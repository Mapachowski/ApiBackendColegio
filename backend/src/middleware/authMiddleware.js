const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación JWT
 * Verifica que el token sea válido y extrae la información del usuario
 *
 * El token debe enviarse en el header:
 * Authorization: Bearer <token>
 */
const authMiddleware = (req, res, next) => {
  try {
    // 1. Obtener el token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación'
      });
    }

    // 2. El formato debe ser: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Formato de token inválido. Use: Bearer <token>'
      });
    }

    const token = parts[1];

    // 3. Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_temporal');

    // 4. Agregar la información del usuario al request para usarla en los controladores
    req.usuario = {
      id: decoded.id,
      rol: decoded.rol
    };

    // 5. Continuar al siguiente middleware o controlador
    next();

  } catch (error) {
    // Manejo de errores específicos de JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado. Por favor, inicie sesión nuevamente'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Error genérico
    return res.status(401).json({
      success: false,
      error: 'Error de autenticación'
    });
  }
};

module.exports = authMiddleware;
