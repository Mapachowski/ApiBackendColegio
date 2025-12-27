const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Unidad = require('./Unidad');
const Alumno = require('./Alumno');
const AsignacionDocente = require('./AsignacionDocente');

const NotaUnidad = sequelize.define('NotaUnidad', {
  IdNotaUnidad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  IdUnidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'unidades', key: 'IdUnidad' },
  },
  IdAlumno: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'alumnos', key: 'IdAlumno' },
  },
  IdAsignacionDocente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'asignacion_docente', key: 'IdAsignacionDocente' },
  },
  NotaZona: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  NotaFinal: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  NotaTotal: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  Aprobado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  FechaRegistro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  RegistradoPor: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  Estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  tableName: 'notas_unidad',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['IdUnidad', 'IdAlumno'],
      name: 'unique_nota'
    },
    {
      fields: ['IdAlumno'],
      name: 'idx_alumno'
    },
    {
      fields: ['IdUnidad'],
      name: 'idx_unidad'
    }
  ],
});

// Relaciones
NotaUnidad.belongsTo(Unidad, { foreignKey: 'IdUnidad' });
NotaUnidad.belongsTo(Alumno, { foreignKey: 'IdAlumno' });
NotaUnidad.belongsTo(AsignacionDocente, { foreignKey: 'IdAsignacionDocente' });

module.exports = NotaUnidad;
