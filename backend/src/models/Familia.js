const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');

const Familia = sequelize.define('Familias', {
  IdFamilia: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  NombreFamilia: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  Direccion: DataTypes.STRING(255),
  TelefonoContacto: DataTypes.STRING(50),
  EmailContacto: DataTypes.STRING(255),
  NombreRecibo: DataTypes.STRING(50),
  DireccionRecibo: DataTypes.STRING(50),
  IdUsuario: {
    type: DataTypes.INTEGER,
    references: { model: 'Usuarios', key: 'IdUsuario' },
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
  tableName: 'Familias',
  timestamps: false,
});

// Relación
Familia.belongsTo(Usuario, { foreignKey: 'IdUsuario' });

module.exports = Familia;