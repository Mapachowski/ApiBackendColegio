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

/**
 * ========================================
 * FASE 4: Endpoints de Cierre de Unidades
 * ========================================
 */

/**
 * Validar si una unidad puede cerrarse
 * Verifica que todos los cursos estén listos
 */
router.post('/validar-cierre/:idUnidad', cierreUnidadesController.validarCierre);

/**
 * Cerrar una unidad
 * Solo administradores, requiere que todos los cursos estén listos
 * Body (opcional): { observaciones: string }
 */
router.post('/cerrar/:idUnidad', cierreUnidadesController.cerrarUnidad);

/**
 * Extender plazo de calificación
 * Solo administradores
 * Body: { nuevaFechaLimite: string, notificarDocentes: boolean, observaciones: string }
 */
router.post('/extender-plazo/:idUnidad', cierreUnidadesController.extenderPlazo);

/**
 * Reabrir una unidad cerrada
 * Solo administradores
 * Body: { motivo: string (requerido), nuevaFechaLimite: string (opcional) }
 */
router.post('/reabrir/:idUnidad', cierreUnidadesController.reabrirUnidad);

module.exports = router;
