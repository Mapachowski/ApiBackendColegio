const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Alumno = require('./Alumno');
const Seccion = require('./Seccion');
const Jornada = require('./Jornada');
const Grado = require('./Grado');

const Inscripcion = sequelize.define('Inscripciones', {
  IdInscripcion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  IdAlumno: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'alumnos', key: 'IdAlumno' },
  },
  IdSeccion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'secciones', key: 'IdSeccion' },
  },
  IdJornada: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'jornadas', key: 'IdJornada' },
  },
  IdGrado: {
    type: DataTypes.INTEGER,
    references: { model: 'grados', key: 'IdGrado' },
  },
  CicloEscolar: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  FechaInscripcion: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  Estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // Activo por defecto
    allowNull: false,
  },
  ComentarioEstado: DataTypes.TEXT,
  CreadoPor: DataTypes.INTEGER,
  FechaCreado: DataTypes.DATE,
  ModificadoPor: DataTypes.INTEGER,
  FechaModificado: DataTypes.DATE,
}, {
  tableName: 'inscripciones',
  timestamps: false,
});

// Relaciones
Inscripcion.belongsTo(Alumno, { foreignKey: 'IdAlumno' });
Inscripcion.belongsTo(Seccion, { foreignKey: 'IdSeccion' });
Inscripcion.belongsTo(Jornada, { foreignKey: 'IdJornada' });
Inscripcion.belongsTo(Grado, { foreignKey: 'IdGrado' });

// Relación inversa: Un alumno tiene muchas inscripciones
Alumno.hasMany(Inscripcion, { foreignKey: 'IdAlumno' });

module.exports = Inscripcion;