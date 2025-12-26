const MetodoPago = require('../models/MetodoPago');

// Obtener todos los métodos de pago con Estado: true
exports.getMetodosPago = async (req, res) => {
  try {
    const metodosPago = await MetodoPago.findAll({
      where: { Estado: true },
    });
    res.status(200).json(metodosPago);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener métodos de pago', error: error.message });
  }
};

// Obtener un método de pago por ID
exports.getMetodoPagoById = async (req, res) => {
  try {
    const metodoPago = await MetodoPago.findByPk(req.params.id);
    if (!metodoPago) {
      return res.status(404).json({ message: 'Método de pago no encontrado' });
    }
    res.status(200).json(metodoPago);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el método de pago', error: error.message });
  }
};

// Crear un nuevo método de pago
exports.createMetodoPago = async (req, res) => {
  try {
    const { NombreMetodoPago } = req.body;

    // Validar campos requeridos
    if (!NombreMetodoPago) {
      return res.status(400).json({ message: 'Falta el campo NombreMetodoPago' });
    }

    const nuevoMetodoPago = await MetodoPago.create({
      NombreMetodoPago,
      Estado: true, // Activo por defecto
    });

    res.status(201).json(nuevoMetodoPago);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear método de pago', error: error.message });
  }
};

// Actualizar un método de pago
exports.updateMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { NombreMetodoPago, Estado } = req.body;

    const metodoPago = await MetodoPago.findByPk(id);
    if (!metodoPago) {
      return res.status(404).json({ message: 'Método de pago no encontrado' });
    }

    await metodoPago.update({
      NombreMetodoPago: NombreMetodoPago || metodoPago.NombreMetodoPago,
      Estado: Estado !== undefined ? Estado : metodoPago.Estado,
    });

    res.status(200).json(metodoPago);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar método de pago', error: error.message });
  }
};

// Eliminar un método de pago (soft delete, cambia Estado a false)
exports.deleteMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const metodoPago = await MetodoPago.findByPk(id);
    if (!metodoPago) {
      return res.status(404).json({ message: 'Método de pago no encontrado' });
    }

    await metodoPago.update({ Estado: false });
    res.status(200).json({ message: 'Método de pago eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar método de pago', error: error.message });
  }
};