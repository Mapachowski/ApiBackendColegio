const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EstadoCursoUnidad = sequelize.define('EstadoCursosUnidad', {
  IdEstado: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  IdUnidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK a unidades',
  },
  IdCurso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK a cursos',
  },
  IdDocente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK a usuarios (docente asignado)',
  },
  // Validación de actividades
  ActividadesSuman100: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Si las actividades del curso suman 100',
  },
  PuntajeActual: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    allowNull: false,
    comment: 'Puntaje actual que suman las actividades',
  },
  // Validación de calificaciones
  TotalEstudiantes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Total de estudiantes en el curso',
  },
  EstudiantesCalificados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Estudiantes que tienen todas las actividades calificadas',
  },
  PorcentajeCompletado: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    allowNull: false,
    comment: 'Porcentaje de estudiantes calificados (0-100)',
  },
  // Estado general
  EstadoGeneral: {
    type: DataTypes.ENUM('LISTO', 'PENDIENTE', 'INCOMPLETO'),
    defaultValue: 'PENDIENTE',
    allowNull: false,
    comment: 'Estado del curso',
  },
  DetallesPendientes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON con lista de pendientes específicos',
    get() {
      const rawValue = this.getDataValue('DetallesPendientes');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('DetallesPendientes', value ? JSON.stringify(value) : null);
    },
  },
  // Auditoría
  UltimaActualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  tableName: 'estado_cursos_unidad',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['IdUnidad', 'IdCurso'],
      name: 'unique_curso_unidad',
    },
  ],
});

module.exports = EstadoCursoUnidad;
