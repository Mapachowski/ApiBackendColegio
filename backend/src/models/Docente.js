const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');

const Docente = sequelize.define('Docente', {
  idDocente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  idUsuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'usuarios', key: 'IdUsuario' },
  },
  NombreDocente: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  DPI: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  Email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  Telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  Especialidad: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  Estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  CreadoPor: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  FechaCreado: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ModificadoPor: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  FechaModificado: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'docentes',
  timestamps: false,
});

// Relaciones
Docente.belongsTo(Usuario, { foreignKey: 'idUsuario' });

module.exports = Docente;
