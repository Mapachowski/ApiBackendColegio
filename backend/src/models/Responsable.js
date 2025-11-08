const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Familia = require('./Familia');
const ResponsableTipo = require('./ResponsableTipo'); // Importamos el nuevo modelo

const Responsable = sequelize.define('Responsables', {
  IdResponsable: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  NombreResponsable: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  DPI: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  NIT: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  IdFamilia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'familias', key: 'IdFamilia' },
  },
  IdResponsableTipo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'responsabletipo',
      key: 'IdResponsableTipo'
    },
    comment: 'Tipo de responsable: Padre, Madre, Tutor, etc.'
  },
  EsResponsable: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  Activo: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    allowNull: false,
  },
  CreadoPor: DataTypes.INTEGER,
  FechaCreado: DataTypes.DATE,
  ModificadoPor: DataTypes.INTEGER,
  FechaModificado: DataTypes.DATE,
}, {
  tableName: 'responsables',
  timestamps: false,
});

// Relación con Familia (ya existente)
Responsable.belongsTo(Familia, { foreignKey: 'IdFamilia' });

// NUEVA RELACIÓN: Responsable → ResponsableTipo
Responsable.belongsTo(ResponsableTipo, {
  foreignKey: 'IdResponsableTipo',
  as: 'TipoResponsable'
});

module.exports = Responsable;