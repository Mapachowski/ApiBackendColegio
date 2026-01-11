const express = require('express');
const router = express.Router();
const asignacionesController = require('../controllers/asignacionesController');

// Rutas específicas primero (antes de las rutas con :id)
router.get('/validar', asignacionesController.validar);
router.get('/cursos-disponibles', asignacionesController.getCursosDisponibles);
router.get('/:id/unidades', asignacionesController.getUnidades);
router.get('/:id/actividades-alumno', asignacionesController.getActividadesConCalificaciones);


// Rutas generales
router.get('/', asignacionesController.getAll);
router.get('/:id', asignacionesController.getById);
router.post('/', asignacionesController.create);
router.put('/:id', asignacionesController.update);
router.delete('/:id', asignacionesController.delete);

module.exports = router;
