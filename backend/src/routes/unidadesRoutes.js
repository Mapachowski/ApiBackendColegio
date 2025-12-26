const express = require('express');
const router = express.Router();
const unidadesController = require('../controllers/unidadesController');
const validarPropiedadUnidad = require('../middleware/validarPropiedadUnidad');

// ==========================================
// RUTAS DE CONSULTA (sin validación de propiedad)
// ==========================================
// Los docentes pueden VER cualquier unidad, pero solo MODIFICAR las suyas

// Reporte para admin: unidades con actividades incompletas
router.get('/reporte-incompletas', unidadesController.reporteUnidadesIncompletas);

router.get('/asignacion/:idAsignacion', unidadesController.getByAsignacion);
router.get('/:id/validar', unidadesController.validarPunteos);
router.get('/:id/resumen', unidadesController.getResumen);
router.get('/:id/actividades', unidadesController.getActividades);
router.get('/:id', unidadesController.getById);

// ==========================================
// RUTAS DE MODIFICACIÓN (CON validación de propiedad)
// ==========================================
// Solo el docente propietario, admins y operadores pueden modificar

// Cerrar unidad actual y abrir siguiente (usa idAsignacion)
router.post('/asignacion/:idAsignacion/cerrar-y-abrir', validarPropiedadUnidad, unidadesController.cerrarYAbrirSiguiente);

// Activar una unidad específica
router.put('/:id/activar', validarPropiedadUnidad, unidadesController.activar);

// Actualizar punteos de zona y final
router.put('/:id/punteos', validarPropiedadUnidad, unidadesController.updatePunteos);

// Actualización general de unidad
router.put('/:id', validarPropiedadUnidad, unidadesController.update);

module.exports = router;
