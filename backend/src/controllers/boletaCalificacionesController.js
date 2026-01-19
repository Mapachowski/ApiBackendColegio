const sequelize = require('../config/database');
const Alumno = require('../models/Alumno');
const Inscripcion = require('../models/Inscripcion');
const NotaUnidad = require('../models/NotaUnidad');
const Unidad = require('../models/Unidad');
const AsignacionDocente = require('../models/AsignacionDocente');
const Curso = require('../models/Curso');
const Grado = require('../models/Grado');
const Seccion = require('../models/Seccion');
const Jornada = require('../models/Jornada');

/**
 * Obtener lista de estudiantes por filtros (Año, Grado, Sección, Jornada)
 * GET /api/boleta-calificaciones/estudiantes?cicloEscolar=2025&idGrado=1&idSeccion=1&idJornada=1
 */
exports.obtenerEstudiantes = async (req, res) => {
  try {
    const { cicloEscolar, idGrado, idSeccion, idJornada } = req.query;

    // Validar parámetros requeridos
    if (!cicloEscolar || !idGrado || !idSeccion || !idJornada) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren los parámetros: cicloEscolar, idGrado, idSeccion, idJornada'
      });
    }

    // Query para obtener estudiantes con inscripción activa
    const [estudiantes] = await sequelize.query(`
      SELECT
        a.IdAlumno,
        a.IdAlumno AS Codigo,
        a.Nombres,
        a.Apellidos,
        g.NombreGrado,
        s.NombreSeccion,
        j.NombreJornada
      FROM alumnos a
      INNER JOIN inscripciones i ON a.IdAlumno = i.IdAlumno
      INNER JOIN grados g ON i.IdGrado = g.IdGrado
      INNER JOIN secciones s ON i.IdSeccion = s.IdSeccion
      INNER JOIN jornadas j ON i.IdJornada = j.IdJornada
      WHERE i.CicloEscolar = :cicloEscolar
        AND i.IdGrado = :idGrado
        AND i.IdSeccion = :idSeccion
        AND i.IdJornada = :idJornada
        AND i.Estado = 1
        AND a.Estado = 1
      ORDER BY a.Apellidos, a.Nombres
    `, {
      replacements: { cicloEscolar, idGrado, idSeccion, idJornada }
    });

    res.json({
      success: true,
      data: estudiantes,
      total: estudiantes.length
    });

  } catch (error) {
    console.error('❌ Error al obtener estudiantes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Obtener calificaciones completas de un estudiante
 * GET /api/boleta-calificaciones/calificaciones/:idAlumno?cicloEscolar=2025&idGrado=1&idSeccion=1&idJornada=1
 */
exports.obtenerCalificaciones = async (req, res) => {
  try {
    const { idAlumno } = req.params;
    const { cicloEscolar, idGrado, idSeccion, idJornada } = req.query;

    // Validar parámetros
    if (!cicloEscolar || !idGrado || !idSeccion || !idJornada) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren los parámetros: cicloEscolar, idGrado, idSeccion, idJornada'
      });
    }

    // 1. Obtener información del estudiante
    const alumno = await Alumno.findByPk(idAlumno, {
      attributes: ['IdAlumno', 'Nombres', 'Apellidos'],
      include: [{
        model: Inscripcion,
        where: {
          CicloEscolar: cicloEscolar,
          IdGrado: idGrado,
          IdSeccion: idSeccion,
          IdJornada: idJornada,
          Estado: 1
        },
        include: [
          { model: Grado, attributes: ['NombreGrado'] },
          { model: Seccion, attributes: ['NombreSeccion'] },
          { model: Jornada, attributes: ['NombreJornada'] }
        ],
        required: true
      }]
    });

    if (!alumno) {
      return res.status(404).json({
        success: false,
        error: 'Estudiante no encontrado o no inscrito en los filtros especificados'
      });
    }

    // 2. Obtener TODOS los cursos asignados al estudiante (a través de asignacion_docente)
    const [cursosAsignados] = await sequelize.query(`
      SELECT DISTINCT
        c.idCurso,
        c.Curso AS NombreCurso,
        c.NoOrden,
        ad.idAsignacionDocente AS IdAsignacionDocente
      FROM asignacion_docente ad
      INNER JOIN cursos c ON ad.idCurso = c.idCurso
      WHERE ad.Anio = :cicloEscolar
        AND ad.idGrado = :idGrado
        AND ad.idSeccion = :idSeccion
        AND ad.idJornada = :idJornada
        AND ad.Estado = 1
      ORDER BY c.NoOrden, c.Curso
    `, {
      replacements: { cicloEscolar, idGrado, idSeccion, idJornada }
    });

    // 3. Obtener las notas existentes del estudiante
    const [notasRaw] = await sequelize.query(`
      SELECT
        c.idCurso,
        u.NumeroUnidad,
        nu.NotaTotal
      FROM notas_unidad nu
      INNER JOIN unidades u ON nu.IdUnidad = u.IdUnidad
      INNER JOIN asignacion_docente ad ON nu.IdAsignacionDocente = ad.idAsignacionDocente
      INNER JOIN cursos c ON ad.idCurso = c.idCurso
      WHERE nu.IdAlumno = :idAlumno
        AND ad.Anio = :cicloEscolar
        AND ad.idGrado = :idGrado
        AND ad.idSeccion = :idSeccion
        AND ad.idJornada = :idJornada
        AND nu.Estado = 1
      ORDER BY c.NoOrden, u.NumeroUnidad
    `, {
      replacements: { idAlumno, cicloEscolar, idGrado, idSeccion, idJornada }
    });

    // 4. Crear mapa de notas por curso y unidad
    const notasMap = {};
    notasRaw.forEach(nota => {
      if (!notasMap[nota.idCurso]) {
        notasMap[nota.idCurso] = {};
      }
      notasMap[nota.idCurso][nota.NumeroUnidad] = Math.round(parseFloat(nota.NotaTotal));
    });

    // 5. Determinar cuál es la última unidad cerrada (para mostrar promedio)
    const [ultimaUnidadCerrada] = await sequelize.query(`
      SELECT MAX(u.NumeroUnidad) AS UltimaUnidad
      FROM unidades u
      INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.idAsignacionDocente
      WHERE ad.Anio = :cicloEscolar
        AND ad.idGrado = :idGrado
        AND ad.idSeccion = :idSeccion
        AND ad.idJornada = :idJornada
        AND u.Cerrada = 1
    `, {
      replacements: { cicloEscolar, idGrado, idSeccion, idJornada }
    });
    const ultimaUnidadNum = ultimaUnidadCerrada[0]?.UltimaUnidad || 0;

    // 6. Construir la estructura de cursos con todas las unidades
    const cursos = cursosAsignados.map(cursoAsignado => {
      const unidadesCompletas = [];
      let sumaNotas = 0;
      let unidadesConNota = 0;

      for (let numUnidad = 1; numUnidad <= 4; numUnidad++) {
        const notaCurso = notasMap[cursoAsignado.idCurso];
        const tieneNota = notaCurso && notaCurso[numUnidad] !== undefined;

        if (tieneNota) {
          unidadesCompletas.push({
            NumeroUnidad: numUnidad,
            NotaFinal: notaCurso[numUnidad]
          });
          sumaNotas += notaCurso[numUnidad];
          unidadesConNota++;
        } else {
          // Unidad sin calificación - mostrar null para que el frontend muestre guión
          unidadesCompletas.push({
            NumeroUnidad: numUnidad,
            NotaFinal: null
          });
        }
      }

      // Calcular promedio dividiendo SIEMPRE entre 4 (las 4 unidades del año)
      // Ejemplo: Si tiene 100 en U1, promedio = 100/4 = 25
      // Si tiene 100 en U1 y 80 en U2, promedio = 180/4 = 45
      let promedio = null;
      if (unidadesConNota > 0) {
        promedio = Math.round(sumaNotas / 4);
      }

      return {
        idCurso: cursoAsignado.idCurso,
        NombreCurso: cursoAsignado.NombreCurso,
        NoOrden: cursoAsignado.NoOrden,
        unidades: unidadesCompletas,
        promedio
      };
    });

    // 7. Calcular promedio general SOLO si estamos en la 4ta unidad
    let promedioGeneral = null;
    if (ultimaUnidadNum === 4) {
      const promediosCursos = cursos.filter(c => c.promedio !== null).map(c => c.promedio);
      if (promediosCursos.length > 0) {
        promedioGeneral = Math.round(promediosCursos.reduce((sum, p) => sum + p, 0) / promediosCursos.length);
      }
    }

    // 6. Formatear respuesta
    const inscripcion = alumno.Inscripciones[0];

    res.json({
      success: true,
      data: {
        estudiante: {
          IdAlumno: alumno.IdAlumno,
          Nombres: alumno.Nombres,
          Apellidos: alumno.Apellidos,
          Codigo: alumno.IdAlumno,
          NombreGrado: inscripcion.Grado.NombreGrado,
          NombreSeccion: inscripcion.Seccione.NombreSeccion,
          NombreJornada: inscripcion.Jornada.NombreJornada,
          CicloEscolar: cicloEscolar
        },
        cursos,
        promedioGeneral
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener calificaciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Obtener calificaciones de múltiples estudiantes en un solo request
 * POST /api/boleta-calificaciones/lote
 * Body: { cicloEscolar, idGrado, idSeccion, idJornada, estudiantes: [1,2,3] }
 */
exports.obtenerCalificacionesLote = async (req, res) => {
  try {
    const { cicloEscolar, idGrado, idSeccion, idJornada, estudiantes } = req.body;

    console.log('🔍 [BOLETAS LOTE] Iniciando procesamiento');
    console.log('📊 Parámetros:', { cicloEscolar, idGrado, idSeccion, idJornada });
    console.log('👥 Total estudiantes solicitados:', estudiantes?.length);

    // Validar parámetros
    if (!cicloEscolar || !idGrado || !idSeccion || !idJornada || !estudiantes) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren: cicloEscolar, idGrado, idSeccion, idJornada, estudiantes (array de IDs)'
      });
    }

    if (!Array.isArray(estudiantes) || estudiantes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El campo estudiantes debe ser un array con al menos un ID'
      });
    }

    // Obtener calificaciones de todos los estudiantes
    const resultados = [];
    let procesados = 0;
    let errores = 0;

    for (const idAlumno of estudiantes) {
      try {
        console.log(`\n🎯 Procesando alumno ID: ${idAlumno}`);

        // Reutilizar la lógica del endpoint individual
        // 1. Obtener información del estudiante
        const alumno = await Alumno.findByPk(idAlumno, {
          attributes: ['IdAlumno', 'Nombres', 'Apellidos'],
          include: [{
            model: Inscripcion,
            where: {
              CicloEscolar: cicloEscolar,
              IdGrado: idGrado,
              IdSeccion: idSeccion,
              IdJornada: idJornada,
              Estado: 1
            },
            include: [
              { model: Grado, attributes: ['NombreGrado'] },
              { model: Seccion, attributes: ['NombreSeccion'] },
              { model: Jornada, attributes: ['NombreJornada'] }
            ],
            required: true
          }]
        });

        if (!alumno) {
          console.log(`⚠️ Alumno ${idAlumno} no encontrado o sin inscripción activa`);
          errores++;
          continue; // Saltar estudiantes no encontrados
        }

        console.log(`✅ Alumno encontrado: ${alumno.Nombres} ${alumno.Apellidos}`);

        // 2. Obtener TODOS los cursos asignados
        const [cursosAsignados] = await sequelize.query(`
          SELECT DISTINCT
            c.idCurso,
            c.Curso AS NombreCurso,
            c.NoOrden
          FROM asignacion_docente ad
          INNER JOIN cursos c ON ad.idCurso = c.idCurso
          WHERE ad.Anio = :cicloEscolar
            AND ad.idGrado = :idGrado
            AND ad.idSeccion = :idSeccion
            AND ad.idJornada = :idJornada
            AND ad.Estado = 1
          ORDER BY c.NoOrden, c.Curso
        `, {
          replacements: { cicloEscolar, idGrado, idSeccion, idJornada }
        });

        // 3. Obtener las notas existentes del estudiante
        const [notasRaw] = await sequelize.query(`
          SELECT
            c.idCurso,
            u.NumeroUnidad,
            nu.NotaTotal
          FROM notas_unidad nu
          INNER JOIN unidades u ON nu.IdUnidad = u.IdUnidad
          INNER JOIN asignacion_docente ad ON nu.IdAsignacionDocente = ad.idAsignacionDocente
          INNER JOIN cursos c ON ad.idCurso = c.idCurso
          WHERE nu.IdAlumno = :idAlumno
            AND ad.Anio = :cicloEscolar
            AND ad.idGrado = :idGrado
            AND ad.idSeccion = :idSeccion
            AND ad.idJornada = :idJornada
            AND nu.Estado = 1
          ORDER BY c.NoOrden, u.NumeroUnidad
        `, {
          replacements: { idAlumno, cicloEscolar, idGrado, idSeccion, idJornada }
        });

        console.log(`📝 Cursos asignados: ${cursosAsignados.length}, Notas encontradas: ${notasRaw.length}`);

        // 4. Crear mapa de notas por curso y unidad
        const notasMap = {};
        notasRaw.forEach(nota => {
          if (!notasMap[nota.idCurso]) {
            notasMap[nota.idCurso] = {};
          }
          notasMap[nota.idCurso][nota.NumeroUnidad] = Math.round(parseFloat(nota.NotaTotal));
        });

        // 5. Determinar última unidad cerrada
        const [ultimaUnidadCerrada] = await sequelize.query(`
          SELECT MAX(u.NumeroUnidad) AS UltimaUnidad
          FROM unidades u
          INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.idAsignacionDocente
          WHERE ad.Anio = :cicloEscolar
            AND ad.idGrado = :idGrado
            AND ad.idSeccion = :idSeccion
            AND ad.idJornada = :idJornada
            AND u.Cerrada = 1
        `, {
          replacements: { cicloEscolar, idGrado, idSeccion, idJornada }
        });
        const ultimaUnidadNum = ultimaUnidadCerrada[0]?.UltimaUnidad || 0;

        // 6. Construir la estructura de cursos con todas las unidades
        const cursos = cursosAsignados.map(cursoAsignado => {
          const unidadesCompletas = [];
          let sumaNotas = 0;
          let unidadesConNota = 0;

          for (let numUnidad = 1; numUnidad <= 4; numUnidad++) {
            const notaCurso = notasMap[cursoAsignado.idCurso];
            const tieneNota = notaCurso && notaCurso[numUnidad] !== undefined;

            if (tieneNota) {
              unidadesCompletas.push({
                NumeroUnidad: numUnidad,
                NotaFinal: notaCurso[numUnidad]
              });
              sumaNotas += notaCurso[numUnidad];
              unidadesConNota++;
            } else {
              unidadesCompletas.push({
                NumeroUnidad: numUnidad,
                NotaFinal: null
              });
            }
          }

          // Calcular promedio dividiendo SIEMPRE entre 4 (las 4 unidades del año)
          let promedio = null;
          if (unidadesConNota > 0) {
            promedio = Math.round(sumaNotas / 4);
          }

          return {
            idCurso: cursoAsignado.idCurso,
            NombreCurso: cursoAsignado.NombreCurso,
            NoOrden: cursoAsignado.NoOrden,
            unidades: unidadesCompletas,
            promedio
          };
        });

        console.log(`📚 Cursos procesados: ${cursos.length}`);

        // 7. Promedio general SOLO si estamos en la 4ta unidad
        let promedioGeneral = null;
        if (ultimaUnidadNum === 4) {
          const promediosCursos = cursos.filter(c => c.promedio !== null).map(c => c.promedio);
          if (promediosCursos.length > 0) {
            promedioGeneral = Math.round(promediosCursos.reduce((sum, p) => sum + p, 0) / promediosCursos.length);
          }
        }

        const inscripcion = alumno.Inscripciones[0];

        resultados.push({
          estudiante: {
            IdAlumno: alumno.IdAlumno,
            Nombres: alumno.Nombres,
            Apellidos: alumno.Apellidos,
            Codigo: alumno.IdAlumno,
            NombreGrado: inscripcion.Grado.NombreGrado,
            NombreSeccion: inscripcion.Seccione.NombreSeccion,
            NombreJornada: inscripcion.Jornada.NombreJornada,
            CicloEscolar: cicloEscolar
          },
          cursos,
          promedioGeneral
        });

        procesados++;
        console.log(`✅ Boleta agregada exitosamente (${procesados}/${estudiantes.length})`);

      } catch (error) {
        console.error(`❌ Error al procesar estudiante ${idAlumno}:`, error.message);
        console.error('Stack:', error.stack);
        errores++;
        // Continuar con el siguiente estudiante
      }
    }

    console.log('\n📊 [RESUMEN FINAL]');
    console.log(`   Total solicitados: ${estudiantes.length}`);
    console.log(`   ✅ Procesados exitosamente: ${procesados}`);
    console.log(`   ❌ Con errores/sin datos: ${errores}`);
    console.log(`   📦 Boletas en respuesta: ${resultados.length}`);

    res.json({
      success: true,
      data: resultados,
      total: resultados.length,
      solicitados: estudiantes.length,
      procesados,
      errores
    });

  } catch (error) {
    console.error('❌ Error al obtener calificaciones en lote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
