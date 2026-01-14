const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seccion = sequelize.define('Secciones', {
  IdSeccion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  NombreSeccion: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  Estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // Activo por defecto
    allowNull: false,
  },
}, {
  tableName: 'secciones',
  timestamps: false,
});

module.exports = Seccion;