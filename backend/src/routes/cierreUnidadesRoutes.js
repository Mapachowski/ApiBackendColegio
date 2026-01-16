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

// ==========================================
// 7. CERRAR SOLO CURSOS LISTOS DE UNA UNIDAD
// ==========================================

/**
 * Cerrar solo los cursos LISTOS de una unidad específica
 * Deja abiertos los cursos pendientes y abre la siguiente unidad para los cursos cerrados
 * Solo administradores
 * Body (opcional): { observaciones: string }
 */
router.post('/cerrar-cursos-listos/:idUnidad', cierreUnidadesController.cerrarCursosListos);

// ==========================================
// 8. ENDPOINTS QUE TRABAJAN CON NUMEROUNIDAD
// ==========================================

/**
 * Obtener estado de todas las unidades con un número específico
 * Útil para dashboard global por unidad (ej. todas las Unidad 1)
 * GET /api/cierre-unidades/estado-por-numero/:numeroUnidad
 */
router.get('/estado-por-numero/:numeroUnidad', cierreUnidadesController.getEstadoPorNumeroUnidad);

/**
 * Actualizar estado de todos los cursos con un número de unidad específico
 * Recalcula estado de todas las Unidad 1, o todas las Unidad 2, etc.
 * POST /api/cierre-unidades/actualizar-todos-por-numero/:numeroUnidad
 */
router.post('/actualizar-todos-por-numero/:numeroUnidad', cierreUnidadesController.actualizarTodosPorNumero);

/**
 * Cerrar cursos listos de todas las unidades con un número específico
 * Cierra todos los cursos LISTOS de todas las "Unidad 1" del colegio, por ejemplo
 * Solo administradores
 * Body (opcional): { observaciones: string }
 */
router.post('/cerrar-cursos-listos-por-numero/:numeroUnidad', cierreUnidadesController.cerrarCursosListosPorNumero);

module.exports = router;
