const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificacionDocente = sequelize.define('NotificacionesDocentes', {
  IdNotificacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  IdDocente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK a usuarios (docente)',
  },
  IdCurso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK a cursos',
  },
  IdUnidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK a unidades',
  },
  TipoNotificacion: {
    type: DataTypes.ENUM(
      'ACTIVIDADES_INCOMPLETAS',
      'CALIFICACIONES_PENDIENTES',
      'FECHA_LIMITE'
    ),
    allowNull: false,
    comment: 'Tipo de notificación',
  },
  Mensaje: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Mensaje descriptivo de la notificación',
  },
  FechaLimite: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha límite para completar pendientes',
  },
  Leida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Si el docente ya leyó la notificación',
  },
  FechaCreacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  FechaLeida: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Cuándo el docente marcó como leída',
  },
}, {
  tableName: 'notificaciones_docentes',
  timestamps: false,
});

module.exports = NotificacionDocente;
