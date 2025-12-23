const Responsable = require('../models/Responsable'); // Importa el modelo de Responsable
const Familia = require('../models/Familia'); // Importa el modelo de Familia
const sequelize = require('../config/database');

// Obtener todos los responsables
exports.getAll = async (req, res) => {
  try {
    const responsables = await Responsable.findAll({ where: { Activo: 1 }, include: [Familia] }); // Solo activos, con familias
    res.json({ success: true, data: responsables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener un responsable por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const responsable = await Responsable.findByPk(id, { include: [Familia] });
    if (!responsable) {
      return res.status(404).json({ success: false, error: 'Responsable no encontrado' });
    }
    res.json({ success: true, data: responsable });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener responsables por IdFamilia
exports.getByIdFamilia = async (req, res) => {
  try {
    const { idFamilia } = req.params;
    const responsables = await Responsable.findAll({
      where: {
        IdFamilia: idFamilia,
        Activo: 1
      },
      include: [Familia]
    });
    if (!responsables || responsables.length === 0) {
      return res.status(404).json({ success: false, error: 'No se encontraron responsables para esta familia' });
    }
    res.json({ success: true, data: responsables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener responsables activos con información completa
exports.getResponsablesActivos = async (req, res) => {
  try {
    const results = await sequelize.query('CALL sp_ObtenerResponsablesActivos()', {
      type: sequelize.QueryTypes.SELECT
    });

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron responsables activos'
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error en getResponsablesActivos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener responsables por grado con filtros
exports.getResponsablesPorGrado = async (req, res) => {
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
        error: 'p_CicloEscolar debe ser un año de 4 dígitos (ej. 2025)'
      });
    }

    // Validación obligatoria de IdGrado
    const gradoId = IdGrado ? parseInt(IdGrado, 10) : null;
    if (!IdGrado || isNaN(gradoId)) {
      return res.status(400).json({
        success: false,
        error: 'IdGrado es obligatorio y debe ser un número'
      });
    }

    // Parámetros opcionales
    const seccionId = IdSeccion ? parseInt(IdSeccion, 10) : null;
    const jornadaId = IdJornada ? parseInt(IdJornada, 10) : null;

    if (IdSeccion && isNaN(seccionId)) {
      return res.status(400).json({ success: false, error: 'IdSeccion debe ser un número' });
    }
    if (IdJornada && isNaN(jornadaId)) {
      return res.status(400).json({ success: false, error: 'IdJornada debe ser un número' });
    }

    // Llamar al stored procedure con replacements para prevenir SQL injection
    const results = await sequelize.query(
      'CALL sp_obtenerresponsablesporgrado(:ciclo, :grado, :seccion, :jornada)',
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

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron responsables con los filtros proporcionados'
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error en getResponsablesPorGrado:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear un nuevo responsable
exports.create = async (req, res) => {
  try {
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const nuevoResponsable = await Responsable.create({
      ...req.body, // Copia los datos del body, incluyendo EsResponsable
      CreadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaCreado: new Date(), // Fecha actual (10:26 PM CST, 07/10/2025)
    });
    res.status(201).json({ success: true, data: nuevoResponsable });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Actualizar un responsable
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const responsable = await Responsable.findByPk(id);
    if (!responsable) {
      return res.status(404).json({ success: false, error: 'Responsable no encontrado' });
    }
    await responsable.update({
      ...req.body, // Copia los datos del body, incluyendo EsResponsable
      ModificadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaModificado: new Date(), // Fecha actual
    });
    res.json({ success: true, data: responsable });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// "Eliminar" un responsable (cambiar Activo a 0)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const responsable = await Responsable.findByPk(id);
    if (!responsable) {
      return res.status(404).json({ success: false, error: 'Responsable no encontrado' });
    }
    await responsable.update({
      Activo: 0,
      ModificadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaModificado: new Date(), // Fecha actual
    });
    res.json({ success: true, message: 'Responsable marcado como inactivo' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};