const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const ResponsableTipo = sequelize.define('ResponsableTipo', {
  IdResponsableTipo: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  Tipo: {
    type: Sequelize.STRING(50),
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'ResponsableTipo',
  timestamps: false, // No tiene campos createdAt/updatedAt
  freezeTableName: true
});

module.exports = ResponsableTipo;