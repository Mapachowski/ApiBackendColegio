const Familia = require('../models/Familia'); // Importa el modelo de Familia
const sequelize = require('../config/database');

// Obtener todas las familias
exports.getAll = async (req, res) => {
  try {
    const familias = await Familia.findAll({ where: { Estado: true } }); // Solo activos
    res.json({ success: true, data: familias });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener una familia por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const familia = await Familia.findByPk(id);
    if (!familia) {
      return res.status(404).json({ success: false, error: 'Familia no encontrada' });
    }
    res.json({ success: true, data: familia });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener familias completas con toda la información
exports.getFamiliasCompletas = async (req, res) => {
  try {
    const results = await sequelize.query('CALL sp_obtenerfamiliascompletas()', {
      type: sequelize.QueryTypes.SELECT
    });

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron familias completas'
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error en getFamiliasCompletas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear una nueva familia
exports.create = async (req, res) => {
  try {
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const nuevaFamilia = await Familia.create({
      ...req.body, // Copia los datos del body
      CreadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaCreado: new Date(), // Fecha actual (05:14 PM CST, 07/10/2025)
    });
    res.status(201).json({ success: true, data: nuevaFamilia });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Actualizar una familia
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const familia = await Familia.findByPk(id);
    if (!familia) {
      return res.status(404).json({ success: false, error: 'Familia no encontrada' });
    }
    await familia.update({
      ...req.body, // Copia los datos del body
      ModificadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaModificado: new Date(), // Fecha actual
    });
    res.json({ success: true, data: familia });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// "Eliminar" una familia (cambiar Estado a 0)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const familia = await Familia.findByPk(id);
    if (!familia) {
      return res.status(404).json({ success: false, error: 'Familia no encontrada' });
    }
    await familia.update({
      Estado: false,
      ModificadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaModificado: new Date(), // Fecha actual
    });
    res.json({ success: true, message: 'Familia marcada como inactiva' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};