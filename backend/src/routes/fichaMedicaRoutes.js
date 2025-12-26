const express = require('express');
const router = express.Router();
const fichaMedicaController = require('../controllers/fichaMedicaController');

// Rutas para fichas médicas
router.get('/', fichaMedicaController.getFichasMedicas); // Obtener todas las fichas médicas
router.get('/:id', fichaMedicaController.getFichaMedicaById); // Obtener una ficha médica por ID
router.post('/', fichaMedicaController.createFichaMedica); // Crear una nueva ficha médica
router.put('/:id', fichaMedicaController.updateFichaMedica); // Actualizar una ficha médica
router.delete('/:id', fichaMedicaController.deleteFichaMedica); // Eliminar una ficha médica

module.exports = router;