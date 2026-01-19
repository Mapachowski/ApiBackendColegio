const sequelize = require('../config/database');
const Unidad = require('../models/Unidad');
const Actividad = require('../models/Actividad');
const Calificacion = require('../models/Calificacion');
const EstadoCursoUnidad = require('../models/EstadoCursoUnidad');
const NotificacionDocente = require('../models/NotificacionDocente');
const { Op, QueryTypes } = require('sequelize');

/**
 * ========================================
 * NOMBRES DE CAMPOS CORRECTOS (colegio2):
 * ========================================
 * asignacion_docente: idAsignacionDocente, idDocente, idCurso, idGrado, idSeccion, idJornada (minúsculas)
 * cursos: idCurso, idGrado, Curso (no NombreCurso)
 * docentes: idDocente, NombreDocente
 * grados: IdGrado, NombreGrado
 * secciones: IdSeccion, NombreSeccion
 * jornadas: IdJornada, NombreJornada
 * unidades: IdUnidad, IdAsignacionDocente (mayúscula)
 */

/**
 * Obtener estado de todos los cursos con un número de unidad específico
 * GET /api/cierre-unidades/estado-por-numero/:numeroUnidad
 */
exports.getEstadoPorNumeroUnidad = async (req, res) => {
  try {
    const { numeroUnidad } = req.params;

    // Obtener estados de TODOS los cursos con ese número de unidad
    const query = `
      SELECT
        e.IdEstado,
        e.IdUnidad,
        e.IdCurso,
        c.Curso AS NombreCurso,
        g.NombreGrado,
        s.NombreSeccion,
        j.NombreJornada,
        e.IdDocente,
        d.NombreDocente,
        e.ActividadesSuman100,
        e.PuntajeActual,
        e.TotalEstudiantes,
        e.EstudiantesCalificados,
        e.PorcentajeCompletado,
        e.EstadoGeneral,
        e.DetallesPendientes,
        e.UltimaActualizacion
      FROM estado_cursos_unidad e
      INNER JOIN unidades un ON e.IdUnidad = un.IdUnidad
      INNER JOIN asignacion_docente ad ON un.IdAsignacionDocente = ad.idAsignacionDocente
      INNER JOIN cursos c ON e.IdCurso = c.idCurso
      INNER JOIN grados g ON c.idGrado = g.IdGrado
      INNER JOIN secciones s ON ad.idSeccion = s.IdSeccion
      INNER JOIN jornadas j ON ad.idJornada = j.IdJornada
      INNER JOIN docentes d ON e.IdDocente = d.idDocente
      WHERE un.NumeroUnidad = ? AND un.Estado = 1 AND un.Cerrada = 0
      ORDER BY g.NombreGrado, s.NombreSeccion, c.Curso
    `;

    const estados = await sequelize.query(query, {
      replacements: [numeroUnidad],
      type: QueryTypes.SELECT
    });

    // Parsear JSON de DetallesPendientes y extraer problemas
    const estadosProcesados = estados.map(estado => {
      let detalles = null;
      try {
        if (estado.DetallesPendientes) {
          detalles = typeof estado.DetallesPendientes === 'string'
            ? JSON.parse(estado.DetallesPendientes)
            : estado.DetallesPendientes;
        }
      } catch (error) {
        console.error('Error parsing DetallesPendientes:', error.message);
        detalles = null;
      }

      const problemas = [];
      if (!estado.ActividadesSuman100) {
        problemas.push(`Actividades suman ${estado.PuntajeActual} pts (deben sumar 100)`);
      }
      if (estado.PorcentajeCompletado < 100) {
        const pendientes = estado.TotalEstudiantes - estado.EstudiantesCalificados;
        problemas.push(`${pendientes} estudiante(s) sin calificar`);
      }

      return {
        ...estado,
        DetallesPendientes: detalles,
        Problemas: problemas
      };
    });

    // Calcular resumen
    const resumen = {
      totalCursos: estadosProcesados.length,
      cursosListos: estadosProcesados.filter(e => e.EstadoGeneral === 'LISTO').length,
      cursosPendientes: estadosProcesados.filter(e => e.EstadoGeneral === 'PENDIENTE').length,
      cursosIncompletos: estadosProcesados.filter(e => e.EstadoGeneral === 'INCOMPLETO').length,
      porcentajeCompletado: 0
    };

    if (resumen.totalCursos > 0) {
      resumen.porcentajeCompletado = Math.round(
        (resumen.cursosListos / resumen.totalCursos) * 100
      );
    }

    res.json({
      success: true,
      data: {
        numeroUnidad: parseInt(numeroUnidad),
        cursos: estadosProcesados,
        resumen
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estado por número de unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Método interno para calcular el estado de un curso específico
 */
exports.calcularEstadoCurso = async (IdUnidad, IdCurso, IdDocente) => {
  // 1. Validar actividades (deben sumar 100)
  const actividades = await Actividad.findAll({
    where: { IdUnidad, Estado: true }
  });

  const puntajeActual = actividades.reduce((sum, act) => {
    return sum + parseFloat(act.PunteoMaximo || 0);
  }, 0);

  const actividadesSuman100 = Math.abs(puntajeActual - 100) < 0.01; // Tolerancia decimal

  // 2. Validar calificaciones de estudiantes
  const [estudiantes] = await sequelize.query(`
    SELECT DISTINCT i.IdAlumno
    FROM inscripciones i
    INNER JOIN asignacion_docente ad ON
      i.IdGrado = ad.idGrado
      AND i.IdSeccion = ad.idSeccion
      AND i.IdJornada = ad.idJornada
      AND i.CicloEscolar = ad.Anio
    INNER JOIN unidades u ON ad.idAsignacionDocente = u.IdAsignacionDocente
    WHERE u.IdUnidad = :idUnidad
      AND ad.idCurso = :idCurso
      AND i.Estado = 1
  `, {
    replacements: { idUnidad: IdUnidad, idCurso: IdCurso }
  });

  const totalEstudiantes = estudiantes.length;
  let estudiantesCalificados = 0;
  const estudiantesPendientes = [];

  if (actividades.length > 0) {
    for (const estudiante of estudiantes) {
      const calificaciones = await Calificacion.count({
        where: {
          IdActividad: actividades.map(a => a.IdActividad),
          IdAlumno: estudiante.IdAlumno,
          Punteo: { [Op.ne]: null }
        }
      });

      if (calificaciones === actividades.length) {
        estudiantesCalificados++;
      } else {
        // Identificar qué actividades le faltan
        const actividadesPendientes = [];
        for (const actividad of actividades) {
          const tieneCalificacion = await Calificacion.findOne({
            where: {
              IdActividad: actividad.IdActividad,
              IdAlumno: estudiante.IdAlumno,
              Punteo: { [Op.ne]: null }
            }
          });

          if (!tieneCalificacion) {
            actividadesPendientes.push(actividad.NombreActividad);
          }
        }

        estudiantesPendientes.push({
          IdAlumno: estudiante.IdAlumno,
          ActividadesPendientes: actividadesPendientes
        });
      }
    }
  }

  const porcentajeCompletado = totalEstudiantes > 0
    ? parseFloat(((estudiantesCalificados / totalEstudiantes) * 100).toFixed(2))
    : 0;

  // 3. Determinar estado general
  let estadoGeneral = 'INCOMPLETO';
  if (actividadesSuman100 && porcentajeCompletado === 100) {
    estadoGeneral = 'LISTO';
  } else if (actividadesSuman100 && porcentajeCompletado >= 80) {
    estadoGeneral = 'PENDIENTE';
  }

  // 4. Generar detalles de pendientes
  const detallesPendientes = {
    actividades: {
      suman100: actividadesSuman100,
      puntajeActual: parseFloat(puntajeActual.toFixed(2)),
      faltante: parseFloat((100 - puntajeActual).toFixed(2))
    },
    calificaciones: {
      totalEstudiantes,
      estudiantesCalificados,
      porcentajeCompletado,
      estudiantesPendientes: estudiantesPendientes.slice(0, 10) // Solo primeros 10 para no saturar
    }
  };

  return {
    ActividadesSuman100: actividadesSuman100,
    PuntajeActual: parseFloat(puntajeActual.toFixed(2)),
    TotalEstudiantes: totalEstudiantes,
    EstudiantesCalificados: estudiantesCalificados,
    PorcentajeCompletado: porcentajeCompletado,
    EstadoGeneral: estadoGeneral,
    DetallesPendientes: detallesPendientes
  };
};

/**
 * Recalcular estado de un curso de forma silenciosa (sin respuesta HTTP)
 */
exports.recalcularEstadoCursoSilencioso = async (IdUnidad, IdCurso, IdDocente) => {
  try {
    const estadoCurso = await this.calcularEstadoCurso(IdUnidad, IdCurso, IdDocente);

    await EstadoCursoUnidad.upsert({
      IdUnidad,
      IdCurso,
      IdDocente,
      ...estadoCurso,
      DetallesPendientes: JSON.stringify(estadoCurso.DetallesPendientes),
      UltimaActualizacion: new Date()
    });

    console.log(`✅ Estado recalculado: Unidad ${IdUnidad}, Curso ${IdCurso} → ${estadoCurso.EstadoGeneral}`);
    return estadoCurso;
  } catch (error) {
    console.error('❌ Error al recalcular estado silencioso:', error);
    throw error;
  }
};

/**
 * Actualizar estado de todos los cursos con un número de unidad específico
 * POST /api/cierre-unidades/actualizar-todos-por-numero/:numeroUnidad
 */
exports.actualizarTodosPorNumero = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { numeroUnidad } = req.params;

    // Obtener todas las unidades con ese número (Estado=1 significa activo, Cerrada=0 significa no cerrada)
    const unidades = await sequelize.query(`
      SELECT u.IdUnidad, ad.idCurso AS IdCurso, ad.idDocente AS IdDocente
      FROM unidades u
      INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.idAsignacionDocente
      WHERE u.NumeroUnidad = ? AND u.Estado = 1 AND u.Cerrada = 0
    `, {
      replacements: [numeroUnidad],
      type: QueryTypes.SELECT,
      transaction
    });

    // Eliminar estados existentes para estas unidades (evitar duplicados)
    const idsUnidades = unidades.map(u => u.IdUnidad);
    if (idsUnidades.length > 0) {
      await sequelize.query(`
        DELETE FROM estado_cursos_unidad WHERE IdUnidad IN (?)
      `, {
        replacements: [idsUnidades],
        type: QueryTypes.DELETE,
        transaction
      });
    }

    let procesados = 0;
    const errores = [];

    for (const unidad of unidades) {
      try {
        const estadoCurso = await this.calcularEstadoCurso(unidad.IdUnidad, unidad.IdCurso, unidad.IdDocente);

        await sequelize.query(`
          INSERT INTO estado_cursos_unidad
            (IdUnidad, IdCurso, IdDocente, ActividadesSuman100, PuntajeActual, TotalEstudiantes,
             EstudiantesCalificados, PorcentajeCompletado, EstadoGeneral, DetallesPendientes, UltimaActualizacion)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, {
          replacements: [
            unidad.IdUnidad,
            unidad.IdCurso,
            unidad.IdDocente,
            estadoCurso.ActividadesSuman100 ? 1 : 0,
            estadoCurso.PuntajeActual,
            estadoCurso.TotalEstudiantes,
            estadoCurso.EstudiantesCalificados,
            estadoCurso.PorcentajeCompletado,
            estadoCurso.EstadoGeneral,
            JSON.stringify(estadoCurso.DetallesPendientes)
          ],
          type: QueryTypes.INSERT,
          transaction
        });

        procesados++;
      } catch (error) {
        errores.push({ IdUnidad: unidad.IdUnidad, IdCurso: unidad.IdCurso, error: error.message });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      procesados,
      total: unidades.length,
      errores: errores.length > 0 ? errores : undefined,
      message: `${procesados} cursos actualizados`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al actualizar estados por número:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Cerrar cursos listos de todas las unidades con un número específico
 * POST /api/cierre-unidades/cerrar-cursos-listos-por-numero/:numeroUnidad
 */
exports.cerrarCursosListosPorNumero = async (req, res) => {
  console.log('\n🎯 INICIO cerrarCursosListosPorNumero - params:', req.params);
  console.log('👤 Usuario:', req.usuario?.IdUsuario, 'Rol:', req.usuario?.rol);

  const transaction = await sequelize.transaction();

  try {
    const { numeroUnidad } = req.params;
    const observaciones = req.body?.observaciones || null;

    // Validar permisos
    if (req.usuario.rol !== 1) {
      console.log('❌ ACCESO DENEGADO - Rol:', req.usuario.rol);
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden cerrar cursos'
      });
    }

    const numeroUnidadActual = parseInt(numeroUnidad);
    const numeroUnidadSiguiente = numeroUnidadActual + 1;

    console.log(`\n🔍 Procesando cierre parcial de Unidad ${numeroUnidadActual}...`);

    // Obtener todos los cursos LISTOS de todas las unidades con ese número
    const cursosListosQuery = `
      SELECT
        e.IdUnidad,
        e.IdCurso,
        e.IdDocente,
        c.Curso AS NombreCurso,
        g.NombreGrado,
        s.NombreSeccion,
        j.NombreJornada,
        d.NombreDocente,
        ad.idAsignacionDocente AS IdAsignacionDocente
      FROM estado_cursos_unidad e
      INNER JOIN unidades un ON e.IdUnidad = un.IdUnidad
      INNER JOIN asignacion_docente ad ON un.IdAsignacionDocente = ad.idAsignacionDocente
      INNER JOIN cursos c ON e.IdCurso = c.idCurso
      INNER JOIN grados g ON c.idGrado = g.IdGrado
      INNER JOIN secciones s ON ad.idSeccion = s.IdSeccion
      INNER JOIN jornadas j ON ad.idJornada = j.IdJornada
      INNER JOIN docentes d ON e.IdDocente = d.idDocente
      WHERE un.NumeroUnidad = ? AND e.EstadoGeneral = 'LISTO' AND un.Estado = 1 AND un.Cerrada = 0
    `;

    const cursosListos = await sequelize.query(cursosListosQuery, {
      replacements: [numeroUnidadActual],
      type: QueryTypes.SELECT,
      transaction
    });

    console.log(`✅ Cursos listos para cerrar: ${cursosListos.length}`);

    if (cursosListos.length === 0) {
      await transaction.rollback();
      return res.json({
        success: true,
        data: {
          NumeroUnidad: numeroUnidadActual,
          cursosCerrados: 0
        },
        message: 'No hay cursos listos para cerrar en esta unidad'
      });
    }

    const cursosActualizados = [];

    for (const curso of cursosListos) {
      const { IdCurso, IdDocente, IdAsignacionDocente, NombreCurso, NombreGrado, NombreSeccion, NombreJornada, NombreDocente } = curso;

      console.log(`\n  📝 Procesando: ${NombreCurso} - ${NombreGrado} ${NombreSeccion}`);

      // Cerrar la unidad actual para esta asignación
      const idUsuarioAdmin = req.usuario?.IdUsuario || req.usuario?.id || null;
      await sequelize.query(`
        UPDATE unidades
        SET Activa = 0, Cerrada = 1, FechaCierre = NOW(), CerradaPorAdmin = ?
        WHERE IdAsignacionDocente = ? AND NumeroUnidad = ?
      `, {
        replacements: [idUsuarioAdmin, IdAsignacionDocente, numeroUnidadActual],
        type: QueryTypes.UPDATE,
        transaction
      });

      console.log(`    ✅ Unidad ${numeroUnidadActual} cerrada`);

      // Si existe siguiente unidad, activarla
      if (numeroUnidadSiguiente <= 4) {
        const [unidadSiguiente] = await sequelize.query(`
          SELECT IdUnidad FROM unidades
          WHERE IdAsignacionDocente = ? AND NumeroUnidad = ?
        `, {
          replacements: [IdAsignacionDocente, numeroUnidadSiguiente],
          type: QueryTypes.SELECT,
          transaction
        });

        if (unidadSiguiente) {
          await sequelize.query(`
            UPDATE unidades SET Activa = 1 WHERE IdUnidad = ?
          `, {
            replacements: [unidadSiguiente.IdUnidad],
            type: QueryTypes.UPDATE,
            transaction
          });
          console.log(`    ✅ Unidad ${numeroUnidadSiguiente} activada`);
        }
      }

      // Marcar notificaciones de este curso como RESUELTAS
      await sequelize.query(`
        UPDATE notificaciones_docentes
        SET Estado = 'RESUELTA'
        WHERE IdCurso = ? AND IdDocente = ? AND IdUnidad = ? AND Estado = 'PENDIENTE'
      `, {
        replacements: [IdCurso, IdDocente, curso.IdUnidad],
        type: QueryTypes.UPDATE,
        transaction
      });

      // ========== CALCULAR Y GUARDAR NOTAS EN notas_unidad ==========
      console.log(`    📊 Calculando notas para estudiantes...`);

      // Obtener todos los estudiantes inscritos en este curso
      const estudiantes = await sequelize.query(`
        SELECT DISTINCT i.IdAlumno
        FROM inscripciones i
        INNER JOIN asignacion_docente ad ON
          i.IdGrado = ad.idGrado
          AND i.IdSeccion = ad.idSeccion
          AND i.IdJornada = ad.idJornada
          AND i.CicloEscolar = ad.Anio
        WHERE ad.idAsignacionDocente = ?
          AND i.Estado = 1
      `, {
        replacements: [IdAsignacionDocente],
        type: QueryTypes.SELECT,
        transaction
      });

      console.log(`    👥 Estudiantes encontrados: ${estudiantes.length}`);

      let notasCalculadas = 0;
      for (const estudiante of estudiantes) {
        // Obtener actividades de zona y final de esta unidad
        const actividades = await sequelize.query(`
          SELECT IdActividad, TipoActividad, PunteoMaximo
          FROM actividades
          WHERE IdUnidad = ? AND Estado = 1
        `, {
          replacements: [curso.IdUnidad],
          type: QueryTypes.SELECT,
          transaction
        });

        // Calcular nota de zona
        let notaZona = 0;
        let notaFinal = 0;

        for (const actividad of actividades) {
          const calificaciones = await sequelize.query(`
            SELECT Punteo FROM calificaciones
            WHERE IdActividad = ? AND IdAlumno = ?
          `, {
            replacements: [actividad.IdActividad, estudiante.IdAlumno],
            type: QueryTypes.SELECT,
            transaction
          });

          const calificacion = calificaciones[0]; // Tomar el primer resultado
          if (calificacion && calificacion.Punteo !== null) {
            const punteo = parseFloat(calificacion.Punteo) || 0;
            if (actividad.TipoActividad === 'zona') {
              notaZona += punteo;
            } else if (actividad.TipoActividad === 'final') {
              notaFinal += punteo;
            }
          }
        }

        const notaTotal = Math.round(notaZona + notaFinal);
        const aprobado = notaTotal >= 60;

        // Insertar o actualizar en notas_unidad
        await sequelize.query(`
          INSERT INTO notas_unidad (IdUnidad, IdAlumno, IdAsignacionDocente, NotaZona, NotaFinal, NotaTotal, Aprobado, FechaRegistro, RegistradoPor, Estado)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, 1)
          ON DUPLICATE KEY UPDATE
            NotaZona = VALUES(NotaZona),
            NotaFinal = VALUES(NotaFinal),
            NotaTotal = VALUES(NotaTotal),
            Aprobado = VALUES(Aprobado),
            RegistradoPor = VALUES(RegistradoPor)
        `, {
          replacements: [curso.IdUnidad, estudiante.IdAlumno, IdAsignacionDocente, notaZona, notaFinal, notaTotal, aprobado ? 1 : 0, idUsuarioAdmin],
          type: QueryTypes.INSERT,
          transaction
        });

        notasCalculadas++;
      }
      console.log(`    ✅ ${notasCalculadas} notas calculadas y guardadas`);
      // ========== FIN CÁLCULO DE NOTAS ==========

      cursosActualizados.push({
        IdCurso,
        NombreCurso,
        NombreGrado,
        NombreSeccion,
        NombreJornada,
        IdDocente,
        NombreDocente,
        UnidadCerrada: numeroUnidadActual,
        UnidadNuevaAbierta: numeroUnidadSiguiente <= 4 ? numeroUnidadSiguiente : null
      });
    }

    await transaction.commit();

    console.log(`\n✅ Cierre parcial completado: ${cursosActualizados.length} cursos cerrados`);

    return res.json({
      success: true,
      data: {
        NumeroUnidad: numeroUnidadActual,
        cursosCerrados: cursosActualizados.length,
        cursosActualizados,
        observaciones: observaciones || null
      },
      message: numeroUnidadSiguiente <= 4
        ? `${cursosActualizados.length} curso(s) cerrado(s) exitosamente. Unidad ${numeroUnidadSiguiente} abierta para esos cursos.`
        : `${cursosActualizados.length} curso(s) cerrado(s) exitosamente (última unidad).`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al cerrar cursos por número:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Validar estado de todos los cursos de una unidad
 * GET /api/cierre-unidades/validar/:idUnidad
 */
exports.validarEstadoUnidad = async (req, res) => {
  try {
    const { idUnidad } = req.params;

    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Obtener todos los cursos de esta unidad
    const [cursos] = await sequelize.query(`
      SELECT DISTINCT
        c.idCurso AS IdCurso,
        c.Curso AS NombreCurso,
        ad.idAsignacionDocente AS IdAsignacionDocente,
        d.idDocente AS IdDocente,
        d.NombreDocente,
        g.IdGrado,
        g.NombreGrado,
        s.IdSeccion,
        s.NombreSeccion,
        j.IdJornada,
        j.NombreJornada
      FROM unidades u
      INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.idAsignacionDocente
      INNER JOIN cursos c ON ad.idCurso = c.idCurso
      INNER JOIN docentes d ON ad.idDocente = d.idDocente
      INNER JOIN grados g ON ad.idGrado = g.IdGrado
      INNER JOIN secciones s ON ad.idSeccion = s.IdSeccion
      INNER JOIN jornadas j ON ad.idJornada = j.IdJornada
      WHERE u.IdUnidad = :idUnidad
        AND u.Estado = 1
    `, {
      replacements: { idUnidad }
    });

    if (cursos.length === 0) {
      return res.json({
        success: true,
        data: {
          unidad: {
            IdUnidad: unidad.IdUnidad,
            NumeroUnidad: unidad.NumeroUnidad,
            NombreUnidad: unidad.NombreUnidad,
            Cerrada: unidad.Cerrada,
            FechaLimiteCalificacion: unidad.FechaLimiteCalificacion
          },
          cursos: [],
          resumen: {
            totalCursos: 0,
            cursosListos: 0,
            cursosPendientes: 0,
            cursosIncompletos: 0,
            porcentajeCompletado: 0
          }
        }
      });
    }

    const estadosCursos = [];

    for (const curso of cursos) {
      const estadoCurso = await this.calcularEstadoCurso(idUnidad, curso.IdCurso, curso.IdDocente);
      estadosCursos.push({
        ...curso,
        ...estadoCurso
      });
    }

    const resumen = {
      totalCursos: estadosCursos.length,
      cursosListos: estadosCursos.filter(c => c.EstadoGeneral === 'LISTO').length,
      cursosPendientes: estadosCursos.filter(c => c.EstadoGeneral === 'PENDIENTE').length,
      cursosIncompletos: estadosCursos.filter(c => c.EstadoGeneral === 'INCOMPLETO').length,
      porcentajeCompletado: 0
    };

    if (resumen.totalCursos > 0) {
      resumen.porcentajeCompletado = Math.round(
        (resumen.cursosListos / resumen.totalCursos) * 100
      );
    }

    res.json({
      success: true,
      data: {
        unidad: {
          IdUnidad: unidad.IdUnidad,
          NumeroUnidad: unidad.NumeroUnidad,
          NombreUnidad: unidad.NombreUnidad,
          Cerrada: unidad.Cerrada,
          FechaLimiteCalificacion: unidad.FechaLimiteCalificacion,
          NotificacionesEnviadas: unidad.NotificacionesEnviadas
        },
        cursos: estadosCursos,
        resumen
      }
    });

  } catch (error) {
    console.error('❌ Error al validar estado de unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Actualizar estado de un curso específico
 * POST /api/cierre-unidades/actualizar-estado
 */
exports.actualizarEstadoCurso = async (req, res) => {
  try {
    const { IdUnidad, IdCurso, IdDocente } = req.body;

    if (!IdUnidad || !IdCurso || !IdDocente) {
      return res.status(400).json({
        success: false,
        error: 'IdUnidad, IdCurso e IdDocente son requeridos'
      });
    }

    const estadoCurso = await this.calcularEstadoCurso(IdUnidad, IdCurso, IdDocente);

    const [estado, created] = await EstadoCursoUnidad.findOrCreate({
      where: { IdUnidad, IdCurso },
      defaults: {
        IdDocente,
        ...estadoCurso,
        DetallesPendientes: JSON.stringify(estadoCurso.DetallesPendientes),
        UltimaActualizacion: new Date()
      }
    });

    if (!created) {
      await estado.update({
        ...estadoCurso,
        DetallesPendientes: JSON.stringify(estadoCurso.DetallesPendientes),
        UltimaActualizacion: new Date()
      });
    }

    res.json({
      success: true,
      data: estado,
      created,
      message: created
        ? 'Estado de curso creado exitosamente'
        : 'Estado de curso actualizado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al actualizar estado de curso:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Actualizar estado de todos los cursos de una unidad
 * POST /api/cierre-unidades/actualizar-todos/:idUnidad
 */
exports.actualizarTodosEstados = async (req, res) => {
  try {
    const { idUnidad } = req.params;

    const [cursos] = await sequelize.query(`
      SELECT DISTINCT
        c.idCurso AS IdCurso,
        d.idDocente AS IdDocente
      FROM unidades u
      INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.idAsignacionDocente
      INNER JOIN cursos c ON ad.idCurso = c.idCurso
      INNER JOIN docentes d ON ad.idDocente = d.idDocente
      WHERE u.IdUnidad = :idUnidad
        AND u.Estado = 1
    `, {
      replacements: { idUnidad }
    });

    let procesados = 0;
    let errores = [];

    for (const curso of cursos) {
      try {
        const estadoCurso = await this.calcularEstadoCurso(idUnidad, curso.IdCurso, curso.IdDocente);

        await EstadoCursoUnidad.upsert({
          IdUnidad: idUnidad,
          IdCurso: curso.IdCurso,
          IdDocente: curso.IdDocente,
          ...estadoCurso,
          DetallesPendientes: JSON.stringify(estadoCurso.DetallesPendientes),
          UltimaActualizacion: new Date()
        });

        procesados++;
      } catch (error) {
        errores.push({
          IdCurso: curso.IdCurso,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      procesados,
      total: cursos.length,
      errores: errores.length > 0 ? errores : undefined,
      message: `${procesados} cursos actualizados exitosamente`
    });

  } catch (error) {
    console.error('❌ Error al actualizar todos los estados:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Obtener estado actual de una unidad desde la tabla estado_cursos_unidad
 * GET /api/cierre-unidades/estado/:idUnidad
 */
exports.getEstadoUnidad = async (req, res) => {
  try {
    const { idUnidad } = req.params;

    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    const [estados] = await sequelize.query(`
      SELECT
        e.IdEstado,
        e.IdCurso,
        c.Curso AS NombreCurso,
        e.IdDocente,
        d.NombreDocente,
        e.ActividadesSuman100,
        e.PuntajeActual,
        e.TotalEstudiantes,
        e.EstudiantesCalificados,
        e.PorcentajeCompletado,
        e.EstadoGeneral,
        e.DetallesPendientes,
        e.UltimaActualizacion
      FROM estado_cursos_unidad e
      INNER JOIN cursos c ON e.IdCurso = c.idCurso
      INNER JOIN docentes d ON e.IdDocente = d.idDocente
      WHERE e.IdUnidad = :idUnidad
      ORDER BY e.EstadoGeneral, e.PorcentajeCompletado DESC
    `, {
      replacements: { idUnidad }
    });

    const estadosProcesados = estados.map(estado => ({
      ...estado,
      DetallesPendientes: estado.DetallesPendientes
        ? (typeof estado.DetallesPendientes === 'string' ? JSON.parse(estado.DetallesPendientes) : estado.DetallesPendientes)
        : null
    }));

    const resumen = {
      totalCursos: estadosProcesados.length,
      cursosListos: estadosProcesados.filter(e => e.EstadoGeneral === 'LISTO').length,
      cursosPendientes: estadosProcesados.filter(e => e.EstadoGeneral === 'PENDIENTE').length,
      cursosIncompletos: estadosProcesados.filter(e => e.EstadoGeneral === 'INCOMPLETO').length,
      porcentajeCompletado: 0
    };

    if (resumen.totalCursos > 0) {
      resumen.porcentajeCompletado = Math.round(
        (resumen.cursosListos / resumen.totalCursos) * 100
      );
    }

    res.json({
      success: true,
      data: {
        unidad: {
          IdUnidad: unidad.IdUnidad,
          NumeroUnidad: unidad.NumeroUnidad,
          NombreUnidad: unidad.NombreUnidad,
          Cerrada: unidad.Cerrada,
          FechaLimiteCalificacion: unidad.FechaLimiteCalificacion,
          NotificacionesEnviadas: unidad.NotificacionesEnviadas
        },
        cursos: estadosProcesados,
        resumen
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estado de unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Validar si una unidad puede cerrarse
 * POST /api/cierre-unidades/validar-cierre/:idUnidad
 */
exports.validarCierre = async (req, res) => {
  try {
    const { idUnidad } = req.params;

    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    const [estados] = await sequelize.query(`
      SELECT
        e.IdCurso,
        c.Curso AS NombreCurso,
        e.IdDocente,
        d.NombreDocente,
        e.ActividadesSuman100,
        e.PuntajeActual,
        e.TotalEstudiantes,
        e.EstudiantesCalificados,
        e.PorcentajeCompletado,
        e.EstadoGeneral,
        e.DetallesPendientes
      FROM estado_cursos_unidad e
      INNER JOIN cursos c ON e.IdCurso = c.idCurso
      INNER JOIN docentes d ON e.IdDocente = d.idDocente
      WHERE e.IdUnidad = :idUnidad
      ORDER BY e.EstadoGeneral DESC, e.PorcentajeCompletado ASC
    `, {
      replacements: { idUnidad }
    });

    const totalCursos = estados.length;
    const cursosListos = estados.filter(e => e.EstadoGeneral === 'LISTO').length;
    const puedeSerCerrada = totalCursos > 0 && cursosListos === totalCursos;

    res.json({
      success: puedeSerCerrada,
      puedeSerCerrada,
      data: {
        IdUnidad: unidad.IdUnidad,
        NumeroUnidad: unidad.NumeroUnidad,
        NombreUnidad: unidad.NombreUnidad,
        totalCursos,
        cursosListos,
        cursosPendientes: estados.filter(e => e.EstadoGeneral === 'PENDIENTE').length,
        cursosIncompletos: estados.filter(e => e.EstadoGeneral === 'INCOMPLETO').length
      },
      message: puedeSerCerrada
        ? 'La unidad está lista para cerrarse'
        : `No se puede cerrar. Hay ${totalCursos - cursosListos} cursos con pendientes`
    });

  } catch (error) {
    console.error('❌ Error al validar cierre:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Cerrar una unidad
 * POST /api/cierre-unidades/cerrar/:idUnidad
 */
exports.cerrarUnidad = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { idUnidad } = req.params;
    const idUsuario = req.usuario?.IdUsuario;
    const rolUsuario = req.usuario?.rol;

    if (rolUsuario !== 1) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden cerrar unidades'
      });
    }

    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    if (unidad.Cerrada) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'La unidad ya está cerrada'
      });
    }

    await unidad.update({
      Cerrada: true,
      Activa: false,
      FechaCierre: new Date(),
      CerradaPorAdmin: idUsuario
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      data: {
        IdUnidad: unidad.IdUnidad,
        NumeroUnidad: unidad.NumeroUnidad,
        NombreUnidad: unidad.NombreUnidad,
        Cerrada: true,
        FechaCierre: unidad.FechaCierre
      },
      message: `Unidad ${unidad.NumeroUnidad} cerrada exitosamente`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al cerrar unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Extender plazo de calificación
 * POST /api/cierre-unidades/extender-plazo/:idUnidad
 */
exports.extenderPlazo = async (req, res) => {
  try {
    const { idUnidad } = req.params;
    const { nuevaFechaLimite } = req.body;
    const rolUsuario = req.usuario?.rol;

    if (rolUsuario !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden extender plazos'
      });
    }

    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    if (!nuevaFechaLimite) {
      return res.status(400).json({
        success: false,
        error: 'La nueva fecha límite es requerida'
      });
    }

    await unidad.update({
      FechaLimiteCalificacion: new Date(nuevaFechaLimite)
    });

    res.json({
      success: true,
      data: {
        IdUnidad: unidad.IdUnidad,
        FechaLimiteNueva: nuevaFechaLimite
      },
      message: `Plazo extendido hasta el ${new Date(nuevaFechaLimite).toLocaleDateString('es-GT')}`
    });

  } catch (error) {
    console.error('❌ Error al extender plazo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Reabrir una unidad cerrada
 * POST /api/cierre-unidades/reabrir/:idUnidad
 */
exports.reabrirUnidad = async (req, res) => {
  try {
    const { idUnidad } = req.params;
    const { motivo, nuevaFechaLimite } = req.body;
    const rolUsuario = req.usuario?.rol;

    if (rolUsuario !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden reabrir unidades'
      });
    }

    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    if (!unidad.Cerrada) {
      return res.status(400).json({
        success: false,
        error: 'La unidad ya está abierta'
      });
    }

    if (!motivo) {
      return res.status(400).json({
        success: false,
        error: 'El motivo de reapertura es requerido'
      });
    }

    const updateData = {
      Cerrada: false,
      Activa: true
    };

    if (nuevaFechaLimite) {
      updateData.FechaLimiteCalificacion = new Date(nuevaFechaLimite);
    }

    await unidad.update(updateData);

    res.json({
      success: true,
      data: {
        IdUnidad: unidad.IdUnidad,
        NumeroUnidad: unidad.NumeroUnidad,
        Cerrada: false,
        Motivo: motivo
      },
      message: `Unidad ${unidad.NumeroUnidad} reabierta exitosamente`
    });

  } catch (error) {
    console.error('❌ Error al reabrir unidad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Cerrar solo cursos LISTOS de una unidad específica
 * POST /api/cierre-unidades/cerrar-cursos-listos/:idUnidad
 */
exports.cerrarCursosListos = async (req, res) => {
  // Redirigir a la versión por IdUnidad (implementación similar a cerrarCursosListosPorNumero)
  const transaction = await sequelize.transaction();

  try {
    const { idUnidad } = req.params;

    if (req.usuario.rol !== 1) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden cerrar cursos'
      });
    }

    const unidad = await Unidad.findByPk(idUnidad);
    if (!unidad) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Unidad no encontrada'
      });
    }

    // Similar lógica que cerrarCursosListosPorNumero pero para una unidad específica
    const cursosListos = await sequelize.query(`
      SELECT e.IdCurso, e.IdDocente
      FROM estado_cursos_unidad e
      WHERE e.IdUnidad = ? AND e.EstadoGeneral = 'LISTO'
    `, {
      replacements: [idUnidad],
      type: QueryTypes.SELECT,
      transaction
    });

    if (cursosListos.length === 0) {
      await transaction.rollback();
      return res.json({
        success: true,
        data: { cursosCerrados: 0 },
        message: 'No hay cursos listos para cerrar'
      });
    }

    // Cerrar la unidad
    await unidad.update({
      Activa: false,
      Cerrada: true,
      FechaCierre: new Date(),
      CerradaPorAdmin: req.usuario.IdUsuario
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      data: {
        IdUnidad: idUnidad,
        cursosCerrados: cursosListos.length
      },
      message: `${cursosListos.length} curso(s) cerrado(s) exitosamente`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al cerrar cursos listos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


module.exports = exports;
