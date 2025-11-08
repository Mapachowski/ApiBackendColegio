const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Alumno = require('./Alumno');
const TipoPago = require('./TipoPago');
const MetodoPago = require('./MetodoPago');

const Pago = sequelize.define('Pagos', {
  IdPago: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  IdUsuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'IdUsuario' },
  },
  IdAlumno: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'alumnos', key: 'IdAlumno' },
  },
  IdTipoPago: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'tiposPago', key: 'IdTipoPago' },
  },
  Concepto: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  IdMetodoPago: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'metodosPago', key: 'IdMetodoPago' },
  },
  Monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  Estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  CreadoPor: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  FechaCreado: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ModificadoPor: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  FechaModificado: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  NumeroRecibo: {
    type: DataTypes.STRING(55),
    allowNull: true, // Cambia a false si debe ser obligatorio
  },
    NombreRecibo: {
    type: DataTypes.STRING(255),
    allowNull: true, // Cambia a false si debe ser obligatorio
  },
    DireccionRecibo: {
    type: DataTypes.STRING(255),
    allowNull: true, // Cambia a false si debe ser obligatorio
  },
}, {
  tableName: 'pagos',
  timestamps: false,
});

// Relaciones
Pago.belongsTo(Usuario, { foreignKey: 'IdUsuario' });
Pago.belongsTo(Alumno, { foreignKey: 'IdAlumno' });
Pago.belongsTo(TipoPago, { foreignKey: 'IdTipoPago' });
Pago.belongsTo(MetodoPago, { foreignKey: 'IdMetodoPago' });

module.exports = Pago;