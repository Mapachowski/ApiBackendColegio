const sequelize = require('../config/database');
const NotificacionDocente = require('../models/NotificacionDocente');
const Unidad = require('../models/Unidad');
const EstadoCursoUnidad = require('../models/EstadoCursoUnidad');
const { Op } = require('sequelize');

/**
 * Función interna reutilizable para generar notificaciones de una unidad
 */
async function generarNotificacionesInterno(idUnidad, fechaLimiteCustom = null, transaction = null) {
  const usarTransaction = transaction || await sequelize.transaction();

  try {
    // Verificar que la unidad existe
    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      if (!transaction) await usarTransaction.rollback();
      return { success: false, error: 'Unidad no encontrada' };
    }

    // Obtener TODOS los cursos de la unidad y su estado (si existe)
    // LEFT JOIN para incluir cursos sin estado calculado (sin actividades configuradas)
    const [cursosConPendientes] = await sequelize.query(`
      SELECT
        c.idCurso AS IdCurso,
        d.idDocente AS IdDocente,
        c.Curso AS NombreCurso,
        d.NombreDocente,
        COALESCE(e.ActividadesSuman100, 0) AS ActividadesSuman100,
        COALESCE(e.PuntajeActual, 0) AS PuntajeActual,
        COALESCE(e.TotalEstudiantes, 0) AS TotalEstudiantes,
        COALESCE(e.EstudiantesCalificados, 0) AS EstudiantesCalificados,
        COALESCE(e.PorcentajeCompletado, 0) AS PorcentajeCompletado,
        COALESCE(e.EstadoGeneral, 'PENDIENTE') AS EstadoGeneral,
        e.DetallesPendientes,
        g.NombreGrado,
        s.NombreSeccion,
        j.NombreJornada
      FROM unidades u
      INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.IdAsignacionDocente
      INNER JOIN cursos c ON ad.IdCurso = c.idCurso
      INNER JOIN docentes d ON ad.IdDocente = d.idDocente
      INNER JOIN grados g ON ad.IdGrado = g.IdGrado
      INNER JOIN secciones s ON ad.IdSeccion = s.IdSeccion
      INNER JOIN jornadas j ON ad.IdJornada = j.IdJornada
      LEFT JOIN estado_cursos_unidad e ON e.IdUnidad = u.IdUnidad AND e.IdCurso = c.idCurso
      WHERE u.IdUnidad = :idUnidad
        AND u.Estado = 1
        AND (e.EstadoGeneral IS NULL OR e.EstadoGeneral != 'LISTO')
      ORDER BY COALESCE(e.EstadoGeneral, 'ZZPENDIENTE') DESC, COALESCE(e.PorcentajeCompletado, 0) ASC
    `, {
      replacements: { idUnidad },
      transaction: usarTransaction
    });

    if (cursosConPendientes.length === 0) {
      if (!transaction) await usarTransaction.commit();
      return { success: true, notificacionesCreadas: 0, message: 'No hay cursos con pendientes' };
    }

    let notificacionesCreadas = 0;
    const fechaLimite = fechaLimiteCustom || unidad.FechaLimiteCalificacion || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 días por defecto

    for (const curso of cursosConPendientes) {
      const detalles = curso.DetallesPendientes
        ? JSON.parse(curso.DetallesPendientes)
        : null;

      // Si el curso NO tiene actividades configuradas (PuntajeActual = 0 y EstadoGeneral = 'PENDIENTE')
      // Enviar notificación genérica para configurar
      if (curso.PuntajeActual === 0 && curso.EstadoGeneral === 'PENDIENTE') {
        const mensaje = `El curso "${curso.NombreCurso}" (${curso.NombreGrado} ${curso.NombreSeccion} - ${curso.NombreJornada}) no tiene actividades configuradas. Por favor configura las actividades de zona y examen final (deben sumar 100 puntos) y califica a todos los estudiantes antes de la fecha límite.`;

        await NotificacionDocente.create({
          IdDocente: curso.IdDocente,
          IdCurso: curso.IdCurso,
          IdUnidad: idUnidad,
          TipoNotificacion: 'CURSO_SIN_CONFIGURAR',
          Mensaje: mensaje,
          FechaLimite: fechaLimite,
          Leida: false
        }, { transaction: usarTransaction });

        notificacionesCreadas++;
        continue; // Saltar las demás verificaciones para este curso
      }

      // Notificación por actividades incompletas (suman menos de 100)
      if (!curso.ActividadesSuman100 && curso.PuntajeActual > 0) {
        const faltante = detalles?.actividades?.faltante || (100 - curso.PuntajeActual);
        const mensaje = `Tus actividades en "${curso.NombreCurso}" (${curso.NombreGrado} ${curso.NombreSeccion}) suman ${curso.PuntajeActual} puntos. Deben sumar exactamente 100 puntos. Faltan ${faltante} puntos.`;

        await NotificacionDocente.create({
          IdDocente: curso.IdDocente,
          IdCurso: curso.IdCurso,
          IdUnidad: idUnidad,
          TipoNotificacion: 'ACTIVIDADES_INCOMPLETAS',
          Mensaje: mensaje,
          FechaLimite: fechaLimite,
          Leida: false
        }, { transaction: usarTransaction });

        notificacionesCreadas++;
      }

      // Notificación por calificaciones pendientes (actividades suman 100 pero faltan calificar)
      if (curso.ActividadesSuman100 && curso.PorcentajeCompletado < 100) {
        const estudiantesPendientes = curso.TotalEstudiantes - curso.EstudiantesCalificados;
        const mensaje = `Tienes ${estudiantesPendientes} estudiante(s) sin calificar en "${curso.NombreCurso}" (${curso.NombreGrado} ${curso.NombreSeccion}). Por favor completa las calificaciones antes de la fecha límite.`;

        await NotificacionDocente.create({
          IdDocente: curso.IdDocente,
          IdCurso: curso.IdCurso,
          IdUnidad: idUnidad,
          TipoNotificacion: 'CALIFICACIONES_PENDIENTES',
          Mensaje: mensaje,
          FechaLimite: fechaLimite,
          Leida: false
        }, { transaction: usarTransaction });

        notificacionesCreadas++;
      }
    }

    // Marcar que se enviaron notificaciones para esta unidad
    await unidad.update({
      NotificacionesEnviadas: true
    }, { transaction: usarTransaction });

    if (!transaction) await usarTransaction.commit();

    return {
      success: true,
      notificacionesCreadas,
      cursosConPendientes: cursosConPendientes.length
    };

  } catch (error) {
    if (!transaction) await usarTransaction.rollback();
    throw error;
  }
}

