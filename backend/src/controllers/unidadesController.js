const sequelize = require('../config/database');
const Unidad = require('../models/Unidad');
const AsignacionDocente = require('../models/AsignacionDocente');

// Obtener una unidad por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const unidad = await Unidad.findByPk(id, {
      include: [{ model: AsignacionDocente }],
    });

    if (!unidad) {
      return res.status(404).json({ success: false, error: 'Unidad no encontrada' });
    }

    res.json({ success: true, data: unidad });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener resumen de una unidad usando la vista
exports.getResumen = async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await sequelize.query(
      'SELECT * FROM vw_actividades_unidad WHERE IdUnidad = ?',
      { replacements: [id] }
    );

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, error: 'Unidad no encontrada' });
    }

    res.json({ success: true, data: results[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener actividades de una unidad
exports.getActividades = async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await sequelize.query(
      'SELECT * FROM actividades WHERE IdUnidad = ? AND Estado = 1 ORDER BY FechaActividad',
      { replacements: [id] }
    );

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Validar punteos de una unidad usando el Stored Procedure
exports.validarPunteos = async (req, res) => {
  try {
    const { id } = req.params;

    // Llamar al stored procedure
    await sequelize.query(
      'CALL sp_validar_punteos_unidad(?, @valido, @zonaConfig, @zonaActual, @finalConfig, @finalActual, @mensaje)',
      {
        replacements: [id],
        type: sequelize.QueryTypes.RAW,
      }
    );

    // Leer los parámetros OUT
    const [[output]] = await sequelize.query(
      'SELECT @valido as valido, @zonaConfig as zonaConfig, @zonaActual as zonaActual, @finalConfig as finalConfig, @finalActual as finalActual, @mensaje as mensaje'
    );

    res.json({
      success: true,
      data: {
        valido: Boolean(output.valido),
        zonaConfig: output.zonaConfig,
        zonaActual: output.zonaActual,
        finalConfig: output.finalConfig,
        finalActual: output.finalActual,
        mensaje: output.mensaje,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Activar una unidad (el trigger validará automáticamente)
exports.activar = async (req, res) => {
  try {
    const { id } = req.params;
    const { ModificadoPor } = req.body;

    if (!ModificadoPor || ModificadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ModificadoPor es requerido',
      });
    }

    const unidad = await Unidad.findByPk(id);
    if (!unidad) {
      return res.status(404).json({ success: false, error: 'Unidad no encontrada' });
    }

    // El trigger tr_validar_activacion_unidad validará automáticamente
    await unidad.update({
      Activa: 1,
      ModificadoPor,
      FechaModificado: new Date(),
    });

    res.json({
      success: true,
      message: 'Unidad activada exitosamente',
      data: unidad,
    });
  } catch (error) {
    // Error 1644 = Error del trigger de validación
    if (error.original && error.original.errno === 1644) {
      return res.status(400).json({
        success: false,
        message: error.original.sqlMessage,
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// Actualizar una unidad
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

    const unidad = await Unidad.findByPk(id);
    if (!unidad) {
      return res.status(404).json({ success: false, error: 'Unidad no encontrada' });
    }

    await unidad.update({
      ...req.body,
      FechaModificado: new Date(),
    });

    res.json({ success: true, data: unidad });
  } catch (error) {
    // Manejar error del trigger si se intenta activar sin punteos correctos
    if (error.original && error.original.errno === 1644) {
      return res.status(400).json({
        success: false,
        message: error.original.sqlMessage,
      });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};
