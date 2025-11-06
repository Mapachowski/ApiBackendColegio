const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Nivel = require('./Nivel');  // Importa para relación

const Grado = sequelize.define('Grados', {
  IdGrado: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  NombreGrado: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  IdNivel: {
    type: DataTypes.INTEGER,
    references: { model: 'Niveles', key: 'IdNivel' },
  },
  Mensualidad: {
    type: DataTypes.DECIMAL(10, 2),
  },
  ValorInscripcion: {
    type: DataTypes.DECIMAL(10, 2),
  },
  Estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // Activo por defecto
    allowNull: false,
  },
  CreadoPor: DataTypes.INTEGER,
  FechaCreado: DataTypes.DATE,
  ModificadoPor: DataTypes.INTEGER,
  FechaModificado: DataTypes.DATE,
}, {
  tableName: 'Grados',
  timestamps: false,  // Desactiva createdAt/updatedAt automáticos
});

// Relación
Grado.belongsTo(Nivel, { foreignKey: 'IdNivel' });

module.exports = Grado;