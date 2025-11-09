const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    // 🔍 Verificar qué llega en el cuerpo
    console.log('Cuerpo recibido en login:', req.body);

    // Aceptar tanto los nombres antiguos como los del frontend
    const { NombreUsuario, Contrasena, usuario, password } = req.body;

    // Normalizar nombres
    const user = NombreUsuario || usuario;
    const pass = Contrasena || password;

    // Validar campos vacíos
    if (!user || !pass) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    // Buscar usuario activo
    const usuarioDB = await Usuario.findOne({
      where: { NombreUsuario: user, Estado: true }
    });

    if (!usuarioDB) {
      return res.status(401).json({ message: 'Usuario no encontrado o inactivo' });
    }

    // Comparar contraseñas (encriptadas)
    const esValida = await bcrypt.compare(pass, usuarioDB.Contrasena);
    if (!esValida) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuarioDB.IdUsuario, rol: usuarioDB.IdRol },
      process.env.JWT_SECRET || 'clave_secreta_temporal',
      { expiresIn: '2h' }
    );

    // Respuesta exitosa
    return res.json({
      message: 'Login exitoso',
      usuario: {
        id: usuarioDB.IdUsuario,
        nombre: usuarioDB.NombreCompleto,
        rol: usuarioDB.IdRol
      },
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { login };
