const express = require('express');
const router = express.Router();
const notasUnidadController = require('../controllers/notasUnidadController');

// ==========================================
// RUTAS ESPECÍFICAS (deben ir PRIMERO)
// ==========================================

// Calcular notas de todos los alumnos de una unidad
router.post('/calcular-todos/:idUnidad', notasUnidadController.calcularTodasNotasUnidad);

// Obtener notas por unidad
router.get('/unidad/:idUnidad', notasUnidadController.getNotasPorUnidad);

// Obtener notas por alumno
router.get('/alumno/:idAlumno', notasUnidadController.getNotasPorAlumno);

// Calcular nota de un alumno específico
router.post('/calcular', notasUnidadController.calcularNotaAlumno);

// ==========================================
// RUTAS GENERALES
// ==========================================

// Obtener una nota específica por ID
router.get('/:id', notasUnidadController.getById);

module.exports = router;
