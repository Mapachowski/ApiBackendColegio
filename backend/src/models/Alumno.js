const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Familia = require('./Familia');

const Alumno = sequelize.define('Alumnos', {
  IdAlumno: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Matricula: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  Nombres: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  Apellidos: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  FechaNacimiento: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  Genero: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  IdFamilia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'familias', key: 'IdFamilia' },
  },
  Estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  CreadoPor: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  FechaCreado: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ModificadoPor: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  FechaModificado: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ContactoEmergencia: {
    type: DataTypes.STRING(60),
    allowNull: true, // Cambia a false si debe ser obligatorio
  },
  NumeroEmergencia: {
    type: DataTypes.STRING(12),
    allowNull: true, // Cambia a false si debe ser obligatorio
  },
  ComunidadLinguistica: {
    type: DataTypes.STRING(4),
    allowNull: true, // Cambia a false si debe ser obligatorio
  },
}, {
  tableName: 'alumnos',
  timestamps: false,
});

// Relación
Alumno.belongsTo(Familia, { foreignKey: 'IdFamilia' });

module.exports = Alumno;