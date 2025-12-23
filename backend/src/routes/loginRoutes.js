const express = require('express');
const router = express.Router();
const { login } = require('../controllers/loginController');

// La ruta ya viene montada en /login desde index.js
// Así que aquí solo definimos '/' que se convierte en /api/login
router.post('/', login);

module.exports = router;
