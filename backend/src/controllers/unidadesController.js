const sequelize = require('../config/database');
const Unidad = require('../models/Unidad');
const AsignacionDocente = require('../models/AsignacionDocente');
const Actividad = require('../models/Actividad');

// Obtener todas las unidades de una asignación
exports.getByAsignacion = async (req, res) => {
  try {
    const { idAsignacion } = req.params;

    const unidades = await Unidad.findAll({
      where: {
        IdAsignacionDocente: idAsignacion,
        Estado: 1,
      },
      order: [['NumeroUnidad', 'ASC']],
    });

    res.json({ success: true, data: unidades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener una unidad por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const unidad = await Unidad.findByPk(id, {
      include: [{ model: AsignacionDocente }],
    });

    if (!unidad) {
      return res.status(404).json({ success: false, error: 'Unidad no encontrada' });
    }

    res.json({ success: true, data: unidad });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener resumen de una unidad usando la vista
exports.getResumen = async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await sequelize.query(
      'SELECT * FROM vw_actividades_unidad WHERE IdUnidad = ?',
      { replacements: [id] }
    );

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, error: 'Unidad no encontrada' });
    }

    res.json({ success: true, data: results[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener actividades de una unidad
exports.getActividades = async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await sequelize.query(
      'SELECT * FROM actividades WHERE IdUnidad = ? AND Estado = 1 ORDER BY FechaActividad',
      { replacements: [id] }
    );

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Validar punteos de una unidad usando el Stored Procedure
exports.validarPunteos = async (req, res) => {
  try {
    const { id } = req.params;

    // Llamar al stored procedure
    await sequelize.query(
      'CALL sp_validar_punteos_unidad(?, @valido, @zonaConfig, @zonaActual, @finalConfig, @finalActual, @mensaje)',
      {
        replacements: [id],
        type: sequelize.QueryTypes.RAW,
      }
    );

    // Leer los parámetros OUT
    const [[output]] = await sequelize.query(
      'SELECT @valido as valido, @zonaConfig as zonaConfig, @zonaActual as zonaActual, @finalConfig as finalConfig, @finalActual as finalActual, @mensaje as mensaje'
    );

    res.json({
      success: true,
      data: {
        valido: Boolean(output.valido),
        zonaConfig: output.zonaConfig,
        zonaActual: output.zonaActual,
        finalConfig: output.finalConfig,
        finalActual: output.finalActual,
        mensaje: output.mensaje,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Activar una unidad (el trigger validará automáticamente)
exports.activar = async (req, res) => {
  try {
    const { id } = req.params;
    const { ModificadoPor } = req.body;

    if (!ModificadoPor || ModificadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ModificadoPor es requerido',
      });
    }

    const unidad = await Unidad.findByPk(id);
    if (!unidad) {
      return res.status(404).json({ success: false, error: 'Unidad no encontrada' });
    }

    // El trigger tr_validar_activacion_unidad validará automáticamente
    await unidad.update({
      Activa: 1,
      ModificadoPor,
      FechaModificado: new Date(),
    });

    res.json({
      success: true,
      message: 'Unidad activada exitosamente',
      data: unidad,
    });
  } catch (error) {
    // Error 1644 = Error del trigger de validación
    if (error.original && error.original.errno === 1644) {
      return res.status(400).json({
        success: false,
        message: error.original.sqlMessage,
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// Actualizar una unidad
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { ModificadoPor, PunteoZona, PunteoFinal } = req.body;

    if (!ModificadoPor || ModificadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ModificadoPor es requerido',
      });
    }

    const unidad = await Unidad.findByPk(id);
    if (!unidad) {
      return res.status(404).json({ success: false, error: 'Unidad no encontrada' });
    }

    // Validar que la suma de PunteoZona + PunteoFinal = 100
    if (PunteoZona !== undefined && PunteoFinal !== undefined) {
      const zona = parseFloat(PunteoZona);
      const final = parseFloat(PunteoFinal);

      if (isNaN(zona) || isNaN(final)) {
        return res.status(400).json({
          success: false,
          error: 'PunteoZona y PunteoFinal deben ser números válidos',
        });
      }

      if (zona < 0 || final < 0) {
        return res.status(400).json({
          success: false,
          error: 'PunteoZona y PunteoFinal no pueden ser negativos',
        });
      }

      const suma = zona + final;
      if (suma !== 100) {
        return res.status(400).json({
          success: false,
          error: `La suma de PunteoZona (${zona}) + PunteoFinal (${final}) debe ser exactamente 100. Suma actual: ${suma}`,
        });
      }
    }

    await unidad.update({
      ...req.body,
      FechaModificado: new Date(),
    });

    res.json({
      success: true,
      data: unidad,
      message: 'Unidad actualizada exitosamente'
    });
  } catch (error) {
    // Manejar error del trigger si se intenta activar sin punteos correctos
    if (error.original && error.original.errno === 1644) {
      return res.status(400).json({
        success: false,
        message: error.original.sqlMessage,
      });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// Actualizar punteos de una unidad (endpoint específico)
exports.updatePunteos = async (req, res) => {
  try {
    const { id } = req.params;
    const { PunteoZona, PunteoFinal, ModificadoPor } = req.body;

    // Validaciones
    if (!ModificadoPor || ModificadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ModificadoPor es requerido',
      });
    }

    if (PunteoZona === undefined || PunteoFinal === undefined) {
      return res.status(400).json({
        success: false,
        error: 'PunteoZona y PunteoFinal son requeridos',
      });
    }

    const zona = parseFloat(PunteoZona);
    const final = parseFloat(PunteoFinal);

    if (isNaN(zona) || isNaN(final)) {
      return res.status(400).json({
        success: false,
        error: 'PunteoZona y PunteoFinal deben ser números válidos',
      });
    }

    if (zona < 0 || final < 0) {
      return res.status(400).json({
        success: false,
        error: 'PunteoZona y PunteoFinal no pueden ser negativos',
      });
    }

    // VALIDACIÓN CRÍTICA: La suma debe ser exactamente 100
    const suma = zona + final;
    if (suma !== 100) {
      return res.status(400).json({
        success: false,
        error: `La suma de PunteoZona (${zona}) + PunteoFinal (${final}) debe ser exactamente 100. Suma actual: ${suma}`,
      });
    }

    const unidad = await Unidad.findByPk(id);
    if (!unidad) {
      return res.status(404).json({ success: false, error: 'Unidad no encontrada' });
    }

    await unidad.update({
      PunteoZona: zona,
      PunteoFinal: final,
      ModificadoPor,
      FechaModificado: new Date(),
    });

    res.json({
      success: true,
      data: unidad,
      message: `Punteos actualizados: ${zona} zona + ${final} examen final = 100`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Cerrar unidad activa y abrir la siguiente
exports.cerrarYAbrirSiguiente = async (req, res) => {
  try {
    const { idAsignacion } = req.params;
    const { ModificadoPor } = req.body;

    if (!ModificadoPor || ModificadoPor.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ModificadoPor es requerido',
      });
    }

    // Buscar la unidad actualmente activa
    const unidadActiva = await Unidad.findOne({
      where: {
        IdAsignacionDocente: idAsignacion,
        Activa: 1,
        Estado: 1,
      },
    });

    if (!unidadActiva) {
      return res.status(404).json({
        success: false,
        error: 'No hay ninguna unidad activa en esta asignación',
      });
    }

    // Buscar la siguiente unidad
    const siguienteUnidad = await Unidad.findOne({
      where: {
        IdAsignacionDocente: idAsignacion,
        NumeroUnidad: unidadActiva.NumeroUnidad + 1,
        Estado: 1,
      },
    });

    if (!siguienteUnidad) {
      return res.status(400).json({
        success: false,
        error: `No existe una unidad siguiente. La unidad ${unidadActiva.NumeroUnidad} es la última.`,
      });
    }

    // Cerrar la unidad activa
    await unidadActiva.update({
      Activa: 0,
      ModificadoPor,
      FechaModificado: new Date(),
    });

    // Abrir la siguiente unidad
    await siguienteUnidad.update({
      Activa: 1,
      ModificadoPor,
      FechaModificado: new Date(),
    });

    res.json({
      success: true,
      message: `Unidad ${unidadActiva.NumeroUnidad} cerrada. Unidad ${siguienteUnidad.NumeroUnidad} activada.`,
      data: {
        unidadCerrada: unidadActiva,
        unidadAbierta: siguienteUnidad,
      },
    });
  } catch (error) {
    // Manejar error del trigger si existe
    if (error.original && error.original.errno === 1644) {
      return res.status(400).json({
        success: false,
        message: error.original.sqlMessage,
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// REPORTE PARA ADMINISTRADOR
// ============================================

/**
 * Obtener reporte de unidades con actividades incompletas
 * GET /api/unidades/reporte-incompletas
 *
 * Retorna todas las unidades activas donde las actividades de zona
 * NO suman el punteo esperado (PunteoZona de la unidad)
 */
exports.reporteUnidadesIncompletas = async (req, res) => {
  try {
    // Obtener todas las unidades activas
    const unidadesActivas = await Unidad.findAll({
      where: { Activa: 1, Estado: true },
      include: [{
        model: AsignacionDocente,
        attributes: ['IdCurso', 'IdGrado', 'IdSeccion', 'IdJornada', 'Anio']
      }],
    });

    const reporte = [];

    for (const unidad of unidadesActivas) {
      const punteoZonaEsperado = parseFloat(unidad.PunteoZona);
      const punteoFinalEsperado = parseFloat(unidad.PunteoFinal);

      // Obtener actividades de zona
      const actividadesZona = await Actividad.findAll({
        where: {
          IdUnidad: unidad.IdUnidad,
          TipoActividad: 'zona',
          Estado: true,
        },
      });

      // Obtener actividades final
      const actividadesFinal = await Actividad.findAll({
        where: {
          IdUnidad: unidad.IdUnidad,
          TipoActividad: 'final',
          Estado: true,
        },
      });

      // Calcular sumas
      const sumaZona = actividadesZona.reduce((total, act) => {
        return total + parseFloat(act.PunteoMaximo);
      }, 0);

      const sumaFinal = actividadesFinal.reduce((total, act) => {
        return total + parseFloat(act.PunteoMaximo);
      }, 0);

      const sumaZonaRedondeada = Math.round(sumaZona * 100) / 100;
      const sumaFinalRedondeada = Math.round(sumaFinal * 100) / 100;

      // Verificar si hay inconsistencias
      const zonaIncompleta = sumaZonaRedondeada !== punteoZonaEsperado;
      const finalIncompleta = sumaFinalRedondeada !== punteoFinalEsperado;

      if (zonaIncompleta || finalIncompleta) {
        // Obtener información adicional de la asignación
        const [asignacionInfo] = await sequelize.query(
          `SELECT
            c.NombreCurso,
            g.NombreGrado,
            s.Nombre AS Seccion,
            j.Nombre AS Jornada,
            CONCAT(d.Nombres, ' ', d.Apellidos) AS Docente
           FROM asignacion_docente ad
           INNER JOIN cursos c ON ad.IdCurso = c.IdCurso
           INNER JOIN grados g ON ad.IdGrado = g.IdGrado
           INNER JOIN secciones s ON ad.IdSeccion = s.IdSeccion
           INNER JOIN jornadas j ON ad.IdJornada = j.IdJornada
           INNER JOIN docentes d ON ad.IdDocente = d.IdDocente
           WHERE ad.IdAsignacionDocente = ?`,
          { replacements: [unidad.IdAsignacionDocente] }
        );

        reporte.push({
          IdUnidad: unidad.IdUnidad,
          NumeroUnidad: unidad.NumeroUnidad,
          NombreUnidad: unidad.NombreUnidad,
          curso: asignacionInfo[0]?.NombreCurso || 'N/A',
          grado: asignacionInfo[0]?.NombreGrado || 'N/A',
          seccion: asignacionInfo[0]?.Seccion || 'N/A',
          jornada: asignacionInfo[0]?.Jornada || 'N/A',
          docente: asignacionInfo[0]?.Docente || 'N/A',
          zona: {
            esperado: punteoZonaEsperado,
            actual: sumaZonaRedondeada,
            diferencia: punteoZonaEsperado - sumaZonaRedondeada,
            incompleta: zonaIncompleta,
            cantidadActividades: actividadesZona.length,
          },
          final: {
            esperado: punteoFinalEsperado,
            actual: sumaFinalRedondeada,
            diferencia: punteoFinalEsperado - sumaFinalRedondeada,
            incompleta: finalIncompleta,
            cantidadActividades: actividadesFinal.length,
          },
          bloqueaFinal: zonaIncompleta, // Si zona incompleta, no pueden calificar el final
        });
      }
    }

    res.json({
      success: true,
      data: reporte,
      total: reporte.length,
      mensaje: reporte.length === 0
        ? 'Todas las unidades activas tienen las actividades configuradas correctamente'
        : `Se encontraron ${reporte.length} unidades con actividades incompletas`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
