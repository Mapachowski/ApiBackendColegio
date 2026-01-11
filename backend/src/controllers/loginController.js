// loginController.js
const Usuario = require('../models/Usuario');
const Alumno = require('../models/Alumno');
const Docente = require('../models/Docente');
const Familia = require('../models/Familia');
const Rol = require('../models/Rol');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    console.log('Cuerpo recibido en login:', req.body);

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

// Obtener perfil del usuario autenticado
const getPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      include: [
        {
          model: Rol,
          attributes: ['IdRol', 'NombreRol']
        }
      ],
      attributes: ['IdUsuario', 'NombreUsuario', 'NombreCompleto', 'IdRol']
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Buscar si es alumno
    const alumno = await Alumno.findOne({
      where: { IdUsuario: req.usuario.id },
      attributes: ['IdAlumno', 'Matricula']
    });

    // Buscar si es docente
    const docente = await Docente.findOne({
      where: { idUsuario: req.usuario.id },
      attributes: ['idDocente', 'NombreDocente']
    });

    // Buscar si es familia
    const familia = await Familia.findOne({
      where: { IdUsuario: req.usuario.id },
      attributes: ['IdFamilia', 'NombreFamilia']
    });

    const perfil = {
      ...usuario.toJSON(),
      IdAlumno: alumno ? alumno.IdAlumno : null,
      Matricula: alumno ? alumno.Matricula : null,
      IdDocente: docente ? docente.idDocente : null,
      NombreDocente: docente ? docente.NombreDocente : null,
      IdFamilia: familia ? familia.IdFamilia : null,
      NombreFamilia: familia ? familia.NombreFamilia : null,
    };

    res.json({ success: true, data: perfil });
  } catch (error) {
    console.error('Error en getPerfil:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { login, getPerfil };