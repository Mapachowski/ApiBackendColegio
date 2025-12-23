const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');

const Bitacora = sequelize.define('Bitacora', {
  IdBitacora: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Accion: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  FechaBitacora: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  Ordenador: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  IdUsuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'IdUsuario' },
  },
  Observacion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'bitacora',
  timestamps: false,
});

// Relación
Bitacora.belongsTo(Usuario, { foreignKey: 'IdUsuario' });

module.exports = Bitacora;