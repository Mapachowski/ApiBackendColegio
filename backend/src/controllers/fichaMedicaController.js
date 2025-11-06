const FichaMedica = require('../models/FichasMedicas');
const Alumno = require('../models/Alumno');

// Obtener todas las fichas médicas
exports.getFichasMedicas = async (req, res) => {
  try {
    const fichasMedicas = await FichaMedica.findAll({
      include: [{ model: Alumno, attributes: ['IdAlumno', 'Nombres', 'Apellidos'] }],
    });
    res.status(200).json(fichasMedicas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener fichas médicas', error: error.message });
  }
};

// Obtener una ficha médica por ID
exports.getFichaMedicaById = async (req, res) => {
  try {
    const fichaMedica = await FichaMedica.findByPk(req.params.id, {
      include: [{ model: Alumno, attributes: ['IdAlumno', 'Nombres', 'Apellidos'] }],
    });
    if (!fichaMedica) {
      return res.status(404).json({ message: 'Ficha médica no encontrada' });
    }
    res.status(200).json(fichaMedica);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la ficha médica', error: error.message });
  }
};

// Crear una nueva ficha médica
exports.createFichaMedica = async (req, res) => {
  try {
    const { IdAlumno, Padecimiento, Medicamento, Observaciones } = req.body;

    // Validar campos requeridos
    if (!IdAlumno) {
      return res.status(400).json({ message: 'Falta el campo IdAlumno' });
    }

    // Validar que el IdAlumno existe
    const alumno = await Alumno.findByPk(IdAlumno);
    if (!alumno) {
      return res.status(400).json({ message: 'Alumno no encontrado' });
    }

    const nuevaFichaMedica = await FichaMedica.create({
      IdAlumno,
      Padecimiento,
      Medicamento,
      Observaciones,
    });

    res.status(201).json(nuevaFichaMedica);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear ficha médica', error: error.message });
  }
};

// Actualizar una ficha médica
exports.updateFichaMedica = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdAlumno, Padecimiento, Medicamento, Observaciones } = req.body;

    const fichaMedica = await FichaMedica.findByPk(id);
    if (!fichaMedica) {
      return res.status(404).json({ message: 'Ficha médica no encontrada' });
    }

    // Validar que el IdAlumno existe si se proporciona
    if (IdAlumno) {
      const alumno = await Alumno.findByPk(IdAlumno);
      if (!alumno) {
        return res.status(400).json({ message: 'Alumno no encontrado' });
      }
    }

    await fichaMedica.update({
      IdAlumno: IdAlumno || fichaMedica.IdAlumno,
      Padecimiento: Padecimiento !== undefined ? Padecimiento : fichaMedica.Padecimiento,
      Medicamento: Medicamento !== undefined ? Medicamento : fichaMedica.Medicamento,
      Observaciones: Observaciones !== undefined ? Observaciones : fichaMedica.Observaciones,
    });

    res.status(200).json(fichaMedica);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar ficha médica', error: error.message });
  }
};

// Eliminar una ficha médica (hard delete, ya que no hay Estado)
exports.deleteFichaMedica = async (req, res) => {
  try {
    const { id } = req.params;
    const fichaMedica = await FichaMedica.findByPk(id);
    if (!fichaMedica) {
      return res.status(404).json({ message: 'Ficha médica no encontrada' });
    }

    await fichaMedica.destroy();
    res.status(200).json({ message: 'Ficha médica eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar ficha médica', error: error.message });
  }
};