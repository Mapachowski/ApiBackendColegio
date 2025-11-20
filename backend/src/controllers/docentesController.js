// src/controllers/docentesController.js

const sequelize = require('../config/database'); 
const Docente = require('../models/Docente');

// ===========================
// OBTENER TODOS LOS DOCENTES ACTIVOS
// ===========================
exports.getAll = async (req, res) => {
  try {
    const docentes = await Docente.findAll({
      where: { Estado: 1 },
      order: [['Apellidos', 'ASC'], ['Nombres', 'ASC']]
    });

    res.json({ success: true, data: docentes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===========================
// OBTENER DOCENTE POR ID
// ===========================
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const docente = await Docente.findByPk(id);

    if (!docente || docente.Estado !== 1) {
      return res.status(404).json({ success: false, error: 'Docente no encontrado' });
    }

    res.json({ success: true, data: docente });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===========================
// CREAR NUEVO DOCENTE
// ===========================
exports.create = async (req, res) => {
  try {
    const {
      Nombres,
      Apellidos,
      DPI,
      Telefono,
      Email,
      Direccion,
      CreadoPor
    } = req.body;

    // DPI único
    const existeDPI = await Docente.findOne({ where: { DPI } });
    if (existeDPI) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un docente con este DPI'
      });
    }

    const nuevo = await Docente.create({
      Nombres,
      Apellidos,
      DPI,
      Telefono,
      Email,
      Direccion,
      Estado: 1,
      CreadoPor,
      FechaCreado: new Date()
    });

    res.status(201).json({ success: true, data: nuevo });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===========================
// ACTUALIZAR DOCENTE
// ===========================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const docente = await Docente.findByPk(id);

    if (!docente || docente.Estado !== 1) {
      return res.status(404).json({ success: false, error: 'Docente no encontrado' });
    }

    const {
      Nombres,
      Apellidos,
      DPI,
      Telefono,
      Email,
      Direccion,
      Estado,
      ModificadoPor
    } = req.body;

    await docente.update({
      Nombres,
      Apellidos,
      DPI,
      Telefono,
      Email,
      Direccion,
      Estado,
      ModificadoPor,
      FechaModificado: new Date()
    });

    res.json({ success: true, data: docente });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===========================
// INACTIVAR DOCENTE (ELIMINACIÓN LÓGICA)
// ===========================
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const docente = await Docente.findByPk(id);

    if (!docente || docente.Estado !== 1) {
      return res.status(404).json({ success: false, error: 'Docente no encontrado' });
    }

    await docente.update({
      Estado: 0,
      ModificadoPor: req.body.ModificadoPor || 'Sistema',
      FechaModificado: new Date()
    });

    res.json({ success: true, message: 'Docente inactivado correctamente' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