/**
 * Generar notificaciones para docentes con pendientes en una unidad
 * POST /api/notificaciones-docentes/generar/:idUnidad
 */
exports.generarNotificaciones = async (req, res) => {
  try {
    const { idUnidad } = req.params;
    const { FechaLimite } = req.body; // Opcional: fecha límite para completar

    const fechaLimite = FechaLimite ? new Date(FechaLimite) : null;
    const resultado = await generarNotificacionesInterno(idUnidad, fechaLimite);

    if (!resultado.success) {
      return res.status(404).json(resultado);
    }

    res.json({
      success: true,
      notificacionesCreadas: resultado.notificacionesCreadas,
      cursosConPendientes: resultado.cursosConPendientes,
      message: resultado.message || `${resultado.notificacionesCreadas} notificaciones creadas para ${resultado.cursosConPendientes} curso(s) con pendientes`
    });

  } catch (error) {
    console.error('❌ Error al generar notificaciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generar notificaciones para TODAS las unidades con un número específico
 * POST /api/notificaciones-docentes/generar-por-numero/:numeroUnidad
 * Body (opcional): { FechaLimite: "2026-01-05T23:59:59" }
 */
exports.generarNotificacionesPorNumero = async (req, res) => {
  try {
    const { numeroUnidad } = req.params;
    const { FechaLimite } = req.body;

    // Obtener TODAS las unidades con ese número
    const [unidades] = await sequelize.query(`
      SELECT IdUnidad FROM unidades WHERE NumeroUnidad = ? AND Estado = 1
    `, { replacements: [numeroUnidad] });

    if (!unidades || unidades.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No se encontraron unidades con número ${numeroUnidad}`
      });
    }

    let totalNotificaciones = 0;
    let totalCursosConPendientes = 0;
    const errores = [];

    const fechaLimite = FechaLimite ? new Date(FechaLimite) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 días por defecto

    for (const { IdUnidad } of unidades) {
      try {
        const resultado = await generarNotificacionesInterno(IdUnidad, fechaLimite);
        if (resultado.success) {
          totalNotificaciones += resultado.notificacionesCreadas || 0;
          totalCursosConPendientes += resultado.cursosConPendientes || 0;
        }
      } catch (error) {
        errores.push({
          IdUnidad,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      notificacionesCreadas: totalNotificaciones,
      cursosConPendientes: totalCursosConPendientes,
      unidadesProcesadas: unidades.length,
      errores: errores.length > 0 ? errores : undefined,
      message: `${totalNotificaciones} notificaciones enviadas con plazo de 3 días para ${totalCursosConPendientes} curso(s) con pendientes`
    });

  } catch (error) {
    console.error('❌ Error al generar notificaciones por número:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Obtener notificaciones de un docente
 * GET /api/notificaciones-docentes/mis-notificaciones
 */
exports.misNotificaciones = async (req, res) => {
  try {
    const idUsuario = req.usuario?.id;
    const { leidas, tipo, limite = 50 } = req.query;

    if (!idUsuario) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    // Buscar el IdDocente del usuario
    const [docente] = await sequelize.query(`
      SELECT idDocente
      FROM docentes
      WHERE IdUsuario = :idUsuario
      LIMIT 1
    `, {
      replacements: { idUsuario }
    });

    if (!docente || docente.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Usuario no es un docente'
      });
    }

    const idDocente = docente[0].idDocente;

    // Construir query con filtros opcionales
    let whereClause = { IdDocente: idDocente };

    if (leidas !== undefined) {
      whereClause.Leida = leidas === 'true' || leidas === '1';
    }

    if (tipo) {
      whereClause.TipoNotificacion = tipo;
    }

    // Obtener notificaciones con información relacionada
    const [notificaciones] = await sequelize.query(`
      SELECT
        n.IdNotificacion,
        n.TipoNotificacion,
        n.Mensaje,
        n.FechaLimite,
        n.Leida,
        n.FechaCreacion,
        n.FechaLeida,
        c.Curso AS NombreCurso,
        u.NumeroUnidad,
        u.NombreUnidad,
        u.Cerrada AS UnidadCerrada,
        g.NombreGrado,
        s.NombreSeccion,
        j.NombreJornada
      FROM notificaciones_docentes n
      INNER JOIN cursos c ON n.IdCurso = c.idCurso
      INNER JOIN unidades u ON n.IdUnidad = u.IdUnidad
      INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.IdAsignacionDocente
      INNER JOIN grados g ON ad.IdGrado = g.IdGrado
      INNER JOIN secciones s ON ad.IdSeccion = s.IdSeccion
      INNER JOIN jornadas j ON ad.IdJornada = j.IdJornada
      WHERE n.IdDocente = :idDocente
        ${leidas !== undefined ? 'AND n.Leida = :leida' : ''}
        ${tipo ? 'AND n.TipoNotificacion = :tipo' : ''}
      ORDER BY n.FechaCreacion DESC
      LIMIT :limite
    `, {
      replacements: {
        idDocente,
        leida: leidas === 'true' || leidas === '1',
        tipo,
        limite: parseInt(limite)
      }
    });

    // Contar no leídas
    const [contadorNoLeidas] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM notificaciones_docentes
      WHERE IdDocente = :idDocente
        AND Leida = FALSE
    `, {
      replacements: { idDocente }
    });

    res.json({
      success: true,
      data: notificaciones,
      total: notificaciones.length,
      noLeidas: contadorNoLeidas[0]?.total || 0
    });

  } catch (error) {
    console.error('❌ Error al obtener notificaciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Marcar notificación(es) como leída(s)
 * PUT /api/notificaciones-docentes/marcar-leida
 */
exports.marcarComoLeida = async (req, res) => {
  try {
    const { IdNotificacion, Todas } = req.body;
    const idUsuario = req.usuario?.id;

    if (!idUsuario) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    // Buscar el IdDocente del usuario
    const [docente] = await sequelize.query(`
      SELECT idDocente
      FROM docentes
      WHERE IdUsuario = :idUsuario
      LIMIT 1
    `, {
      replacements: { idUsuario }
    });

    if (!docente || docente.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Usuario no es un docente'
      });
    }

    const idDocente = docente[0].idDocente;

    let actualizadas = 0;

    if (Todas === true || Todas === 'true') {
      // Marcar todas las notificaciones del docente como leídas
      const [result] = await sequelize.query(`
        UPDATE notificaciones_docentes
        SET Leida = TRUE, FechaLeida = NOW()
        WHERE IdDocente = :idDocente
          AND Leida = FALSE
      `, {
        replacements: { idDocente }
      });

      actualizadas = result.affectedRows || 0;

    } else if (IdNotificacion) {
      // Marcar una notificación específica
      const notificacion = await NotificacionDocente.findOne({
        where: {
          IdNotificacion,
          IdDocente: idDocente
        }
      });

      if (!notificacion) {
        return res.status(404).json({
          success: false,
          error: 'Notificación no encontrada o no pertenece a este docente'
        });
      }

      await notificacion.update({
        Leida: true,
        FechaLeida: new Date()
      });

      actualizadas = 1;

    } else {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar IdNotificacion o Todas=true'
      });
    }

    res.json({
      success: true,
      actualizadas,
      message: `${actualizadas} notificación(es) marcada(s) como leída(s)`
    });

  } catch (error) {
    console.error('❌ Error al marcar notificaciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Contador de notificaciones no leídas
 * GET /api/notificaciones-docentes/contador
 */
exports.contadorNoLeidas = async (req, res) => {
  try {
    const idUsuario = req.usuario?.id;

    if (!idUsuario) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    // Buscar el IdDocente del usuario
    const [docente] = await sequelize.query(`
      SELECT idDocente
      FROM docentes
      WHERE IdUsuario = :idUsuario
      LIMIT 1
    `, {
      replacements: { idUsuario }
    });

    if (!docente || docente.length === 0) {
      return res.json({
        success: true,
        data: {
          noLeidas: 0,
          tieneNotificaciones: false
        }
      });
    }

    const idDocente = docente[0].idDocente;

    // Contar notificaciones no leídas
    const [resultado] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM notificaciones_docentes
      WHERE IdDocente = :idDocente
        AND Leida = FALSE
    `, {
      replacements: { idDocente }
    });

    const total = resultado[0]?.total || 0;

    res.json({
      success: true,
      data: {
        noLeidas: parseInt(total),
        tieneNotificaciones: parseInt(total) > 0
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener contador:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Eliminar notificaciones antiguas (opcional - limpieza)
 * DELETE /api/notificaciones-docentes/limpiar
 */
exports.limpiarNotificaciones = async (req, res) => {
  try {
    const { DiasAntiguedad = 90 } = req.body;
    const rolUsuario = req.usuario?.rol;

    // Solo administradores pueden limpiar
    if (rolUsuario !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden limpiar notificaciones'
      });
    }

    // Eliminar notificaciones leídas con más de X días
    const [result] = await sequelize.query(`
      DELETE FROM notificaciones_docentes
      WHERE Leida = TRUE
        AND FechaLeida < DATE_SUB(NOW(), INTERVAL :dias DAY)
    `, {
      replacements: { dias: DiasAntiguedad }
    });

    const eliminadas = result.affectedRows || 0;

    res.json({
      success: true,
      eliminadas,
      message: `${eliminadas} notificación(es) antigua(s) eliminada(s)`
    });

  } catch (error) {
    console.error('❌ Error al limpiar notificaciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = exports;
