const sequelize = require('../config/database');
const NotificacionDocente = require('../models/NotificacionDocente');
const Unidad = require('../models/Unidad');
const EstadoCursoUnidad = require('../models/EstadoCursoUnidad');
const { Op } = require('sequelize');

/**
 * Generar notificaciones para docentes con pendientes en una unidad
 * POST /api/notificaciones-docentes/generar/:idUnidad
 */
exports.generarNotificaciones = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { idUnidad } = req.params;
    const { FechaLimite } = req.body; // Opcional: fecha límite para completar

    // Verificar que la unidad existe
    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Obtener estados de cursos que NO están listos
    const [cursosConPendientes] = await sequelize.query(`
      SELECT
        e.IdCurso,
        e.IdDocente,
        c.Curso AS NombreCurso,
        d.NombreDocente,
        e.ActividadesSuman100,
        e.PuntajeActual,
        e.TotalEstudiantes,
        e.EstudiantesCalificados,
        e.PorcentajeCompletado,
        e.EstadoGeneral,
        e.DetallesPendientes
      FROM estado_cursos_unidad e
      INNER JOIN cursos c ON e.IdCurso = c.idCurso
      INNER JOIN docentes d ON e.IdDocente = d.idDocente
      WHERE e.IdUnidad = :idUnidad
        AND e.EstadoGeneral != 'LISTO'
      ORDER BY e.EstadoGeneral DESC, e.PorcentajeCompletado ASC
    `, {
      replacements: { idUnidad },
      transaction
    });

    if (cursosConPendientes.length === 0) {
      await transaction.rollback();
      return res.json({
        success: true,
        message: 'No hay cursos con pendientes. Todos los cursos están listos.',
        notificacionesCreadas: 0
      });
    }

    let notificacionesCreadas = 0;
    const fechaLimite = FechaLimite ? new Date(FechaLimite) : unidad.FechaLimiteCalificacion;

    for (const curso of cursosConPendientes) {
      const detalles = curso.DetallesPendientes
        ? JSON.parse(curso.DetallesPendientes)
        : null;

      // Notificación por actividades incompletas
      if (!curso.ActividadesSuman100) {
        const faltante = detalles?.actividades?.faltante || 0;
        const mensaje = `Tus actividades en "${curso.NombreCurso}" suman ${curso.PuntajeActual} puntos. Deben sumar exactamente 100 puntos. Faltan ${faltante} puntos.`;

        await NotificacionDocente.create({
          IdDocente: curso.IdDocente,
          IdCurso: curso.IdCurso,
          IdUnidad: idUnidad,
          TipoNotificacion: 'ACTIVIDADES_INCOMPLETAS',
          Mensaje: mensaje,
          FechaLimite: fechaLimite,
          Leida: false
        }, { transaction });

        notificacionesCreadas++;
      }

      // Notificación por calificaciones pendientes
      if (curso.PorcentajeCompletado < 100) {
        const estudiantesPendientes = curso.TotalEstudiantes - curso.EstudiantesCalificados;
        const mensaje = `Tienes ${estudiantesPendientes} estudiante(s) sin calificar en "${curso.NombreCurso}". Por favor completa las calificaciones antes de la fecha límite.`;

        await NotificacionDocente.create({
          IdDocente: curso.IdDocente,
          IdCurso: curso.IdCurso,
          IdUnidad: idUnidad,
          TipoNotificacion: 'CALIFICACIONES_PENDIENTES',
          Mensaje: mensaje,
          FechaLimite: fechaLimite,
          Leida: false
        }, { transaction });

        notificacionesCreadas++;
      }
    }

    // Marcar que se enviaron notificaciones para esta unidad
    await unidad.update({
      NotificacionesEnviadas: true
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      notificacionesCreadas,
      cursosConPendientes: cursosConPendientes.length,
      message: `${notificacionesCreadas} notificaciones creadas para ${cursosConPendientes.length} curso(s) con pendientes`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al generar notificaciones:', error);
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
        u.Cerrada AS UnidadCerrada
      FROM notificaciones_docentes n
      INNER JOIN cursos c ON n.IdCurso = c.idCurso
      INNER JOIN unidades u ON n.IdUnidad = u.IdUnidad
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
