const sequelize = require('../config/database');
const { Op } = require('sequelize');
const Actividad = require('../models/Actividad');
const Unidad = require('../models/Unidad');
const Calificacion = require('../models/Calificacion');
const cierreUnidadesController = require('./cierreUnidadesController');

// Obtener una actividad por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const actividad = await Actividad.findByPk(id, {
      include: [{ model: Unidad }],
    });

    if (!actividad) {
      return res.status(404).json({ success: false, error: 'Actividad no encontrada' });
    }

    res.json({ success: true, data: actividad });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener alumnos inscritos en la asignación de una actividad
exports.getAlumnosActividad = async (req, res) => {
  try {
    const { id } = req.params;

    const [alumnos] = await sequelize.query(
      `SELECT DISTINCT
          a.IdAlumno,
          a.Matricula AS Carnet,
          CONCAT(a.Nombres, ' ', a.Apellidos) AS NombreCompleto,
          a.Nombres,
          a.Apellidos,
          c.IdCalificacion,
          c.Punteo,
          c.Observaciones
       FROM actividades act
       INNER JOIN unidades u ON act.IdUnidad = u.IdUnidad
       INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.IdAsignacionDocente
       INNER JOIN inscripciones i ON
           i.IdGrado = ad.IdGrado
           AND i.IdSeccion = ad.IdSeccion
           AND i.IdJornada = ad.IdJornada
           AND i.CicloEscolar = ad.Anio
       INNER JOIN alumnos a ON i.IdAlumno = a.IdAlumno
       LEFT JOIN calificaciones c ON c.IdActividad = act.IdActividad AND c.IdAlumno = a.IdAlumno
       WHERE act.IdActividad = ?
         AND i.Estado = 1
         AND a.Estado = 1
       ORDER BY a.Apellidos, a.Nombres`,
      { replacements: [id] }
    );

    res.json({ success: true, data: alumnos, total: alumnos.length });
  } catch (error) {
    console.error('❌ Error al obtener alumnos de actividad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener calificaciones de una actividad
exports.getCalificaciones = async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await sequelize.query(
      `SELECT c.IdCalificacion, c.Punteo, c.Observaciones,
              a.IdAlumno, a.Matricula, a.Nombres, a.Apellidos,
              act.NombreActividad, act.PunteoMaximo
       FROM calificaciones c
       INNER JOIN alumnos a ON c.IdAlumno = a.IdAlumno
       INNER JOIN actividades act ON c.IdActividad = act.IdActividad
       WHERE c.IdActividad = ?
       ORDER BY a.Apellidos, a.Nombres`,
      { replacements: [id] }
    );

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear una nueva actividad (el trigger creará las calificaciones automáticamente)
exports.create = async (req, res) => {
  try {
    const { IdUnidad, NombreActividad, Descripcion, PunteoMaximo, TipoActividad, FechaActividad, CreadoPor } = req.body;

    // Validaciones
    if (!IdUnidad || !NombreActividad || !PunteoMaximo || !TipoActividad || !FechaActividad) {
      return res.status(400).json({
        success: false,
        error: 'IdUnidad, NombreActividad, PunteoMaximo, TipoActividad y FechaActividad son requeridos',
      });
    }

    if (!['zona', 'final'].includes(TipoActividad)) {
      return res.status(400).json({
        success: false,
        error: 'TipoActividad debe ser "zona" o "final"',
      });
    }

    if (!CreadoPor || CreadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'CreadoPor es requerido',
      });
    }

    // ============================================
    // VALIDACIÓN CRÍTICA: Verificar que la unidad esté activa
    // ============================================
    const unidad = await Unidad.findByPk(IdUnidad);
    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    if (unidad.Activa === 0) {
      return res.status(403).json({
        success: false,
        error: 'No puedes crear actividades en una unidad cerrada. Solicita reapertura al administrador.',
        unidadCerrada: true
      });
    }

    // El trigger tr_crear_calificaciones_actividad se encargará de crear las calificaciones automáticamente
    const nuevaActividad = await Actividad.create({
      IdUnidad,
      NombreActividad,
      Descripcion,
      PunteoMaximo,
      TipoActividad,
      FechaActividad,
      CreadoPor,
      FechaCreado: new Date(),
    });

    // Recalcular estado del curso automáticamente
    try {
      // Reutilizamos la variable 'unidad' que ya obtuvimos en la validación
      // Obtener IdCurso e IdDocente de la unidad
      const [asignacion] = await sequelize.query(`
        SELECT IdCurso, IdDocente
        FROM asignacion_docente
        WHERE IdAsignacionDocente = :idAsignacion
      `, {
        replacements: { idAsignacion: unidad.IdAsignacionDocente },
        type: sequelize.QueryTypes.SELECT
      });

      if (asignacion) {
        await cierreUnidadesController.recalcularEstadoCursoSilencioso(
          IdUnidad,
          asignacion.IdCurso,
          asignacion.IdDocente
        );
      }
    } catch (error) {
      console.error('⚠️ Error al recalcular estado (no crítico):', error.message);
      // No lanzamos error porque la actividad ya se creó exitosamente
    }

    res.status(201).json({
      success: true,
      data: nuevaActividad,
      message: 'Actividad creada y calificaciones generadas automáticamente',
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Actualizar una actividad
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { PunteoMaximo, FechaActividad, Estado, TipoActividad } = req.body;

    // Obtener usuario del token JWT (agregado por middleware de autenticación)
    const ModificadoPor = req.usuario?.email || req.usuario?.nombre || 'Sistema';

    const actividad = await Actividad.findByPk(id, {
      include: [{ model: Unidad }]
    });
    if (!actividad) {
      return res.status(404).json({ success: false, error: 'Actividad no encontrada' });
    }

    // ============================================
    // VALIDACIÓN CRÍTICA: Verificar que la unidad esté activa
    // ============================================
    if (!actividad.Unidad || actividad.Unidad.Activa === 0) {
      return res.status(403).json({
        success: false,
        error: 'No puedes modificar actividades de una unidad cerrada. Solicita reapertura al administrador.',
        unidadCerrada: true
      });
    }

    // ============================================
    // VALIDACIÓN CRÍTICA: Verificar si tiene calificaciones CON PUNTEO asignadas
    // ============================================
    // Solo contamos calificaciones que tienen punteo (no NULL)
    // Esto permite inactivar actividades recién creadas que solo tienen calificaciones vacías
    const cantidadCalificacionesConPunteo = await Calificacion.count({
      where: {
        IdActividad: id,
        Punteo: { [Op.ne]: null }  // Solo contar calificaciones con punteo asignado
      }
    });

    if (cantidadCalificacionesConPunteo > 0) {
      // ❌ NO permitir inactivar actividad con calificaciones que tienen punteo
      if (Estado !== undefined && (Estado === false || Estado === 0 || Estado === '0')) {
        return res.status(400).json({
          success: false,
          error: 'No se puede inactivar una actividad con calificaciones registradas',
          tieneCalificaciones: true,
          cantidadCalificaciones: cantidadCalificacionesConPunteo,
          mensaje: 'Esta actividad tiene calificaciones de estudiantes con punteo asignado. Inactivarla afectaría sus notas.'
        });
      }

      // ❌ NO permitir cambiar punteo máximo si tiene calificaciones con punteo
      if (PunteoMaximo !== undefined && parseFloat(PunteoMaximo) !== parseFloat(actividad.PunteoMaximo)) {
        return res.status(400).json({
          success: false,
          error: 'No se puede cambiar el punteo de una actividad con calificaciones registradas',
          tieneCalificaciones: true,
          cantidadCalificaciones: cantidadCalificacionesConPunteo,
          punteoActual: actividad.PunteoMaximo,
          punteoSolicitado: PunteoMaximo,
          mensaje: 'Esta actividad tiene calificaciones de estudiantes. Cambiar el punteo crearía inconsistencias.'
        });
      }

      // ❌ NO permitir cambiar tipo de actividad (zona ↔ final)
      if (TipoActividad !== undefined && TipoActividad !== actividad.TipoActividad) {
        return res.status(400).json({
          success: false,
          error: 'No se puede cambiar el tipo de una actividad con calificaciones registradas',
          tieneCalificaciones: true,
          cantidadCalificaciones: cantidadCalificacionesConPunteo,
          tipoActual: actividad.TipoActividad,
          tipoSolicitado: TipoActividad,
          mensaje: 'Esta actividad tiene calificaciones de estudiantes. Cambiar de zona a final (o viceversa) afectaría sus notas.'
        });
      }
    }

    // ============================================
    // ACTUALIZAR LA ACTIVIDAD
    // (Se permite editar siempre que la unidad esté abierta)
    // ============================================
    await actividad.update({
      ...req.body,
      ModificadoPor,
      FechaModificado: new Date(),
    });

    // Recalcular estado del curso automáticamente
    try {
      const unidad = await Unidad.findByPk(actividad.IdUnidad);
      if (unidad) {
        // Obtener IdCurso e IdDocente de la unidad
        const [asignacion] = await sequelize.query(`
          SELECT IdCurso, IdDocente
          FROM asignacion_docente
          WHERE IdAsignacionDocente = :idAsignacion
        `, {
          replacements: { idAsignacion: unidad.IdAsignacionDocente },
          type: sequelize.QueryTypes.SELECT
        });

        if (asignacion) {
          await cierreUnidadesController.recalcularEstadoCursoSilencioso(
            actividad.IdUnidad,
            asignacion.IdCurso,
            asignacion.IdDocente
          );
        }
      }
    } catch (error) {
      console.error('⚠️ Error al recalcular estado (no crítico):', error.message);
      // No lanzamos error porque la actividad ya se actualizó exitosamente
    }

    res.json({ success: true, data: actividad });
  } catch (error) {
    console.error('❌ Error al actualizar actividad:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Eliminar (desactivar) una actividad
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener usuario del token JWT (agregado por middleware de autenticación)
    const ModificadoPor = req.usuario?.email || req.usuario?.nombre || 'Sistema';

    const actividad = await Actividad.findByPk(id);
    if (!actividad) {
      return res.status(404).json({ success: false, error: 'Actividad no encontrada' });
    }

    // ============================================
    // VALIDACIÓN CRÍTICA: No permitir eliminar actividad con calificaciones
    // ============================================
    const cantidadCalificaciones = await Calificacion.count({
      where: { IdActividad: id }
    });

    if (cantidadCalificaciones > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar una actividad con calificaciones asignadas',
        tieneCalificaciones: true,
        cantidadCalificaciones: cantidadCalificaciones,
        mensaje: 'Esta actividad tiene calificaciones de estudiantes. Eliminarla afectaría sus notas finales.'
      });
    }

    await actividad.update({
      Estado: false,
      ModificadoPor,
      FechaModificado: new Date(),
    });

    res.json({
      success: true,
      message: 'Actividad eliminada exitosamente',
      data: {
        IdActividad: actividad.IdActividad,
        NombreActividad: actividad.NombreActividad
      }
    });
  } catch (error) {
    console.error('❌ Error al eliminar actividad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// NUEVAS FUNCIONALIDADES - SISTEMA DE ACTIVIDADES COMPLETO
// ============================================

/**
 * Verificar si una actividad tiene calificaciones asignadas
 * GET /api/actividades/:id/tiene-calificaciones
 */
exports.tieneCalificaciones = async (req, res) => {
  try {
    const { id } = req.params;

    const actividad = await Actividad.findByPk(id);
    if (!actividad) {
      return res.status(404).json({ success: false, error: 'Actividad no encontrada' });
    }

    const cantidadCalificaciones = await Calificacion.count({
      where: { IdActividad: id }
    });

    res.json({
      success: true,
      tieneCalificaciones: cantidadCalificaciones > 0,
      cantidad: cantidadCalificaciones,
      actividad: {
        IdActividad: actividad.IdActividad,
        NombreActividad: actividad.NombreActividad,
        PunteoMaximo: actividad.PunteoMaximo,
        TipoActividad: actividad.TipoActividad
      }
    });
  } catch (error) {
    console.error('❌ Error al verificar calificaciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Obtener todas las actividades de una unidad (zona y final)
 * GET /api/actividades/unidad/:idUnidad
 */
exports.getByUnidad = async (req, res) => {
  try {
    const { idUnidad } = req.params;

    // Obtener TODAS las actividades (activas e inactivas)
    const actividades = await Actividad.findAll({
      where: { IdUnidad: idUnidad },
      order: [['TipoActividad', 'ASC'], ['FechaActividad', 'ASC']],
    });

    // Obtener total de alumnos inscritos en esta unidad
    const [alumnos] = await sequelize.query(
      `SELECT DISTINCT a.IdAlumno
       FROM actividades act
       INNER JOIN unidades u ON act.IdUnidad = u.IdUnidad
       INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.IdAsignacionDocente
       INNER JOIN inscripciones i ON
           i.IdGrado = ad.IdGrado
           AND i.IdSeccion = ad.IdSeccion
           AND i.IdJornada = ad.IdJornada
           AND i.CicloEscolar = ad.Anio
       INNER JOIN alumnos a ON i.IdAlumno = a.IdAlumno
       WHERE act.IdUnidad = :idUnidad
         AND i.Estado = 1
         AND a.Estado = 1`,
      { replacements: { idUnidad } }
    );

    const totalAlumnos = alumnos.length;

    // Enriquecer cada actividad con contadores de calificaciones
    const actividadesConContadores = await Promise.all(
      actividades.map(async (actividad) => {
        const alumnosCalificados = await Calificacion.count({
          where: {
            IdActividad: actividad.IdActividad,
            Punteo: { [Op.ne]: null }
          }
        });

        return {
          ...actividad.toJSON(),
          AlumnosCalificados: alumnosCalificados,
          TotalAlumnos: totalAlumnos
        };
      })
    );

    // Calcular totales SOLO con actividades activas (Estado = true)
    const totales = {
      zona: 0,
      final: 0,
      total: 0,
    };

    const actividadesActivas = actividadesConContadores.filter(act => act.Estado === true);

    actividadesActivas.forEach((act) => {
      const punteo = parseFloat(act.PunteoMaximo);
      totales[act.TipoActividad] += punteo;
      totales.total += punteo;
    });

    res.json({
      success: true,
      data: actividadesConContadores, // Devolver todas con contadores
      totales, // Totales solo de activas
      cantidad: actividadesConContadores.length,
      cantidadActivas: actividadesActivas.length,
      cantidadInactivas: actividadesConContadores.length - actividadesActivas.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Crear actividades por lote con validación de suma
 * POST /api/actividades/unidad/:idUnidad/batch
 *
 * Body: {
 *   actividades: [{NombreActividad, Descripcion, PunteoMaximo, TipoActividad, FechaActividad}, ...],
 *   CreadoPor: "nombre_usuario"
 * }
 */
exports.createBatch = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { idUnidad } = req.params;
    const { actividades, CreadoPor } = req.body;

    // ============================================
    // VALIDACIONES
    // ============================================

    if (!actividades || !Array.isArray(actividades) || actividades.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar un array de actividades',
      });
    }

    if (!CreadoPor || CreadoPor.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'CreadoPor es requerido',
      });
    }

    // Obtener la unidad para validar punteos
    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada',
      });
    }

    const punteoZonaEsperado = parseFloat(unidad.PunteoZona);
    const punteoFinalEsperado = parseFloat(unidad.PunteoFinal);

    // Calcular suma de punteos por tipo
    let sumaZona = 0;
    let sumaFinal = 0;

    actividades.forEach((act) => {
      // Validar FechaActividad obligatoria
      if (!act.FechaActividad) {
        throw new Error(`FechaActividad es obligatoria para la actividad: ${act.NombreActividad}`);
      }

      const punteo = parseFloat(act.PunteoMaximo);

      if (isNaN(punteo) || punteo <= 0) {
        throw new Error(`Punteo inválido en actividad: ${act.NombreActividad}`);
      }

      if (act.TipoActividad === 'zona') {
        sumaZona += punteo;
      } else if (act.TipoActividad === 'final') {
        sumaFinal += punteo;
      } else {
        throw new Error(`TipoActividad inválido en: ${act.NombreActividad}. Debe ser 'zona' o 'final'`);
      }
    });

    // Redondear para evitar problemas de precisión de decimales
    sumaZona = Math.round(sumaZona * 100) / 100;
    sumaFinal = Math.round(sumaFinal * 100) / 100;

    // Validar que las sumas coincidan con los punteos de la unidad
    // NOTA: Esto es solo una advertencia, NO bloquea la creación
    const advertencias = [];

    if (sumaZona !== punteoZonaEsperado) {
      advertencias.push(
        `Las actividades de ZONA suman ${sumaZona} pero deben sumar ${punteoZonaEsperado}`
      );
    }

    if (sumaFinal !== punteoFinalEsperado) {
      advertencias.push(
        `Las actividades FINAL suman ${sumaFinal} pero deben sumar ${punteoFinalEsperado}`
      );
    }

    // ============================================
    // CREAR ACTIVIDADES
    // ============================================

    const actividadesCreadas = [];

    for (const actData of actividades) {
      const nuevaActividad = await Actividad.create(
        {
          IdUnidad: idUnidad,
          NombreActividad: actData.NombreActividad,
          Descripcion: actData.Descripcion || null,
          PunteoMaximo: actData.PunteoMaximo,
          TipoActividad: actData.TipoActividad,
          FechaActividad: actData.FechaActividad, // Ya validamos que no sea null
          Estado: true,
          CreadoPor,
          FechaCreado: new Date(),
        },
        { transaction }
      );

      actividadesCreadas.push(nuevaActividad);
    }

    // Confirmar transacción
    await transaction.commit();

    // Mensaje sobre el trigger
    const response = {
      success: true,
      data: actividadesCreadas,
      message: `${actividadesCreadas.length} actividades creadas exitosamente. Las calificaciones fueron asignadas automáticamente a los estudiantes.`,
      totales: {
        zona: sumaZona,
        final: sumaFinal,
        total: sumaZona + sumaFinal,
      },
    };

    // Agregar advertencias si existen
    if (advertencias.length > 0) {
      response.advertencias = advertencias;
      response.mensaje_advertencia = 'ADVERTENCIA: Los punteos no suman correctamente. El docente NO podrá calificar el examen final hasta que la zona sume 100%.';
    }

    res.status(201).json(response);
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Validar suma de actividades sin crear
 * POST /api/actividades/unidad/:idUnidad/validar-suma
 *
 * Permite al frontend validar antes de enviar el formulario
 */
exports.validarSuma = async (req, res) => {
  try {
    const { idUnidad } = req.params;
    const { actividades } = req.body;

    if (!actividades || !Array.isArray(actividades)) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar un array de actividades',
      });
    }

    // Obtener la unidad
    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada',
      });
    }

    const punteoZonaEsperado = parseFloat(unidad.PunteoZona);
    const punteoFinalEsperado = parseFloat(unidad.PunteoFinal);

    // Calcular sumas
    let sumaZona = 0;
    let sumaFinal = 0;

    actividades.forEach((act) => {
      const punteo = parseFloat(act.PunteoMaximo || 0);
      if (act.TipoActividad === 'zona') {
        sumaZona += punteo;
      } else if (act.TipoActividad === 'final') {
        sumaFinal += punteo;
      }
    });

    sumaZona = Math.round(sumaZona * 100) / 100;
    sumaFinal = Math.round(sumaFinal * 100) / 100;

    const zonaValida = sumaZona === punteoZonaEsperado;
    const finalValida = sumaFinal === punteoFinalEsperado;
    const esValido = zonaValida && finalValida;

    res.json({
      success: true,
      valido: esValido,
      detalles: {
        zona: {
          suma: sumaZona,
          esperado: punteoZonaEsperado,
          diferencia: punteoZonaEsperado - sumaZona,
          valido: zonaValida,
        },
        final: {
          suma: sumaFinal,
          esperado: punteoFinalEsperado,
          diferencia: punteoFinalEsperado - sumaFinal,
          valido: finalValida,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
