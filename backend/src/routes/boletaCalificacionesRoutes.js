const express = require('express');
const router = express.Router();
const boletaCalificacionesController = require('../controllers/boletaCalificacionesController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * GET /api/boleta-calificaciones/estudiantes
 * Obtener lista de estudiantes por filtros
 * Query params: cicloEscolar, idGrado, idSeccion, idJornada
 * Roles: Administrador (1), Operador (2)
 */
router.get('/estudiantes', boletaCalificacionesController.obtenerEstudiantes);

/**
 * GET /api/boleta-calificaciones/calificaciones/:idAlumno
 * Obtener calificaciones completas de un estudiante
 * Query params: cicloEscolar, idGrado, idSeccion, idJornada
 * Roles: Administrador (1), Operador (2)
 */
router.get('/calificaciones/:idAlumno', boletaCalificacionesController.obtenerCalificaciones);

/**
 * POST /api/boleta-calificaciones/lote
 * Obtener calificaciones de múltiples estudiantes
 * Body: { cicloEscolar, idGrado, idSeccion, idJornada, estudiantes: [ids] }
 * Roles: Administrador (1), Operador (2)
 */
router.post('/lote', boletaCalificacionesController.obtenerCalificacionesLote);

module.exports = router;
