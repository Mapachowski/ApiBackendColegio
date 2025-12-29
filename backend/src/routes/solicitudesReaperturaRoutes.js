const express = require('express');
const router = express.Router();
const solicitudesReaperturaController = require('../controllers/solicitudesReaperturaController');

// ==========================================
// RUTAS PARA DOCENTES
// ==========================================

// Docente crea solicitud de reapertura
router.post('/', solicitudesReaperturaController.crearSolicitud);

// Docente ve sus propias solicitudes
router.get('/mis-solicitudes', solicitudesReaperturaController.misSolicitudes);

// ==========================================
// RUTAS PARA ADMINISTRADORES
// ==========================================

// Obtener contador de solicitudes pendientes (para badge/notificación)
router.get('/contador', solicitudesReaperturaController.contadorPendientes);

// Admin obtiene lista de solicitudes pendientes
router.get('/pendientes', solicitudesReaperturaController.obtenerPendientes);

// Admin procesa solicitud (aprobar o rechazar)
router.put('/:id/procesar', solicitudesReaperturaController.procesarSolicitud);

module.exports = router;
