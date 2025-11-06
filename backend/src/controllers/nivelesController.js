const Nivel = require('../models/Nivel');

// Obtener todos los niveles con Estado: true
exports.getNiveles = async (req, res) => {
  try {
    const niveles = await Nivel.findAll({
      where: { Estado: true },
    });
    res.status(200).json(niveles);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener niveles', error: error.message });
  }
};

// Obtener un nivel por ID
exports.getNivelById = async (req, res) => {
  try {
    const nivel = await Nivel.findByPk(req.params.id);
    if (!nivel) {
      return res.status(404).json({ message: 'Nivel no encontrado' });
    }
    res.status(200).json(nivel);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el nivel', error: error.message });
  }
};

// Crear un nuevo nivel
exports.createNivel = async (req, res) => {
  try {
    const { NombreNivel } = req.body;

    // Validar campos requeridos
    if (!NombreNivel) {
      return res.status(400).json({ message: 'Falta el campo NombreNivel' });
    }

    const nuevoNivel = await Nivel.create({
      NombreNivel,
      Estado: true, // Activo por defecto
    });

    res.status(201).json(nuevoNivel);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear nivel', error: error.message });
  }
};

// Actualizar un nivel
exports.updateNivel = async (req, res) => {
  try {
    const { id } = req.params;
    const { NombreNivel, Estado } = req.body;

    const nivel = await Nivel.findByPk(id);
    if (!nivel) {
      return res.status(404).json({ message: 'Nivel no encontrado' });
    }

    await nivel.update({
      NombreNivel: NombreNivel || nivel.NombreNivel,
      Estado: Estado !== undefined ? Estado : nivel.Estado,
    });

    res.status(200).json(nivel);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar nivel', error: error.message });
  }
};

// Eliminar un nivel (soft delete, cambia Estado a false)
exports.deleteNivel = async (req, res) => {
  try {
    const { id } = req.params;
    const nivel = await Nivel.findByPk(id);
    if (!nivel) {
      return res.status(404).json({ message: 'Nivel no encontrado' });
    }

    await nivel.update({ Estado: false });
    res.status(200).json({ message: 'Nivel eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar nivel', error: error.message });
  }
};