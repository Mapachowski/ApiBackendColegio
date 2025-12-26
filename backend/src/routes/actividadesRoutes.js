const express = require('express');
const router = express.Router();
const actividadesController = require('../controllers/actividadesController');
const validarPropiedadActividad = require('../middleware/validarPropiedadActividad');

// ==========================================
// RUTAS ESPECÍFICAS (deben ir PRIMERO)
// ==========================================

// Obtener todas las actividades de una unidad
router.get('/unidad/:idUnidad', actividadesController.getByUnidad);

// Crear actividades por lote con validación de suma
router.post('/unidad/:idUnidad/batch', validarPropiedadActividad, actividadesController.createBatch);

// Validar suma de actividades (antes de crear)
router.post('/unidad/:idUnidad/validar-suma', actividadesController.validarSuma);

// Verificar si actividad tiene calificaciones
router.get('/:id/tiene-calificaciones', actividadesController.tieneCalificaciones);

// Obtener calificaciones de una actividad
router.get('/:id/calificaciones', actividadesController.getCalificaciones);

// ==========================================
// RUTAS GENERALES
// ==========================================

router.get('/:id', actividadesController.getById);
router.post('/', validarPropiedadActividad, actividadesController.create);
router.put('/:id', validarPropiedadActividad, actividadesController.update);
router.delete('/:id', validarPropiedadActividad, actividadesController.delete);

module.exports = router;
