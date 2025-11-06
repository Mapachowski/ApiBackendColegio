const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Nivel = sequelize.define('Niveles', {
  IdNivel: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  NombreNivel: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  Estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // Activo por defecto
    allowNull: false,
  },
}, {
  tableName: 'Niveles',
  timestamps: false,
});

module.exports = Nivel;