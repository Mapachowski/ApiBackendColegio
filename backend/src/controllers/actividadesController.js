const sequelize = require('../config/database');
const Actividad = require('../models/Actividad');
const Unidad = require('../models/Unidad');

// Obtener una actividad por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const actividad = await Actividad.findByPk(id, {
      include: [{ model: Unidad }],
    });

    if (!actividad) {
      return res.status(404).json({ success: false, error: 'Actividad no encontrada' });
    }

    res.json({ success: true, data: actividad });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener calificaciones de una actividad
exports.getCalificaciones = async (req, res) => {
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

// Crear una nueva actividad (el trigger creará las calificaciones automáticamente)
exports.create = async (req, res) => {
  try {
    const { IdUnidad, NombreActividad, Descripcion, PunteoMaximo, TipoActividad, FechaActividad, CreadoPor } = req.body;

    // Validaciones
    if (!IdUnidad || !NombreActividad || !PunteoMaximo || !TipoActividad) {
      return res.status(400).json({
        success: false,
        error: 'IdUnidad, NombreActividad, PunteoMaximo y TipoActividad son requeridos',
      });
    }

    if (!['zona', 'final'].includes(TipoActividad)) {
      return res.status(400).json({
        success: false,
        error: 'TipoActividad debe ser "zona" o "final"',
      });
    }

    if (!CreadoPor || CreadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'CreadoPor es requerido',
      });
    }

    // El trigger tr_crear_calificaciones_actividad se encargará de crear las calificaciones automáticamente
    const nuevaActividad = await Actividad.create({
      IdUnidad,
      NombreActividad,
      Descripcion,
      PunteoMaximo,
      TipoActividad,
      FechaActividad,
      CreadoPor,
      FechaCreado: new Date(),
    });

    res.status(201).json({
      success: true,
      data: nuevaActividad,
      message: 'Actividad creada y calificaciones generadas automáticamente',
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Actualizar una actividad
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

    const actividad = await Actividad.findByPk(id);
    if (!actividad) {
      return res.status(404).json({ success: false, error: 'Actividad no encontrada' });
    }

    await actividad.update({
      ...req.body,
      FechaModificado: new Date(),
    });

    res.json({ success: true, data: actividad });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Eliminar (desactivar) una actividad
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

    const actividad = await Actividad.findByPk(id);
    if (!actividad) {
      return res.status(404).json({ success: false, error: 'Actividad no encontrada' });
    }

    await actividad.update({
      Estado: false,
      ModificadoPor,
      FechaModificado: new Date(),
    });

    res.json({ success: true, message: 'Actividad marcada como inactiva' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
