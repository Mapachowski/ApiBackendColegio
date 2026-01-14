const express = require('express');
const router = express.Router();
const calificacionesController = require('../controllers/calificacionesController');

// Rutas específicas primero
router.get('/actividad/:id', calificacionesController.getPorActividad);
router.get('/alumno/:id', calificacionesController.getPorAlumno);
router.get('/alumno/:id/promedio', calificacionesController.getPromedioAlumno);
router.put('/batch', calificacionesController.updateBatch);
router.post('/actividad/:idActividad/batch', calificacionesController.updateBatchActividad);

// Rutas generales
router.get('/:id', calificacionesController.getById);
router.put('/:id', calificacionesController.update);

module.exports = router;
