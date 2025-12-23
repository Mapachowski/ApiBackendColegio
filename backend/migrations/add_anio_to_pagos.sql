-- Migración: Agregar columna Anio a la tabla pagos
-- Fecha: 2025-12-09
-- Descripción: Añade campo Anio para registro del año del pago

-- Agregar columna Anio a la tabla pagos
ALTER TABLE pagos
ADD COLUMN Anio INT NULL;

-- Crear índice para mejorar el rendimiento de consultas por año
CREATE INDEX IDX_Pagos_Anio ON pagos(Anio);
