const express = require('express');
const router = express.Router();
const cierreUnidadesController = require('../controllers/cierreUnidadesController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * Validar estado de todos los cursos de una unidad
 * Calcula en tiempo real sin guardar en BD
 */
router.get('/validar/:idUnidad', cierreUnidadesController.validarEstadoUnidad);

/**
 * Obtener estado guardado de una unidad
 * Lee desde la tabla estado_cursos_unidad
 */
router.get('/estado/:idUnidad', cierreUnidadesController.getEstadoUnidad);

/**
 * Actualizar estado de un curso específico
 * Body: { IdUnidad, IdCurso, IdDocente }
 */
router.post('/actualizar-estado', cierreUnidadesController.actualizarEstadoCurso);

/**
 * Actualizar estado de todos los cursos de una unidad
 * Recalcula y guarda en BD
 */
router.post('/actualizar-todos/:idUnidad', cierreUnidadesController.actualizarTodosEstados);

module.exports = router;
