const ResponsableTipo = require('../models/ResponsableTipo');

exports.getAll = async (req, res) => {
  try {
    const tipos = await ResponsableTipo.findAll({
      attributes: ['IdResponsableTipo', 'Tipo'],
      order: [['IdResponsableTipo', 'ASC']]
    });

    res.json({ success: true, data: tipos });
  } catch (error) {
    console.error('Error en getAll:', error);
    res.status(500).json({ success: false, error: 'Error al obtener tipos de responsables' });
  }
};