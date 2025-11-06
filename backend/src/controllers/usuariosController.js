const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const bcrypt = require('bcryptjs'); // 👈 Importar bcrypt para encriptar contraseñas

// Obtener todos los usuarios
exports.getAll = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      where: { Estado: true },
      include: [Rol],
    });
    res.json({ success: true, data: usuarios });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener un usuario por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id, { include: [Rol] });
    if (!usuario) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    res.json({ success: true, data: usuario });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear un nuevo usuario (encripta la contraseña)
exports.create = async (req, res) => {
  try {
    const { IdColaborador, Contrasena } = req.body;

    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({
        success: false,
        error: 'IdColaborador es requerido y debe ser un número',
      });
    }

    if (!Contrasena) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña es requerida',
      });
    }

    // 🔒 Encriptar la contraseña antes de guardar
    const contrasenaEncriptada = bcrypt.hashSync(Contrasena, 10);

    const nuevoUsuario = await Usuario.create({
      ...req.body,
      Contrasena: contrasenaEncriptada, // 👈 Guardamos la versión encriptada
      IdColaborador,
      FechaCreado: new Date(),
    });

    res.status(201).json({ success: true, data: nuevoUsuario });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Actualizar un usuario (opcionalmente encripta si se manda una nueva contraseña)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador, Contrasena } = req.body;

    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({
        success: false,
        error: 'IdColaborador es requerido y debe ser un número',
      });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // 🔒 Si se envía una nueva contraseña, la encriptamos
    let datosActualizados = { ...req.body };
    if (Contrasena) {
      datosActualizados.Contrasena = bcrypt.hashSync(Contrasena, 10);
    }

    await usuario.update({
      ...datosActualizados,
      ModificadoPor: IdColaborador,
      FechaModificado: new Date(),
    });

    res.json({ success: true, data: usuario });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// "Eliminar" un usuario (cambiar Estado a 0)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador } = req.body;

    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({
        success: false,
        error: 'IdColaborador es requerido y debe ser un número',
      });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    await usuario.update({
      Estado: false,
      ModificadoPor: IdColaborador,
      FechaModificado: new Date(),
    });

    res.json({ success: true, message: 'Usuario marcado como inactivo' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
