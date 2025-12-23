const express = require('express');
const router = express.Router();
const docentesController = require('../controllers/docentesController');

// Rutas específicas primero
router.get('/:id/asignaciones', docentesController.getAsignaciones);

// Rutas generales
router.get('/', docentesController.getAll);
router.get('/:id', docentesController.getById);
router.post('/', docentesController.create);
router.put('/:id', docentesController.update);
router.delete('/:id', docentesController.delete);

module.exports = router;
