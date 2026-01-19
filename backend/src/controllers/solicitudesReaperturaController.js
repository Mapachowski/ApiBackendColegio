const sequelize = require('../config/database');
const SolicitudReapertura = require('../models/SolicitudReapertura');
const Unidad = require('../models/Unidad');
const AsignacionDocente = require('../models/AsignacionDocente');
const Docente = require('../models/Docente');
const Usuario = require('../models/Usuario');
const Curso = require('../models/Curso');
const Grado = require('../models/Grado');
const Seccion = require('../models/Seccion');

/**
 * Docente solicita reapertura de una unidad cerrada
 * POST /api/solicitudes-reapertura
 */
exports.crearSolicitud = async (req, res) => {
  try {
    const { IdUnidad, Motivo, IdDocente } = req.body;

    if (!IdUnidad || !Motivo) {
      return res.status(400).json({
        success: false,
        error: 'IdUnidad y Motivo son requeridos'
      });
    }

    // Obtener idDocente: primero del body, luego del token, finalmente buscar en BD
    let idDocente = IdDocente || req.usuario?.idDocente;

    if (!idDocente && req.usuario?.id) {
      // Buscar el docente por IdUsuario
      const docente = await Docente.findOne({
        where: { idUsuario: req.usuario.id, Estado: 1 }
      });

      if (docente) {
        idDocente = docente.idDocente;
      }
    }

    if (!idDocente) {
      return res.status(403).json({
        success: false,
        error: 'Solo docentes pueden solicitar reapertura',
        debug: {
          tieneIdDocenteEnBody: !!IdDocente,
          tieneIdDocenteEnToken: !!req.usuario?.idDocente,
          idUsuario: req.usuario?.id,
          rol: req.usuario?.rol
        }
      });
    }

    // Verificar que la unidad existe
    const unidad = await Unidad.findByPk(IdUnidad);
    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Verificar que la unidad esté cerrada
    if (unidad.Activa === 1) {
      return res.status(400).json({
        success: false,
        error: 'La unidad ya está activa. Solo se puede solicitar reapertura de unidades cerradas.'
      });
    }

    // Verificar que el docente sea dueño de la unidad
    const asignacion = await AsignacionDocente.findByPk(unidad.IdAsignacionDocente);
    // El modelo Sequelize usa 'IdDocente' (mayúscula) como está definido en el modelo
    // Convertir ambos a número para comparar correctamente
    const idDocenteAsignacion = asignacion ? parseInt(asignacion.IdDocente) : null;
    const idDocenteSolicitud = parseInt(idDocente);

    if (!asignacion || idDocenteAsignacion !== idDocenteSolicitud) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para solicitar reapertura de esta unidad'
      });
    }

    // Verificar que no haya otra solicitud pendiente para esta unidad del mismo docente
    const solicitudPendiente = await SolicitudReapertura.findOne({
      where: {
        IdUnidad,
        SolicitadoPor: idDocente,
        Estado: 'pendiente'
      }
    });

    if (solicitudPendiente) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una solicitud pendiente para esta unidad',
        IdSolicitud: solicitudPendiente.IdSolicitud
      });
    }

    // Crear la solicitud
    const nuevaSolicitud = await SolicitudReapertura.create({
      IdUnidad,
      SolicitadoPor: idDocente,
      Motivo,
      Estado: 'pendiente',
      FechaSolicitud: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud de reapertura enviada al administrador',
      data: {
        IdSolicitud: nuevaSolicitud.IdSolicitud,
        IdUnidad: nuevaSolicitud.IdUnidad,
        Estado: nuevaSolicitud.Estado,
        FechaSolicitud: nuevaSolicitud.FechaSolicitud
      }
    });

  } catch (error) {
    console.error('❌ Error al crear solicitud de reapertura:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Obtener contador de solicitudes pendientes (para badge/notificación)
 * GET /api/solicitudes-reapertura/contador
 */
exports.contadorPendientes = async (req, res) => {
  try {
    const rolUsuario = req.usuario?.rol;

    // Solo administradores y operadores pueden ver el contador
    if (rolUsuario !== 1 && rolUsuario !== 2) {
      return res.status(403).json({
        success: false,
        error: 'Solo administradores y operadores pueden ver solicitudes pendientes'
      });
    }

    // Obtener conteo de solicitudes pendientes
    const [resultado] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM solicitudes_reapertura
      WHERE Estado = 'pendiente'
    `);

    const total = resultado[0]?.total || 0;

    res.json({
      success: true,
      data: {
        pendientes: parseInt(total),
        tieneNotificaciones: parseInt(total) > 0
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener contador de solicitudes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Administrador obtiene lista de solicitudes pendientes
 * GET /api/solicitudes-reapertura/pendientes
 */
exports.obtenerPendientes = async (req, res) => {
  try {
    const rolUsuario = req.usuario?.rol;

    // Solo administradores pueden ver todas las solicitudes
    if (rolUsuario !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden ver solicitudes pendientes'
      });
    }

    // Obtener solicitudes pendientes con información relacionada
    // Nota: asignacion_docente usa minúsculas en sus columnas
    const [solicitudes] = await sequelize.query(`
      SELECT
        sr.IdSolicitud,
        sr.IdUnidad,
        u.NombreUnidad,
        c.Curso AS NombreCurso,
        g.NombreGrado,
        s.NombreSeccion,
        j.NombreJornada,
        d.NombreDocente,
        sr.Motivo,
        sr.FechaSolicitud,
        sr.Estado
      FROM solicitudes_reapertura sr
      INNER JOIN unidades u ON sr.IdUnidad = u.IdUnidad
      INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.idAsignacionDocente
      INNER JOIN cursos c ON ad.idCurso = c.idCurso
      INNER JOIN grados g ON ad.idGrado = g.IdGrado
      INNER JOIN secciones s ON ad.idSeccion = s.IdSeccion
      INNER JOIN jornadas j ON ad.idJornada = j.IdJornada
      INNER JOIN docentes d ON sr.SolicitadoPor = d.idDocente
      WHERE sr.Estado = 'pendiente'
      ORDER BY sr.FechaSolicitud ASC
    `);

    res.json({
      success: true,
      data: solicitudes,
      total: solicitudes.length
    });

  } catch (error) {
    console.error('❌ Error al obtener solicitudes pendientes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Administrador aprueba o rechaza solicitud
 * PUT /api/solicitudes-reapertura/:id/procesar
 */
exports.procesarSolicitud = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    // Soportar ambos formatos: Accion/accion y ObservacionesAprobacion/observaciones
    const Accion = req.body.Accion || req.body.accion;
    const ObservacionesAprobacion = req.body.ObservacionesAprobacion || req.body.observaciones;
    const rolUsuario = req.usuario?.rol;
    const idUsuario = req.usuario?.id;

    // Solo administradores pueden procesar solicitudes
    if (rolUsuario !== 1) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden procesar solicitudes'
      });
    }

    if (!Accion || !['aprobar', 'rechazar'].includes(Accion)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Accion debe ser "aprobar" o "rechazar"'
      });
    }

    // Verificar que la solicitud existe
    const solicitud = await SolicitudReapertura.findByPk(id);
    if (!solicitud) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      });
    }

    // Verificar que la solicitud esté pendiente
    if (solicitud.Estado !== 'pendiente') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: `La solicitud ya fue ${solicitud.Estado}`,
        estadoActual: solicitud.Estado
      });
    }

    const nuevoEstado = Accion === 'aprobar' ? 'aprobada' : 'rechazada';

    // Actualizar la solicitud
    await solicitud.update({
      Estado: nuevoEstado,
      AprobadoPor: idUsuario,
      ObservacionesAprobacion,
      FechaAprobacion: new Date()
    }, { transaction });

    // Si se aprueba, reabrir la unidad
    let unidadActiva = false;
    let unidadDesactivada = null;
    if (Accion === 'aprobar') {
      const unidad = await Unidad.findByPk(solicitud.IdUnidad);
      if (unidad) {
        // Primero desactivar cualquier otra unidad activa de esta asignación
        // (El trigger solo permite una unidad activa por asignación)
        const unidadActivaActual = await Unidad.findOne({
          where: {
            IdAsignacionDocente: unidad.IdAsignacionDocente,
            Activa: 1
          },
          transaction
        });

        if (unidadActivaActual && unidadActivaActual.IdUnidad !== unidad.IdUnidad) {
          // Desactivar la unidad que está actualmente activa
          await unidadActivaActual.update({
            Activa: 0,
            ModificadoPor: req.usuario?.email || req.usuario?.nombre || 'Admin',
            FechaModificado: new Date()
          }, { transaction });
          unidadDesactivada = {
            IdUnidad: unidadActivaActual.IdUnidad,
            NombreUnidad: unidadActivaActual.NombreUnidad
          };
        }

        // Ahora activar la unidad solicitada y marcarla como no cerrada
        // Activa = 1: El docente puede editar calificaciones
        // Cerrada = 0: La unidad aparecerá nuevamente en "Cierre de Unidades" cuando esté lista
        await unidad.update({
          Activa: 1,
          Cerrada: 0,
          FechaCierre: null,
          CerradaPorAdmin: null,
          ModificadoPor: req.usuario?.email || req.usuario?.nombre || 'Admin',
          FechaModificado: new Date()
        }, { transaction });
        unidadActiva = true;
      }
    }

    await transaction.commit();

    let mensaje = '';
    if (Accion === 'aprobar') {
      mensaje = 'Solicitud aprobada. La unidad ha sido reabierta.';
      if (unidadDesactivada) {
        mensaje += ` Se desactivó automáticamente la ${unidadDesactivada.NombreUnidad} para permitir la reapertura.`;
      }
    } else {
      mensaje = 'Solicitud rechazada.';
    }

    res.json({
      success: true,
      message: mensaje,
      data: {
        IdSolicitud: solicitud.IdSolicitud,
        Estado: nuevoEstado,
        IdUnidad: solicitud.IdUnidad,
        UnidadActiva: unidadActiva,
        UnidadDesactivada: unidadDesactivada
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al procesar solicitud:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Docente ve el historial de sus propias solicitudes
 * GET /api/solicitudes-reapertura/mis-solicitudes
 */
exports.misSolicitudes = async (req, res) => {
  try {
    // Obtener idDocente: primero del token, luego buscar en BD por IdUsuario
    let idDocente = req.usuario?.idDocente;

    if (!idDocente && req.usuario?.id) {
      // Buscar el docente por IdUsuario
      const docente = await Docente.findOne({
        where: { idUsuario: req.usuario.id, Estado: 1 }
      });

      if (docente) {
        idDocente = docente.idDocente;
      }
    }

    if (!idDocente) {
      return res.status(403).json({
        success: false,
        error: 'Solo docentes pueden ver sus solicitudes',
        debug: {
          tieneIdDocenteEnToken: !!req.usuario?.idDocente,
          idUsuario: req.usuario?.id,
          rol: req.usuario?.rol
        }
      });
    }

    // Obtener solicitudes del docente con información relacionada
    // Nota: asignacion_docente usa minúsculas en sus columnas
    const [solicitudes] = await sequelize.query(`
      SELECT
        sr.IdSolicitud,
        sr.IdUnidad,
        u.NombreUnidad,
        c.Curso AS NombreCurso,
        g.NombreGrado,
        s.NombreSeccion,
        j.NombreJornada,
        sr.Motivo,
        sr.Estado,
        sr.FechaSolicitud,
        sr.FechaAprobacion,
        us.NombreCompleto AS AprobadoPor,
        sr.ObservacionesAprobacion
      FROM solicitudes_reapertura sr
      INNER JOIN unidades u ON sr.IdUnidad = u.IdUnidad
      INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.idAsignacionDocente
      INNER JOIN cursos c ON ad.idCurso = c.idCurso
      INNER JOIN grados g ON ad.idGrado = g.IdGrado
      INNER JOIN secciones s ON ad.idSeccion = s.IdSeccion
      INNER JOIN jornadas j ON ad.idJornada = j.IdJornada
      LEFT JOIN usuarios us ON sr.AprobadoPor = us.IdUsuario
      WHERE sr.SolicitadoPor = :idDocente
      ORDER BY sr.FechaSolicitud DESC
    `, {
      replacements: { idDocente }
    });

    res.json({
      success: true,
      data: solicitudes,
      total: solicitudes.length
    });

  } catch (error) {
    console.error('❌ Error al obtener mis solicitudes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
