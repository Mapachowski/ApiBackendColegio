const express = require('express');
const router = express.Router();
const jornadaController = require('../controllers/jornadasController');

// Rutas para jornadas
router.get('/', jornadaController.getJornadas); // Obtener todas las jornadas (filtradas por Estado: true)
router.get('/:id', jornadaController.getJornadaById); // Obtener una jornada por ID
router.post('/', jornadaController.createJornada); // Crear una nueva jornada
router.put('/:id', jornadaController.updateJornada); // Actualizar una jornada
router.delete('/:id', jornadaController.deleteJornada); // Eliminar una jornada (soft delete)

module.exports = router;