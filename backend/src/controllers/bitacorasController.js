const Bitacora = require('../models/Bitacora');
const Usuario = require('../models/Usuario');

// Obtener todas las bitácoras
exports.getBitacoras = async (req, res) => {
  try {
    const bitacoras = await Bitacora.findAll({
      include: [{ model: Usuario, attributes: ['IdUsuario', 'NombreUsuario'] }], // Incluye datos del usuario relacionado
    });
    res.status(200).json(bitacoras);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener bitácoras', error: error.message });
  }
};

// Obtener una bitácora por ID
exports.getBitacoraById = async (req, res) => {
  try {
    const bitacora = await Bitacora.findByPk(req.params.id, {
      include: [{ model: Usuario, attributes: ['IdUsuario', 'NombreUsuario'] }],
    });
    if (!bitacora) {
      return res.status(404).json({ message: 'Bitácora no encontrada' });
    }
    res.status(200).json(bitacora);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la bitácora', error: error.message });
  }
};

// Crear una nueva bitácora
exports.createBitacora = async (req, res) => {
  try {
    const { Accion, FechaBitacora, Ordenador, IdUsuario, Observacion } = req.body;

    // Validar campos requeridos
    if (!Accion || !FechaBitacora || !Ordenador || !IdUsuario) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    // Validar que el IdUsuario existe
    const usuario = await Usuario.findByPk(IdUsuario);
    if (!usuario) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const nuevaBitacora = await Bitacora.create({
      Accion,
      FechaBitacora,
      Ordenador,
      IdUsuario,
      Observacion: Observacion || null, // Campo opcional
    });

    res.status(201).json(nuevaBitacora);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear bitácora', error: error.message });
  }
};