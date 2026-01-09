const Unidad = require('../models/Unidad');
const AsignacionDocente = require('../models/AsignacionDocente');
const Docente = require('../models/Docente');

/**
 * ============================================
 * MIDDLEWARE DE VALIDACIÓN DE PROPIEDAD DE UNIDADES
 * ============================================
 *
 * Protege los endpoints de unidades para que:
 * - Admins (rol 1) y Operadores (rol 2): Acceso completo
 * - Docentes (rol 4): Solo pueden modificar SUS propias unidades
 * - Otros roles: Sin acceso
 *
 * Previene que un docente malicioso use Postman/curl para modificar
 * unidades de otros docentes.
 */

const validarPropiedadUnidad = async (req, res, next) => {
  try {
    // Obtener datos del usuario desde el token JWT (agregados por authMiddleware)
    const userId = req.usuario.id;
    const userRole = req.usuario.rol;

    console.log('🔒 Validando permisos - Usuario:', userId, 'Rol:', userRole);

    // ==========================================
    // ADMIN (1) y OPERADOR (2): Acceso completo
    // ==========================================
    if (userRole === 1 || userRole === 2) {
      console.log('✅ Admin/Operador - Acceso permitido');
      return next();
    }

    // ==========================================
    // DOCENTE (4): Validar propiedad de la unidad
    // ==========================================
    if (userRole === 4) {
      // Obtener el ID de la unidad o asignación según el endpoint
      const { id, idAsignacion } = req.params;

      console.log('🔍 Validando para Docente - Unidad ID:', id, 'Asignación ID:', idAsignacion);

      // Primero, obtener el IdDocente asociado al usuario
      const docente = await Docente.findOne({
        where: { idUsuario: userId, Estado: true }
      });

      if (!docente) {
        console.log('❌ Usuario no es un docente válido');
        return res.status(403).json({
          success: false,
          error: 'No tienes un perfil de docente activo'
        });
      }

      const idDocente = docente.idDocente;
      console.log('👨‍🏫 ID Docente:', idDocente);

      // Dependiendo del endpoint, validar de forma diferente
      let perteneceAlDocente = false;

      if (id) {
        // Endpoints que usan :id (la mayoría)
        // Buscar la unidad y verificar que pertenece a una asignación del docente
        const unidad = await Unidad.findOne({
          where: { IdUnidad: id, Estado: true },
          include: [{
            model: AsignacionDocente,
            where: { IdDocente: idDocente, Estado: true },
            required: true // INNER JOIN - solo si existe la asignación del docente
          }]
        });

        perteneceAlDocente = !!unidad;
        console.log('🔍 Unidad encontrada:', !!unidad);

      } else if (idAsignacion) {
        // Endpoint de cerrar-y-abrir usa :idAsignacion
        // Verificar que la asignación pertenece al docente
        const asignacion = await AsignacionDocente.findOne({
          where: {
            IdAsignacionDocente: idAsignacion,
            IdDocente: idDocente,
            Estado: true
          }
        });

        perteneceAlDocente = !!asignacion;
        console.log('🔍 Asignación encontrada:', !!asignacion);
      }

      // Si no pertenece al docente, denegar acceso
      if (!perteneceAlDocente) {
        console.log('❌ Acceso denegado - La unidad no pertenece al docente');
        return res.status(403).json({
          success: false,
          error: 'No tienes permiso para modificar esta unidad. Solo puedes modificar tus propias unidades.'
        });
      }

      console.log('✅ Docente - Acceso permitido a su propia unidad');
      return next();
    }

    // ==========================================
    // OTROS ROLES: Sin acceso
    // ==========================================
    console.log('❌ Rol sin permisos:', userRole);
    return res.status(403).json({
      success: false,
      error: 'No tienes permisos para realizar esta acción'
    });

  } catch (error) {
    console.error('❌ Error al validar permisos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al validar permisos de la unidad',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = validarPropiedadUnidad;
