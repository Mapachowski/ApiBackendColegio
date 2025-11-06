const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Jornada = sequelize.define('Jornadas', {
  IdJornada: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  NombreJornada: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  Estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // Activo por defecto
    allowNull: false,
  },
}, {
  tableName: 'Jornadas',
  timestamps: false,
});

module.exports = Jornada;