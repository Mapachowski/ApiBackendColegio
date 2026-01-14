const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { loginLimiter, generalLimiter } = require('../middleware/rateLimiter');

const alumnosRoutes = require('./alumnosRoutes');
const gradosRoutes = require('./gradosRoutes');
const inscripcionesRoutes = require('./inscripcionesRoutes');
const familiasRoutes = require('./familiasRoutes');
const pagosRoutes = require('./pagosRoutes');
const usuariosRoutes = require('./usuariosRoutes');
const responsablesRoutes = require('./responsablesRoutes');
const bitacorasRoutes = require('./bitacorasRoutes');
const jornadasRoutes = require('./jornadasRoutes');
const metodoPagosRoutes = require('./metodoPagosRoutes');
const nivelesRoutes = require('./nivelesRoutes');
const rolesRoutes = require('./rolesRoutes');
const seccionesRoutes = require('./seccionesRoutes');
const tipoPagosRoutes = require('./tipoPagosRoutes');
const loginRoutes = require('./loginRoutes');
const fichaMedicaRoutes = require('./fichaMedicaRoutes');
const responsableTipoRoutes = require('./responsableTipoRoutes');
const docentesRoutes = require('./docentesRoutes');
const asignacionesRoutes = require('./asignacionesRoutes');
const unidadesRoutes = require('./unidadesRoutes');
const actividadesRoutes = require('./actividadesRoutes');
const calificacionesRoutes = require('./calificacionesRoutes');
const notasUnidadRoutes = require('./notasUnidadRoutes');
const cursosRoutes = require('./cursosRoutes');
const solicitudesReaperturaRoutes = require('./solicitudesReaperturaRoutes');
const boletaCalificacionesRoutes = require('./boletaCalificacionesRoutes');
const cierreUnidadesRoutes = require('./cierreUnidadesRoutes');
const notificacionesDocentesRoutes = require('./notificacionesDocentesRoutes');

// ==========================================
// RUTAS PÚBLICAS (sin autenticación)
// ==========================================
// Login tiene rate limiting ESTRICTO para prevenir fuerza bruta
// Máximo: 5 intentos cada 15 minutos
router.use('/login', loginLimiter, loginRoutes);

// ==========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ==========================================
// Aplicar middleware de autenticación a TODAS las rutas siguientes
// NO aplicamos rate limiting aquí porque:
// 1. Ya están protegidas por JWT (necesitas token válido)
// 2. El rate limiting es más importante en rutas públicas (como /login)
// 3. Usuarios legítimos pueden hacer muchas peticiones seguidas sin problema
router.use(authMiddleware);

// Todas estas rutas ahora requieren un token JWT válido
router.use('/alumnos', alumnosRoutes);
router.use('/grados', gradosRoutes);
router.use('/inscripciones', inscripcionesRoutes);
router.use('/familias', familiasRoutes);
router.use('/pagos', pagosRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/responsables', responsablesRoutes);
router.use('/bitacoras', bitacorasRoutes);
router.use('/jornadas', jornadasRoutes);
router.use('/metodopagos', metodoPagosRoutes);
router.use('/niveles', nivelesRoutes);
router.use('/roles', rolesRoutes);
router.use('/secciones', seccionesRoutes);
router.use('/tipopagos', tipoPagosRoutes);
router.use('/fichasmedicas', fichaMedicaRoutes);
router.use('/responsable-tipo', responsableTipoRoutes);
router.use('/docentes', docentesRoutes);
router.use('/asignaciones', asignacionesRoutes);
router.use('/unidades', unidadesRoutes);
router.use('/actividades', actividadesRoutes);
router.use('/calificaciones', calificacionesRoutes);
router.use('/notas-unidad', notasUnidadRoutes);
router.use('/cursos', cursosRoutes);
router.use('/solicitudes-reapertura', solicitudesReaperturaRoutes);
router.use('/boleta-calificaciones', boletaCalificacionesRoutes);
router.use('/cierre-unidades', cierreUnidadesRoutes);
router.use('/notificaciones-docentes', notificacionesDocentesRoutes);

module.exports = router;