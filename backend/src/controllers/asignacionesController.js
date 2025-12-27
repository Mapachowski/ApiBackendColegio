const sequelize = require('../config/database');
const AsignacionDocente = require('../models/AsignacionDocente');
const Docente = require('../models/Docente');
const Curso = require('../models/Curso');
const Grado = require('../models/Grado');
const Seccion = require('../models/Seccion');
const Jornada = require('../models/Jornada');

// Obtener todas las asignaciones activas (con filtros opcionales)
exports.getAll = async (req, res) => {
  try {
    const { anio, idGrado, idSeccion, idJornada, idDocente } = req.query;

    // Si hay filtros, usar el SP de filtrado
    if (anio || idGrado || idSeccion || idJornada || idDocente) {
      const results = await sequelize.query(
        'CALL sp_filtrar_asignaciones(:anio, :idGrado, :idSeccion, :idJornada, :idDocente)',
        {
          replacements: {
            anio: anio || null,
            idGrado: idGrado || null,
            idSeccion: idSeccion || null,
            idJornada: idJornada || null,
            idDocente: idDocente || null
          },
          type: sequelize.QueryTypes.SELECT
        }
      );
      return res.json({ success: true, data: results });
    }

    // Sin filtros, usar la vista
    const [results] = await sequelize.query('SELECT * FROM vw_asignaciones_docente WHERE Estado = 1');
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener una asignación por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const asignacion = await AsignacionDocente.findByPk(id, {
      include: [
        { model: Docente },
        { model: Curso },
        { model: Grado },
        { model: Seccion },
        { model: Jornada },
      ],
    });

    if (!asignacion) {
      return res.status(404).json({ success: false, error: 'Asignación no encontrada' });
    }

    res.json({ success: true, data: asignacion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener unidades de una asignación
exports.getUnidades = async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await sequelize.query(
      'SELECT * FROM vw_actividades_unidad WHERE IdAsignacionDocente = ? ORDER BY NumeroUnidad',
      { replacements: [id] }
    );

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear una nueva asignación usando el Stored Procedure
exports.create = async (req, res) => {
  try {
    const { idDocente, idCurso, idGrado, idSeccion, idJornada, anio, CreadoPor } = req.body;

    // Validaciones
    if (!idDocente || !idCurso || !idGrado || !idSeccion || !idJornada || !anio) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos: idDocente, idCurso, idGrado, idSeccion, idJornada, anio',
      });
    }

    if (!CreadoPor || CreadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'CreadoPor es requerido',
      });
    }

    // Llamar al stored procedure
    await sequelize.query(
      'CALL sp_asignar_docente_curso(?, ?, ?, ?, ?, ?, ?, @idAsig, @success, @mensaje)',
      {
        replacements: [idDocente, idCurso, idGrado, idSeccion, idJornada, anio, CreadoPor],
        type: sequelize.QueryTypes.RAW,
      }
    );

    // Leer los parámetros OUT
    const [[output]] = await sequelize.query('SELECT @idAsig as idAsignacion, @success as success, @mensaje as mensaje');

    if (output.success) {
      res.status(201).json({
        success: true,
        data: { idAsignacion: output.idAsignacion },
        message: output.mensaje,
      });
    } else {
      res.status(400).json({
        success: false,
        message: output.mensaje,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Actualizar una asignación
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { ModificadoPor } = req.body;

    if (!ModificadoPor || ModificadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ModificadoPor es requerido',
      });
    }

    const asignacion = await AsignacionDocente.findByPk(id);
    if (!asignacion) {
      return res.status(404).json({ success: false, error: 'Asignación no encontrada' });
    }

    await asignacion.update({
      ...req.body,
      FechaModificado: new Date(),
    });

    res.json({ success: true, data: asignacion });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Eliminar (desactivar) una asignación
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { ModificadoPor } = req.body;

    if (!ModificadoPor || ModificadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ModificadoPor es requerido',
      });
    }

    const asignacion = await AsignacionDocente.findByPk(id);
    if (!asignacion) {
      return res.status(404).json({ success: false, error: 'Asignación no encontrada' });
    }

    await asignacion.update({
      Estado: false,
      ModificadoPor,
      FechaModificado: new Date(),
    });

    res.json({ success: true, message: 'Asignación marcada como inactiva' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Validar si existe una asignación duplicada
exports.validar = async (req, res) => {
  try {
    const { idCurso, idGrado, idSeccion, idJornada, anio } = req.query;

    // Validaciones
    if (!idCurso || !idGrado || !idSeccion || !idJornada || !anio) {
      return res.status(400).json({
        success: false,
        error: 'Todos los parámetros son requeridos: idCurso, idGrado, idSeccion, idJornada, anio',
      });
    }

    // Llamar al stored procedure
    const results = await sequelize.query(
      'CALL sp_validar_asignacion_duplicada(:idCurso, :idGrado, :idSeccion, :idJornada, :anio)',
      {
        replacements: {
          idCurso,
          idGrado,
          idSeccion,
          idJornada,
          anio
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    // El resultado del SP viene en results[0][0]
    const resultado = results[0][0];

    res.json({
      success: true,
      data: {
        existe: resultado.Existe === 1,
        idAsignacionExistente: resultado.IdAsignacionExistente,
        nombreDocente: resultado.NombreDocente,
        nombreCurso: resultado.NombreCurso,
        nombreGrado: resultado.NombreGrado,
        nombreSeccion: resultado.NombreSeccion,
        nombreJornada: resultado.NombreJornada,
        anio: resultado.Anio,
        mensaje: resultado.Mensaje
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener cursos disponibles para asignar
exports.getCursosDisponibles = async (req, res) => {
  try {
    const { idGrado, idSeccion, idJornada, anio } = req.query;

    // Validaciones
    if (!idGrado || !idSeccion || !idJornada || !anio) {
      return res.status(400).json({
        success: false,
        error: 'Todos los parámetros son requeridos: idGrado, idSeccion, idJornada, anio',
      });
    }

    // Ejecutar el stored procedure
    const results = await sequelize.query(
      'CALL sp_cursos_disponibles(:idGrado, :idSeccion, :idJornada, :anio)',
      {
        replacements: {
          idGrado,
          idSeccion,
          idJornada,
          anio
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error en getCursosDisponibles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener actividades con calificaciones del alumno
exports.getActividadesConCalificaciones = async (req, res) => {
  try {
    const { id } = req.params;
    const { idAlumno } = req.query;

    if (!idAlumno || isNaN(idAlumno)) {
      return res.status(400).json({
        success: false,
        error: 'idAlumno es requerido en query params y debe ser un número'
      });
    }

    // Validar que la asignación existe
    const asignacion = await AsignacionDocente.findByPk(id);
    if (!asignacion) {
      return res.status(404).json({
        success: false,
        error: 'Asignación no encontrada'
      });
    }

    // Obtener actividades con calificaciones del alumno
    const [actividades] = await sequelize.query(
      `SELECT
        a.IdActividad,
        a.NombreActividad,
        a.Descripcion,
        a.PunteoMaximo,
        a.TipoActividad,
        a.FechaActividad,
        a.FechaCreado,
        a.Estado as EstadoActividad,
        u.IdUnidad,
        u.NumeroUnidad,
        u.NombreUnidad,
        u.Activa as UnidadActiva,
        c.IdCalificacion,
        c.Punteo,
        c.Observaciones
      FROM actividades a
      INNER JOIN unidades u ON a.IdUnidad = u.IdUnidad
      LEFT JOIN calificaciones c ON a.IdActividad = c.IdActividad AND c.IdAlumno = ?
      WHERE u.IdAsignacionDocente = ?
        AND a.Estado = 1
      ORDER BY u.NumeroUnidad, a.FechaActividad`,
      {
        replacements: [idAlumno, id]
      }
    );

    res.json({
      success: true,
      data: actividades,
      total: actividades.length
    });
  } catch (error) {
    console.error('Error en getActividadesConCalificaciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
