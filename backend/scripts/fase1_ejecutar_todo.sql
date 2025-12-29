-- ========================================
-- FASE 1 - SCRIPT MAESTRO
-- Sistema de Cierre de Unidades - Base de Datos
-- ========================================
-- Fecha: 2025-12-29
-- Propósito: Ejecutar todos los scripts de Fase 1 en orden
-- ========================================

-- IMPORTANTE: Ejecutar este script en MySQL Workbench o desde la línea de comandos
-- mysql -u root -p colegio_db < fase1_ejecutar_todo.sql

USE colegio_db;

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;

-- ========================================
-- PASO 1: Crear tabla notificaciones_docentes
-- ========================================
SELECT '========================================' AS '';
SELECT 'PASO 1: Creando tabla notificaciones_docentes...' AS '';
SELECT '========================================' AS '';

SOURCE fase1_crear_tabla_notificaciones_docentes.sql;

-- ========================================
-- PASO 2: Crear tabla estado_cursos_unidad
-- ========================================
SELECT '========================================' AS '';
SELECT 'PASO 2: Creando tabla estado_cursos_unidad...' AS '';
SELECT '========================================' AS '';

SOURCE fase1_crear_tabla_estado_cursos_unidad.sql;

-- ========================================
-- PASO 3: Modificar tabla unidades
-- ========================================
SELECT '========================================' AS '';
SELECT 'PASO 3: Modificando tabla unidades...' AS '';
SELECT '========================================' AS '';

SOURCE fase1_modificar_tabla_unidades.sql;

-- ========================================
-- PASO 4: Insertar datos de prueba
-- ========================================
SELECT '========================================' AS '';
SELECT 'PASO 4: Insertando datos de prueba...' AS '';
SELECT '========================================' AS '';
SELECT 'NOTA: Ajustar IDs de cursos y docentes según tu BD' AS '';
SELECT '========================================' AS '';

-- Comentar la siguiente línea si NO quieres insertar datos de prueba
-- SOURCE fase1_datos_prueba.sql;

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================
SELECT '========================================' AS '';
SELECT 'VERIFICACIÓN FINAL' AS '';
SELECT '========================================' AS '';

-- Verificar tablas creadas
SELECT
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME,
  TABLE_COMMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'notificaciones_docentes',
    'estado_cursos_unidad',
    'unidades'
  )
ORDER BY TABLE_NAME;

-- Verificar columnas nuevas en unidades
SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'unidades'
  AND COLUMN_NAME IN (
    'Cerrada',
    'FechaCierre',
    'CerradaPorAdmin',
    'FechaLimiteCalificacion',
    'NotificacionesEnviadas'
  )
ORDER BY ORDINAL_POSITION;

-- Verificar foreign keys
SELECT
  CONSTRAINT_NAME,
  TABLE_NAME,
  REFERENCED_TABLE_NAME,
  DELETE_RULE
FROM information_schema.REFERENTIAL_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('notificaciones_docentes', 'estado_cursos_unidad', 'unidades')
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

SELECT '========================================' AS '';
SELECT '✅ FASE 1 COMPLETADA EXITOSAMENTE' AS '';
SELECT '========================================' AS '';
