const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Unidad = require('./Unidad');
const Docente = require('./Docente');

const SolicitudReapertura = sequelize.define('SolicitudReapertura', {
  IdSolicitud: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  IdUnidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'unidades', key: 'IdUnidad' },
  },
  SolicitadoPor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'IdDocente que solicita',
    references: { model: 'docentes', key: 'idDocente' },
  },
  Motivo: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  Estado: {
    type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada'),
    defaultValue: 'pendiente',
    allowNull: false,
  },
  AprobadoPor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'IdUsuario del admin que procesó',
    references: { model: 'usuarios', key: 'IdUsuario' },
  },
  ObservacionesAprobacion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  FechaSolicitud: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  FechaAprobacion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'solicitudes_reapertura',
  timestamps: false,
  indexes: [
    {
      fields: ['Estado'],
      name: 'idx_estado'
    },
    {
      fields: ['IdUnidad'],
      name: 'idx_unidad'
    },
    {
      fields: ['SolicitadoPor'],
      name: 'idx_solicitante'
    }
  ],
});

// Relaciones
SolicitudReapertura.belongsTo(Unidad, { foreignKey: 'IdUnidad' });
SolicitudReapertura.belongsTo(Docente, { foreignKey: 'SolicitadoPor' });

module.exports = SolicitudReapertura;
