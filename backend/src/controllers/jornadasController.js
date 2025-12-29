const Jornada = require('../models/Jornada');

// Obtener todas las jornadas con Estado: true
exports.getJornadas = async (req, res) => {
  try {
    const jornadas = await Jornada.findAll({
      where: { Estado: true },
      order: [['NombreJornada', 'ASC']]
    });
    res.status(200).json({ success: true, data: jornadas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener una jornada por ID
exports.getJornadaById = async (req, res) => {
  try {
    const jornada = await Jornada.findByPk(req.params.id);
    if (!jornada) {
      return res.status(404).json({ message: 'Jornada no encontrada' });
    }
    res.status(200).json(jornada);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la jornada', error: error.message });
  }
};

// Crear una nueva jornada
exports.createJornada = async (req, res) => {
  try {
    const { NombreJornada } = req.body;

    // Validar campos requeridos
    if (!NombreJornada) {
      return res.status(400).json({ message: 'Falta el campo NombreJornada' });
    }

    const nuevaJornada = await Jornada.create({
      NombreJornada,
      Estado: true, // Activo por defecto
    });

    res.status(201).json(nuevaJornada);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear jornada', error: error.message });
  }
};

// Actualizar una jornada
exports.updateJornada = async (req, res) => {
  try {
    const { id } = req.params;
    const { NombreJornada, Estado } = req.body;

    const jornada = await Jornada.findByPk(id);
    if (!jornada) {
      return res.status(404).json({ message: 'Jornada no encontrada' });
    }

    await jornada.update({
      NombreJornada: NombreJornada || jornada.NombreJornada,
      Estado: Estado !== undefined ? Estado : jornada.Estado,
    });

    res.status(200).json(jornada);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar jornada', error: error.message });
  }
};

// Eliminar una jornada (soft delete, cambia Estado a false)
exports.deleteJornada = async (req, res) => {
  try {
    const { id } = req.params;
    const jornada = await Jornada.findByPk(id);
    if (!jornada) {
      return res.status(404).json({ message: 'Jornada no encontrada' });
    }

    await jornada.update({ Estado: false });
    res.status(200).json({ message: 'Jornada eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar jornada', error: error.message });
  }
};