const express = require('express');
const router = express.Router();
const unidadesController = require('../controllers/unidadesController');

// Rutas específicas primero
router.get('/:id/validar', unidadesController.validarPunteos);
router.get('/:id/resumen', unidadesController.getResumen);
router.get('/:id/actividades', unidadesController.getActividades);
router.put('/:id/activar', unidadesController.activar);

// Rutas generales
router.get('/:id', unidadesController.getById);
router.put('/:id', unidadesController.update);

module.exports = router;
