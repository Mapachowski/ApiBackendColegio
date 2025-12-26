const sequelize = require('../config/database'); // ← Ahora sí funciona
const Alumno = require('../models/Alumno'); // Importa el modelo de Alumno
const Usuario = require('../models/Usuario');

// Obtener todos los alumnos con estado activo
exports.getAll = async (req, res) => {
  try {
    const alumnos = await Alumno.findAll({ where: { Estado: true } }); // Solo activos
    res.json({ success: true, data: alumnos });
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