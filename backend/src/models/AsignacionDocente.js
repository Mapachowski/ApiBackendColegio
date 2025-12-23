const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Docente = require('./Docente');
const Curso = require('./Curso');
const Grado = require('./Grado');
const Seccion = require('./Seccion');
const Jornada = require('./Jornada');

const AsignacionDocente = sequelize.define('AsignacionDocente', {
  IdAsignacionDocente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  IdDocente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'docentes', key: 'idDocente' },
  },
  IdCurso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'cursos', key: 'idCurso' },
  },
  IdGrado: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'grados', key: 'IdGrado' },
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
  Anio: {
    type: DataTypes.INTEGER,
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
  tableName: 'asignacion_docente',
  timestamps: false,
});

// Relaciones
AsignacionDocente.belongsTo(Docente, { foreignKey: 'IdDocente' });
AsignacionDocente.belongsTo(Curso, { foreignKey: 'IdCurso' });
AsignacionDocente.belongsTo(Grado, { foreignKey: 'IdGrado' });
AsignacionDocente.belongsTo(Seccion, { foreignKey: 'IdSeccion' });
AsignacionDocente.belongsTo(Jornada, { foreignKey: 'IdJornada' });

module.exports = AsignacionDocente;
