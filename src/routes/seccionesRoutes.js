const express = require('express');
const router = express.Router();
const seccionController = require('../controllers/seccionesController');

// Rutas para secciones
router.get('/', seccionController.getSecciones); // Obtener todas las secciones (filtradas por Estado: true)
router.get('/:id', seccionController.getSeccionById); // Obtener una sección por ID
router.post('/', seccionController.createSeccion); // Crear una nueva sección
router.put('/:id', seccionController.updateSeccion); // Actualizar una sección
router.delete('/:id', seccionController.deleteSeccion); // Eliminar una sección (soft delete)

module.exports = router;