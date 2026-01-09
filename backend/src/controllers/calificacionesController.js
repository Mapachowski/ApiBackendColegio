const sequelize = require('../config/database');
const Calificacion = require('../models/Calificacion');
const Actividad = require('../models/Actividad');
const Alumno = require('../models/Alumno');
const Unidad = require('../models/Unidad');
const cierreUnidadesController = require('./cierreUnidadesController');

// Obtener una calificación por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const calificacion = await Calificacion.findByPk(id, {
      include: [
        { model: Actividad },
        { model: Alumno },
      ],
    });

    if (!calificacion) {
      return res.status(404).json({ success: false, error: 'Calificación no encontrada' });
    }

    res.json({ success: true, data: calificacion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener calificaciones por actividad
exports.getPorActividad = async (req, res) => {
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

// Obtener calificaciones por alumno (con opción de filtrar por unidad)
exports.getPorAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const { unidad } = req.query;

    let query = 'SELECT * FROM vw_calificaciones_alumno_unidad WHERE IdAlumno = ?';
    let params = [id];

    if (unidad) {
      query += ' AND NumeroUnidad = ?';
      params.push(unidad);
    }

    const [results] = await sequelize.query(query, { replacements: params });

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener promedio anual de un alumno
exports.getPromedioAlumno = async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await sequelize.query(
      'SELECT * FROM vw_promedio_anual WHERE IdAlumno = ?',
      { replacements: [id] }
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron calificaciones para este alumno',
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear/actualizar calificaciones en batch para una actividad
exports.updateBatchActividad = async (req, res) => {
  try {
    const { idActividad } = req.params;
    const { calificaciones } = req.body;

    // Obtener usuario del JWT
    const ModificadoPor = req.usuario?.email || req.usuario?.nombre || 'Sistema';

    if (!calificaciones || !Array.isArray(calificaciones) || calificaciones.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de calificaciones',
      });
    }

    // Verificar que la actividad existe
    const actividad = await Actividad.findByPk(idActividad, {
      include: [{ model: Unidad }]
    });
    if (!actividad) {
      return res.status(404).json({
        success: false,
        error: 'Actividad no encontrada'
      });
    }

    // ============================================
    // VALIDACIÓN CRÍTICA: Verificar que la unidad esté activa
    // ============================================
    if (!actividad.Unidad || actividad.Unidad.Activa === 0) {
      return res.status(403).json({
        success: false,
        error: 'No puedes modificar calificaciones de una unidad cerrada. Solicita reapertura al administrador.',
        unidadCerrada: true
      });
    }

    let creadas = 0;
    let actualizadas = 0;
    const errores = [];

    for (const item of calificaciones) {
      try {
        const { IdAlumno, Punteo, Observaciones } = item;

        // Buscar si ya existe la calificación
        const [calificacionExistente] = await Calificacion.findOrCreate({
          where: {
            IdActividad: idActividad,
            IdAlumno: IdAlumno
          },
          defaults: {
            Punteo,
            Observaciones,
            CreadoPor: ModificadoPor,
            FechaCreado: new Date()
          }
        });

        if (calificacionExistente._options.isNewRecord) {
          // Se creó una nueva calificación
          creadas++;
        } else {
          // Actualizar calificación existente
          await calificacionExistente.update({
            Punteo,
            Observaciones,
            ModificadoPor,
            FechaModificado: new Date()
          });
          actualizadas++;
        }
      } catch (error) {
        errores.push({
          IdAlumno: item.IdAlumno,
          error: error.message
        });
      }
    }

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
      // No lanzamos error porque las calificaciones ya se guardaron exitosamente
    }

    res.json({
      success: true,
      creadas,
      actualizadas,
      total: creadas + actualizadas,
      errores: errores.length > 0 ? errores : undefined,
      message: `${creadas + actualizadas} calificaciones procesadas exitosamente`
    });
  } catch (error) {
    console.error('❌ Error en batch de calificaciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Actualizar una calificación (ingresar punteo)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { Punteo, Observaciones } = req.body;

    // Obtener usuario del JWT
    const ModificadoPor = req.usuario?.email || req.usuario?.nombre || 'Sistema';

    const calificacion = await Calificacion.findByPk(id, {
      include: [{ model: Actividad }],
    });

    if (!calificacion) {
      return res.status(404).json({ success: false, error: 'Calificación no encontrada' });
    }

    // ============================================
    // VALIDACIÓN CRÍTICA: Bloquear calificación de examen final si zona incompleta
    // ============================================
    if (calificacion.Actividad.TipoActividad === 'final' && Punteo !== null && Punteo !== undefined) {
      // Obtener la unidad para conocer el punteo esperado de zona
      const unidad = await Unidad.findByPk(calificacion.Actividad.IdUnidad);

      if (!unidad) {
        return res.status(404).json({ success: false, error: 'Unidad no encontrada' });
      }

      // Calcular suma de actividades de zona
      const actividadesZona = await Actividad.findAll({
        where: {
          IdUnidad: calificacion.Actividad.IdUnidad,
          TipoActividad: 'zona',
          Estado: true,
        },
      });

      const sumaZona = actividadesZona.reduce((total, act) => {
        return total + parseFloat(act.PunteoMaximo);
      }, 0);

      const sumaZonaRedondeada = Math.round(sumaZona * 100) / 100;
      const punteoZonaEsperado = parseFloat(unidad.PunteoZona);

      // Si la zona NO suma 100%, BLOQUEAR la calificación del final
      if (sumaZonaRedondeada !== punteoZonaEsperado) {
        return res.status(403).json({
          success: false,
          error: 'No se puede calificar el examen final porque las actividades de ZONA no suman correctamente',
          detalles: {
            zonaActual: sumaZonaRedondeada,
            zonaEsperada: punteoZonaEsperado,
            diferencia: punteoZonaEsperado - sumaZonaRedondeada,
            mensaje: `Falta configurar ${punteoZonaEsperado - sumaZonaRedondeada} puntos en actividades de zona`,
          },
        });
      }
    }

    // Validar opcionalmente con el stored procedure
    if (Punteo !== null && Punteo !== undefined) {
      await sequelize.query(
        'CALL sp_validar_calificacion(?, ?, ?, @valido, @mensaje)',
        {
          replacements: [calificacion.IdActividad, calificacion.IdAlumno, Punteo],
          type: sequelize.QueryTypes.RAW,
        }
      );

      const [[validation]] = await sequelize.query('SELECT @valido as valido, @mensaje as mensaje');

      if (!validation.valido) {
        return res.status(400).json({
          success: false,
          message: validation.mensaje,
        });
      }
    }

    // Actualizar la calificación
    await calificacion.update({
      Punteo,
      Observaciones,
      ModificadoPor,
      FechaModificado: new Date(),
    });

    res.json({
      success: true,
      data: calificacion,
      message: 'Calificación actualizada exitosamente',
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Actualizar múltiples calificaciones en batch
exports.updateBatch = async (req, res) => {
  try {
    const { calificaciones, ModificadoPor } = req.body;

    if (!calificaciones || !Array.isArray(calificaciones) || calificaciones.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de calificaciones',
      });
    }

    if (!ModificadoPor || ModificadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ModificadoPor es requerido',
      });
    }

    const actualizadas = [];
    const errores = [];

    for (const item of calificaciones) {
      try {
        const calificacion = await Calificacion.findByPk(item.IdCalificacion);
        if (calificacion) {
          await calificacion.update({
            Punteo: item.Punteo,
            Observaciones: item.Observaciones || null,
            ModificadoPor,
            FechaModificado: new Date(),
          });
          actualizadas.push(item.IdCalificacion);
        }
      } catch (error) {
        errores.push({
          IdCalificacion: item.IdCalificacion,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      data: {
        actualizadas: actualizadas.length,
        errores: errores.length,
        detalleErrores: errores,
      },
      message: `${actualizadas.length} calificaciones actualizadas exitosamente`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
