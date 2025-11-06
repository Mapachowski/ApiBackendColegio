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

// Obtener inscripciones por filtros usando stored procedure
exports.getByFilters = async (req, res) => {
  try {
    const { IdGrado, IdSeccion, IdJornada } = req.query;

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

    const query = `CALL sp_ListadoAlumnosPorInscripcion(${gradoId || 'NULL'}, ${seccionId || 'NULL'}, ${jornadaId || 'NULL'})`;
    const results = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });

    const inscripciones = results;

    if (!inscripciones || inscripciones.length === 0) {
      return res.status(404).json({ success: false, error: 'No se encontraron inscripciones con los filtros proporcionados' });
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

    // Escapar CicloEscolar para evitar inyección SQL
    const escapedCicloEscolar = sequelize.escape(CicloEscolar);
    const query = `CALL sp_BuscarAlumnoPorIdEnInscripcion(${alumnoId}, ${escapedCicloEscolar})`;
    const results = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });

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