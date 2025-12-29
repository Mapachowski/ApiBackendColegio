const sequelize = require('../config/database');
const Unidad = require('../models/Unidad');
const Actividad = require('../models/Actividad');
const Calificacion = require('../models/Calificacion');
const EstadoCursoUnidad = require('../models/EstadoCursoUnidad');
const NotificacionDocente = require('../models/NotificacionDocente');
const { Op } = require('sequelize');

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

module.exports = exports;
