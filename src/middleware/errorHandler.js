/**
 * ============================================
 * MIDDLEWARE DE MANEJO DE ERRORES
 * ============================================
 *
 * Maneja todos los errores de la aplicación de forma centralizada
 * En desarrollo: muestra detalles completos
 * En producción: oculta información sensible
 */

/**
 * Clase personalizada para errores de la aplicación
 * Permite crear errores con código de estado HTTP específico
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Indica que es un error esperado (no un bug)

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware para manejar rutas no encontradas (404)
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `No se encontró la ruta: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
};

/**
 * Middleware principal de manejo de errores
 * IMPORTANTE: Debe tener 4 parámetros (err, req, res, next) para que Express lo reconozca
 */
const errorHandler = (err, req, res, next) => {
  // 1. Establecer código de estado (por defecto 500)
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // 2. Loggear error en consola (siempre)
  if (err.statusCode === 500) {
    console.error('❌ ERROR 500:', err);
  } else {
    console.log(`⚠️ ERROR ${err.statusCode}:`, err.message);
  }

  // 3. Responder según el ambiente
  if (process.env.NODE_ENV === 'production') {
    // ============================================
    // PRODUCCIÓN: Respuesta genérica y segura
    // ============================================

    // Errores operacionales (esperados): mostrar mensaje
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message
      });
    }

    // Errores de programación (bugs): NO exponer detalles
    // Ejemplos: errores de Sequelize, referencias undefined, etc.
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor. Por favor, contacta al administrador.'
    });

  } else {
    // ============================================
    // DESARROLLO: Respuesta detallada para debugging
    // ============================================
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      stack: err.stack,
      // Información adicional útil para debugging
      details: {
        statusCode: err.statusCode,
        isOperational: err.isOperational,
        name: err.name,
        path: req.path,
        method: req.method,
      }
    });
  }
};

/**
 * Manejador específico para errores de Sequelize
 * Convierte errores de Sequelize en errores más legibles
 */
const sequelizeErrorHandler = (err, req, res, next) => {
  // Error de validación de Sequelize
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    const error = new AppError(
      `Error de validación: ${messages.join(', ')}`,
      400
    );
    return next(error);
  }

  // Error de restricción única (duplicate entry)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0].path;
    const error = new AppError(
      `El valor ya existe: ${field}`,
      409 // Conflict
    );
    return next(error);
  }

  // Error de clave foránea
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const error = new AppError(
      'No se puede realizar la operación: viola restricciones de integridad',
      400
    );
    return next(error);
  }

  // Error de conexión a la base de datos
  if (err.name === 'SequelizeConnectionError') {
    const error = new AppError(
      'Error de conexión a la base de datos',
      503 // Service Unavailable
    );
    return next(error);
  }

  // Si no es un error de Sequelize conocido, pasar al siguiente handler
  next(err);
};

/**
 * Manejador específico para errores de JWT
 */
const jwtErrorHandler = (err, req, res, next) => {
  // Token expirado
  if (err.name === 'TokenExpiredError') {
    const error = new AppError(
      'Token expirado. Por favor, inicia sesión nuevamente',
      401
    );
    return next(error);
  }

  // Token inválido
  if (err.name === 'JsonWebTokenError') {
    const error = new AppError(
      'Token inválido',
      401
    );
    return next(error);
  }

  // Si no es un error de JWT, pasar al siguiente handler
  next(err);
};

/**
 * Manejador de errores asíncronos
 * Wrapper para evitar try-catch en cada función async
 *
 * Uso:
 * exports.getAll = catchAsync(async (req, res) => {
 *   const data = await Model.findAll();
 *   res.json(data);
 * });
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  sequelizeErrorHandler,
  jwtErrorHandler,
  catchAsync
};
