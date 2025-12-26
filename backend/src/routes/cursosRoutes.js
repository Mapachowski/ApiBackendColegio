const express = require('express');
const router = express.Router();
const cursosController = require('../controllers/cursosController');

// Rutas específicas primero (antes de las rutas con :id)
router.get('/por-grado', cursosController.getCursosPorGrado);
router.get('/grado/:idGrado', cursosController.getByGrado);

// Rutas generales
router.get('/', cursosController.getAll);
router.get('/:id', cursosController.getById);
router.post('/', cursosController.create);
router.put('/:id', cursosController.update);
router.delete('/:id', cursosController.delete);

module.exports = router;
