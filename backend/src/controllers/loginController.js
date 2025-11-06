const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { NombreUsuario, Contrasena } = req.body;

    // Validar campos vacíos
    if (!NombreUsuario || !Contrasena) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({
      where: { NombreUsuario, Estado: true }
    });

    if (!usuario) {
      return res.status(401).json({ message: 'Usuario no encontrado o inactivo' });
    }

    // Comparar contraseñas (encriptadas)
    const esValida = await bcrypt.compare(Contrasena, usuario.Contrasena);

    if (!esValida) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.IdUsuario, rol: usuario.IdRol },
      process.env.JWT_SECRET || 'clave_secreta_temporal',
      { expiresIn: '2h' }
    );

    return res.json({
      message: 'Login exitoso',
      usuario: {
        id: usuario.IdUsuario,
        nombre: usuario.NombreCompleto,
        rol: usuario.IdRol
      },
      token
    });

  } catch (error) {
  console.error('Error en login:', error); // 👈 esto mostrará el error en la consola
  return res.status(500).json({ message: error.message });
}
};

module.exports = { login };
