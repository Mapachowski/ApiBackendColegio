const Familia = require('../models/Familia'); // Importa el modelo de Familia
const sequelize = require('../config/database');

// Obtener todas las familias
exports.getAll = async (req, res) => {
  try {
    const familias = await Familia.findAll({ where: { Estado: true } }); // Solo activos
    res.json({ success: true, data: familias });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener una familia por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const familia = await Familia.findByPk(id);
    if (!familia) {
      return res.status(404).json({ success: false, error: 'Familia no encontrada' });
    }
    res.json({ success: true, data: familia });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener familias completas con toda la información
exports.getFamiliasCompletas = async (req, res) => {
  try {
    const results = await sequelize.query('CALL sp_obtenerfamiliascompletas()', {
      type: sequelize.QueryTypes.SELECT
    });

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron familias completas'
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error en getFamiliasCompletas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear una nueva familia
exports.create = async (req, res) => {
  try {
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const nuevaFamilia = await Familia.create({
      ...req.body, // Copia los datos del body
      CreadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaCreado: new Date(), // Fecha actual (05:14 PM CST, 07/10/2025)
    });
    res.status(201).json({ success: true, data: nuevaFamilia });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Actualizar una familia
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const familia = await Familia.findByPk(id);
    if (!familia) {
      return res.status(404).json({ success: false, error: 'Familia no encontrada' });
    }
    await familia.update({
      ...req.body, // Copia los datos del body
      ModificadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaModificado: new Date(), // Fecha actual
    });
    res.json({ success: true, data: familia });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// "Eliminar" una familia (cambiar Estado a 0)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador } = req.body; // Obtener IdColaborador del body
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    const familia = await Familia.findByPk(id);
    if (!familia) {
      return res.status(404).json({ success: false, error: 'Familia no encontrada' });
    }
    await familia.update({
      Estado: false,
      ModificadoPor: IdColaborador, // Usar el IdColaborador del body
      FechaModificado: new Date(), // Fecha actual
    });
    res.json({ success: true, message: 'Familia marcada como inactiva' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener hijos (alumnos) de una familia con su inscripción actual
exports.getHijosPorFamilia = async (req, res) => {
  try {
    const { idFamilia } = req.params;
    const { cicloEscolar } = req.query;

    // Validar que idFamilia sea un número
    if (!idFamilia || isNaN(idFamilia)) {
      return res.status(400).json({
        success: false,
        error: 'idFamilia es requerido y debe ser un número'
      });
    }

    // Validar ciclo escolar (opcional, si no se envía se obtienen todas las inscripciones activas)
    let cicloCondition = '';
    let replacements = { idFamilia };

    if (cicloEscolar) {
      if (!/^\d{4}$/.test(cicloEscolar)) {
        return res.status(400).json({
          success: false,
          error: 'cicloEscolar debe ser un año de 4 dígitos (ej. 2026)'
        });
      }
      cicloCondition = 'AND i.CicloEscolar = :cicloEscolar';
      replacements.cicloEscolar = cicloEscolar;
    }

    // Query para obtener hijos con su inscripción actual
    const hijos = await sequelize.query(`
      SELECT
        a.IdAlumno,
        a.Nombres,
        a.Apellidos,
        a.Matricula,
        a.FechaNacimiento,
        a.Genero,
        i.IdInscripcion,
        i.CicloEscolar,
        i.IdGrado,
        g.NombreGrado,
        i.IdSeccion,
        s.NombreSeccion,
        i.IdJornada,
        j.NombreJornada,
        i.FechaInscripcion
      FROM alumnos a
      LEFT JOIN inscripciones i ON a.IdAlumno = i.IdAlumno AND i.Estado = 1 ${cicloCondition}
      LEFT JOIN grados g ON i.IdGrado = g.IdGrado
      LEFT JOIN secciones s ON i.IdSeccion = s.IdSeccion
      LEFT JOIN jornadas j ON i.IdJornada = j.IdJornada
      WHERE a.IdFamilia = :idFamilia
        AND a.Estado = 1
      ORDER BY a.Apellidos, a.Nombres
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    if (!hijos || hijos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron hijos para esta familia'
      });
    }

    res.json({
      success: true,
      data: hijos,
      total: hijos.length
    });

  } catch (error) {
    console.error('Error en getHijosPorFamilia:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener cursos detallados de un hijo con todas sus actividades organizadas por unidad
exports.getCursosDetalladosHijo = async (req, res) => {
  try {
    const { idAlumno } = req.params;
    const { cicloEscolar, idGrado, idSeccion, idJornada } = req.query;

    // Validar que idAlumno sea un número
    if (!idAlumno || isNaN(idAlumno)) {
      return res.status(400).json({
        success: false,
        error: 'idAlumno es requerido y debe ser un número'
      });
    }

    // Validar parámetros requeridos
    if (!cicloEscolar || !idGrado || !idSeccion || !idJornada) {
      return res.status(400).json({
        success: false,
        error: 'cicloEscolar, idGrado, idSeccion e idJornada son requeridos'
      });
    }

    // Validar formato de ciclo escolar
    if (!/^\d{4}$/.test(cicloEscolar)) {
      return res.status(400).json({
        success: false,
        error: 'cicloEscolar debe ser un año de 4 dígitos (ej. 2026)'
      });
    }

    // Validar que los IDs sean números
    if (isNaN(idGrado) || isNaN(idSeccion) || isNaN(idJornada)) {
      return res.status(400).json({
        success: false,
        error: 'idGrado, idSeccion e idJornada deben ser números'
      });
    }

    // Query para obtener cursos con unidades y actividades del alumno
    const cursos = await sequelize.query(`
      SELECT
        c.IdCurso,
        c.Curso,
        u.IdUnidad,
        u.NumeroUnidad,
        u.NombreUnidad,
        u.PunteoZona,
        u.PunteoFinal,
        act.IdActividad,
        act.NombreActividad,
        act.Descripcion AS DescripcionActividad,
        act.PunteoMaximo,
        act.TipoActividad,
        act.FechaActividad,
        cal.IdCalificacion,
        cal.Punteo AS PunteoObtenido,
        cal.Observaciones
      FROM asignacion_docente ad
      INNER JOIN cursos c ON ad.IdCurso = c.IdCurso
      INNER JOIN unidades u ON ad.IdAsignacionDocente = u.IdAsignacionDocente
      LEFT JOIN actividades act ON u.IdUnidad = act.IdUnidad AND act.Estado = 1
      LEFT JOIN calificaciones cal ON act.IdActividad = cal.IdActividad AND cal.IdAlumno = :idAlumno
      WHERE ad.IdGrado = :idGrado
        AND ad.IdSeccion = :idSeccion
        AND ad.IdJornada = :idJornada
        AND ad.Anio = :cicloEscolar
        AND ad.Estado = 1
        AND c.Estado = 1
        AND u.Estado = 1
      ORDER BY c.Curso, u.NumeroUnidad, act.TipoActividad, act.FechaActividad
    `, {
      replacements: {
        idAlumno,
        cicloEscolar,
        idGrado,
        idSeccion,
        idJornada
      },
      type: sequelize.QueryTypes.SELECT
    });

    if (!cursos || cursos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron cursos para este alumno con los parámetros proporcionados'
      });
    }

    // Organizar la data: Cursos -> Unidades -> Actividades
    const cursosAgrupados = {};

    cursos.forEach(row => {
      const cursoId = row.IdCurso;
      const unidadId = row.IdUnidad;

      // Crear curso si no existe
      if (!cursosAgrupados[cursoId]) {
        cursosAgrupados[cursoId] = {
          IdCurso: row.IdCurso,
          Curso: row.Curso,
          unidades: {}
        };
      }

      // Crear unidad si no existe
      if (!cursosAgrupados[cursoId].unidades[unidadId]) {
        cursosAgrupados[cursoId].unidades[unidadId] = {
          IdUnidad: row.IdUnidad,
          NumeroUnidad: row.NumeroUnidad,
          NombreUnidad: row.NombreUnidad,
          PunteoZona: row.PunteoZona,
          PunteoFinal: row.PunteoFinal,
          actividades: []
        };
      }

      // Agregar actividad si existe
      if (row.IdActividad) {
        cursosAgrupados[cursoId].unidades[unidadId].actividades.push({
          IdActividad: row.IdActividad,
          NombreActividad: row.NombreActividad,
          Descripcion: row.DescripcionActividad,
          PunteoMaximo: row.PunteoMaximo,
          TipoActividad: row.TipoActividad,
          FechaActividad: row.FechaActividad,
          IdCalificacion: row.IdCalificacion,
          PunteoObtenido: row.PunteoObtenido,
          Observaciones: row.Observaciones
        });
      }
    });

    // Convertir objetos a arrays
    const cursosFinales = Object.values(cursosAgrupados).map(curso => ({
      ...curso,
      unidades: Object.values(curso.unidades)
    }));

    res.json({
      success: true,
      data: {
        idAlumno: parseInt(idAlumno),
        cicloEscolar,
        idGrado: parseInt(idGrado),
        idSeccion: parseInt(idSeccion),
        idJornada: parseInt(idJornada),
        cursos: cursosFinales
      },
      total: cursosFinales.length
    });

  } catch (error) {
    console.error('Error en getCursosDetalladosHijo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener familias activas con responsables e hijos agregados
exports.getFamiliasActivasConResponsables = async (req, res) => {
  try {
    // Parámetro opcional soloResponsables (true/false o 1/0)
    const { soloResponsables } = req.query;
    const filtroResponsables = soloResponsables === 'true' || soloResponsables === '1' ? 1 : 0;

    const results = await sequelize.query(
      'CALL sp_ObtenerFamiliasActivasConResponsables(:soloResponsables)',
      {
        replacements: { soloResponsables: filtroResponsables },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron familias activas'
      });
    }

    res.json({ success: true, data: results, total: results.length });
  } catch (error) {
    console.error('Error en getFamiliasActivasConResponsables:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener familias por grado del hijo con información completa
exports.getFamiliasPorGrado = async (req, res) => {
  try {
    const { CicloEscolar, p_CicloEscolar, IdGrado, IdSeccion, IdJornada, soloResponsables } = req.query;

    // Aceptar tanto CicloEscolar como p_CicloEscolar para compatibilidad
    const cicloEscolar = CicloEscolar || p_CicloEscolar;

    // Validación obligatoria del ciclo escolar
    if (!cicloEscolar) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro CicloEscolar (o p_CicloEscolar) es obligatorio'
      });
    }

    if (typeof cicloEscolar !== 'string' || cicloEscolar.length !== 4 || !/^\d{4}$/.test(cicloEscolar)) {
      return res.status(400).json({
        success: false,
        error: 'CicloEscolar debe ser un año de 4 dígitos (ej. 2026)'
      });
    }

    // Validación obligatoria de IdGrado
    const gradoId = IdGrado ? parseInt(IdGrado, 10) : null;
    if (!IdGrado || isNaN(gradoId)) {
      return res.status(400).json({
        success: false,
        error: 'IdGrado es obligatorio y debe ser un número'
      });
    }

    // Parámetros opcionales
    const seccionId = IdSeccion ? parseInt(IdSeccion, 10) : null;
    const jornadaId = IdJornada ? parseInt(IdJornada, 10) : null;
    const filtroResponsables = soloResponsables === 'true' || soloResponsables === '1' ? 1 : 0;

    if (IdSeccion && isNaN(seccionId)) {
      return res.status(400).json({ success: false, error: 'IdSeccion debe ser un número' });
    }
    if (IdJornada && isNaN(jornadaId)) {
      return res.status(400).json({ success: false, error: 'IdJornada debe ser un número' });
    }

    // Llamar al stored procedure
    const results = await sequelize.query(
      'CALL sp_ObtenerFamiliasPorGrado(:ciclo, :grado, :seccion, :jornada, :soloResponsables)',
      {
        replacements: {
          ciclo: cicloEscolar,
          grado: gradoId,
          seccion: seccionId,
          jornada: jornadaId,
          soloResponsables: filtroResponsables
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron familias con los filtros proporcionados'
      });
    }

    res.json({ success: true, data: results, total: results.length });
  } catch (error) {
    console.error('Error en getFamiliasPorGrado:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener familias y sus hijos por grado (con el otro SP que ya existe)
exports.getFamiliasYHijosPorGrado = async (req, res) => {
  try {
    const { CicloEscolar, p_CicloEscolar, IdGrado, IdSeccion, IdJornada } = req.query;

    // Aceptar tanto CicloEscolar como p_CicloEscolar para compatibilidad
    const cicloEscolar = CicloEscolar || p_CicloEscolar;

    // Validación obligatoria del ciclo escolar
    if (!cicloEscolar) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro CicloEscolar (o p_CicloEscolar) es obligatorio'
      });
    }

    if (typeof cicloEscolar !== 'string' || cicloEscolar.length !== 4 || !/^\d{4}$/.test(cicloEscolar)) {
      return res.status(400).json({
        success: false,
        error: 'CicloEscolar debe ser un año de 4 dígitos (ej. 2026)'
      });
    }

    // Validación obligatoria de IdGrado
    const gradoId = IdGrado ? parseInt(IdGrado, 10) : null;
    if (!IdGrado || isNaN(gradoId)) {
      return res.status(400).json({
        success: false,
        error: 'IdGrado es obligatorio y debe ser un número'
      });
    }

    // Parámetros opcionales
    const seccionId = IdSeccion ? parseInt(IdSeccion, 10) : null;
    const jornadaId = IdJornada ? parseInt(IdJornada, 10) : null;

    if (IdSeccion && isNaN(seccionId)) {
      return res.status(400).json({ success: false, error: 'IdSeccion debe ser un número' });
    }
    if (IdJornada && isNaN(jornadaId)) {
      return res.status(400).json({ success: false, error: 'IdJornada debe ser un número' });
    }

    // Llamar al stored procedure
    const results = await sequelize.query(
      'CALL sp_ObtenerFamiliasActivasConResponsables(:ciclo, :grado, :seccion, :jornada)',
      {
        replacements: {
          ciclo: cicloEscolar,
          grado: gradoId,
          seccion: seccionId,
          jornada: jornadaId
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron familias con los filtros proporcionados'
      });
    }

    res.json({ success: true, data: results, total: results.length });
  } catch (error) {
    console.error('Error en getFamiliasYHijosPorGrado:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};