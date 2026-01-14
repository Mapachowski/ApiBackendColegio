-- Migración: Agregar columna NoOrden a la tabla cursos
-- Fecha: 2025-12-09
-- Descripción: Añade campo NoOrden para ordenar los cursos

-- Agregar columna NoOrden a la tabla cursos
ALTER TABLE cursos
ADD COLUMN NoOrden INT NOT NULL;

-- Crear índice para mejorar el rendimiento de consultas ordenadas
CREATE INDEX IDX_Cursos_NoOrden ON cursos(NoOrden);
