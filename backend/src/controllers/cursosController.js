const Curso = require('../models/Curso');
const Grado = require('../models/Grado');
const sequelize = require('../config/database');

// Obtener todos los cursos
exports.getAll = async (req, res) => {
  try {
    const cursos = await Curso.findAll({
      where: { Estado: true },
      include: [
        { model: Grado, attributes: ['IdGrado', 'NombreGrado'] }
      ],
    });
    res.json({ success: true, data: cursos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener un curso por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const curso = await Curso.findByPk(id, {
      include: [
        { model: Grado, attributes: ['IdGrado', 'NombreGrado'] }
      ],
    });
    if (!curso) {
      return res.status(404).json({ success: false, error: 'Curso no encontrado' });
    }
    res.json({ success: true, data: curso });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener cursos por IdGrado
exports.getByGrado = async (req, res) => {
  try {
    const { idGrado } = req.params;

    if (!idGrado || isNaN(idGrado)) {
      return res.status(400).json({ success: false, error: 'idGrado es requerido y debe ser un número' });
    }

    const cursos = await Curso.findAll({
      where: {
        idGrado: idGrado,
        Estado: true
      },
      include: [
        { model: Grado, attributes: ['IdGrado', 'NombreGrado'] }
      ],
    });

    if (!cursos || cursos.length === 0) {
      return res.status(404).json({ success: false, error: 'No se encontraron cursos para este grado' });
    }

    res.json({ success: true, data: cursos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear un nuevo curso
exports.create = async (req, res) => {
  try {
    const { idGrado, Curso: nombreCurso, CodigoSire, NoOrden } = req.body;

    // Validaciones
    if (!idGrado || isNaN(idGrado)) {
      return res.status(400).json({ success: false, error: 'idGrado es requerido y debe ser un número' });
    }
    if (!nombreCurso || typeof nombreCurso !== 'string' || nombreCurso.trim() === '') {
      return res.status(400).json({ success: false, error: 'Curso es requerido y debe ser texto válido' });
    }
    if (NoOrden === undefined || NoOrden === null || isNaN(NoOrden)) {
      return res.status(400).json({ success: false, error: 'NoOrden es requerido y debe ser un número' });
    }

    const nuevoCurso = await Curso.create({
      idGrado,
      Curso: nombreCurso.trim(),
      CodigoSire: CodigoSire ? CodigoSire.trim() : null,
      NoOrden,
      Estado: true,
    });

    res.status(201).json({ success: true, data: nuevoCurso });
  } catch (error) {
    console.error('Error al crear curso:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Actualizar un curso
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { idGrado, Curso: nombreCurso, CodigoSire, NoOrden, Estado } = req.body;

    const curso = await Curso.findByPk(id);
    if (!curso) {
      return res.status(404).json({ success: false, error: 'Curso no encontrado' });
    }

    await curso.update({
      idGrado: idGrado || curso.idGrado,
      Curso: nombreCurso ? nombreCurso.trim() : curso.Curso,
      CodigoSire: CodigoSire !== undefined ? (CodigoSire ? CodigoSire.trim() : null) : curso.CodigoSire,
      NoOrden: NoOrden !== undefined ? NoOrden : curso.NoOrden,
      Estado: Estado !== undefined ? Estado : curso.Estado,
    });

    res.json({ success: true, data: curso });
  } catch (error) {
    console.error('Error al actualizar curso:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// "Eliminar" un curso (cambiar Estado a false)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const curso = await Curso.findByPk(id);
    if (!curso) {
      return res.status(404).json({ success: false, error: 'Curso no encontrado' });
    }

    await curso.update({
      Estado: false,
    });

    res.json({ success: true, message: 'Curso marcado como inactivo' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener cursos por grado con información de asignaciones (usando SP)
exports.getCursosPorGrado = async (req, res) => {
  try {
    const { idGrado, idSeccion, idJornada, anio } = req.query;

    // Validaciones
    if (!idGrado || isNaN(idGrado)) {
      return res.status(400).json({
        success: false,
        error: 'idGrado es requerido y debe ser un número'
      });
    }
    if (!idSeccion || isNaN(idSeccion)) {
      return res.status(400).json({
        success: false,
        error: 'idSeccion es requerido y debe ser un número'
      });
    }
    if (!idJornada || isNaN(idJornada)) {
      return res.status(400).json({
        success: false,
        error: 'idJornada es requerido y debe ser un número'
      });
    }
    if (!anio || isNaN(anio)) {
      return res.status(400).json({
        success: false,
        error: 'anio es requerido y debe ser un número'
      });
    }

    // Llamar al stored procedure
    const results = await sequelize.query(
      'CALL sp_ObtenerCursosPorGrado(:idGrado, :idSeccion, :idJornada, :anio)',
      {
        replacements: {
          idGrado,
          idSeccion,
          idJornada,
          anio
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    // El SP retorna los cursos con la información de si están asignados o no
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error al obtener cursos por grado:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
