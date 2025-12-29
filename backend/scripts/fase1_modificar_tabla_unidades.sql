-- ========================================
-- FASE 1 - Modificar Tabla: unidades
-- ========================================
-- Propósito: Agregar campos para control de cierre de unidades
--            por parte del administrador
-- Fecha: 2025-12-29
-- ========================================

-- Agregar columna Cerrada (si no existe)
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'unidades'
    AND COLUMN_NAME = 'Cerrada'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE unidades ADD COLUMN Cerrada BOOLEAN DEFAULT FALSE COMMENT ''Si la unidad está cerrada por el administrador''',
  'SELECT ''Columna Cerrada ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna FechaCierre (si no existe)
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'unidades'
    AND COLUMN_NAME = 'FechaCierre'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE unidades ADD COLUMN FechaCierre DATETIME NULL COMMENT ''Cuándo se cerró la unidad''',
  'SELECT ''Columna FechaCierre ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna CerradaPorAdmin (si no existe)
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'unidades'
    AND COLUMN_NAME = 'CerradaPorAdmin'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE unidades ADD COLUMN CerradaPorAdmin INT NULL COMMENT ''FK a usuarios (administrador que cerró)''',
  'SELECT ''Columna CerradaPorAdmin ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna FechaLimiteCalificacion (si no existe)
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'unidades'
    AND COLUMN_NAME = 'FechaLimiteCalificacion'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE unidades ADD COLUMN FechaLimiteCalificacion DATETIME NULL COMMENT ''Fecha límite para que docentes completen calificaciones''',
  'SELECT ''Columna FechaLimiteCalificacion ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna NotificacionesEnviadas (si no existe)
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'unidades'
    AND COLUMN_NAME = 'NotificacionesEnviadas'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE unidades ADD COLUMN NotificacionesEnviadas BOOLEAN DEFAULT FALSE COMMENT ''Si ya se enviaron notificaciones a docentes''',
  'SELECT ''Columna NotificacionesEnviadas ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar índice idx_cerrada (si no existe)
SET @idx_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'unidades'
    AND INDEX_NAME = 'idx_cerrada'
);

SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE unidades ADD INDEX idx_cerrada (Cerrada)',
  'SELECT ''Índice idx_cerrada ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar índice idx_fecha_limite (si no existe)
SET @idx_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'unidades'
    AND INDEX_NAME = 'idx_fecha_limite'
);

SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE unidades ADD INDEX idx_fecha_limite (FechaLimiteCalificacion)',
  'SELECT ''Índice idx_fecha_limite ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar índice idx_fecha_cierre (si no existe)
SET @idx_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'unidades'
    AND INDEX_NAME = 'idx_fecha_cierre'
);

SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE unidades ADD INDEX idx_fecha_cierre (FechaCierre)',
  'SELECT ''Índice idx_fecha_cierre ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar foreign key (si no existe)
SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'unidades'
    AND CONSTRAINT_NAME = 'fk_cerrada_por_admin'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE unidades
   ADD CONSTRAINT fk_cerrada_por_admin
     FOREIGN KEY (CerradaPorAdmin)
     REFERENCES usuarios(IdUsuario)
     ON DELETE SET NULL',
  'SELECT ''Foreign key fk_cerrada_por_admin ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar cambios
SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  COLUMN_DEFAULT,
  IS_NULLABLE,
  COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'unidades'
  AND COLUMN_NAME IN (
    'Cerrada',
    'FechaCierre',
    'CerradaPorAdmin',
    'FechaLimiteCalificacion',
    'NotificacionesEnviadas'
  );
