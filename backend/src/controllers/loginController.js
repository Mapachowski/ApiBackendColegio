// loginController.js
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { NombreUsuario, Contrasena, usuario, password } = req.body;
    const user = NombreUsuario || usuario;
    const pass = Contrasena || password;

    if (!user || !pass) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    const usuarioDB = await Usuario.findOne({
      where: { NombreUsuario: user, Estado: true }
    });

    if (!usuarioDB) {
      return res.status(401).json({ message: 'Usuario no encontrado o inactivo' });
    }

    const esValida = await bcrypt.compare(pass, usuarioDB.Contrasena);
    if (!esValida) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Verificar que JWT_SECRET esté configurado
    if (!process.env.JWT_SECRET) {
      console.error('FATAL: JWT_SECRET no está configurado en .env');
      return res.status(500).json({ message: 'Error de configuración del servidor' });
    }

    const token = jwt.sign(
      { id: usuarioDB.IdUsuario, rol: usuarioDB.IdRol },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // DEVOLVEMOS NombreCompleto (clave)
    return res.json({
      message: 'Login exitoso',
      usuario: {
        IdUsuario: usuarioDB.IdUsuario,
        NombreUsuario: usuarioDB.NombreUsuario,
        NombreCompleto: usuarioDB.NombreCompleto, // AQUÍ ESTÁ
        IdRol: usuarioDB.IdRol
      },
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { login };