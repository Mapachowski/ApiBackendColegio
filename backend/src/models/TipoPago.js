const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TipoPago = sequelize.define('TiposPago', {
  IdTipoPago: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  NombreTipoPago: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  Estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // Activo por defecto
    allowNull: false,
  },
}, {
  tableName: 'TiposPago',
  timestamps: false,
});

module.exports = TipoPago;