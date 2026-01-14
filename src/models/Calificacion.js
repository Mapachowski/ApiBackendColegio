const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Actividad = require('./Actividad');
const Alumno = require('./Alumno');

const Calificacion = sequelize.define('Calificacion', {
  IdCalificacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  IdActividad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'actividades', key: 'IdActividad' },
  },
  IdAlumno: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'alumnos', key: 'IdAlumno' },
  },
  Punteo: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true, // NULL hasta que se ingrese la calificación
  },
  Observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  tableName: 'calificaciones',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['IdActividad', 'IdAlumno'],
    },
  ],
});

// Relaciones
Calificacion.belongsTo(Actividad, { foreignKey: 'IdActividad' });
Calificacion.belongsTo(Alumno, { foreignKey: 'IdAlumno' });

module.exports = Calificacion;
