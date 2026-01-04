const sequelize = require('../config/database');
const Docente = require('../models/Docente');
const Usuario = require('../models/Usuario');

// Obtener todos los docentes activos
exports.getAll = async (req, res) => {
  try {
    const docentes = await Docente.findAll({
      where: { Estado: true },
      include: [
        {
          model: Usuario,
          attributes: ['IdUsuario', 'NombreUsuario', 'NombreCompleto', 'IdRol'],
          required: false,
        },
      ],
    });
    res.json({ success: true, data: docentes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener un docente por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const docente = await Docente.findByPk(id, {
      include: [
        {
          model: Usuario,
          attributes: ['IdUsuario', 'NombreUsuario', 'NombreCompleto', 'IdRol'],
          required: false,
        },
      ],
    });
    if (!docente) {
      return res.status(404).json({ success: false, error: 'Docente no encontrado' });
    }
    res.json({ success: true, data: docente });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener asignaciones de un docente
exports.getAsignaciones = async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await sequelize.query(
      'SELECT * FROM vw_asignaciones_docente WHERE idDocente = ?',
      { replacements: [id] }
    );

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear un nuevo docente
exports.create = async (req, res) => {
  try {
    const { CreadoPor, DPI, idUsuario, NombreDocente } = req.body;

    // Validar campos obligatorios
    if (!CreadoPor || CreadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'CreadoPor es requerido',
      });
    }

    if (!DPI || DPI.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'DPI es requerido',
      });
    }

    if (!idUsuario || isNaN(idUsuario)) {
      return res.status(400).json({
        success: false,
        error: 'idUsuario es requerido y debe ser un número',
      });
    }

    if (!NombreDocente || NombreDocente.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'NombreDocente es requerido',
      });
    }

    const nuevoDocente = await Docente.create({
      ...req.body,
      FechaCreado: new Date(),
    });

    res.status(201).json({ success: true, data: nuevoDocente });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Actualizar un docente
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

    const docente = await Docente.findByPk(id);
    if (!docente) {
      return res.status(404).json({ success: false, error: 'Docente no encontrado' });
    }

    await docente.update({
      ...req.body,
      FechaModificado: new Date(),
    });

    res.json({ success: true, data: docente });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Eliminar (desactivar) un docente
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

    const docente = await Docente.findByPk(id);
    if (!docente) {
      return res.status(404).json({ success: false, error: 'Docente no encontrado' });
    }

    await docente.update({
      Estado: false,
      ModificadoPor,
      FechaModificado: new Date(),
    });

    res.json({ success: true, message: 'Docente marcado como inactivo' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
