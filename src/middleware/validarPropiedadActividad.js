const Unidad = require('../models/Unidad');
const AsignacionDocente = require('../models/AsignacionDocente');
const Docente = require('../models/Docente');

/**
 * ============================================
 * MIDDLEWARE DE VALIDACIÓN DE PROPIEDAD DE ACTIVIDADES
 * ============================================
 *
 * Similar a validarPropiedadUnidad, pero para actividades.
 * Valida que el docente solo pueda modificar actividades de sus propias unidades.
 */

const validarPropiedadActividad = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const userRole = req.usuario.rol;

    console.log('🔒 Validando permisos actividad - Usuario:', userId, 'Rol:', userRole);

    // Admin (1) y Operador (2): Acceso completo
    if (userRole === 1 || userRole === 2) {
      console.log('✅ Admin/Operador - Acceso permitido');
      return next();
    }

    // Docente (4): Validar propiedad
    if (userRole === 4) {
      const { id, idUnidad } = req.params;
      const { IdUnidad: idUnidadBody } = req.body || {};

      // Obtener IdDocente del usuario
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

      let perteneceAlDocente = false;

      // CASO 1: Validar por IdUnidad en params (rutas /unidad/:idUnidad/...)
      if (idUnidad) {
        const unidad = await Unidad.findOne({
          where: { IdUnidad: idUnidad, Estado: true },
          include: [{
            model: AsignacionDocente,
            where: { IdDocente: idDocente, Estado: true },
            required: true
          }]
        });

        perteneceAlDocente = !!unidad;
        console.log('🔍 Unidad encontrada (por idUnidad en params):', !!unidad);

      // CASO 2: POST /actividades - Validar por IdUnidad en body (crear actividad nueva)
      } else if (req.method === 'POST' && idUnidadBody) {
        const unidad = await Unidad.findOne({
          where: { IdUnidad: idUnidadBody, Estado: true },
          include: [{
            model: AsignacionDocente,
            where: { IdDocente: idDocente, Estado: true },
            required: true
          }]
        });

        perteneceAlDocente = !!unidad;
        console.log('🔍 Unidad encontrada (por IdUnidad en body - POST):', !!unidad);

      // CASO 3: PUT/DELETE - Validar por IdActividad (modificar actividad existente)
      } else if (id) {
        // Usar query directa para mayor robustez
        const { QueryTypes } = require('sequelize');
        const sequelize = require('../config/database');

        const [resultado] = await sequelize.query(
          `SELECT COUNT(*) as count
           FROM actividades a
           INNER JOIN unidades u ON a.IdUnidad = u.IdUnidad
           INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.IdAsignacionDocente
           WHERE a.IdActividad = :idActividad
             AND u.Estado = 1
             AND ad.Estado = 1
             AND ad.IdDocente = :idDocente`,
          {
            replacements: { idActividad: id, idDocente },
            type: QueryTypes.SELECT
          }
        );

        perteneceAlDocente = resultado.count > 0;
        console.log('🔍 Actividad encontrada (por id - PUT/DELETE):', perteneceAlDocente, '| Count:', resultado.count);
      }

      if (!perteneceAlDocente) {
        console.log('❌ Acceso denegado - La actividad no pertenece al docente');
        return res.status(403).json({
          success: false,
          error: 'No tienes permiso para modificar esta actividad. Solo puedes modificar actividades de tus propias unidades.'
        });
      }

      console.log('✅ Docente - Acceso permitido a su propia actividad');
      return next();
    }

    // Otros roles: Sin acceso
    console.log('❌ Rol sin permisos:', userRole);
    return res.status(403).json({
      success: false,
      error: 'No tienes permisos para realizar esta acción'
    });

  } catch (error) {
    console.error('❌ Error al validar permisos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al validar permisos de la actividad',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = validarPropiedadActividad;
