const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Unidad = require('./Unidad');

const Actividad = sequelize.define('Actividad', {
  IdActividad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  IdUnidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'unidades', key: 'IdUnidad' },
  },
  NombreActividad: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  Descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  PunteoMaximo: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  TipoActividad: {
    type: DataTypes.ENUM('zona', 'final'),
    allowNull: false,
  },
  FechaActividad: {
    type: DataTypes.DATEONLY,
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
  tableName: 'actividades',
  timestamps: false,
});

// Relaciones
Actividad.belongsTo(Unidad, { foreignKey: 'IdUnidad' });

module.exports = Actividad;
