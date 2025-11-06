const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Rol = require('./Rol');

const Usuario = sequelize.define('Usuarios', {
  IdUsuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  NombreUsuario: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  NombreCompleto: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  Contrasena: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  IdRol: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Roles', key: 'IdRol' },
  },
  Estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // Activo por defecto
    allowNull: false,
  },
  CreadoPor: DataTypes.INTEGER,
  FechaCreado: DataTypes.DATE,
  ModificadoPor: DataTypes.INTEGER,
  FechaModificado: DataTypes.DATE,
}, {
  tableName: 'Usuarios',
  timestamps: false,
});

// Relación
Usuario.belongsTo(Rol, { foreignKey: 'IdRol' });

module.exports = Usuario;