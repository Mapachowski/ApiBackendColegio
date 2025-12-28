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
    const { IdUnidad, Motivo } = req.body;
    const idDocente = req.usuario?.idDocente;

    if (!IdUnidad || !Motivo) {
      return res.status(400).json({
        success: false,
        error: 'IdUnidad y Motivo son requeridos'
      });
    }

    if (!idDocente) {
      return res.status(403).json({
        success: false,
        error: 'Solo docentes pueden solicitar reapertura'
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
    if (!asignacion || asignacion.IdDocente !== idDocente) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para solicitar reapertura de esta unidad'
      });
    }

    // Verificar que no haya otra solicitud pendiente para esta unidad
    const solicitudPendiente = await SolicitudReapertura.findOne({
      where: {
        IdUnidad,
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
    const [solicitudes] = await sequelize.query(`
      SELECT
        sr.IdSolicitud,
        sr.IdUnidad,
        u.NombreUnidad,
        c.NombreCurso,
        g.NombreGrado,
        s.NombreSeccion,
        CONCAT(d.Nombres, ' ', d.Apellidos) AS DocenteSolicitante,
        sr.Motivo,
        sr.FechaSolicitud,
        sr.Estado
      FROM solicitudes_reapertura sr
      INNER JOIN unidades u ON sr.IdUnidad = u.IdUnidad
      INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.IdAsignacionDocente
      INNER JOIN cursos c ON ad.IdCurso = c.IdCurso
      INNER JOIN grados g ON ad.IdGrado = g.IdGrado
      INNER JOIN secciones s ON ad.IdSeccion = s.IdSeccion
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
    const { Accion, ObservacionesAprobacion } = req.body;
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
    if (Accion === 'aprobar') {
      const unidad = await Unidad.findByPk(solicitud.IdUnidad);
      if (unidad) {
        await unidad.update({
          Activa: 1,
          ModificadoPor: req.usuario?.email || req.usuario?.nombre || 'Admin',
          FechaModificado: new Date()
        }, { transaction });
        unidadActiva = true;
      }
    }

    await transaction.commit();

    const mensaje = Accion === 'aprobar'
      ? 'Solicitud aprobada. La unidad ha sido reabierta.'
      : 'Solicitud rechazada.';

    res.json({
      success: true,
      message: mensaje,
      data: {
        IdSolicitud: solicitud.IdSolicitud,
        Estado: nuevoEstado,
        IdUnidad: solicitud.IdUnidad,
        UnidadActiva: unidadActiva
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
    const idDocente = req.usuario?.idDocente;

    if (!idDocente) {
      return res.status(403).json({
        success: false,
        error: 'Solo docentes pueden ver sus solicitudes'
      });
    }

    // Obtener solicitudes del docente con información relacionada
    const [solicitudes] = await sequelize.query(`
      SELECT
        sr.IdSolicitud,
        sr.IdUnidad,
        u.NombreUnidad,
        c.NombreCurso,
        sr.Motivo,
        sr.Estado,
        sr.FechaSolicitud,
        sr.FechaAprobacion,
        CONCAT(us.Nombre, ' ', COALESCE(us.Apellido, '')) AS AprobadoPor,
        sr.ObservacionesAprobacion
      FROM solicitudes_reapertura sr
      INNER JOIN unidades u ON sr.IdUnidad = u.IdUnidad
      INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.IdAsignacionDocente
      INNER JOIN cursos c ON ad.IdCurso = c.IdCurso
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
