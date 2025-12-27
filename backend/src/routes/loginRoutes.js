const express = require('express');
const router = express.Router();
const { login, getPerfil } = require('../controllers/loginController');
const authMiddleware = require('../middleware/authMiddleware');

// La ruta ya viene montada en /login desde index.js
// Así que aquí solo definimos '/' que se convierte en /api/login
router.post('/', login);
router.get('/perfil', authMiddleware, getPerfil); // GET /api/login/perfil

module.exports = router;
