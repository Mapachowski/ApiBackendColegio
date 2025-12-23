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

// Actualizar un usuario
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador, Contrasena, ContrasenaActual } = req.body;

    // Validar IdColaborador
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

    // Validar que solo se pueda modificar a sí mismo
    if (parseInt(id) !== parseInt(IdColaborador)) {
      return res.status(403).json({
        success: false,
        error: 'No puedes modificar a otro usuario',
      });
    }

    // Si cambia contraseña → validar actual
    if (Contrasena) {
      if (!ContrasenaActual) {
        return res.status(400).json({
          success: false,
          error: 'La contraseña actual es requerida',
        });
      }

      const esValida = bcrypt.compareSync(ContrasenaActual, usuario.Contrasena);
      if (!esValida) {
        return res.status(400).json({
          success: false,
          error: 'Contraseña actual incorrecta',
        });
      }
    }

    let datosActualizados = { ...req.body };
    if (Contrasena) {
      datosActualizados.Contrasena = bcrypt.hashSync(Contrasena, 10);
    }

    await usuario.update({
      ...datosActualizados,
      ModificadoPor: IdColaborador,
      FechaModificado: new Date(),
    });

    res.json({ success: true, message: 'Usuario actualizado' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Resetear contraseña (sin validar contraseña actual)
exports.softReset = async (req, res) => {
  try {
    const { id } = req.params;
    const { Contrasena } = req.body;

    // Validar que se proporcione la nueva contraseña
    if (!Contrasena || typeof Contrasena !== 'string' || Contrasena.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Contrasena es requerida y debe ser un texto válido',
      });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // Encriptar la nueva contraseña
    const contrasenaEncriptada = bcrypt.hashSync(Contrasena, 10);

    // Actualizar solo la contraseña
    await usuario.update({
      Contrasena: contrasenaEncriptada,
      FechaModificado: new Date(),
    });

    res.json({ success: true, message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error en softReset:', error);
    res.status(500).json({ success: false, error: error.message });
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
