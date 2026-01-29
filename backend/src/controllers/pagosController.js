const Pago = require('../models/Pago');
const sequelize = require('../config/database');
const Alumno = require('../models/Alumno');
const Usuario = require('../models/Usuario');
const TipoPago = require('../models/TipoPago');
const MetodoPago = require('../models/MetodoPago');

// Obtener todos los pagos
exports.getAll = async (req, res) => {
  try {
    const pagos = await Pago.findAll({
      where: { Estado: true },
      include: [
        { model: Alumno, attributes: ['IdAlumno', 'Nombres', 'Apellidos'] },
        { model: Usuario, attributes: ['IdUsuario', 'NombreUsuario'] },
        { model: TipoPago, attributes: ['IdTipoPago', 'NombreTipoPago'] },
        { model: MetodoPago, attributes: ['IdMetodoPago', 'NombreMetodoPago'] },
      ],
    });
    res.json({ success: true, data: pagos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener un pago por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const pago = await Pago.findByPk(id, {
      include: [
        { model: Alumno, attributes: ['IdAlumno', 'Nombres', 'Apellidos'] },
        { model: Usuario, attributes: ['IdUsuario', 'NombreUsuario'] },
        { model: TipoPago, attributes: ['IdTipoPago', 'NombreTipoPago'] },
        { model: MetodoPago, attributes: ['IdMetodoPago', 'NombreMetodoPago'] },
      ],
    });
    if (!pago) {
      return res.status(404).json({ success: false, error: 'Pago no encontrado' });
    }
    res.json({ success: true, data: pago });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

  exports.getMesesPagados = async (req, res) => {
    try {
      const { idAlumno, tipoPago, cicloEscolar } = req.params;

      // Validaciones
      if (!idAlumno || isNaN(idAlumno)) {
        return res.status(400).json({ success: false, error: 'IdAlumno es requerido y debe ser un número' });
      }
      if (!tipoPago || isNaN(tipoPago)) {
        return res.status(400).json({ success: false, error: 'IdTipoPago es requerido y debe ser un número' });
      }
      if (!cicloEscolar || !/^\d{4}$/.test(cicloEscolar)) {
        return res.status(400).json({ success: false, error: 'CicloEscolar debe ser un año válido (ej: 2026)' });
      }

      // ✅ SEGURO: Usar replacements con nombres para prevenir SQL injection
      const [results] = await sequelize.query(
        'CALL sp_MesesPagados(:idAlumno, :tipoPago, :cicloEscolar)',
        {
          replacements: {
            idAlumno: idAlumno,
            tipoPago: tipoPago,
            cicloEscolar: cicloEscolar
          },
          type: Pago.sequelize.QueryTypes.SELECT
        }
      );

      // Sequelize devuelve un array plano con los resultados del SP
      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Error al ejecutar sp_MesesPagados:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener meses pagados',
        details: error.message
      });
    }
  };
// Obtener pagos por NumeroRecibo
exports.getByNumeroRecibo = async (req, res) => {
  try {
    const { numero } = req.params;
    const pagos = await Pago.findAll({
      where: {
        NumeroRecibo: numero,
        Estado: true,
      },
      include: [
        { model: Alumno, attributes: ['IdAlumno', 'Nombres', 'Apellidos'] },
        { model: Usuario, attributes: ['IdUsuario', 'NombreUsuario'] },
        { model: TipoPago, attributes: ['IdTipoPago', 'NombreTipoPago'] },
        { model: MetodoPago, attributes: ['IdMetodoPago', 'NombreMetodoPago'] },
      ],
    });
    if (!pagos || pagos.length === 0) {
      return res.status(404).json({ success: false, error: 'No se encontraron pagos con ese número de recibo' });
    }
    res.json({ success: true, data: pagos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener reporte de pagos por fechas y ciclo escolar
exports.getReportePagos = async (req, res) => {
  try {
    const { fechaInicial, fechaFinal, cicloEscolar } = req.query;

    // Validaciones
    if (!fechaInicial) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro fechaInicial es obligatorio'
      });
    }
    if (!fechaFinal) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro fechaFinal es obligatorio'
      });
    }
    if (!cicloEscolar) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro cicloEscolar es obligatorio'
      });
    }

    // Validar formato de ciclo escolar
    if (typeof cicloEscolar !== 'string' || cicloEscolar.length !== 4 || !/^\d{4}$/.test(cicloEscolar)) {
      return res.status(400).json({
        success: false,
        error: 'cicloEscolar debe ser un año de 4 dígitos (ej. 2026)'
      });
    }

    // Validar formato de fechas (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fechaInicial)) {
      return res.status(400).json({
        success: false,
        error: 'fechaInicial debe tener formato YYYY-MM-DD (ej. 2025-11-06)'
      });
    }
    if (!dateRegex.test(fechaFinal)) {
      return res.status(400).json({
        success: false,
        error: 'fechaFinal debe tener formato YYYY-MM-DD (ej. 2025-11-09)'
      });
    }

    // Llamar al stored procedure con replacements para prevenir SQL injection
    const results = await sequelize.query(
      'CALL sp_ReportePagos(:fechaInicial, :fechaFinal, :cicloEscolar)',
      {
        replacements: {
          fechaInicial: fechaInicial,
          fechaFinal: fechaFinal,
          cicloEscolar: cicloEscolar
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron pagos con los filtros proporcionados'
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error en getReportePagos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener pagos de hoy por ciclo escolar
exports.getPagosHoy = async (req, res) => {
  try {
    const { cicloEscolar } = req.query;

    // Validación obligatoria del ciclo escolar
    if (!cicloEscolar) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro cicloEscolar es obligatorio'
      });
    }

    // Validar formato de ciclo escolar
    if (typeof cicloEscolar !== 'string' || cicloEscolar.length !== 4 || !/^\d{4}$/.test(cicloEscolar)) {
      return res.status(400).json({
        success: false,
        error: 'cicloEscolar debe ser un año de 4 dígitos (ej. 2026)'
      });
    }

    // Llamar al stored procedure con replacements para prevenir SQL injection
    const results = await sequelize.query(
      'CALL sp_PagosHoy(:cicloEscolar)',
      {
        replacements: {
          cicloEscolar: cicloEscolar
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron pagos para hoy'
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error en getPagosHoy:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener alumnos insolventes por ciclo escolar y mes
exports.getInsolventes = async (req, res) => {
  try {
    const { cicloEscolar, mes } = req.query;

    // Validación obligatoria del ciclo escolar
    if (!cicloEscolar) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro cicloEscolar es obligatorio'
      });
    }

    // Validar formato de ciclo escolar
    if (typeof cicloEscolar !== 'string' || cicloEscolar.length !== 4 || !/^\d{4}$/.test(cicloEscolar)) {
      return res.status(400).json({
        success: false,
        error: 'cicloEscolar debe ser un año de 4 dígitos (ej. 2026)'
      });
    }

    // Validación obligatoria del mes
    if (!mes) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro mes es obligatorio'
      });
    }

    // Validar que el mes sea un número entre 1 y 10
    const mesNumero = parseInt(mes, 10);
    if (isNaN(mesNumero) || mesNumero < 1 || mesNumero > 10) {
      return res.status(400).json({
        success: false,
        error: 'El mes debe ser un número entre 1 y 10'
      });
    }

    // Llamar al stored procedure con replacements para prevenir SQL injection
    const results = await sequelize.query(
      'CALL sp_obtenerAlumnosInsolventesPrueba(:cicloEscolar, :mes)',
      {
        replacements: {
          cicloEscolar: cicloEscolar,
          mes: mesNumero
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron alumnos insolventes con los filtros proporcionados'
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error en getInsolventes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener alumnos solventes por ciclo escolar y mes
exports.getSolventes = async (req, res) => {
  try {
    const { cicloEscolar, mes } = req.query;

    // Validación obligatoria del ciclo escolar
    if (!cicloEscolar) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro cicloEscolar es obligatorio'
      });
    }

    // Validar formato de ciclo escolar
    if (typeof cicloEscolar !== 'string' || cicloEscolar.length !== 4 || !/^\d{4}$/.test(cicloEscolar)) {
      return res.status(400).json({
        success: false,
        error: 'cicloEscolar debe ser un año de 4 dígitos (ej. 2026)'
      });
    }

    // Validación obligatoria del mes
    if (!mes) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro mes es obligatorio'
      });
    }

    // Validar que el mes sea un número entre 1 y 10
    const mesNumero = parseInt(mes, 10);
    if (isNaN(mesNumero) || mesNumero < 1 || mesNumero > 10) {
      return res.status(400).json({
        success: false,
        error: 'El mes debe ser un número entre 1 y 10'
      });
    }

    // Llamar al stored procedure con replacements para prevenir SQL injection
    const results = await sequelize.query(
      'CALL sp_obtenerAlumnosSolventes(:cicloEscolar, :mes)',
      {
        replacements: {
          cicloEscolar: cicloEscolar,
          mes: mesNumero
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron alumnos solventes con los filtros proporcionados'
      });
    }

    res.json({ success: true, data: results, total: results.length });
  } catch (error) {
    console.error('Error en getSolventes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Buscar pagos por nombre de recibo, número de recibo y ciclo escolar
exports.buscarPagos = async (req, res) => {
  try {
    const { nombreRecibo, numeroRecibo, cicloEscolar } = req.query;

    // Validación: al menos uno de los filtros opcionales debe estar presente
    if (!nombreRecibo && !numeroRecibo) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar al menos nombreRecibo o numeroRecibo'
      });
    }

    // Validación obligatoria del ciclo escolar
    if (!cicloEscolar) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro cicloEscolar es obligatorio'
      });
    }

    // Validar formato de ciclo escolar
    if (typeof cicloEscolar !== 'string' || cicloEscolar.length !== 4 || !/^\d{4}$/.test(cicloEscolar)) {
      return res.status(400).json({
        success: false,
        error: 'cicloEscolar debe ser un año de 4 dígitos (ej. 2026)'
      });
    }

    // Preparar parámetros (null si no se proporciona)
    const nombreReciboParam = nombreRecibo || null;
    const numeroReciboParam = numeroRecibo || null;

    // Llamar al stored procedure con replacements para prevenir SQL injection
    const results = await sequelize.query(
      'CALL sp_BuscarPagos(:nombreRecibo, :numeroRecibo, :cicloEscolar)',
      {
        replacements: {
          nombreRecibo: nombreReciboParam,
          numeroRecibo: numeroReciboParam,
          cicloEscolar: cicloEscolar
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron pagos con los filtros proporcionados'
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error en buscarPagos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Crear un nuevo pago
exports.create = async (req, res) => {
  try {
    const {
      IdColaborador, Fecha, IdUsuario, IdAlumno, IdTipoPago, Concepto,
      IdMetodoPago, Monto, Anio, NumeroRecibo, NombreRecibo, DireccionRecibo
    } = req.body;

    // Validaciones existentes
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }
    if (!Fecha) return res.status(400).json({ success: false, error: 'Fecha es requerida' });
    if (!IdUsuario || isNaN(IdUsuario)) return res.status(400).json({ success: false, error: 'IdUsuario es requerido y debe ser un número' });
    if (!IdAlumno || isNaN(IdAlumno)) return res.status(400).json({ success: false, error: 'IdAlumno es requerido y debe ser un número' });
    if (!IdTipoPago || isNaN(IdTipoPago)) return res.status(400).json({ success: false, error: 'IdTipoPago es requerido y debe ser un número' });
    if (!Concepto) return res.status(400).json({ success: false, error: 'Concepto es requerido' });
    if (!IdMetodoPago || isNaN(IdMetodoPago)) return res.status(400).json({ success: false, error: 'IdMetodoPago es requerido y debe ser un número' });
    if (!Monto || isNaN(Monto)) return res.status(400).json({ success: false, error: 'Monto es requerido y debe ser un número' });

    // Validación de Anio
    if (!Anio || isNaN(Anio)) {
      return res.status(400).json({ success: false, error: 'Anio es requerido y debe ser un número' });
    }

    // NUEVAS VALIDACIONES
    if (!NombreRecibo || typeof NombreRecibo !== 'string' || NombreRecibo.trim() === '') {
      return res.status(400).json({ success: false, error: 'NombreRecibo es requerido y debe ser texto válido' });
    }
    if (!DireccionRecibo || typeof DireccionRecibo !== 'string' || DireccionRecibo.trim() === '') {
      return res.status(400).json({ success: false, error: 'DireccionRecibo es requerida y debe ser texto válido' });
    }

    const nuevoPago = await Pago.create({
      Fecha,
      IdUsuario,
      IdAlumno,
      IdTipoPago,
      Concepto,
      IdMetodoPago,
      Monto,
      Anio,
      NumeroRecibo,
      NombreRecibo: NombreRecibo.trim(),
      DireccionRecibo: DireccionRecibo.trim(),
      Estado: true,
      CreadoPor: IdColaborador,
      FechaCreado: new Date(),
    });

    res.status(201).json({ success: true, data: nuevoPago });
  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Actualizar un pago
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      IdColaborador, Fecha, IdUsuario, IdAlumno, IdTipoPago, Concepto,
      IdMetodoPago, Monto, Anio, NumeroRecibo, NombreRecibo, DireccionRecibo, Estado
    } = req.body;

    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }

    const pago = await Pago.findByPk(id);
    if (!pago) {
      return res.status(404).json({ success: false, error: 'Pago no encontrado' });
    }

    await pago.update({
      Fecha: Fecha || pago.Fecha,
      IdUsuario: IdUsuario || pago.IdUsuario,
      IdAlumno: IdAlumno || pago.IdAlumno,
      IdTipoPago: IdTipoPago || pago.IdTipoPago,
      Concepto: Concepto || pago.Concepto,
      IdMetodoPago: IdMetodoPago || pago.IdMetodoPago,
      Monto: Monto !== undefined ? Monto : pago.Monto,
      Anio: Anio !== undefined ? Anio : pago.Anio,
      NumeroRecibo: NumeroRecibo !== undefined ? NumeroRecibo : pago.NumeroRecibo,
      // NUEVOS CAMPOS
      NombreRecibo: NombreRecibo !== undefined ? NombreRecibo.trim() : pago.NombreRecibo,
      DireccionRecibo: DireccionRecibo !== undefined ? DireccionRecibo.trim() : pago.DireccionRecibo,
      Estado: Estado !== undefined ? Estado : pago.Estado,
      ModificadoPor: IdColaborador,
      FechaModificado: new Date(),
    });

    res.json({ success: true, data: pago });
  } catch (error) {
    console.error('Error al actualizar pago:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};
// "Eliminar" un pago (cambiar Estado a false)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdColaborador } = req.body;

    // Validar IdColaborador
    if (!IdColaborador || isNaN(IdColaborador)) {
      return res.status(400).json({ success: false, error: 'IdColaborador es requerido y debe ser un número' });
    }

    const pago = await Pago.findByPk(id);
    if (!pago) {
      return res.status(404).json({ success: false, error: 'Pago no encontrado' });
    }

    await pago.update({
      Estado: false,
      ModificadoPor: IdColaborador,
      FechaModificado: new Date(),
    });

    res.json({ success: true, message: 'Pago marcado como inactivo' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
