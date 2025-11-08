const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Alumno = require('./Alumno');

const FichaMedica = sequelize.define('FichasMedicas', {
  IdFichaMedica: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  IdAlumno: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'alumnos', key: 'IdAlumno' },
  },
  Padecimiento: {
    type: DataTypes.STRING(55),
    allowNull: true,
  },
  Medicamento: {
    type: DataTypes.STRING(55),
    allowNull: true,
  },
  Observaciones: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'fichasmedicas',
  timestamps: false,
});

// Relación
FichaMedica.belongsTo(Alumno, { foreignKey: 'IdAlumno' });

module.exports = FichaMedica;