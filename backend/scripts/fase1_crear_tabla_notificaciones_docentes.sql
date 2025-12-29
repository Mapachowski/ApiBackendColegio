-- ========================================
-- FASE 1 - Crear Tabla: notificaciones_docentes
-- ========================================
-- Propósito: Almacenar notificaciones sobre actividades incompletas
--            y calificaciones pendientes para docentes
-- Fecha: 2025-12-29
-- ========================================

CREATE TABLE IF NOT EXISTS notificaciones_docentes (
  IdNotificacion INT PRIMARY KEY AUTO_INCREMENT,
  IdDocente INT NOT NULL COMMENT 'FK a usuarios (docente)',
  IdCurso INT NOT NULL COMMENT 'FK a cursos',
  IdUnidad INT NOT NULL COMMENT 'FK a unidades',

  TipoNotificacion ENUM(
    'ACTIVIDADES_INCOMPLETAS',
    'CALIFICACIONES_PENDIENTES',
    'FECHA_LIMITE'
  ) NOT NULL COMMENT 'Tipo de notificación',

  Mensaje TEXT NOT NULL COMMENT 'Mensaje descriptivo de la notificación',
  FechaLimite DATETIME NULL COMMENT 'Fecha límite para completar pendientes',

  Leida BOOLEAN DEFAULT FALSE COMMENT 'Si el docente ya leyó la notificación',
  FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FechaLeida DATETIME NULL COMMENT 'Cuándo el docente marcó como leída',

  FOREIGN KEY (IdDocente) REFERENCES usuarios(IdUsuario) ON DELETE CASCADE,
  FOREIGN KEY (IdCurso) REFERENCES cursos(idCurso) ON DELETE CASCADE,
  FOREIGN KEY (IdUnidad) REFERENCES unidades(IdUnidad) ON DELETE CASCADE,

  INDEX idx_docente_leida (IdDocente, Leida),
  INDEX idx_fecha_limite (FechaLimite),
  INDEX idx_fecha_creacion (FechaCreacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Notificaciones para docentes sobre pendientes en calificaciones';

-- Verificar creación
SELECT
  TABLE_NAME,
  TABLE_COMMENT,
  CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'notificaciones_docentes';
