const Seccion = require('../models/Seccion');

// Obtener todas las secciones con Estado: true
exports.getSecciones = async (req, res) => {
  try {
    const secciones = await Seccion.findAll({
      where: { Estado: true },
      order: [['NombreSeccion', 'ASC']]
    });
    res.status(200).json({ success: true, data: secciones });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener una sección por ID
exports.getSeccionById = async (req, res) => {
  try {
    const seccion = await Seccion.findByPk(req.params.id);
    if (!seccion) {
      return res.status(404).json({ message: 'Sección no encontrada' });
    }
    res.status(200).json(seccion);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la sección', error: error.message });
  }
};

// Crear una nueva sección
exports.createSeccion = async (req, res) => {
  try {
    const { NombreSeccion } = req.body;

    // Validar campos requeridos
    if (!NombreSeccion) {
      return res.status(400).json({ message: 'Falta el campo NombreSeccion' });
    }

    const nuevaSeccion = await Seccion.create({
      NombreSeccion,
      Estado: true, // Activo por defecto
    });

    res.status(201).json(nuevaSeccion);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear sección', error: error.message });
  }
};

// Actualizar una sección
exports.updateSeccion = async (req, res) => {
  try {
    const { id } = req.params;
    const { NombreSeccion, Estado } = req.body;

    const seccion = await Seccion.findByPk(id);
    if (!seccion) {
      return res.status(404).json({ message: 'Sección no encontrada' });
    }

    await seccion.update({
      NombreSeccion: NombreSeccion || seccion.NombreSeccion,
      Estado: Estado !== undefined ? Estado : seccion.Estado,
    });

    res.status(200).json(seccion);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar sección', error: error.message });
  }
};

// Eliminar una sección (soft delete, cambia Estado a false)
exports.deleteSeccion = async (req, res) => {
  try {
    const { id } = req.params;
    const seccion = await Seccion.findByPk(id);
    if (!seccion) {
      return res.status(404).json({ message: 'Sección no encontrada' });
    }

    await seccion.update({ Estado: false });
    res.status(200).json({ message: 'Sección eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar sección', error: error.message });
  }
};