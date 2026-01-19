const Inscripcion = require('../models/Inscripcion');
const Alumno = require('../models/Alumno');
const Seccion = require('../models/Seccion');
const Jornada = require('../models/Jornada');
const Grado = require('../models/Grado');
const sequelize = require('../config/database');

// Obtener todas las inscripciones
exports.getAll = async (req, res) => {
  try {
    const inscripciones = await Inscripcion.findAll({
      where: { Estado: true },
      include: [
        { model: Alumno, attributes: ['IdAlumno', 'Nombres', 'Apellidos'], required: false },
        { model: Seccion, attributes: ['IdSeccion', 'NombreSeccion'], required: false },
        { model: Jornada, attributes: ['IdJornada', 'NombreJornada'], required: false },
        { model: Grado, attributes: ['IdGrado', 'NombreGrado'], required: false },
      ],
    });
    res.json({ success: true, data: inscripciones });
  } catch (error) {
    console.error('Error en getAll:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener una inscripción por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const inscripcion = await Inscripcion.findByPk(id, {
      include: [
        { model: Alumno, attributes: ['IdAlumno', 'Nombres', 'Apellidos'], required: false },
        { model: Seccion, attributes: ['IdSeccion', 'NombreSeccion'], required: false },
        { model: Jornada, attributes: ['IdJornada', 'NombreJornada'], required: false },
        { model: Grado, attributes: ['IdGrado', 'NombreGrado'], required: false },
      ],
    });
    if (!inscripcion) {
      return res.status(404).json({ success: false, error: 'Inscripción no encontrada' });
    }
    res.json({ success: true, data: inscripcion });
  } catch (error) {
    console.error('Error en getById:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener inscripciones por filtros usando stored procedure (con ciclo escolar)
exports.getByFilters = async (req, res) => {
  try {
    const { p_CicloEscolar, IdGrado, IdSeccion, IdJornada } = req.query;

    // Validación obligatoria del ciclo escolar
    if (!p_CicloEscolar) {
      return res.status(400).json({ 
        success: false, 
        error: 'El parámetro p_CicloEscolar es obligatorio' 
      });
    }

    if (typeof p_CicloEscolar !== 'string' || p_CicloEscolar.length !== 4 || !/^\d{4}$/.test(p_CicloEscolar)) {
      return res.status(400).json({ 
        success: false, 
        error: 'p_CicloEscolar debe ser un año de 4 dígitos (ej. 2026)' 
      });
    }

    // Parámetros opcionales numéricos (como antes)
    const gradoId = IdGrado ? parseInt(IdGrado, 10) : null;
    const seccionId = IdSeccion ? parseInt(IdSeccion, 10) : null;
    const jornadaId = IdJornada ? parseInt(IdJornada, 10) : null;

    if (IdGrado && isNaN(gradoId)) {
      return res.status(400).json({ success: false, error: 'IdGrado debe ser un número' });
    }
    if (IdSeccion && isNaN(seccionId)) {
      return res.status(400).json({ success: false, error: 'IdSeccion debe ser un número' });
    }
    if (IdJornada && isNaN(jornadaId)) {
      return res.status(400).json({ success: false, error: 'IdJornada debe ser un número' });
    }

    // ✅ SEGURO: Usar replacements para prevenir SQL injection
    const results = await sequelize.query(
      'CALL sp_ListadoAlumnosPorInscripcion(:ciclo, :grado, :seccion, :jornada)',
      {
        replacements: {
          ciclo: p_CicloEscolar,
          grado: gradoId,
          seccion: seccionId,
          jornada: jornadaId
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const inscripciones = results;

    if (!inscripciones || inscripciones.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No se encontraron inscripciones con los filtros proporcionados' 
      });
    }

    res.json({ success: true, data: inscripciones });

  } catch (error) {
    console.error('Error en getByFilters:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener inscripción por IdAlumno y CicloEscolar usando stored procedure
exports.getByAlumnoAndCiclo = async (req, res) => {
  try {
    const { IdAlumno, CicloEscolar } = req.query;

    // Validar parámetros
    const alumnoId = IdAlumno ? parseInt(IdAlumno, 10) : null;
    if (!IdAlumno || isNaN(alumnoId)) {
      return res.status(400).json({ success: false, error: 'IdAlumno es requerido y debe ser un número' });
    }
    if (!CicloEscolar || !/^\d{4}$/.test(CicloEscolar)) {
      return res.status(400).json({ success: false, error: 'CicloEscolar es requerido y debe ser un año en formato YYYY' });
    }

    // ✅ SEGURO: Usar replacements para prevenir SQL injection
    const results = await sequelize.query(
      'CALL sp_BuscarAlumnoPorIdEnInscripcion(:alumnoId, :ciclo)',
      {
        replacements: {
          alumnoId: alumnoId,
          ciclo: CicloEscolar
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const inscripciones = results;

    if (!inscripciones || inscripciones.length === 0) {
      return res.status(404).json({ success: false, error: 'No se encontró la inscripción para el alumno y ciclo escolar proporcionados' });
    }

    res.json({ success: true, data: inscripciones });
  } catch (error) {
    console.error('Error en getByAlumnoAndCiclo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.yaInscrito = async (req, res) => {
  try {
    console.log('Query recibidos:', req.query);
    const { idAlumno, ciclo } = req.query;

    const id = parseInt(idAlumno, 10);
    const cicloEscolar = parseInt(ciclo, 10);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'IdAlumno debe ser número' });
    }
    if (isNaN(cicloEscolar) || cicloEscolar < 2000 || cicloEscolar > 2100) {
      return res.status(400).json({ success: false, error: 'CicloEscolar debe ser un año válido' });
    }

    // Paso 1: Llamar SP con :param
    await sequelize.query(
      'CALL SP_AlumnoYaInscrito(:idAlumno, :ciclo, @yaInscrito, @idInscripcion)',
      {
        replacements: { idAlumno: id, ciclo: cicloEscolar },
        type: sequelize.QueryTypes.RAW
      }
    );

    // Paso 2: Leer variables OUT
    const [[result]] = await sequelize.query(
      'SELECT @yaInscrito AS yaInscrito, @idInscripcion AS idInscripcion'
    );

    res.json({
      success: true,
      yaInscrito: Boolean(result.yaInscrito),
      idInscripcion: result.idInscripcion || null,
    });
  } catch (error) {
    console.error('Error en yaInscrito:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// Crear una nueva inscripción
exports.create = async (req, res) => {
  try {
    const { IdColaborador, IdAlumno, IdSeccion, IdJornada, IdGrado, CicloEscolar, FechaInscripcion } = req.body;

    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    if (!IdAlumno || isNaN(IdAlumno)) {
      return res.status(400).json({ success: false, error: 'IdAlumno es requerido y debe ser un número' });
    }
    if (!IdSeccion || isNaN(IdSeccion)) {
      return res.status(400).json({ success: false, error: 'IdSeccion es requerido y debe ser un número' });
    }
    if (!IdJornada || isNaN(IdJornada)) {
      return res.status(400).json({ success: false, error: 'IdJornada es requerido y debe ser un número' });
    }
    if (!IdGrado || isNaN(IdGrado)) {
      return res.status(400).json({ success: false, error: 'IdGrado es requerido y debe ser un número' });
    }
    if (!CicloEscolar) {
      return res.status(400).json({ success: false, error: 'CicloEscolar es requerido' });
    }
    if (!FechaInscripcion) {
      return res.status(400).json({ success: false, error: 'FechaInscripcion es requerida' });
    }

    const nuevaInscripcion = await Inscripcion.create({
      IdAlumno,
      IdSeccion,
      IdJornada,
      IdGrado,
      CicloEscolar,
      FechaInscripcion,
      Estado: true,
      ComentarioEstado: req.body.ComentarioEstado || null,
      CreadoPor: IdColaborador,
      FechaCreado: new Date(),
    });

    res.status(201).json({ success: true, data: nuevaInscripcion });
  } catch (error) {
    console.error('Error en create:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Actualizar una inscripción
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador, IdAlumno, IdSeccion, IdJornada, IdGrado, CicloEscolar, FechaInscripcion, Estado, ComentarioEstado } = req.body;

    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }

    const inscripcion = await Inscripcion.findByPk(id);
    if (!inscripcion) {
      return res.status(404).json({ success: false, error: 'Inscripción no encontrada' });
    }

    await inscripcion.update({
      IdAlumno: IdAlumno || inscripcion.IdAlumno,
      IdSeccion: IdSeccion || inscripcion.IdSeccion,
      IdJornada: IdJornada || inscripcion.IdJornada,
      IdGrado: IdGrado || inscripcion.IdGrado,
      CicloEscolar: CicloEscolar || inscripcion.CicloEscolar,
      FechaInscripcion: FechaInscripcion || inscripcion.FechaInscripcion,
      Estado: Estado !== undefined ? Estado : inscripcion.Estado,
      ComentarioEstado: ComentarioEstado !== undefined ? ComentarioEstado : inscripcion.ComentarioEstado,
      ModificadoPor: IdColaborador,
      FechaModificado: new Date(),
    });

    res.json({ success: true, data: inscripcion });
  } catch (error) {
    console.error('Error en update:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// "Eliminar" una inscripción (cambiar Estado a false)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador } = req.body;

    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }

    const inscripcion = await Inscripcion.findByPk(id);
    if (!inscripcion) {
      return res.status(404).json({ success: false, error: 'Inscripción no encontrada' });
    }

    await inscripcion.update({
      Estado: false,
      ModificadoPor: IdColaborador,
      FechaModificado: new Date(),
    });

    res.json({ success: true, message: 'Inscripción marcada como inactiva' });
  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Cambiar sección y/o jornada de un alumno
 * NO permite cambio de grado (ese es un proceso diferente al inicio de año)
 *
 * Lógica:
 * - Elimina SOLO las calificaciones de la unidad actual del grupo ANTERIOR
 * - Crea calificaciones para TODAS las unidades (1-4) del grupo NUEVO
 *
 * POST /api/inscripciones/cambiar-grupo
 */
exports.cambiarGrupo = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      IdInscripcion,
      IdSeccionNueva,
      IdJornadaNueva,
      IdColaborador,
      Motivo,
      NumeroUnidadActual  // Unidad actual que se está cursando (1, 2, 3 o 4)
    } = req.body;

    // ==========================================
    // VALIDACIONES
    // ==========================================

    if (!IdInscripcion || isNaN(IdInscripcion)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'IdInscripcion es requerido y debe ser un número'
      });
    }

    if (!IdColaborador || isNaN(IdColaborador)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'IdColaborador es requerido y debe ser un número'
      });
    }

    // Al menos uno de los dos debe cambiar (sección o jornada)
    if (!IdSeccionNueva && !IdJornadaNueva) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar al menos uno: IdSeccionNueva o IdJornadaNueva'
      });
    }

    // Validar NumeroUnidadActual (requerido)
    if (!NumeroUnidadActual || isNaN(NumeroUnidadActual)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'NumeroUnidadActual es requerido (1, 2, 3 o 4)'
      });
    }

    const unidadActual = parseInt(NumeroUnidadActual);
    if (unidadActual < 1 || unidadActual > 4) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'NumeroUnidadActual debe ser un número entre 1 y 4'
      });
    }

    // ==========================================
    // 1. OBTENER INSCRIPCIÓN ACTUAL
    // ==========================================

    const inscripcion = await Inscripcion.findByPk(IdInscripcion, { transaction });
    if (!inscripcion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Inscripción no encontrada'
      });
    }

    // Guardar datos anteriores
    const datosAnteriores = {
      IdGrado: inscripcion.IdGrado,
      IdSeccion: inscripcion.IdSeccion,
      IdJornada: inscripcion.IdJornada
    };

    // Determinar nuevos valores (usar actuales si no se envían)
    // El grado SIEMPRE se mantiene igual
    const datosNuevos = {
      IdGrado: inscripcion.IdGrado,  // Grado no cambia
      IdSeccion: IdSeccionNueva || inscripcion.IdSeccion,
      IdJornada: IdJornadaNueva || inscripcion.IdJornada
    };

    // Verificar que realmente haya un cambio
    if (datosAnteriores.IdSeccion === datosNuevos.IdSeccion &&
        datosAnteriores.IdJornada === datosNuevos.IdJornada) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Los datos nuevos son iguales a los actuales. No hay cambios que realizar.'
      });
    }

    const IdAlumno = inscripcion.IdAlumno;
    const CicloEscolar = inscripcion.CicloEscolar;

    // ==========================================
    // 2. OBTENER NOMBRES PARA EL RESPONSE
    // ==========================================

    const [nombresAnteriores] = await sequelize.query(`
      SELECT
        g.NombreGrado,
        s.NombreSeccion,
        j.NombreJornada
      FROM grados g, secciones s, jornadas j
      WHERE g.IdGrado = :IdGrado
        AND s.IdSeccion = :IdSeccion
        AND j.IdJornada = :IdJornada
    `, {
      replacements: datosAnteriores,
      transaction
    });

    const [nombresNuevos] = await sequelize.query(`
      SELECT
        g.NombreGrado,
        s.NombreSeccion,
        j.NombreJornada
      FROM grados g, secciones s, jornadas j
      WHERE g.IdGrado = :IdGrado
        AND s.IdSeccion = :IdSeccion
        AND j.IdJornada = :IdJornada
    `, {
      replacements: datosNuevos,
      transaction
    });

    // ==========================================
    // 3. OBTENER ACTIVIDADES DEL GRUPO ANTERIOR
    //    SOLO de la unidad actual (la que se está cursando)
    // ==========================================

    const [actividadesAnteriores] = await sequelize.query(`
      SELECT DISTINCT a.IdActividad, u.NumeroUnidad
      FROM asignacion_docente ad
      INNER JOIN unidades u ON ad.IdAsignacionDocente = u.IdAsignacionDocente
      INNER JOIN actividades a ON u.IdUnidad = a.IdUnidad
      WHERE ad.IdGrado = :IdGrado
        AND ad.IdSeccion = :IdSeccion
        AND ad.IdJornada = :IdJornada
        AND ad.Anio = :CicloEscolar
        AND ad.Estado = 1
        AND u.Estado = 1
        AND a.Estado = 1
        AND u.NumeroUnidad = :UnidadActual
    `, {
      replacements: { ...datosAnteriores, CicloEscolar, UnidadActual: unidadActual },
      transaction
    });

    const idsActividadesAnteriores = actividadesAnteriores.map(a => a.IdActividad);

    // ==========================================
    // 4. ACTUALIZAR INSCRIPCIÓN
    // ==========================================

    await inscripcion.update({
      IdSeccion: datosNuevos.IdSeccion,
      IdJornada: datosNuevos.IdJornada,
      ModificadoPor: IdColaborador,
      FechaModificado: new Date()
    }, { transaction });

    // ==========================================
    // 5. OBTENER ACTIVIDADES DEL NUEVO GRUPO
    //    TODAS las unidades (1-4)
    // ==========================================

    const [actividadesNuevas] = await sequelize.query(`
      SELECT DISTINCT
        a.IdActividad,
        c.IdCurso,
        c.Curso AS NombreCurso,
        u.NumeroUnidad
      FROM asignacion_docente ad
      INNER JOIN cursos c ON ad.IdCurso = c.IdCurso
      INNER JOIN unidades u ON ad.IdAsignacionDocente = u.IdAsignacionDocente
      INNER JOIN actividades a ON u.IdUnidad = a.IdUnidad
      WHERE ad.IdGrado = :IdGrado
        AND ad.IdSeccion = :IdSeccion
        AND ad.IdJornada = :IdJornada
        AND ad.Anio = :CicloEscolar
        AND ad.Estado = 1
        AND u.Estado = 1
        AND a.Estado = 1
    `, {
      replacements: { ...datosNuevos, CicloEscolar },
      transaction
    });

    // ==========================================
    // 6. CREAR CALIFICACIONES PARA NUEVAS ACTIVIDADES
    //    (todas las unidades del nuevo grupo)
    // ==========================================

    let calificacionesCreadas = 0;
    const detallesPorCursoCreadas = {};
    const detallesPorUnidadCreadas = {};

    for (const actividad of actividadesNuevas) {
      // Verificar si ya existe calificación para evitar duplicados
      const [existente] = await sequelize.query(`
        SELECT IdCalificacion FROM calificaciones
        WHERE IdActividad = :idActividad AND IdAlumno = :idAlumno
      `, {
        replacements: { idActividad: actividad.IdActividad, idAlumno: IdAlumno },
        transaction
      });

      if (existente.length === 0) {
        // Crear calificación vacía
        await sequelize.query(`
          INSERT INTO calificaciones (IdActividad, IdAlumno, Punteo, Observaciones, CreadoPor, FechaCreado)
          VALUES (:idActividad, :idAlumno, NULL, 'Creado por cambio de sección/jornada', :creadoPor, NOW())
        `, {
          replacements: {
            idActividad: actividad.IdActividad,
            idAlumno: IdAlumno,
            creadoPor: IdColaborador
          },
          transaction
        });

        calificacionesCreadas++;

        // Agrupar por curso para el detalle
        if (!detallesPorCursoCreadas[actividad.IdCurso]) {
          detallesPorCursoCreadas[actividad.IdCurso] = {
            IdCurso: actividad.IdCurso,
            NombreCurso: actividad.NombreCurso,
            cantidad: 0
          };
        }
        detallesPorCursoCreadas[actividad.IdCurso].cantidad++;

        // Agrupar por unidad
        if (!detallesPorUnidadCreadas[actividad.NumeroUnidad]) {
          detallesPorUnidadCreadas[actividad.NumeroUnidad] = 0;
        }
        detallesPorUnidadCreadas[actividad.NumeroUnidad]++;
      }
    }

    // ==========================================
    // 7. ELIMINAR CALIFICACIONES DEL GRUPO ANTERIOR
    //    (solo de la unidad actual)
    // ==========================================

    let calificacionesEliminadas = 0;
    let detalleEliminadas = [];

    if (idsActividadesAnteriores.length > 0) {
      // Obtener detalle antes de eliminar
      const [detalleEliminacion] = await sequelize.query(`
        SELECT
          c.IdCurso,
          cur.Curso AS NombreCurso,
          COUNT(*) AS cantidad
        FROM calificaciones cal
        INNER JOIN actividades a ON cal.IdActividad = a.IdActividad
        INNER JOIN unidades u ON a.IdUnidad = u.IdUnidad
        INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.IdAsignacionDocente
        INNER JOIN cursos c ON ad.IdCurso = c.IdCurso
        INNER JOIN cursos cur ON c.IdCurso = cur.IdCurso
        WHERE cal.IdAlumno = :idAlumno
          AND cal.IdActividad IN (:idsActividades)
        GROUP BY c.IdCurso, cur.Curso
      `, {
        replacements: {
          idAlumno: IdAlumno,
          idsActividades: idsActividadesAnteriores
        },
        transaction
      });

      detalleEliminadas = detalleEliminacion;

      // Eliminar calificaciones
      const [resultadoEliminacion] = await sequelize.query(`
        DELETE FROM calificaciones
        WHERE IdAlumno = :idAlumno
          AND IdActividad IN (:idsActividades)
      `, {
        replacements: {
          idAlumno: IdAlumno,
          idsActividades: idsActividadesAnteriores
        },
        transaction
      });

      calificacionesEliminadas = resultadoEliminacion.affectedRows || 0;
    }

    // ==========================================
    // 8. COMMIT Y RESPUESTA
    // ==========================================

    await transaction.commit();

    res.json({
      success: true,
      data: {
        inscripcion: {
          IdInscripcion: inscripcion.IdInscripcion,
          IdAlumno,
          CicloEscolar,
          cambio: {
            anterior: {
              IdGrado: datosAnteriores.IdGrado,
              NombreGrado: nombresAnteriores[0]?.NombreGrado || null,
              IdSeccion: datosAnteriores.IdSeccion,
              NombreSeccion: nombresAnteriores[0]?.NombreSeccion || null,
              IdJornada: datosAnteriores.IdJornada,
              NombreJornada: nombresAnteriores[0]?.NombreJornada || null
            },
            nuevo: {
              IdGrado: datosNuevos.IdGrado,
              NombreGrado: nombresNuevos[0]?.NombreGrado || null,
              IdSeccion: datosNuevos.IdSeccion,
              NombreSeccion: nombresNuevos[0]?.NombreSeccion || null,
              IdJornada: datosNuevos.IdJornada,
              NombreJornada: nombresNuevos[0]?.NombreJornada || null
            }
          }
        },
        calificaciones: {
          creadas: calificacionesCreadas,
          eliminadas: calificacionesEliminadas,
          unidadActual,
          nota: `Se eliminaron calificaciones solo de la Unidad ${unidadActual}. Se crearon calificaciones para todas las unidades del nuevo grupo.`,
          detalleCreadas: Object.values(detallesPorCursoCreadas),
          creadasPorUnidad: detallesPorUnidadCreadas,
          detalleEliminadas
        },
        motivo: Motivo || null
      },
      message: `Cambio de sección/jornada completado. ${calificacionesCreadas} calificaciones creadas (todas las unidades), ${calificacionesEliminadas} eliminadas (solo Unidad ${unidadActual}).`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error en cambiarGrupo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Asignar actividades a un alumno inscrito fuera de tiempo
 * Llama al SP sp_asignar_actividades_alumno
 *
 * POST /api/inscripciones/asignar-actividades
 */
exports.asignarActividades = async (req, res) => {
  try {
    const { IdInscripcion, IdColaborador } = req.body;

    // Validaciones
    if (!IdInscripcion || isNaN(IdInscripcion)) {
      return res.status(400).json({
        success: false,
        error: 'IdInscripcion es requerido y debe ser un número'
      });
    }

    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({
        success: false,
        error: 'IdColaborador es requerido y debe ser un número'
      });
    }

    // Llamar al Stored Procedure
    const [resultado] = await sequelize.query(
      'CALL sp_asignar_actividades_alumno(:idInscripcion, :idColaborador)',
      {
        replacements: {
          idInscripcion: IdInscripcion,
          idColaborador: IdColaborador
        }
      }
    );

    // El SP retorna un array con un objeto
    const respuestaSP = resultado[0] || resultado;

    if (respuestaSP.success === 1 || respuestaSP.success === true) {
      res.json({
        success: true,
        data: {
          actividadesEncontradas: respuestaSP.actividadesEncontradas,
          calificacionesCreadas: respuestaSP.calificacionesCreadas
        },
        message: respuestaSP.mensaje
      });
    } else {
      res.status(404).json({
        success: false,
        error: respuestaSP.mensaje
      });
    }

  } catch (error) {
    console.error('Error en asignarActividades:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};