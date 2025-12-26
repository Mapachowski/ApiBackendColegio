const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const AsignacionDocente = require('./AsignacionDocente');

const Unidad = sequelize.define('Unidad', {
  IdUnidad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  IdAsignacionDocente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'asignacion_docente', key: 'IdAsignacionDocente' },
  },
  NumeroUnidad: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: {
      min: 1,
      max: 4,
    },
  },
  NombreUnidad: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  PunteoZona: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 60.00,
    allowNull: false,
  },
  PunteoFinal: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 40.00,
    allowNull: false,
  },
  Activa: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: false,
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
  tableName: 'unidades',
  timestamps: false,
});

// Relaciones
Unidad.belongsTo(AsignacionDocente, { foreignKey: 'IdAsignacionDocente' });

module.exports = Unidad;
