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
      'CALL colegio.sp_ListadoAlumnosPorInscripcion(:ciclo, :grado, :seccion, :jornada)',
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