const sequelize = require('../config/database'); // ← Ahora sí funciona
const Alumno = require('../models/Alumno'); // Importa el modelo de Alumno
const Usuario = require('../models/Usuario');

// Obtener todos los alumnos con estado activo
exports.getAll = async (req, res) => {
  try {
    const { sinUsuario, idFamilia } = req.query;

    // Construir filtros dinámicos
    const filtros = { Estado: true }; // Solo activos

    // Filtro para alumnos sin usuario asignado
    if (sinUsuario === 'true') {
      filtros.IdUsuario = null;
    }

    // Filtro por familia
    if (idFamilia && !isNaN(idFamilia)) {
      filtros.IdFamilia = parseInt(idFamilia);
    }

    const alumnos = await Alumno.findAll({
      where: filtros,
      order: [['Nombres', 'ASC'], ['Apellidos', 'ASC']] // Ordenar alfabéticamente
    });

    res.json({
      success: true,
      data: alumnos,
      total: alumnos.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener un alumno por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const alumno = await Alumno.findByPk(id, {
      include: [
        {
          model: Usuario,
          attributes: ['IdUsuario', 'NombreUsuario', 'NombreCompleto', 'IdRol'],
          required: false // LEFT JOIN - devuelve el alumno aunque no tenga usuario
        }
      ]
    });
    if (!alumno) {
      return res.status(404).json({ success: false, error: 'Alumno no encontrado' });
    }
    res.json({ success: true, data: alumno });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear un nuevo alumno
exports.create = async (req, res) => {
  try {
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const nuevoAlumno = await Alumno.create({
      ...req.body, // Copia los datos del body
      CreadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaCreado: new Date(), // Fecha actual
    });
    res.status(201).json({ success: true, data: nuevoAlumno });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
// NUEVO: Obtener el siguiente carné
exports.getSiguienteCarnet = async (req, res) => {
  console.log('Ejecutando getSiguienteCarnet...');
  try {
    const [results] = await sequelize.query('CALL sp_SiguienteCarnet()');
    const siguienteCarnet = results[0]?.SiguienteCarnet || results?.SiguienteCarnet;

    if (!siguienteCarnet) {
      return res.status(404).json({
        success: false,
        error: 'SP no devolvió SiguienteCarnet'
      });
    }

    res.json({ success: true, data: siguienteCarnet });
  } catch (error) {
    console.error('Error en getSiguienteCarnet:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// Validar si matrícula ya existe
exports.existeMatricula = async (req, res) => {
  try {
    console.log('Query matricula:', req.query); // ← LOG CLAVE
    const { matricula } = req.query;

    if (!matricula || matricula.trim() === '') {
      return res.status(400).json({ success: false, error: 'Matrícula es requerida' });
    }

    // Paso 1: Llamar SP con replacements
    await sequelize.query(
      'CALL SP_ExisteMatricula(:matricula, @existe)',
      {
        replacements: { matricula },
        type: sequelize.QueryTypes.RAW
      }
    );

    // Paso 2: Leer la variable OUT
    const [[result]] = await sequelize.query('SELECT @existe AS existe');

    res.json({ success: true, existe: Boolean(result.existe) });
  } catch (error) {
    console.error('Error en existeMatricula:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// Actualizar un alumno
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const alumno = await Alumno.findByPk(id);
    if (!alumno) {
      return res.status(404).json({ success: false, error: 'Alumno no encontrado' });
    }
    await alumno.update({
      ...req.body, // Copia los datos del body
      ModificadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaModificado: new Date(), // Fecha actual
    });
    res.json({ success: true, data: alumno });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Obtener alumnos retirados/expulsados
exports.getAlumnosExpulsados = async (req, res) => {
  try {
    const [results] = await sequelize.query('CALL sp_BuscarAlumnosRetirados()');

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron alumnos retirados'
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error en getAlumnosExpulsados:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Regresar estudiante al sistema
exports.regresarEstudiante = async (req, res) => {
  try {
    const { IdAlumno, IdInscripcion, IdColaborador } = req.body;

    // Validaciones
    if (!IdAlumno || isNaN(IdAlumno)) {
      return res.status(400).json({
        success: false,
        error: 'IdAlumno es requerido y debe ser un número'
      });
    }
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

    // Llamar al stored procedure con replacements para prevenir SQL injection
    await sequelize.query(
      'CALL sp_RegresarEstudianteAlSistema(:idAlumno, :idInscripcion, :idColaborador)',
      {
        replacements: {
          idAlumno: IdAlumno,
          idInscripcion: IdInscripcion,
          idColaborador: IdColaborador
        },
        type: sequelize.QueryTypes.RAW
      }
    );

    res.json({
      success: true,
      message: 'Estudiante regresado al sistema exitosamente'
    });
  } catch (error) {
    console.error('Error en regresarEstudiante:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// "Eliminar" un alumno (cambiar Estado a 0)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const alumno = await Alumno.findByPk(id);
    if (!alumno) {
      return res.status(404).json({ success: false, error: 'Alumno no encontrado' });
    }
    await alumno.update({
      Estado: false,
      ModificadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaModificado: new Date(), // Fecha actual
    });
    res.json({ success: true, message: 'Alumno marcado como inactivo' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener cursos actuales del alumno
exports.getCursosActuales = async (req, res) => {
  try {
    const { id, anio } = req.params;

    // Validar que el año sea un número de 4 dígitos
    if (!anio || !/^\d{4}$/.test(anio)) {
      return res.status(400).json({
        success: false,
        error: 'El año es requerido y debe ser un número de 4 dígitos (ejemplo: 2026)'
      });
    }

    // Validar que el alumno existe
    const alumno = await Alumno.findByPk(id);
    if (!alumno) {
      return res.status(404).json({
        success: false,
        error: 'Alumno no encontrado'
      });
    }

    // Obtener inscripción del alumno
    const [inscripciones] = await sequelize.query(
      `SELECT IdInscripcion, IdGrado, IdSeccion, IdJornada, CicloEscolar
       FROM inscripciones
       WHERE IdAlumno = ? AND CicloEscolar = ? AND Estado = 1
       LIMIT 1`,
      { replacements: [id, anio] }
    );

    if (!inscripciones || inscripciones.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No se encontró inscripción activa para este alumno en el año ${anio}`
      });
    }

    const inscripcion = inscripciones[0];

    // Obtener cursos (asignaciones) del grado/sección/jornada con total de actividades
    const [cursos] = await sequelize.query(
      `SELECT
        ad.IdAsignacionDocente,
        ad.IdCurso,
        c.Curso as NombreCurso,
        c.NoOrden,
        ad.IdDocente,
        d.NombreDocente,
        g.IdGrado,
        g.NombreGrado,
        s.IdSeccion,
        s.NombreSeccion,
        j.IdJornada,
        j.NombreJornada,
        ad.Anio,
        (SELECT COUNT(*)
         FROM unidades u
         INNER JOIN actividades a ON u.IdUnidad = a.IdUnidad
         WHERE u.IdAsignacionDocente = ad.IdAsignacionDocente
           AND a.Estado = 1
        ) as totalActividades
      FROM asignacion_docente ad
      INNER JOIN cursos c ON ad.IdCurso = c.idCurso
      INNER JOIN docentes d ON ad.IdDocente = d.idDocente
      INNER JOIN grados g ON ad.IdGrado = g.IdGrado
      INNER JOIN secciones s ON ad.IdSeccion = s.IdSeccion
      INNER JOIN jornadas j ON ad.IdJornada = j.IdJornada
      WHERE ad.IdGrado = ?
        AND ad.IdSeccion = ?
        AND ad.IdJornada = ?
        AND ad.Anio = ?
        AND ad.Estado = 1
      ORDER BY c.NoOrden`,
      {
        replacements: [
          inscripcion.IdGrado,
          inscripcion.IdSeccion,
          inscripcion.IdJornada,
          inscripcion.CicloEscolar
        ]
      }
    );

    res.json({ success: true, data: cursos });
  } catch (error) {
    console.error('Error en getCursosActuales:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener inscripción actual del alumno
exports.getInscripcionActual = async (req, res) => {
  try {
    const { id, anio } = req.params;

    // Validar que el año sea un número de 4 dígitos
    if (!anio || !/^\d{4}$/.test(anio)) {
      return res.status(400).json({
        success: false,
        error: 'El año es requerido y debe ser un número de 4 dígitos (ejemplo: 2026)'
      });
    }

    const [inscripciones] = await sequelize.query(
      `SELECT
        i.IdInscripcion,
        i.IdAlumno,
        a.Matricula,
        CONCAT(a.Nombres, ' ', a.Apellidos) as NombreCompleto,
        i.IdGrado,
        g.NombreGrado,
        i.IdSeccion,
        s.NombreSeccion,
        i.IdJornada,
        j.NombreJornada,
        i.CicloEscolar,
        i.Estado
      FROM inscripciones i
      INNER JOIN alumnos a ON i.IdAlumno = a.IdAlumno
      INNER JOIN grados g ON i.IdGrado = g.IdGrado
      INNER JOIN secciones s ON i.IdSeccion = s.IdSeccion
      INNER JOIN jornadas j ON i.IdJornada = j.IdJornada
      WHERE i.IdAlumno = ?
        AND i.CicloEscolar = ?
        AND i.Estado = 1
      LIMIT 1`,
      { replacements: [id, anio] }
    );

    if (!inscripciones || inscripciones.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No se encontró inscripción activa para el alumno en el año ${anio}`
      });
    }

    res.json({ success: true, data: inscripciones[0] });
  } catch (error) {
    console.error('Error en getInscripcionActual:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener todas las actividades del alumno (todas las materias) para calendario
exports.getTodasActividadesAlumno = async (req, res) => {
  try {
    const { id, anio } = req.params;

    // Validar que el año sea un número de 4 dígitos
    if (!anio || !/^\d{4}$/.test(anio)) {
      return res.status(400).json({
        success: false,
        error: 'El año es requerido y debe ser un número de 4 dígitos (ejemplo: 2026)'
      });
    }

    // Validar que el alumno existe
    const alumno = await Alumno.findByPk(id);
    if (!alumno) {
      return res.status(404).json({
        success: false,
        error: 'Alumno no encontrado'
      });
    }

    // Obtener inscripción del alumno
    const [inscripciones] = await sequelize.query(
      `SELECT IdInscripcion, IdGrado, IdSeccion, IdJornada, CicloEscolar
       FROM inscripciones
       WHERE IdAlumno = ? AND CicloEscolar = ? AND Estado = 1
       LIMIT 1`,
      { replacements: [id, anio] }
    );

    if (!inscripciones || inscripciones.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No se encontró inscripción activa para este alumno en el año ${anio}`
      });
    }

    const inscripcion = inscripciones[0];

    // Obtener TODAS las actividades del alumno de TODOS sus cursos
    const [actividades] = await sequelize.query(
      `SELECT
        a.IdActividad,
        a.NombreActividad,
        a.Descripcion,
        a.PunteoMaximo,
        a.TipoActividad,
        a.FechaActividad,
        a.FechaCreado,
        c.Curso as NombreCurso,
        c.NoOrden,
        u.IdUnidad,
        u.NumeroUnidad,
        u.NombreUnidad,
        u.Activa as UnidadActiva,
        ad.IdAsignacionDocente,
        d.NombreDocente,
        cal.IdCalificacion,
        cal.Punteo,
        cal.Observaciones
      FROM asignacion_docente ad
      INNER JOIN cursos c ON ad.IdCurso = c.idCurso
      INNER JOIN docentes d ON ad.IdDocente = d.idDocente
      INNER JOIN unidades u ON ad.IdAsignacionDocente = u.IdAsignacionDocente
      INNER JOIN actividades a ON u.IdUnidad = a.IdUnidad
      LEFT JOIN calificaciones cal ON a.IdActividad = cal.IdActividad AND cal.IdAlumno = ?
      WHERE ad.IdGrado = ?
        AND ad.IdSeccion = ?
        AND ad.IdJornada = ?
        AND ad.Anio = ?
        AND ad.Estado = 1
        AND a.Estado = 1
      ORDER BY a.FechaActividad ASC, c.NoOrden, u.NumeroUnidad`,
      {
        replacements: [
          id,
          inscripcion.IdGrado,
          inscripcion.IdSeccion,
          inscripcion.IdJornada,
          inscripcion.CicloEscolar
        ]
      }
    );

    res.json({
      success: true,
      data: actividades,
      total: actividades.length
    });
  } catch (error) {
    console.error('Error en getTodasActividadesAlumno:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};