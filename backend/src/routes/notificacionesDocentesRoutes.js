const express = require('express');
const router = express.Router();
const notificacionesDocentesController = require('../controllers/notificacionesDocentesController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * Generar notificaciones para docentes con pendientes
 * POST /generar/:idUnidad
 * Body (opcional): { FechaLimite: "2026-01-05T23:59:59" }
 */
router.post('/generar/:idUnidad', notificacionesDocentesController.generarNotificaciones);

/**
 * Obtener notificaciones del docente autenticado
 * GET /mis-notificaciones
 * Query params:
 *   - leidas: true/false (filtrar por leídas)
 *   - tipo: ACTIVIDADES_INCOMPLETAS | CALIFICACIONES_PENDIENTES | FECHA_LIMITE
 *   - limite: número de notificaciones a retornar (default 50)
 */
router.get('/mis-notificaciones', notificacionesDocentesController.misNotificaciones);

/**
 * Marcar notificación(es) como leída(s)
 * PUT /marcar-leida
 * Body:
 *   - IdNotificacion: number (marcar una específica)
 *   - Todas: boolean (marcar todas como leídas)
 */
router.put('/marcar-leida', notificacionesDocentesController.marcarComoLeida);

/**
 * Contador de notificaciones no leídas
 * GET /contador
 */
router.get('/contador', notificacionesDocentesController.contadorNoLeidas);

/**
 * Limpiar notificaciones antiguas (solo admin)
 * DELETE /limpiar
 * Body (opcional): { DiasAntiguedad: 90 }
 */
router.delete('/limpiar', notificacionesDocentesController.limpiarNotificaciones);

module.exports = router;
