const sequelize = require('../config/database');
const { Op } = require('sequelize');
const Unidad = require('../models/Unidad');
const Actividad = require('../models/Actividad');
const Calificacion = require('../models/Calificacion');
const notasUnidadController = require('./notasUnidadController');

/**
 * Validar si una unidad está lista para cerrarse
 * GET /api/unidades/:id/validar-cierre
 */
exports.validarCierre = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la unidad existe
    const unidad = await Unidad.findByPk(id);
    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Verificar que la unidad esté activa
    if (unidad.Activa === 0) {
      return res.status(400).json({
        success: false,
        puedeCerrar: false,
        razon: 'La unidad ya está cerrada',
        unidadCerrada: true
      });
    }

    // Obtener todas las actividades de la unidad (activas)
    const actividades = await Actividad.findAll({
      where: { IdUnidad: id, Estado: true }
    });

    if (actividades.length === 0) {
      return res.status(400).json({
        success: false,
        puedeCerrar: false,
        razon: 'No hay actividades creadas en esta unidad'
      });
    }

    // Obtener alumnos inscritos
    const [alumnos] = await sequelize.query(
      `SELECT DISTINCT a.IdAlumno
       FROM actividades act
       INNER JOIN unidades u ON act.IdUnidad = u.IdUnidad
       INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.IdAsignacionDocente
       INNER JOIN inscripciones i ON
           i.IdGrado = ad.IdGrado
           AND i.IdSeccion = ad.IdSeccion
           AND i.IdJornada = ad.IdJornada
           AND i.CicloEscolar = ad.Anio
       INNER JOIN alumnos a ON i.IdAlumno = a.IdAlumno
       WHERE act.IdUnidad = :idUnidad
         AND i.Estado = 1
         AND a.Estado = 1`,
      { replacements: { idUnidad: id } }
    );

    const totalAlumnos = alumnos.length;
    const totalActividades = actividades.length;
    const calificacionesEsperadas = totalAlumnos * totalActividades;

    // Contar calificaciones completas (con punteo no null)
    const idsActividades = actividades.map(act => act.IdActividad);
    const idsAlumnos = alumnos.map(a => a.IdAlumno);

    const calificacionesCompletas = await Calificacion.count({
      where: {
        IdActividad: idsActividades,
        IdAlumno: idsAlumnos,
        Punteo: { [Op.ne]: null }
      }
    });

    const porcentajeCompletado = Math.round((calificacionesCompletas / calificacionesEsperadas) * 100);
    const puedeCerrar = calificacionesCompletas === calificacionesEsperadas;

    // Si puede cerrar, devolver respuesta simple
    if (puedeCerrar) {
      return res.json({
        success: true,
        puedeCerrar: true,
        estadisticas: {
          totalActividades,
          totalAlumnos,
          calificacionesCompletas,
          calificacionesEsperadas,
          porcentajeCompletado: 100
        },
        actividadesPendientes: []
      });
    }

    // Si NO puede cerrar, obtener detalles de actividades pendientes
    const actividadesPendientes = [];

    for (const actividad of actividades) {
      const calificadasEnActividad = await Calificacion.count({
        where: {
          IdActividad: actividad.IdActividad,
          IdAlumno: idsAlumnos,
          Punteo: { [Op.ne]: null }
        }
      });

      const alumnosSinCalificar = totalAlumnos - calificadasEnActividad;

      if (alumnosSinCalificar > 0) {
        actividadesPendientes.push({
          IdActividad: actividad.IdActividad,
          NombreActividad: actividad.NombreActividad,
          alumnosSinCalificar
        });
      }
    }

    res.json({
      success: true,
      puedeCerrar: false,
      razon: 'Hay actividades sin calificar completamente',
      estadisticas: {
        totalActividades,
        totalAlumnos,
        calificacionesCompletas,
        calificacionesEsperadas,
        porcentajeCompletado
      },
      actividadesPendientes
    });

  } catch (error) {
    console.error('❌ Error al validar cierre de unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Cerrar una unidad y calcular notas finales
 * POST /api/unidades/:id/cerrar
 */
exports.cerrarUnidad = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id;

    // Verificar que la unidad existe
    const unidad = await Unidad.findByPk(id);
    if (!unidad) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Verificar que la unidad esté activa
    if (unidad.Activa === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'La unidad ya está cerrada'
      });
    }

    // Validar que todas las calificaciones estén completas
    const validacion = await this.validarCierreInterno(id);
    if (!validacion.puedeCerrar) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'No se puede cerrar la unidad',
        razon: validacion.razon,
        detalles: validacion.actividadesPendientes
      });
    }

    // Calcular notas de todos los alumnos usando el método existente
    const [alumnos] = await sequelize.query(
      `SELECT DISTINCT a.IdAlumno
       FROM actividades act
       INNER JOIN unidades u ON act.IdUnidad = u.IdUnidad
       INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.IdAsignacionDocente
       INNER JOIN inscripciones i ON
           i.IdGrado = ad.IdGrado
           AND i.IdSeccion = ad.IdSeccion
           AND i.IdJornada = ad.IdJornada
           AND i.CicloEscolar = ad.Anio
       INNER JOIN alumnos a ON i.IdAlumno = a.IdAlumno
       WHERE act.IdUnidad = :idUnidad
         AND i.Estado = 1
         AND a.Estado = 1`,
      { replacements: { idUnidad: id } }
    );

    let notasRegistradas = 0;
    let sumaNotas = 0;
    let aprobados = 0;
    let reprobados = 0;

    for (const alumno of alumnos) {
      try {
        const notaUnidad = await notasUnidadController.calcularNotaAlumnoInterno(
          id,
          alumno.IdAlumno,
          unidad,
          usuarioId
        );

        notasRegistradas++;
        sumaNotas += parseFloat(notaUnidad.NotaTotal);
        if (notaUnidad.Aprobado) {
          aprobados++;
        } else {
          reprobados++;
        }
      } catch (error) {
        console.error(`Error calculando nota alumno ${alumno.IdAlumno}:`, error);
      }
    }

    // Cerrar la unidad (Activa = 0)
    await unidad.update({
      Activa: 0,
      ModificadoPor: req.usuario?.email || req.usuario?.nombre || 'Sistema',
      FechaModificado: new Date()
    }, { transaction });

    await transaction.commit();

    const promedio = notasRegistradas > 0 ? Math.round(sumaNotas / notasRegistradas) : 0;

    res.json({
      success: true,
      message: `Unidad cerrada exitosamente. ${notasRegistradas} notas finales registradas.`,
      data: {
        IdUnidad: parseInt(id),
        notasRegistradas,
        estadisticas: {
          promedio,
          aprobados,
          reprobados
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al cerrar unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Método interno para validar cierre (sin respuesta HTTP)
 */
exports.validarCierreInterno = async (idUnidad) => {
  const actividades = await Actividad.findAll({
    where: { IdUnidad: idUnidad, Estado: true }
  });

  if (actividades.length === 0) {
    return {
      puedeCerrar: false,
      razon: 'No hay actividades creadas'
    };
  }

  const [alumnos] = await sequelize.query(
    `SELECT DISTINCT a.IdAlumno
     FROM actividades act
     INNER JOIN unidades u ON act.IdUnidad = u.IdUnidad
     INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.IdAsignacionDocente
     INNER JOIN inscripciones i ON
         i.IdGrado = ad.IdGrado
         AND i.IdSeccion = ad.IdSeccion
         AND i.IdJornada = ad.IdJornada
         AND i.CicloEscolar = ad.Anio
     INNER JOIN alumnos a ON i.IdAlumno = a.IdAlumno
     WHERE act.IdUnidad = :idUnidad
       AND i.Estado = 1
       AND a.Estado = 1`,
    { replacements: { idUnidad } }
  );

  const totalAlumnos = alumnos.length;
  const totalActividades = actividades.length;
  const calificacionesEsperadas = totalAlumnos * totalActividades;

  const idsActividades = actividades.map(act => act.IdActividad);
  const idsAlumnos = alumnos.map(a => a.IdAlumno);

  const calificacionesCompletas = await Calificacion.count({
    where: {
      IdActividad: idsActividades,
      IdAlumno: idsAlumnos,
      Punteo: { [Op.ne]: null }
    }
  });

  if (calificacionesCompletas !== calificacionesEsperadas) {
    const actividadesPendientes = [];

    for (const actividad of actividades) {
      const calificadasEnActividad = await Calificacion.count({
        where: {
          IdActividad: actividad.IdActividad,
          IdAlumno: idsAlumnos,
          Punteo: { [Op.ne]: null }
        }
      });

      const alumnosSinCalificar = totalAlumnos - calificadasEnActividad;

      if (alumnosSinCalificar > 0) {
        actividadesPendientes.push({
          IdActividad: actividad.IdActividad,
          NombreActividad: actividad.NombreActividad,
          alumnosSinCalificar
        });
      }
    }

    return {
      puedeCerrar: false,
      razon: 'Hay actividades sin calificar completamente',
      actividadesPendientes
    };
  }

  return { puedeCerrar: true };
};
