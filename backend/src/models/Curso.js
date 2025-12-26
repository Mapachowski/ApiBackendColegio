const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Grado = require('./Grado');

const Curso = sequelize.define('Curso', {
  idCurso: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  idGrado: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'grados', key: 'IdGrado' },
  },
  Curso: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  CodigoSire: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  NoOrden: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  Estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  tableName: 'cursos',
  timestamps: false,
});

// Relaciones
Curso.belongsTo(Grado, { foreignKey: 'idGrado' });

module.exports = Curso;
