const sequelize = require('../config/database');
const Actividad = require('../models/Actividad');
const Unidad = require('../models/Unidad');
const Calificacion = require('../models/Calificacion');

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
    const { ModificadoPor, PunteoMaximo, FechaActividad } = req.body;

    if (!ModificadoPor || ModificadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ModificadoPor es requerido',
      });
    }

    const actividad = await Actividad.findByPk(id);
    if (!actividad) {
      return res.status(404).json({ success: false, error: 'Actividad no encontrada' });
    }

    // ============================================
    // VALIDACIÓN 1: Bloquear modificación si la fecha límite ya pasó
    // ============================================
    const fechaActual = new Date();
    const fechaLimiteActividad = new Date(actividad.FechaActividad);

    if (fechaActual > fechaLimiteActividad) {
      return res.status(403).json({
        success: false,
        error: 'No se puede modificar la actividad porque la fecha límite ya pasó',
        detalles: {
          fechaLimite: actividad.FechaActividad,
          fechaActual: fechaActual.toISOString().split('T')[0],
        },
      });
    }

    // ============================================
    // VALIDACIÓN 2: Bloquear cambio de PunteoMaximo si hay estudiantes calificados
    // ============================================
    if (PunteoMaximo !== undefined && parseFloat(PunteoMaximo) !== parseFloat(actividad.PunteoMaximo)) {
      // Verificar si existen calificaciones con punteo asignado (Punteo IS NOT NULL)
      const [resultados] = await sequelize.query(
        `SELECT COUNT(*) as calificados
         FROM calificaciones
         WHERE IdActividad = ? AND Punteo IS NOT NULL`,
        { replacements: [id] }
      );

      const cantidadCalificados = resultados[0].calificados;

      if (cantidadCalificados > 0) {
        return res.status(403).json({
          success: false,
          error: 'No se puede modificar el punteo máximo porque ya hay estudiantes calificados',
          detalles: {
            estudiantesCalificados: cantidadCalificados,
            punteoActual: actividad.PunteoMaximo,
            punteoSolicitado: PunteoMaximo,
            mensaje: 'Para cambiar el punteo, primero debe eliminar todas las calificaciones de esta actividad',
          },
        });
      }
    }

    // ============================================
    // ACTUALIZAR LA ACTIVIDAD
    // ============================================
    await actividad.update({
      ...req.body,
      FechaModificado: new Date(),
    });

    res.json({ success: true, data: actividad });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Eliminar (desactivar) una actividad
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { ModificadoPor } = req.body;

    if (!ModificadoPor || ModificadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ModificadoPor es requerido',
      });
    }

    const actividad = await Actividad.findByPk(id);
    if (!actividad) {
      return res.status(404).json({ success: false, error: 'Actividad no encontrada' });
    }

    await actividad.update({
      Estado: false,
      ModificadoPor,
      FechaModificado: new Date(),
    });

    res.json({ success: true, message: 'Actividad marcada como inactiva' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// NUEVAS FUNCIONALIDADES - SISTEMA DE ACTIVIDADES COMPLETO
// ============================================

/**
 * Obtener todas las actividades de una unidad (zona y final)
 * GET /api/actividades/unidad/:idUnidad
 */
exports.getByUnidad = async (req, res) => {
  try {
    const { idUnidad } = req.params;

    const actividades = await Actividad.findAll({
      where: { IdUnidad: idUnidad, Estado: true },
      order: [['TipoActividad', 'ASC'], ['FechaActividad', 'ASC']],
    });

    // Calcular totales por tipo
    const totales = {
      zona: 0,
      final: 0,
      total: 0,
    };

    actividades.forEach((act) => {
      const punteo = parseFloat(act.PunteoMaximo);
      totales[act.TipoActividad] += punteo;
      totales.total += punteo;
    });

    res.json({
      success: true,
      data: actividades,
      totales,
      cantidad: actividades.length,
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
