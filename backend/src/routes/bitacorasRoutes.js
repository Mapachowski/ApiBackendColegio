const express = require('express');
const router = express.Router();
const bitacorasController = require('../controllers/bitacorasController');

// Rutas para bitácoras
router.get('/', bitacorasController.getBitacoras); // Obtener todas las bitácoras
router.get('/:id', bitacorasController.getBitacoraById); // Obtener una bitácora por ID
router.post('/', bitacorasController.createBitacora); // Crear una nueva bitácora

module.exports = router;