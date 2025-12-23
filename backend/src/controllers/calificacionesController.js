const sequelize = require('../config/database');
const Calificacion = require('../models/Calificacion');
const Actividad = require('../models/Actividad');
const Alumno = require('../models/Alumno');

// Obtener una calificación por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const calificacion = await Calificacion.findByPk(id, {
      include: [
        { model: Actividad },
        { model: Alumno },
      ],
    });

    if (!calificacion) {
      return res.status(404).json({ success: false, error: 'Calificación no encontrada' });
    }

    res.json({ success: true, data: calificacion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener calificaciones por actividad
exports.getPorActividad = async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await sequelize.query(
      `SELECT c.IdCalificacion, c.Punteo, c.Observaciones,
              a.IdAlumno, a.Matricula, a.Nombres, a.Apellidos,
              act.NombreActividad, act.PunteoMaximo
       FROM calificaciones c
       INNER JOIN alumnos a ON c.IdAlumno = a.IdAlumno
       INNER JOIN actividades act ON c.IdActividad = act.IdActividad
       WHERE c.IdActividad = ?
       ORDER BY a.Apellidos, a.Nombres`,
      { replacements: [id] }
    );

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener calificaciones por alumno (con opción de filtrar por unidad)
exports.getPorAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const { unidad } = req.query;

    let query = 'SELECT * FROM vw_calificaciones_alumno_unidad WHERE IdAlumno = ?';
    let params = [id];

    if (unidad) {
      query += ' AND NumeroUnidad = ?';
      params.push(unidad);
    }

    const [results] = await sequelize.query(query, { replacements: params });

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener promedio anual de un alumno
exports.getPromedioAlumno = async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await sequelize.query(
      'SELECT * FROM vw_promedio_anual WHERE IdAlumno = ?',
      { replacements: [id] }
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron calificaciones para este alumno',
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Actualizar una calificación (ingresar punteo)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { Punteo, Observaciones, ModificadoPor } = req.body;

    if (!ModificadoPor || ModificadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ModificadoPor es requerido',
      });
    }

    const calificacion = await Calificacion.findByPk(id, {
      include: [{ model: Actividad }],
    });

    if (!calificacion) {
      return res.status(404).json({ success: false, error: 'Calificación no encontrada' });
    }

    // Validar opcionalmente con el stored procedure
    if (Punteo !== null && Punteo !== undefined) {
      await sequelize.query(
        'CALL sp_validar_calificacion(?, ?, ?, @valido, @mensaje)',
        {
          replacements: [calificacion.IdActividad, calificacion.IdAlumno, Punteo],
          type: sequelize.QueryTypes.RAW,
        }
      );

      const [[validation]] = await sequelize.query('SELECT @valido as valido, @mensaje as mensaje');

      if (!validation.valido) {
        return res.status(400).json({
          success: false,
          message: validation.mensaje,
        });
      }
    }

    // Actualizar la calificación
    await calificacion.update({
      Punteo,
      Observaciones,
      ModificadoPor,
      FechaModificado: new Date(),
    });

    res.json({
      success: true,
      data: calificacion,
      message: 'Calificación actualizada exitosamente',
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Actualizar múltiples calificaciones en batch
exports.updateBatch = async (req, res) => {
  try {
    const { calificaciones, ModificadoPor } = req.body;

    if (!calificaciones || !Array.isArray(calificaciones) || calificaciones.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de calificaciones',
      });
    }

    if (!ModificadoPor || ModificadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ModificadoPor es requerido',
      });
    }

    const actualizadas = [];
    const errores = [];

    for (const item of calificaciones) {
      try {
        const calificacion = await Calificacion.findByPk(item.IdCalificacion);
        if (calificacion) {
          await calificacion.update({
            Punteo: item.Punteo,
            Observaciones: item.Observaciones || null,
            ModificadoPor,
            FechaModificado: new Date(),
          });
          actualizadas.push(item.IdCalificacion);
        }
      } catch (error) {
        errores.push({
          IdCalificacion: item.IdCalificacion,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      data: {
        actualizadas: actualizadas.length,
        errores: errores.length,
        detalleErrores: errores,
      },
      message: `${actualizadas.length} calificaciones actualizadas exitosamente`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
