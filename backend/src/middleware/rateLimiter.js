const rateLimit = require('express-rate-limit');

/**
 * ============================================
 * RATE LIMITER PARA LOGIN (Muy Estricto)
 * ============================================
 *
 * Previene ataques de fuerza bruta al endpoint de login
 *
 * Configuración:
 * - Máximo: 5 intentos
 * - Ventana: 15 minutos
 * - Si alcanza el límite: bloqueo de 15 minutos
 *
 * Ejemplo:
 * Usuario intenta login 5 veces incorrectamente
 * → Sistema: "Demasiados intentos. Espera 15 minutos"
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos en milisegundos
  max: 5, // Máximo 5 peticiones por IP

  // Mensaje cuando se alcanza el límite
  message: {
    success: false,
    error: 'Demasiados intentos de login. Por favor, intenta nuevamente en 15 minutos.',
    retryAfter: '15 minutos'
  },

  // Código de estado HTTP cuando se alcanza el límite
  statusCode: 429, // 429 = Too Many Requests

  // Headers estándar de rate limiting (informan al cliente)
  standardHeaders: true, // Agrega headers RateLimit-*
  legacyHeaders: false, // Desactiva headers X-RateLimit-* antiguos

  // Identifica usuarios por IP (usa el default que maneja IPv6 correctamente)
  // keyGenerator por defecto ya maneja IPv4 e IPv6

  // Función que se ejecuta cuando se alcanza el límite
  handler: (req, res) => {
    console.log(`⚠️ Rate limit alcanzado para IP: ${req.ip} en /login`);
    res.status(429).json({
      success: false,
      error: 'Demasiados intentos de login. Por favor, intenta nuevamente en 15 minutos.',
      retryAfter: '15 minutos'
    });
  },

  // No aplicar rate limit a peticiones exitosas (opcional)
  // skipSuccessfulRequests: true, // Descomentar si solo quieres contar intentos fallidos

  // No aplicar rate limit a peticiones fallidas (opcional)
  // skipFailedRequests: false,
});

/**
 * ============================================
 * RATE LIMITER GENERAL (Moderado)
 * ============================================
 *
 * Previene abuso general de la API
 *
 * Configuración:
 * - Máximo: 100 peticiones
 * - Ventana: 15 minutos
 *
 * Ejemplo:
 * Usuario hace 100 peticiones en 15 minutos a cualquier endpoint
 * → Sistema: "Límite de peticiones alcanzado. Espera un momento"
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 peticiones por IP

  message: {
    success: false,
    error: 'Demasiadas peticiones desde esta IP. Por favor, intenta nuevamente más tarde.',
    retryAfter: 'En unos minutos'
  },

  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    console.log(`⚠️ Rate limit general alcanzado para IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Demasiadas peticiones. Por favor, espera un momento antes de continuar.',
      retryAfter: 'En unos minutos'
    });
  },
});

/**
 * ============================================
 * RATE LIMITER PARA CREACIÓN DE RECURSOS (Moderado)
 * ============================================
 *
 * Previene spam en endpoints de creación (POST)
 *
 * Configuración:
 * - Máximo: 20 creaciones
 * - Ventana: 1 hora
 *
 * Útil para endpoints como:
 * - POST /alumnos
 * - POST /pagos
 * - POST /inscripciones
 */
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // Máximo 20 creaciones por hora

  message: {
    success: false,
    error: 'Has alcanzado el límite de creaciones por hora. Espera un momento.',
    retryAfter: '1 hora'
  },

  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,

  // Solo aplicar a peticiones POST
  skip: (req) => req.method !== 'POST',

  handler: (req, res) => {
    console.log(`⚠️ Rate limit de creación alcanzado para IP: ${req.ip} en ${req.path}`);
    res.status(429).json({
      success: false,
      error: 'Has alcanzado el límite de creaciones. Por favor, espera antes de continuar.',
      retryAfter: '1 hora'
    });
  },
});

/**
 * ============================================
 * RATE LIMITER PARA APIS PÚBLICAS (Flexible)
 * ============================================
 *
 * Para endpoints que no requieren autenticación
 * Más permisivo pero con control
 *
 * Configuración:
 * - Máximo: 50 peticiones
 * - Ventana: 10 minutos
 */
const publicApiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 50, // Máximo 50 peticiones

  message: {
    success: false,
    error: 'Límite de peticiones alcanzado. Intenta más tarde.',
    retryAfter: '10 minutos'
  },

  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  generalLimiter,
  createLimiter,
  publicApiLimiter
};
