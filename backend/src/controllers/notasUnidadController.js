const sequelize = require('../config/database');
const NotaUnidad = require('../models/NotaUnidad');
const Calificacion = require('../models/Calificacion');
const Actividad = require('../models/Actividad');
const Unidad = require('../models/Unidad');
const Alumno = require('../models/Alumno');

/**
 * Calcular y actualizar las notas de unidad para un alumno específico
 * POST /api/notas-unidad/calcular
 */
exports.calcularNotaAlumno = async (req, res) => {
  try {
    const { IdUnidad, IdAlumno } = req.body;

    if (!IdUnidad || !IdAlumno) {
      return res.status(400).json({
        success: false,
        error: 'IdUnidad e IdAlumno son requeridos'
      });
    }

    // Obtener la unidad para conocer los punteos esperados
    const unidad = await Unidad.findByPk(IdUnidad);
    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Obtener todas las actividades de la unidad (activas)
    const actividades = await Actividad.findAll({
      where: { IdUnidad, Estado: true }
    });

    // Obtener todas las calificaciones del alumno para esta unidad
    const idsActividades = actividades.map(act => act.IdActividad);
    const calificaciones = await Calificacion.findAll({
      where: {
        IdActividad: idsActividades,
        IdAlumno
      }
    });

    // Calcular nota de zona
    const actividadesZona = actividades.filter(act => act.TipoActividad === 'zona');
    let notaZona = 0;
    actividadesZona.forEach(actividad => {
      const calificacion = calificaciones.find(c => c.IdActividad === actividad.IdActividad);
      if (calificacion && calificacion.Punteo !== null) {
        notaZona += parseFloat(calificacion.Punteo);
      }
    });

    // Calcular nota final
    const actividadesFinal = actividades.filter(act => act.TipoActividad === 'final');
    let notaFinal = 0;
    actividadesFinal.forEach(actividad => {
      const calificacion = calificaciones.find(c => c.IdActividad === actividad.IdActividad);
      if (calificacion && calificacion.Punteo !== null) {
        notaFinal += parseFloat(calificacion.Punteo);
      }
    });

    // Calcular nota total
    const notaTotal = notaZona + notaFinal;

    // Determinar si aprobó (nota >= 60)
    const aprobado = notaTotal >= 60;

    // Crear o actualizar nota de unidad
    const [notaUnidad, created] = await NotaUnidad.findOrCreate({
      where: { IdUnidad, IdAlumno },
      defaults: {
        IdAsignacionDocente: unidad.IdAsignacionDocente,
        NotaZona: notaZona,
        NotaFinal: notaFinal,
        NotaTotal: notaTotal,
        Aprobado: aprobado,
        RegistradoPor: req.usuario?.id || null,
        FechaRegistro: new Date()
      }
    });

    if (!created) {
      // Actualizar nota existente
      await notaUnidad.update({
        NotaZona: notaZona,
        NotaFinal: notaFinal,
        NotaTotal: notaTotal,
        Aprobado: aprobado,
        RegistradoPor: req.usuario?.id || null
      });
    }

    res.json({
      success: true,
      data: notaUnidad,
      created,
      message: created ? 'Nota de unidad creada exitosamente' : 'Nota de unidad actualizada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al calcular nota de unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Calcular y actualizar las notas de todos los alumnos de una unidad
 * POST /api/notas-unidad/calcular-todos/:idUnidad
 */
exports.calcularTodasNotasUnidad = async (req, res) => {
  try {
    const { idUnidad } = req.params;

    // Obtener la unidad
    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Obtener todos los alumnos inscritos en esta unidad
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

    let procesados = 0;
    let errores = [];

    for (const alumno of alumnos) {
      try {
        // Reutilizar la lógica del método anterior
        await this.calcularNotaAlumnoInterno(idUnidad, alumno.IdAlumno, unidad, req.usuario?.id);
        procesados++;
      } catch (error) {
        errores.push({
          IdAlumno: alumno.IdAlumno,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      procesados,
      total: alumnos.length,
      errores: errores.length > 0 ? errores : undefined,
      message: `${procesados} notas calculadas exitosamente`
    });
  } catch (error) {
    console.error('❌ Error al calcular todas las notas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Método interno para calcular nota de un alumno (reutilizable)
 */
exports.calcularNotaAlumnoInterno = async (IdUnidad, IdAlumno, unidad, usuarioId) => {
  // Obtener todas las actividades de la unidad (activas)
  const actividades = await Actividad.findAll({
    where: { IdUnidad, Estado: true }
  });

  // Obtener todas las calificaciones del alumno para esta unidad
  const idsActividades = actividades.map(act => act.IdActividad);
  const calificaciones = await Calificacion.findAll({
    where: {
      IdActividad: idsActividades,
      IdAlumno
    }
  });

  // Calcular nota de zona
  const actividadesZona = actividades.filter(act => act.TipoActividad === 'zona');
  let notaZona = 0;
  actividadesZona.forEach(actividad => {
    const calificacion = calificaciones.find(c => c.IdActividad === actividad.IdActividad);
    if (calificacion && calificacion.Punteo !== null) {
      notaZona += parseFloat(calificacion.Punteo);
    }
  });

  // Calcular nota final
  const actividadesFinal = actividades.filter(act => act.TipoActividad === 'final');
  let notaFinal = 0;
  actividadesFinal.forEach(actividad => {
    const calificacion = calificaciones.find(c => c.IdActividad === actividad.IdActividad);
    if (calificacion && calificacion.Punteo !== null) {
      notaFinal += parseFloat(calificacion.Punteo);
    }
  });

  // Calcular nota total
  const notaTotal = notaZona + notaFinal;

  // Determinar si aprobó (nota >= 60)
  const aprobado = notaTotal >= 60;

  // Crear o actualizar nota de unidad
  const [notaUnidad, created] = await NotaUnidad.findOrCreate({
    where: { IdUnidad, IdAlumno },
    defaults: {
      IdAsignacionDocente: unidad.IdAsignacionDocente,
      NotaZona: notaZona,
      NotaFinal: notaFinal,
      NotaTotal: notaTotal,
      Aprobado: aprobado,
      RegistradoPor: usuarioId || null,
      FechaRegistro: new Date()
    }
  });

  if (!created) {
    await notaUnidad.update({
      NotaZona: notaZona,
      NotaFinal: notaFinal,
      NotaTotal: notaTotal,
      Aprobado: aprobado,
      RegistradoPor: usuarioId || null
    });
  }

  return notaUnidad;
};

/**
 * Obtener notas de todos los alumnos de una unidad
 * GET /api/notas-unidad/unidad/:idUnidad
 */
exports.getNotasPorUnidad = async (req, res) => {
  try {
    const { idUnidad } = req.params;

    const [notas] = await sequelize.query(
      `SELECT
          nu.IdNotaUnidad,
          nu.IdUnidad,
          nu.IdAlumno,
          nu.NotaZona,
          nu.NotaFinal,
          nu.NotaTotal,
          nu.Aprobado,
          nu.FechaRegistro,
          a.Matricula AS Carnet,
          CONCAT(a.Nombres, ' ', a.Apellidos) AS NombreCompleto,
          a.Nombres,
          a.Apellidos
       FROM notas_unidad nu
       INNER JOIN alumnos a ON nu.IdAlumno = a.IdAlumno
       WHERE nu.IdUnidad = :idUnidad
         AND nu.Estado = 1
       ORDER BY a.Apellidos, a.Nombres`,
      { replacements: { idUnidad } }
    );

    res.json({
      success: true,
      data: notas,
      total: notas.length
    });
  } catch (error) {
    console.error('❌ Error al obtener notas de unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Obtener notas de un alumno en todas sus unidades
 * GET /api/notas-unidad/alumno/:idAlumno
 */
exports.getNotasPorAlumno = async (req, res) => {
  try {
    const { idAlumno } = req.params;

    const [notas] = await sequelize.query(
      `SELECT
          nu.IdNotaUnidad,
          nu.IdUnidad,
          nu.NotaZona,
          nu.NotaFinal,
          nu.NotaTotal,
          nu.Aprobado,
          nu.FechaRegistro,
          u.NumeroUnidad,
          u.NombreUnidad,
          u.PunteoZona,
          u.PunteoFinal
       FROM notas_unidad nu
       INNER JOIN unidades u ON nu.IdUnidad = u.IdUnidad
       WHERE nu.IdAlumno = :idAlumno
         AND nu.Estado = 1
       ORDER BY u.NumeroUnidad`,
      { replacements: { idAlumno } }
    );

    res.json({
      success: true,
      data: notas,
      total: notas.length
    });
  } catch (error) {
    console.error('❌ Error al obtener notas del alumno:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Obtener una nota específica
 * GET /api/notas-unidad/:id
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const notaUnidad = await NotaUnidad.findByPk(id, {
      include: [
        { model: Unidad },
        { model: Alumno }
      ]
    });

    if (!notaUnidad) {
      return res.status(404).json({
        success: false,
        error: 'Nota de unidad no encontrada'
      });
    }

    res.json({ success: true, data: notaUnidad });
  } catch (error) {
    console.error('❌ Error al obtener nota de unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
