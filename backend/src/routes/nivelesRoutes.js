const express = require('express');
const router = express.Router();
const nivelController = require('../controllers/nivelesController');

// Rutas para niveles
router.get('/', nivelController.getNiveles); // Obtener todos los niveles (filtrados por Estado: true)
router.get('/:id', nivelController.getNivelById); // Obtener un nivel por ID
router.post('/', nivelController.createNivel); // Crear un nuevo nivel
router.put('/:id', nivelController.updateNivel); // Actualizar un nivel
router.delete('/:id', nivelController.deleteNivel); // Eliminar un nivel (soft delete)

module.exports = router;