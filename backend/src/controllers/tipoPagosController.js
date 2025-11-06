const TipoPago = require('../models/TipoPago');

// Obtener todos los tipos de pago con Estado: true
exports.getTiposPago = async (req, res) => {
  try {
    const tiposPago = await TipoPago.findAll({
      where: { Estado: true },
    });
    res.status(200).json(tiposPago);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tipos de pago', error: error.message });
  }
};

// Obtener un tipo de pago por ID
exports.getTipoPagoById = async (req, res) => {
  try {
    const tipoPago = await TipoPago.findByPk(req.params.id);
    if (!tipoPago) {
      return res.status(404).json({ message: 'Tipo de pago no encontrado' });
    }
    res.status(200).json(tipoPago);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el tipo de pago', error: error.message });
  }
};

// Crear un nuevo tipo de pago
exports.createTipoPago = async (req, res) => {
  try {
    const { NombreTipoPago } = req.body;

    // Validar campos requeridos
    if (!NombreTipoPago) {
      return res.status(400).json({ message: 'Falta el campo NombreTipoPago' });
    }

    const nuevoTipoPago = await TipoPago.create({
      NombreTipoPago,
      Estado: true, // Activo por defecto
    });

    res.status(201).json(nuevoTipoPago);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear tipo de pago', error: error.message });
  }
};

// Actualizar un tipo de pago
exports.updateTipoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { NombreTipoPago, Estado } = req.body;

    const tipoPago = await TipoPago.findByPk(id);
    if (!tipoPago) {
      return res.status(404).json({ message: 'Tipo de pago no encontrado' });
    }

    await tipoPago.update({
      NombreTipoPago: NombreTipoPago || tipoPago.NombreTipoPago,
      Estado: Estado !== undefined ? Estado : tipoPago.Estado,
    });

    res.status(200).json(tipoPago);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar tipo de pago', error: error.message });
  }
};

// Eliminar un tipo de pago (soft delete, cambia Estado a false)
exports.deleteTipoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const tipoPago = await TipoPago.findByPk(id);
    if (!tipoPago) {
      return res.status(404).json({ message: 'Tipo de pago no encontrado' });
    }

    await tipoPago.update({ Estado: false });
    res.status(200).json({ message: 'Tipo de pago eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar tipo de pago', error: error.message });
  }
};