-- ========================================
-- FASE 1 - Crear Tabla: estado_cursos_unidad
-- ========================================
-- Propósito: Almacenar el estado de validación de cada curso
--            en cada unidad (listo para cierre o con pendientes)
-- Fecha: 2025-12-29
-- ========================================

CREATE TABLE IF NOT EXISTS estado_cursos_unidad (
  IdEstado INT PRIMARY KEY AUTO_INCREMENT,
  IdUnidad INT NOT NULL COMMENT 'FK a unidades',
  IdCurso INT NOT NULL COMMENT 'FK a cursos',
  IdDocente INT NOT NULL COMMENT 'FK a usuarios (docente asignado)',

  -- Validación de actividades
  ActividadesSuman100 BOOLEAN DEFAULT FALSE COMMENT 'Si las actividades del curso suman 100',
  PuntajeActual DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Puntaje actual que suman las actividades',

  -- Validación de calificaciones
  TotalEstudiantes INT DEFAULT 0 COMMENT 'Total de estudiantes en el curso',
  EstudiantesCalificados INT DEFAULT 0 COMMENT 'Estudiantes que tienen todas las actividades calificadas',
  PorcentajeCompletado DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Porcentaje de estudiantes calificados (0-100)',

  -- Estado general
  EstadoGeneral ENUM('LISTO', 'PENDIENTE', 'INCOMPLETO') DEFAULT 'PENDIENTE' COMMENT 'Estado del curso',
  DetallesPendientes TEXT NULL COMMENT 'JSON con lista de pendientes específicos',

  -- Auditoría
  UltimaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (IdUnidad) REFERENCES unidades(IdUnidad) ON DELETE CASCADE,
  FOREIGN KEY (IdCurso) REFERENCES cursos(idCurso) ON DELETE CASCADE,
  FOREIGN KEY (IdDocente) REFERENCES usuarios(IdUsuario) ON DELETE CASCADE,

  UNIQUE KEY unique_curso_unidad (IdUnidad, IdCurso),
  INDEX idx_estado (EstadoGeneral),
  INDEX idx_unidad (IdUnidad),
  INDEX idx_docente (IdDocente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Estado de validación de cada curso en cada unidad';

-- Verificar creación
SELECT
  TABLE_NAME,
  TABLE_COMMENT,
  CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'estado_cursos_unidad';
