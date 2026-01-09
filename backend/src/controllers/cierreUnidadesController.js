const sequelize = require('../config/database');
const Unidad = require('../models/Unidad');
const Actividad = require('../models/Actividad');
const Calificacion = require('../models/Calificacion');
const EstadoCursoUnidad = require('../models/EstadoCursoUnidad');
const NotificacionDocente = require('../models/NotificacionDocente');
const { Op, QueryTypes } = require('sequelize');

/**
 * Validar estado de todos los cursos de una unidad
 * GET /api/cierre-unidades/validar/:idUnidad
 */
exports.validarEstadoUnidad = async (req, res) => {
  try {
    const { idUnidad } = req.params;

    // Verificar que la unidad existe
    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Obtener todos los cursos de esta unidad mediante asignaciones
    const [cursos] = await sequelize.query(`
      SELECT DISTINCT
        c.idCurso AS IdCurso,
        c.Curso AS NombreCurso,
        ad.IdAsignacionDocente,
        d.idDocente AS IdDocente,
        d.NombreDocente,
        g.IdGrado,
        g.NombreGrado,
        s.IdSeccion,
        s.NombreSeccion,
        j.IdJornada,
        j.NombreJornada
      FROM unidades u
      INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.IdAsignacionDocente
      INNER JOIN cursos c ON ad.IdCurso = c.idCurso
      INNER JOIN docentes d ON ad.IdDocente = d.idDocente
      INNER JOIN grados g ON ad.IdGrado = g.IdGrado
      INNER JOIN secciones s ON ad.IdSeccion = s.IdSeccion
      INNER JOIN jornadas j ON ad.IdJornada = j.IdJornada
      WHERE u.IdUnidad = :idUnidad
        AND u.Estado = 1
    `, {
      replacements: { idUnidad }
    });

    if (cursos.length === 0) {
      return res.json({
        success: true,
        data: {
          unidad: {
            IdUnidad: unidad.IdUnidad,
            NumeroUnidad: unidad.NumeroUnidad,
            NombreUnidad: unidad.NombreUnidad,
            Cerrada: unidad.Cerrada,
            FechaLimiteCalificacion: unidad.FechaLimiteCalificacion
          },
          cursos: [],
          resumen: {
            totalCursos: 0,
            cursosListos: 0,
            cursosPendientes: 0,
            cursosIncompletos: 0,
            porcentajeCompletado: 0
          }
        }
      });
    }

    // Para cada curso, calcular su estado
    const estadosCursos = [];

    for (const curso of cursos) {
      const estadoCurso = await this.calcularEstadoCurso(idUnidad, curso.IdCurso, curso.IdDocente);
      estadosCursos.push({
        ...curso,
        ...estadoCurso
      });
    }

    // Calcular resumen general
    const resumen = {
      totalCursos: estadosCursos.length,
      cursosListos: estadosCursos.filter(c => c.EstadoGeneral === 'LISTO').length,
      cursosPendientes: estadosCursos.filter(c => c.EstadoGeneral === 'PENDIENTE').length,
      cursosIncompletos: estadosCursos.filter(c => c.EstadoGeneral === 'INCOMPLETO').length,
      porcentajeCompletado: 0
    };

    if (resumen.totalCursos > 0) {
      resumen.porcentajeCompletado = Math.round(
        (resumen.cursosListos / resumen.totalCursos) * 100
      );
    }

    res.json({
      success: true,
      data: {
        unidad: {
          IdUnidad: unidad.IdUnidad,
          NumeroUnidad: unidad.NumeroUnidad,
          NombreUnidad: unidad.NombreUnidad,
          Cerrada: unidad.Cerrada,
          FechaLimiteCalificacion: unidad.FechaLimiteCalificacion,
          NotificacionesEnviadas: unidad.NotificacionesEnviadas
        },
        cursos: estadosCursos,
        resumen
      }
    });

  } catch (error) {
    console.error('❌ Error al validar estado de unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Método interno para calcular el estado de un curso específico
 */
exports.calcularEstadoCurso = async (IdUnidad, IdCurso, IdDocente) => {
  // 1. Validar actividades (deben sumar 100)
  const actividades = await Actividad.findAll({
    where: { IdUnidad, Estado: true }
  });

  const puntajeActual = actividades.reduce((sum, act) => {
    return sum + parseFloat(act.PunteoMaximo || 0);
  }, 0);

  const actividadesSuman100 = Math.abs(puntajeActual - 100) < 0.01; // Tolerancia decimal

  // 2. Validar calificaciones de estudiantes
  const [estudiantes] = await sequelize.query(`
    SELECT DISTINCT i.IdAlumno
    FROM inscripciones i
    INNER JOIN asignacion_docente ad ON
      i.IdGrado = ad.IdGrado
      AND i.IdSeccion = ad.IdSeccion
      AND i.IdJornada = ad.IdJornada
      AND i.CicloEscolar = ad.Anio
    INNER JOIN unidades u ON ad.IdAsignacionDocente = u.IdAsignacionDocente
    WHERE u.IdUnidad = :idUnidad
      AND ad.IdCurso = :idCurso
      AND i.Estado = 1
  `, {
    replacements: { idUnidad: IdUnidad, idCurso: IdCurso }
  });

  const totalEstudiantes = estudiantes.length;
  let estudiantesCalificados = 0;
  const estudiantesPendientes = [];

  if (actividades.length > 0) {
    for (const estudiante of estudiantes) {
      const calificaciones = await Calificacion.count({
        where: {
          IdActividad: actividades.map(a => a.IdActividad),
          IdAlumno: estudiante.IdAlumno,
          Punteo: { [Op.ne]: null }
        }
      });

      if (calificaciones === actividades.length) {
        estudiantesCalificados++;
      } else {
        // Identificar qué actividades le faltan
        const actividadesPendientes = [];
        for (const actividad of actividades) {
          const tieneCalificacion = await Calificacion.findOne({
            where: {
              IdActividad: actividad.IdActividad,
              IdAlumno: estudiante.IdAlumno,
              Punteo: { [Op.ne]: null }
            }
          });

          if (!tieneCalificacion) {
            actividadesPendientes.push(actividad.NombreActividad);
          }
        }

        estudiantesPendientes.push({
          IdAlumno: estudiante.IdAlumno,
          ActividadesPendientes: actividadesPendientes
        });
      }
    }
  }

  const porcentajeCompletado = totalEstudiantes > 0
    ? parseFloat(((estudiantesCalificados / totalEstudiantes) * 100).toFixed(2))
    : 0;

  // 3. Determinar estado general
  let estadoGeneral = 'INCOMPLETO';
  if (actividadesSuman100 && porcentajeCompletado === 100) {
    estadoGeneral = 'LISTO';
  } else if (actividadesSuman100 && porcentajeCompletado >= 80) {
    estadoGeneral = 'PENDIENTE';
  }

  // 4. Generar detalles de pendientes
  const detallesPendientes = {
    actividades: {
      suman100: actividadesSuman100,
      puntajeActual: parseFloat(puntajeActual.toFixed(2)),
      faltante: parseFloat((100 - puntajeActual).toFixed(2))
    },
    calificaciones: {
      totalEstudiantes,
      estudiantesCalificados,
      porcentajeCompletado,
      estudiantesPendientes: estudiantesPendientes.slice(0, 10) // Solo primeros 10 para no saturar
    }
  };

  return {
    ActividadesSuman100: actividadesSuman100,
    PuntajeActual: parseFloat(puntajeActual.toFixed(2)),
    TotalEstudiantes: totalEstudiantes,
    EstudiantesCalificados: estudiantesCalificados,
    PorcentajeCompletado: porcentajeCompletado,
    EstadoGeneral: estadoGeneral,
    DetallesPendientes: detallesPendientes
  };
};

/**
 * Actualizar estado de un curso específico en la BD
 * POST /api/cierre-unidades/actualizar-estado
 */
exports.actualizarEstadoCurso = async (req, res) => {
  try {
    const { IdUnidad, IdCurso, IdDocente } = req.body;

    if (!IdUnidad || !IdCurso || !IdDocente) {
      return res.status(400).json({
        success: false,
        error: 'IdUnidad, IdCurso e IdDocente son requeridos'
      });
    }

    // Calcular estado actual del curso
    const estadoCurso = await this.calcularEstadoCurso(IdUnidad, IdCurso, IdDocente);

    // Insertar o actualizar en la tabla estado_cursos_unidad
    const [estado, created] = await EstadoCursoUnidad.findOrCreate({
      where: { IdUnidad, IdCurso },
      defaults: {
        IdDocente,
        ...estadoCurso,
        UltimaActualizacion: new Date()
      }
    });

    if (!created) {
      await estado.update({
        ...estadoCurso,
        UltimaActualizacion: new Date()
      });
    }

    res.json({
      success: true,
      data: estado,
      created,
      message: created
        ? 'Estado de curso creado exitosamente'
        : 'Estado de curso actualizado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al actualizar estado de curso:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Recalcular estado de un curso de forma silenciosa (sin respuesta HTTP)
 * Útil para llamar desde otros controladores después de crear/actualizar actividades o calificaciones
 */
exports.recalcularEstadoCursoSilencioso = async (IdUnidad, IdCurso, IdDocente) => {
  try {
    // Calcular estado actual del curso
    const estadoCurso = await this.calcularEstadoCurso(IdUnidad, IdCurso, IdDocente);

    // Insertar o actualizar en la tabla estado_cursos_unidad
    await EstadoCursoUnidad.upsert({
      IdUnidad,
      IdCurso,
      IdDocente,
      ...estadoCurso,
      UltimaActualizacion: new Date()
    });

    console.log(`✅ Estado recalculado: Unidad ${IdUnidad}, Curso ${IdCurso} → ${estadoCurso.EstadoGeneral}`);
    return estadoCurso;
  } catch (error) {
    console.error('❌ Error al recalcular estado silencioso:', error);
    throw error;
  }
};

/**
 * Actualizar estado de todos los cursos de una unidad
 * POST /api/cierre-unidades/actualizar-todos/:idUnidad
 */
exports.actualizarTodosEstados = async (req, res) => {
  try {
    const { idUnidad } = req.params;

    // Obtener todos los cursos de la unidad
    const [cursos] = await sequelize.query(`
      SELECT DISTINCT
        c.idCurso AS IdCurso,
        d.idDocente AS IdDocente
      FROM unidades u
      INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.IdAsignacionDocente
      INNER JOIN cursos c ON ad.IdCurso = c.idCurso
      INNER JOIN docentes d ON ad.IdDocente = d.idDocente
      WHERE u.IdUnidad = :idUnidad
        AND u.Estado = 1
    `, {
      replacements: { idUnidad }
    });

    let procesados = 0;
    let errores = [];

    for (const curso of cursos) {
      try {
        const estadoCurso = await this.calcularEstadoCurso(idUnidad, curso.IdCurso, curso.IdDocente);

        await EstadoCursoUnidad.upsert({
          IdUnidad: idUnidad,
          IdCurso: curso.IdCurso,
          IdDocente: curso.IdDocente,
          ...estadoCurso,
          UltimaActualizacion: new Date()
        });

        procesados++;
      } catch (error) {
        errores.push({
          IdCurso: curso.IdCurso,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      procesados,
      total: cursos.length,
      errores: errores.length > 0 ? errores : undefined,
      message: `${procesados} cursos actualizados exitosamente`
    });

  } catch (error) {
    console.error('❌ Error al actualizar todos los estados:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Obtener estado actual de una unidad desde la tabla estado_cursos_unidad
 * GET /api/cierre-unidades/estado/:idUnidad
 */
exports.getEstadoUnidad = async (req, res) => {
  try {
    const { idUnidad } = req.params;

    // Verificar que la unidad existe
    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Obtener estados de cursos desde la tabla
    const [estados] = await sequelize.query(`
      SELECT
        e.IdEstado,
        e.IdCurso,
        c.Curso AS NombreCurso,
        e.IdDocente,
        d.NombreDocente,
        e.ActividadesSuman100,
        e.PuntajeActual,
        e.TotalEstudiantes,
        e.EstudiantesCalificados,
        e.PorcentajeCompletado,
        e.EstadoGeneral,
        e.DetallesPendientes,
        e.UltimaActualizacion
      FROM estado_cursos_unidad e
      INNER JOIN cursos c ON e.IdCurso = c.idCurso
      INNER JOIN docentes d ON e.IdDocente = d.idDocente
      WHERE e.IdUnidad = :idUnidad
      ORDER BY e.EstadoGeneral, e.PorcentajeCompletado DESC
    `, {
      replacements: { idUnidad }
    });

    // Parsear JSON de DetallesPendientes
    const estadosProcesados = estados.map(estado => ({
      ...estado,
      DetallesPendientes: estado.DetallesPendientes
        ? JSON.parse(estado.DetallesPendientes)
        : null
    }));

    // Calcular resumen
    const resumen = {
      totalCursos: estadosProcesados.length,
      cursosListos: estadosProcesados.filter(e => e.EstadoGeneral === 'LISTO').length,
      cursosPendientes: estadosProcesados.filter(e => e.EstadoGeneral === 'PENDIENTE').length,
      cursosIncompletos: estadosProcesados.filter(e => e.EstadoGeneral === 'INCOMPLETO').length,
      porcentajeCompletado: 0
    };

    if (resumen.totalCursos > 0) {
      resumen.porcentajeCompletado = Math.round(
        (resumen.cursosListos / resumen.totalCursos) * 100
      );
    }

    res.json({
      success: true,
      data: {
        unidad: {
          IdUnidad: unidad.IdUnidad,
          NumeroUnidad: unidad.NumeroUnidad,
          NombreUnidad: unidad.NombreUnidad,
          Cerrada: unidad.Cerrada,
          FechaLimiteCalificacion: unidad.FechaLimiteCalificacion,
          NotificacionesEnviadas: unidad.NotificacionesEnviadas
        },
        cursos: estadosProcesados,
        resumen
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estado de unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ========================================
 * FASE 4: Endpoints de Cierre de Unidades
 * ========================================
 */

/**
 * Validar si una unidad puede cerrarse (todos los cursos listos)
 * POST /api/cierre-unidades/validar-cierre/:idUnidad
 */
exports.validarCierre = async (req, res) => {
  try {
    const { idUnidad } = req.params;

    // Verificar que la unidad existe
    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Obtener estados de todos los cursos desde la tabla
    const [estados] = await sequelize.query(`
      SELECT
        e.IdCurso,
        c.Curso AS NombreCurso,
        g.NombreGrado,
        s.NombreSeccion,
        e.IdDocente,
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
      INNER JOIN asignacion_docente ad ON e.IdCurso = ad.IdCurso AND e.IdDocente = ad.IdDocente
      INNER JOIN grados g ON ad.IdGrado = g.IdGrado
      INNER JOIN secciones s ON ad.IdSeccion = s.IdSeccion
      WHERE e.IdUnidad = :idUnidad
      ORDER BY e.EstadoGeneral DESC, e.PorcentajeCompletado ASC
    `, {
      replacements: { idUnidad }
    });

    const totalCursos = estados.length;
    const cursosListos = estados.filter(e => e.EstadoGeneral === 'LISTO').length;
    const cursosPendientes = estados.filter(e => e.EstadoGeneral === 'PENDIENTE').length;
    const cursosIncompletos = estados.filter(e => e.EstadoGeneral === 'INCOMPLETO').length;
    const porcentajeCompletado = totalCursos > 0
      ? Math.round((cursosListos / totalCursos) * 100)
      : 0;

    const puedeSerCerrada = totalCursos > 0 && cursosListos === totalCursos;

    // Si puede cerrarse
    if (puedeSerCerrada) {
      return res.json({
        success: true,
        puedeSerCerrada: true,
        data: {
          IdUnidad: unidad.IdUnidad,
          NumeroUnidad: unidad.NumeroUnidad,
          NombreUnidad: unidad.NombreUnidad,
          totalCursos,
          cursosListos,
          cursosPendientes,
          cursosIncompletos,
          porcentajeCompletado
        },
        message: 'La unidad está lista para cerrarse'
      });
    }

    // Si NO puede cerrarse, generar detalles de cursos pendientes
    const cursosPendientesDetalle = estados
      .filter(e => e.EstadoGeneral !== 'LISTO')
      .map(curso => {
        const detalles = curso.DetallesPendientes
          ? JSON.parse(curso.DetallesPendientes)
          : null;

        const problemas = [];

        if (!curso.ActividadesSuman100) {
          const faltante = detalles?.actividades?.faltante || 0;
          problemas.push(
            `Actividades suman ${curso.PuntajeActual} puntos (faltan ${faltante})`
          );
        }

        if (curso.PorcentajeCompletado < 100) {
          const estudiantesPendientes = curso.TotalEstudiantes - curso.EstudiantesCalificados;
          problemas.push(
            `Faltan ${estudiantesPendientes} estudiantes por calificar`
          );
        }

        return {
          IdCurso: curso.IdCurso,
          NombreCurso: curso.NombreCurso,
          NombreGrado: curso.NombreGrado,
          NombreSeccion: curso.NombreSeccion,
          IdDocente: curso.IdDocente,
          NombreDocente: curso.NombreDocente,
          EstadoGeneral: curso.EstadoGeneral,
          ActividadesSuman100: curso.ActividadesSuman100,
          PuntajeActual: curso.PuntajeActual,
          PorcentajeCompletado: curso.PorcentajeCompletado,
          Problemas: problemas
        };
      });

    res.json({
      success: false,
      puedeSerCerrada: false,
      data: {
        IdUnidad: unidad.IdUnidad,
        NumeroUnidad: unidad.NumeroUnidad,
        NombreUnidad: unidad.NombreUnidad,
        totalCursos,
        cursosListos,
        cursosPendientes,
        cursosIncompletos,
        porcentajeCompletado,
        cursosPendientesDetalle
      },
      message: `No se puede cerrar la unidad. Hay ${cursosPendientes + cursosIncompletos} cursos con pendientes`
    });

  } catch (error) {
    console.error('❌ Error al validar cierre:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Cerrar una unidad (bloquear calificaciones)
 * POST /api/cierre-unidades/cerrar/:idUnidad
 */
exports.cerrarUnidad = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { idUnidad } = req.params;
    const { observaciones } = req.body;
    const idUsuario = req.usuario?.id;
    const rolUsuario = req.usuario?.rol;

    // Validar que solo administradores pueden cerrar unidades
    if (rolUsuario !== 1) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden cerrar unidades'
      });
    }

    // Verificar que la unidad existe
    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Verificar que NO esté ya cerrada
    if (unidad.Cerrada) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'La unidad ya está cerrada',
        fechaCierre: unidad.FechaCierre,
        cerradaPor: unidad.CerradaPorAdmin
      });
    }

    // Validar que todos los cursos estén listos
    const [cursosNoListos] = await sequelize.query(`
      SELECT COUNT(*) AS total
      FROM estado_cursos_unidad
      WHERE IdUnidad = :idUnidad
        AND EstadoGeneral != 'LISTO'
    `, {
      replacements: { idUnidad },
      transaction
    });

    if (cursosNoListos[0].total > 0) {
      // Obtener detalles de cursos pendientes
      const [cursosPendientes] = await sequelize.query(`
        SELECT
          e.IdCurso,
          c.Curso AS NombreCurso,
          e.EstadoGeneral,
          e.PorcentajeCompletado
        FROM estado_cursos_unidad e
        INNER JOIN cursos c ON e.IdCurso = c.idCurso
        WHERE e.IdUnidad = :idUnidad
          AND e.EstadoGeneral != 'LISTO'
      `, {
        replacements: { idUnidad },
        transaction
      });

      const pendientes = cursosPendientes.filter(c => c.EstadoGeneral === 'PENDIENTE').length;
      const incompletos = cursosPendientes.filter(c => c.EstadoGeneral === 'INCOMPLETO').length;

      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: `No se puede cerrar la unidad. Hay ${cursosNoListos[0].total} cursos con pendientes`,
        puedeSerCerrada: false,
        cursosPendientes: pendientes,
        cursosIncompletos: incompletos,
        cursosPendientesDetalle: cursosPendientes
      });
    }

    // Cerrar la unidad
    await unidad.update({
      Cerrada: true,
      FechaCierre: new Date(),
      CerradaPorAdmin: idUsuario
    }, { transaction });

    // Obtener nombre del admin
    const [admin] = await sequelize.query(`
      SELECT NombreCompleto FROM usuarios WHERE IdUsuario = :idUsuario
    `, {
      replacements: { idUsuario },
      transaction
    });

    const nombreAdmin = admin[0]?.NombreCompleto || 'Admin';

    // Contar cursos cerrados
    const [totalCursos] = await sequelize.query(`
      SELECT COUNT(*) AS total
      FROM estado_cursos_unidad
      WHERE IdUnidad = :idUnidad
    `, {
      replacements: { idUnidad },
      transaction
    });

    await transaction.commit();

    res.json({
      success: true,
      data: {
        IdUnidad: unidad.IdUnidad,
        NumeroUnidad: unidad.NumeroUnidad,
        NombreUnidad: unidad.NombreUnidad,
        Cerrada: true,
        FechaCierre: unidad.FechaCierre,
        CerradaPorAdmin: idUsuario,
        NombreAdmin: nombreAdmin,
        totalCursosCerrados: totalCursos[0].total
      },
      message: `Unidad ${unidad.NumeroUnidad} cerrada exitosamente. ${totalCursos[0].total} cursos bloqueados.`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al cerrar unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Extender plazo de calificación de una unidad
 * POST /api/cierre-unidades/extender-plazo/:idUnidad
 */
exports.extenderPlazo = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { idUnidad } = req.params;
    const { nuevaFechaLimite, notificarDocentes, observaciones } = req.body;
    const rolUsuario = req.usuario?.rol;

    // Validar que solo administradores pueden extender plazo
    if (rolUsuario !== 1) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden extender plazos'
      });
    }

    // Verificar que la unidad existe
    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Verificar que la unidad NO esté cerrada
    if (unidad.Cerrada) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'No se puede extender el plazo de una unidad cerrada'
      });
    }

    // Validar que se proporcione nueva fecha límite
    if (!nuevaFechaLimite) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'La nueva fecha límite es requerida'
      });
    }

    const nuevaFecha = new Date(nuevaFechaLimite);
    const fechaActual = new Date();
    const fechaLimiteAnterior = unidad.FechaLimiteCalificacion;

    // Validar que sea fecha futura
    if (nuevaFecha <= fechaActual) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'La nueva fecha límite debe ser posterior a la fecha actual'
      });
    }

    // Validar que sea posterior a la fecha límite actual (si existe)
    if (fechaLimiteAnterior && nuevaFecha <= new Date(fechaLimiteAnterior)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'La nueva fecha límite debe ser posterior a la actual'
      });
    }

    // Actualizar fecha límite
    await unidad.update({
      FechaLimiteCalificacion: nuevaFecha
    }, { transaction });

    let notificacionesEnviadas = 0;

    // Si se solicita notificar a docentes
    if (notificarDocentes === true || notificarDocentes === 'true') {
      // Obtener docentes con cursos pendientes
      const [docentesPendientes] = await sequelize.query(`
        SELECT DISTINCT
          e.IdDocente,
          e.IdCurso,
          c.Curso AS NombreCurso,
          d.NombreDocente
        FROM estado_cursos_unidad e
        INNER JOIN cursos c ON e.IdCurso = c.idCurso
        INNER JOIN docentes d ON e.IdDocente = d.idDocente
        WHERE e.IdUnidad = :idUnidad
          AND e.EstadoGeneral != 'LISTO'
      `, {
        replacements: { idUnidad },
        transaction
      });

      // Crear notificaciones
      for (const docente of docentesPendientes) {
        const mensaje = `La fecha límite para "${unidad.NombreUnidad}" se extendió hasta ${nuevaFecha.toLocaleDateString('es-GT')}. Por favor completa las calificaciones de "${docente.NombreCurso}" antes de la nueva fecha.`;

        await NotificacionDocente.create({
          IdDocente: docente.IdDocente,
          IdCurso: docente.IdCurso,
          IdUnidad: idUnidad,
          TipoNotificacion: 'FECHA_LIMITE',
          Mensaje: mensaje,
          FechaLimite: nuevaFecha,
          Leida: false
        }, { transaction });

        notificacionesEnviadas++;
      }
    }

    // Calcular días extendidos
    const diasExtendidos = fechaLimiteAnterior
      ? Math.ceil((nuevaFecha - new Date(fechaLimiteAnterior)) / (1000 * 60 * 60 * 24))
      : null;

    await transaction.commit();

    res.json({
      success: true,
      data: {
        IdUnidad: unidad.IdUnidad,
        NumeroUnidad: unidad.NumeroUnidad,
        NombreUnidad: unidad.NombreUnidad,
        FechaLimiteAnterior: fechaLimiteAnterior,
        FechaLimiteNueva: nuevaFecha,
        DiasExtendidos: diasExtendidos,
        NotificacionesEnviadas: notificacionesEnviadas
      },
      message: notificacionesEnviadas > 0
        ? `Plazo extendido hasta el ${nuevaFecha.toLocaleDateString('es-GT')}. ${notificacionesEnviadas} docentes notificados.`
        : `Plazo extendido hasta el ${nuevaFecha.toLocaleDateString('es-GT')}.`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al extender plazo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Reabrir una unidad cerrada (para correcciones)
 * POST /api/cierre-unidades/reabrir/:idUnidad
 */
exports.reabrirUnidad = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { idUnidad } = req.params;
    const { motivo, nuevaFechaLimite } = req.body;
    const idUsuario = req.usuario?.id;
    const rolUsuario = req.usuario?.rol;

    // Validar que solo administradores pueden reabrir unidades
    if (rolUsuario !== 1) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden reabrir unidades'
      });
    }

    // Verificar que la unidad existe
    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Verificar que la unidad esté cerrada
    if (!unidad.Cerrada) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'La unidad ya está abierta'
      });
    }

    // Validar que se proporcione motivo
    if (!motivo) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'El motivo de reapertura es requerido'
      });
    }

    // Preparar datos de actualización
    const updateData = {
      Cerrada: false
    };

    // Si se proporciona nueva fecha límite
    if (nuevaFechaLimite) {
      const nuevaFecha = new Date(nuevaFechaLimite);
      const fechaActual = new Date();

      if (nuevaFecha <= fechaActual) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'La nueva fecha límite debe ser posterior a la fecha actual'
        });
      }

      updateData.FechaLimiteCalificacion = nuevaFecha;
    }

    // Reabrir la unidad
    await unidad.update(updateData, { transaction });

    // Obtener nombre del admin
    const [admin] = await sequelize.query(`
      SELECT NombreCompleto FROM usuarios WHERE IdUsuario = :idUsuario
    `, {
      replacements: { idUsuario },
      transaction
    });

    const nombreAdmin = admin[0]?.NombreCompleto || 'Admin';

    await transaction.commit();

    res.json({
      success: true,
      data: {
        IdUnidad: unidad.IdUnidad,
        NumeroUnidad: unidad.NumeroUnidad,
        NombreUnidad: unidad.NombreUnidad,
        Cerrada: false,
        FechaReapertura: new Date(),
        ReabiertaPor: nombreAdmin,
        FechaLimiteNueva: nuevaFechaLimite ? new Date(nuevaFechaLimite) : unidad.FechaLimiteCalificacion,
        Motivo: motivo
      },
      message: nuevaFechaLimite
        ? `Unidad ${unidad.NumeroUnidad} reabierta exitosamente hasta el ${new Date(nuevaFechaLimite).toLocaleDateString('es-GT')}`
        : `Unidad ${unidad.NumeroUnidad} reabierta exitosamente`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al reabrir unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// 7. CERRAR SOLO CURSOS LISTOS DE UNA UNIDAD
// ==========================================

/**
 * Cierra solo los cursos con EstadoGeneral='LISTO' de una unidad específica
 * y abre automáticamente la siguiente unidad para esos cursos.
 *
 * POST /api/cierre-unidades/cerrar-cursos-listos/:idUnidad
 *
 * Diferencia con cerrarUnidad:
 * - cerrarUnidad: cierra TODA la unidad (todos los cursos o ninguno)
 * - cerrarCursosListos: cierra SOLO cursos listos, deja abiertos los pendientes
 */
exports.cerrarCursosListos = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { idUnidad } = req.params;
    const { observaciones } = req.body;

    // 1. VALIDAR PERMISOS
    if (req.usuario.rol !== 1) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden cerrar cursos'
      });
    }

    // 2. VERIFICAR QUE LA UNIDAD EXISTE
    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    const numeroUnidadActual = unidad.NumeroUnidad;
    const numeroUnidadSiguiente = numeroUnidadActual + 1;

    console.log(`\n🔍 Procesando cierre parcial de Unidad ${numeroUnidadActual}...`);

    // 3. OBTENER TOTAL DE CURSOS DE ESTA UNIDAD (para estadísticas)
    const totalCursosQuery = `
      SELECT COUNT(DISTINCT ecu.IdCurso) as total
      FROM estado_cursos_unidad ecu
      WHERE ecu.IdUnidad = ?
    `;
    const [totalResult] = await sequelize.query(totalCursosQuery, {
      replacements: [idUnidad],
      type: QueryTypes.SELECT,
      transaction
    });
    const totalCursos = totalResult?.total || 0;

    // 4. OBTENER CURSOS LISTOS PARA CERRAR
    const cursosListosQuery = `
      SELECT
        ecu.IdCurso,
        ecu.IdDocente,
        ecu.EstadoGeneral,
        c.Curso AS NombreCurso,
        g.NombreGrado,
        s.NombreSeccion,
        j.NombreJornada,
        d.NombreDocente
      FROM estado_cursos_unidad ecu
      INNER JOIN unidades un ON ecu.IdUnidad = un.IdUnidad
      INNER JOIN asignacion_docente ad ON un.IdAsignacionDocente = ad.IdAsignacionDocente
      INNER JOIN cursos c ON ecu.IdCurso = c.idCurso
      INNER JOIN grados g ON c.IdGrado = g.IdGrado
      INNER JOIN secciones s ON ad.IdSeccion = s.IdSeccion
      INNER JOIN jornadas j ON ad.IdJornada = j.IdJornada
      INNER JOIN docentes d ON ecu.IdDocente = d.idDocente
      WHERE ecu.IdUnidad = ? AND ecu.EstadoGeneral = 'LISTO'
    `;

    const cursosListos = await sequelize.query(cursosListosQuery, {
      replacements: [idUnidad],
      type: QueryTypes.SELECT,
      transaction
    });

    console.log(`✅ Cursos listos para cerrar: ${cursosListos.length} de ${totalCursos}`);

    // 5. SI NO HAY CURSOS LISTOS, RETORNAR
    if (cursosListos.length === 0) {
      await transaction.rollback();
      return res.json({
        success: true,
        data: {
          IdUnidad: parseInt(idUnidad),
          NumeroUnidad: numeroUnidadActual,
          NombreUnidad: unidad.NombreUnidad,
          totalCursosAnalizados: totalCursos,
          cursosCerrados: 0,
          cursosConPendientes: totalCursos
        },
        message: 'No hay cursos listos para cerrar en esta unidad'
      });
    }

    // 6. VERIFICAR SI LA SIGUIENTE UNIDAD EXISTE
    let siguienteUnidad = null;
    if (numeroUnidadSiguiente <= 4) {
      siguienteUnidad = await Unidad.findOne({
        where: { NumeroUnidad: numeroUnidadSiguiente },
        transaction
      });
    }

    if (!siguienteUnidad) {
      console.log(`⚠️  Unidad ${numeroUnidadActual} es la última, no se abrirá siguiente`);
    }

    // 7. PROCESAR CADA CURSO LISTO
    const cursosActualizados = [];

    for (const curso of cursosListos) {
      const { IdCurso, IdDocente, NombreCurso, NombreGrado, NombreSeccion, NombreJornada, NombreDocente } = curso;

      console.log(`\n  📝 Procesando: ${NombreCurso} - ${NombreGrado} ${NombreSeccion}`);

      // A) Marcar como inactiva la asignación de la unidad actual
      const updateActual = `
        UPDATE asignacion_docente
        SET Activa = 0
        WHERE IdCurso = ? AND IdUnidad = ? AND IdDocente = ?
      `;
      await sequelize.query(updateActual, {
        replacements: [IdCurso, idUnidad, IdDocente],
        type: QueryTypes.UPDATE,
        transaction
      });

      console.log(`    ✅ Unidad ${numeroUnidadActual} cerrada para este curso`);

      // B) Si existe siguiente unidad, crear o activar asignación
      if (siguienteUnidad) {
        // Verificar si ya existe asignación en la siguiente unidad
        const existeAsignacionQuery = `
          SELECT IdAsignacionDocente, Activa
          FROM asignacion_docente
          WHERE IdCurso = ? AND IdUnidad = ? AND IdDocente = ?
        `;
        const [asignacionExistente] = await sequelize.query(existeAsignacionQuery, {
          replacements: [IdCurso, siguienteUnidad.IdUnidad, IdDocente],
          type: QueryTypes.SELECT,
          transaction
        });

        if (asignacionExistente) {
          // Si ya existe, solo activarla
          const activarSiguiente = `
            UPDATE asignacion_docente
            SET Activa = 1
            WHERE IdAsignacionDocente = ?
          `;
          await sequelize.query(activarSiguiente, {
            replacements: [asignacionExistente.IdAsignacionDocente],
            type: QueryTypes.UPDATE,
            transaction
          });
          console.log(`    ✅ Unidad ${numeroUnidadSiguiente} activada (ya existía)`);
        } else {
          // Si no existe, crearla
          const crearSiguiente = `
            INSERT INTO asignacion_docente (IdCurso, IdUnidad, IdDocente, Activa)
            VALUES (?, ?, ?, 1)
          `;
          await sequelize.query(crearSiguiente, {
            replacements: [IdCurso, siguienteUnidad.IdUnidad, IdDocente],
            type: QueryTypes.INSERT,
            transaction
          });
          console.log(`    ✅ Unidad ${numeroUnidadSiguiente} creada y activada`);
        }
      }

      // C) Registrar curso actualizado
      cursosActualizados.push({
        IdCurso,
        NombreCurso,
        NombreGrado,
        NombreSeccion,
        NombreJornada,
        IdDocente,
        NombreDocente,
        UnidadCerrada: numeroUnidadActual,
        UnidadNuevaAbierta: siguienteUnidad ? numeroUnidadSiguiente : null
      });
    }

    // 8. COMMIT DE LA TRANSACCIÓN
    await transaction.commit();

    console.log(`\n✅ Cierre parcial completado:`);
    console.log(`   - Cursos cerrados: ${cursosActualizados.length}`);
    console.log(`   - Cursos con pendientes: ${totalCursos - cursosActualizados.length}`);

    // 9. RETORNAR RESULTADO
    return res.json({
      success: true,
      data: {
        IdUnidad: parseInt(idUnidad),
        NumeroUnidad: numeroUnidadActual,
        NombreUnidad: unidad.NombreUnidad,
        totalCursosAnalizados: totalCursos,
        cursosCerrados: cursosActualizados.length,
        cursosConPendientes: totalCursos - cursosActualizados.length,
        cursosActualizados,
        observaciones: observaciones || null
      },
      message: siguienteUnidad
        ? `${cursosActualizados.length} curso(s) cerrado(s) exitosamente. Unidad ${numeroUnidadSiguiente} abierta para esos cursos.`
        : `${cursosActualizados.length} curso(s) cerrado(s) exitosamente (última unidad).`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al cerrar cursos listos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// 8. ENDPOINTS QUE TRABAJAN CON NUMEROUNIDAD
// ==========================================

/**
 * Obtener estado de todas las unidades con un número específico
 * GET /api/cierre-unidades/estado-por-numero/:numeroUnidad
 */
exports.getEstadoPorNumeroUnidad = async (req, res) => {
  try {
    const { numeroUnidad } = req.params;

    // Obtener estados de TODOS los cursos con ese número de unidad
    const query = `
      SELECT
        e.IdEstado,
        e.IdUnidad,
        e.IdCurso,
        c.Curso AS NombreCurso,
        g.NombreGrado,
        s.NombreSeccion,
        j.NombreJornada,
        e.IdDocente,
        d.NombreDocente,
        e.ActividadesSuman100,
        e.PuntajeActual,
        e.TotalEstudiantes,
        e.EstudiantesCalificados,
        e.PorcentajeCompletado,
        e.EstadoGeneral,
        e.DetallesPendientes,
        e.UltimaActualizacion
      FROM estado_cursos_unidad e
      INNER JOIN unidades un ON e.IdUnidad = un.IdUnidad
      INNER JOIN asignacion_docente ad ON un.IdAsignacionDocente = ad.IdAsignacionDocente
      INNER JOIN cursos c ON e.IdCurso = c.idCurso
      INNER JOIN grados g ON c.IdGrado = g.IdGrado
      INNER JOIN secciones s ON ad.IdSeccion = s.IdSeccion
      INNER JOIN jornadas j ON ad.IdJornada = j.IdJornada
      INNER JOIN docentes d ON e.IdDocente = d.idDocente
      WHERE un.NumeroUnidad = ? AND un.Estado = 1 AND un.Activa = 1
      ORDER BY g.NombreGrado, s.NombreSeccion, c.Curso
    `;

    const estados = await sequelize.query(query, {
      replacements: [numeroUnidad],
      type: QueryTypes.SELECT
    });

    // Parsear JSON de DetallesPendientes y extraer problemas
    const estadosProcesados = estados.map(estado => {
      let detalles = null;
      try {
        if (estado.DetallesPendientes) {
          detalles = typeof estado.DetallesPendientes === 'string'
            ? JSON.parse(estado.DetallesPendientes)
            : estado.DetallesPendientes;
        }
      } catch (error) {
        console.error('Error parsing DetallesPendientes:', error.message);
        detalles = null;
      }

      const problemas = [];
      if (!estado.ActividadesSuman100) {
        problemas.push(`Actividades suman ${estado.PuntajeActual} pts (deben sumar 100)`);
      }
      if (estado.PorcentajeCompletado < 100) {
        const pendientes = estado.TotalEstudiantes - estado.EstudiantesCalificados;
        problemas.push(`${pendientes} estudiante(s) sin calificar`);
      }

      return {
        ...estado,
        DetallesPendientes: detalles,
        Problemas: problemas
      };
    });

    // Calcular resumen
    const resumen = {
      totalCursos: estadosProcesados.length,
      cursosListos: estadosProcesados.filter(e => e.EstadoGeneral === 'LISTO').length,
      cursosPendientes: estadosProcesados.filter(e => e.EstadoGeneral === 'PENDIENTE').length,
      cursosIncompletos: estadosProcesados.filter(e => e.EstadoGeneral === 'INCOMPLETO').length,
      porcentajeCompletado: 0
    };

    if (resumen.totalCursos > 0) {
      resumen.porcentajeCompletado = Math.round(
        (resumen.cursosListos / resumen.totalCursos) * 100
      );
    }

    res.json({
      success: true,
      data: {
        numeroUnidad: parseInt(numeroUnidad),
        cursos: estadosProcesados,
        resumen
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estado por número de unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Actualizar estado de todos los cursos con un número de unidad específico
 * POST /api/cierre-unidades/actualizar-todos-por-numero/:numeroUnidad
 */
exports.actualizarTodosPorNumero = async (req, res) => {
  try {
    const { numeroUnidad } = req.params;

    // Obtener todas las unidades con ese número
    const unidades = await sequelize.query(`
      SELECT IdUnidad FROM unidades WHERE NumeroUnidad = ? AND Estado = 1
    `, {
      replacements: [numeroUnidad],
      type: QueryTypes.SELECT
    });

    let procesados = 0;
    const errores = [];

    for (const { IdUnidad } of unidades) {
      // Obtener cursos de esta unidad
      const cursos = await sequelize.query(`
        SELECT DISTINCT
          c.idCurso AS IdCurso,
          u.IdUsuario AS IdDocente
        FROM unidades un
        INNER JOIN asignacion_docente ad ON un.IdAsignacionDocente = ad.IdAsignacionDocente
        INNER JOIN cursos c ON ad.IdCurso = c.idCurso
        INNER JOIN usuarios u ON ad.IdDocente = u.IdUsuario
        WHERE un.IdUnidad = ?
      `, {
        replacements: [IdUnidad],
        type: QueryTypes.SELECT
      });

      for (const curso of cursos) {
        try {
          const estadoCurso = await this.calcularEstadoCurso(IdUnidad, curso.IdCurso, curso.IdDocente);

          await EstadoCursoUnidad.upsert({
            IdUnidad,
            IdCurso: curso.IdCurso,
            IdDocente: curso.IdDocente,
            ...estadoCurso,
            UltimaActualizacion: new Date()
          });

          procesados++;
        } catch (error) {
          errores.push({ IdUnidad, IdCurso: curso.IdCurso, error: error.message });
        }
      }
    }

    res.json({
      success: true,
      procesados,
      unidadesActualizadas: unidades.length,
      errores: errores.length > 0 ? errores : undefined,
      message: `${procesados} cursos actualizados en ${unidades.length} unidades`
    });

  } catch (error) {
    console.error('❌ Error al actualizar estados por número:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Cerrar cursos listos de todas las unidades con un número específico
 * POST /api/cierre-unidades/cerrar-cursos-listos-por-numero/:numeroUnidad
 */
exports.cerrarCursosListosPorNumero = async (req, res) => {
  console.log('\n🎯 INICIO cerrarCursosListosPorNumero - params:', req.params);
  console.log('👤 Usuario:', req.usuario?.IdUsuario, 'Rol:', req.usuario?.rol);

  const transaction = await sequelize.transaction();

  try {
    const { numeroUnidad } = req.params;
    const observaciones = req.body?.observaciones || null;

    console.log('📋 Datos recibidos - NumeroUnidad:', numeroUnidad, 'Observaciones:', observaciones);

    // Validar permisos
    if (req.usuario.rol !== 1) {
      console.log('❌ ACCESO DENEGADO - Rol:', req.usuario.rol);
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden cerrar cursos'
      });
    }

    const numeroUnidadActual = parseInt(numeroUnidad);
    const numeroUnidadSiguiente = numeroUnidadActual + 1;

    console.log(`\n🔍 Procesando cierre parcial de Unidad ${numeroUnidadActual}...`);

    // Obtener todos los cursos LISTOS de todas las unidades con ese número
    const cursosListosQuery = `
      SELECT
        e.IdUnidad,
        e.IdCurso,
        e.IdDocente,
        c.Curso AS NombreCurso,
        g.NombreGrado,
        s.NombreSeccion,
        j.NombreJornada,
        d.NombreDocente,
        ad.IdAsignacionDocente
      FROM estado_cursos_unidad e
      INNER JOIN unidades un ON e.IdUnidad = un.IdUnidad
      INNER JOIN asignacion_docente ad ON un.IdAsignacionDocente = ad.IdAsignacionDocente
      INNER JOIN cursos c ON e.IdCurso = c.idCurso
      INNER JOIN grados g ON c.IdGrado = g.IdGrado
      INNER JOIN secciones s ON ad.IdSeccion = s.IdSeccion
      INNER JOIN jornadas j ON ad.IdJornada = j.IdJornada
      INNER JOIN docentes d ON e.IdDocente = d.idDocente
      WHERE un.NumeroUnidad = ? AND e.EstadoGeneral = 'LISTO' AND un.Estado = 1
    `;

    const cursosListos = await sequelize.query(cursosListosQuery, {
      replacements: [numeroUnidadActual],
      type: QueryTypes.SELECT,
      transaction
    });

    console.log(`✅ Cursos listos para cerrar: ${cursosListos.length}`);

    if (cursosListos.length === 0) {
      await transaction.rollback();
      return res.json({
        success: true,
        data: {
          NumeroUnidad: numeroUnidadActual,
          cursosCerrados: 0
        },
        message: 'No hay cursos listos para cerrar en esta unidad'
      });
    }

    const cursosActualizados = [];

    for (const curso of cursosListos) {
      const { IdCurso, IdDocente, IdAsignacionDocente, NombreCurso, NombreGrado, NombreSeccion, NombreJornada, NombreDocente } = curso;

      console.log(`\n  📝 Procesando: ${NombreCurso} - ${NombreGrado} ${NombreSeccion}`);

      // Cerrar la unidad actual para esta asignación
      await sequelize.query(`
        UPDATE unidades
        SET Activa = 0
        WHERE IdAsignacionDocente = ? AND NumeroUnidad = ?
      `, {
        replacements: [IdAsignacionDocente, numeroUnidadActual],
        type: QueryTypes.UPDATE,
        transaction
      });

      console.log(`    ✅ Unidad ${numeroUnidadActual} cerrada`);

      // Si existe siguiente unidad, activarla o crearla
      if (numeroUnidadSiguiente <= 4) {
        const [unidadSiguiente] = await sequelize.query(`
          SELECT IdUnidad FROM unidades
          WHERE IdAsignacionDocente = ? AND NumeroUnidad = ?
        `, {
          replacements: [IdAsignacionDocente, numeroUnidadSiguiente],
          type: QueryTypes.SELECT,
          transaction
        });

        if (unidadSiguiente) {
          // Usar modelo para omitir trigger de validación
          const Unidad = require('../models/Unidad');
          await Unidad.update(
            { Activa: 1 },
            {
              where: { IdUnidad: unidadSiguiente.IdUnidad },
              transaction,
              hooks: false // Omitir hooks que podrían validar
            }
          );
          console.log(`    ✅ Unidad ${numeroUnidadSiguiente} activada`);
        } else {
          // Crear la siguiente unidad
          await sequelize.query(`
            INSERT INTO unidades (IdAsignacionDocente, NumeroUnidad, NombreUnidad, PunteoZona, PunteoFinal, Activa, Estado)
            VALUES (?, ?, ?, 60.00, 40.00, 1, 1)
          `, {
            replacements: [IdAsignacionDocente, numeroUnidadSiguiente, `Unidad ${numeroUnidadSiguiente}`],
            type: QueryTypes.INSERT,
            transaction
          });
          console.log(`    ✅ Unidad ${numeroUnidadSiguiente} creada y activada`);
        }
      }

      // Marcar notificaciones de este curso como RESUELTAS
      await sequelize.query(`
        UPDATE notificaciones_docentes
        SET Estado = 'RESUELTA'
        WHERE IdCurso = ? AND IdDocente = ? AND IdUnidad = ? AND Estado = 'PENDIENTE'
      `, {
        replacements: [IdCurso, IdDocente, curso.IdUnidad],
        type: QueryTypes.UPDATE,
        transaction
      });

      cursosActualizados.push({
        IdCurso,
        NombreCurso,
        NombreGrado,
        NombreSeccion,
        NombreJornada,
        IdDocente,
        NombreDocente,
        UnidadCerrada: numeroUnidadActual,
        UnidadNuevaAbierta: numeroUnidadSiguiente <= 4 ? numeroUnidadSiguiente : null
      });
    }

    await transaction.commit();

    console.log(`\n✅ Cierre parcial completado: ${cursosActualizados.length} cursos cerrados`);

    return res.json({
      success: true,
      data: {
        NumeroUnidad: numeroUnidadActual,
        cursosCerrados: cursosActualizados.length,
        cursosActualizados,
        observaciones: observaciones || null
      },
      message: numeroUnidadSiguiente <= 4
        ? `${cursosActualizados.length} curso(s) cerrado(s) exitosamente. Unidad ${numeroUnidadSiguiente} abierta para esos cursos.`
        : `${cursosActualizados.length} curso(s) cerrado(s) exitosamente (última unidad).`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al cerrar cursos por número:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = exports;
