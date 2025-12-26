const sequelize = require('../config/database');
const Grado = require('../models/Grado'); // Importa el modelo de Grado

// Obtener todos los grados
exports.getAll = async (req, res) => {
  try {
    const grados = await Grado.findAll({ where: { Estado: true } }); // Solo activos
    res.json({ success: true, data: grados });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener un grado por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const grado = await Grado.findByPk(id);
    if (!grado) {
      return res.status(404).json({ success: false, error: 'Grado no encontrado' });
    }
    res.json({ success: true, data: grado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear un nuevo grado
exports.create = async (req, res) => {
  try {
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const nuevoGrado = await Grado.create({
      ...req.body, // Copia los datos del body
      CreadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaCreado: new Date(), // Fecha actual
    });
    res.status(201).json({ success: true, data: nuevoGrado });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

  exports.getCostoGrado = async (req, res) => {
    const { GradoId } = req.params;

    // Validar que GradoId sea número
    const id = parseInt(GradoId, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'GradoId debe ser un número entero positivo'
      });
    }

    try {
      console.log(`Ejecutando sp_CostoGrado(${id})...`);
      // ✅ SEGURO: Usar replacements para prevenir SQL injection
      const [results] = await sequelize.query(
        'CALL sp_CostoGrado(:gradoId)',
        {
          replacements: { gradoId: id }
        }
      );
      console.log('Resultado del SP:', results);

      // Manejar el resultado del procedimiento almacenado
      const fila = Array.isArray(results) ? results[0] : results;

      const mensualidad = fila?.Mensualidad;
      const valorInscripcion = fila?.ValorInscripcion;

      if (!mensualidad || !valorInscripcion) {
        return res.status(404).json({
          success: false,
          error: 'No se encontraron los costos para este grado'
        });
      }

      res.json({
        success: true,
        data: {
          ValorInscripcion: valorInscripcion,
          Mensualidad: mensualidad
        }
      });
    } catch (error) {
      console.error('Error en getCostoGrado:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener los costos del grado'
      });
    }
  };

// Actualizar un grado
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const grado = await Grado.findByPk(id);
    if (!grado) {
      return res.status(404).json({ success: false, error: 'Grado no encontrado' });
    }
    await grado.update({
      ...req.body, // Copia los datos del body
      ModificadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaModificado: new Date(), // Fecha actual
    });
    res.json({ success: true, data: grado });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// "Eliminar" un grado (cambiar Estado a 0)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const grado = await Grado.findByPk(id);
    if (!grado) {
      return res.status(404).json({ success: false, error: 'Grado no encontrado' });
    }
    await grado.update({
      Estado: false,
      ModificadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaModificado: new Date(), // Fecha actual
    });
    res.json({ success: true, message: 'Grado marcado como inactivo' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};