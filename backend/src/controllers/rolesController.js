const Rol = require('../models/Rol');

// Obtener todos los roles con Estado: true
exports.getRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      where: { Estado: true },
    });
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener roles', error: error.message });
  }
};

// Obtener un rol por ID
exports.getRolById = async (req, res) => {
  try {
    const rol = await Rol.findByPk(req.params.id);
    if (!rol) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    res.status(200).json(rol);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el rol', error: error.message });
  }
};

// Obtener todos los roles activos
exports.getAll = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      where: { Estado: true },
      attributes: ['IdRol', 'NombreRol'], // Solo necesitamos estos
    });
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// Crear un nuevo rol
exports.createRol = async (req, res) => {
  try {
    const { NombreRol } = req.body;

    // Validar campos requeridos
    if (!NombreRol) {
      return res.status(400).json({ message: 'Falta el campo NombreRol' });
    }

    const nuevoRol = await Rol.create({
      NombreRol,
      Estado: true, // Activo por defecto
    });

    res.status(201).json(nuevoRol);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear rol', error: error.message });
  }
};

// Actualizar un rol
exports.updateRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { NombreRol, Estado } = req.body;

    const rol = await Rol.findByPk(id);
    if (!rol) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    await rol.update({
      NombreRol: NombreRol || rol.NombreRol,
      Estado: Estado !== undefined ? Estado : rol.Estado,
    });

    res.status(200).json(rol);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar rol', error: error.message });
  }
};

// Eliminar un rol (soft delete, cambia Estado a false)
exports.deleteRol = async (req, res) => {
  try {
    const { id } = req.params;
    const rol = await Rol.findByPk(id);
    if (!rol) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    await rol.update({ Estado: false });
    res.status(200).json({ message: 'Rol eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar rol', error: error.message });
  }
};