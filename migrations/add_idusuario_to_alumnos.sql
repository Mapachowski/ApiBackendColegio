-- Migración: Agregar columna IdUsuario a la tabla alumnos
-- Fecha: 2025-12-09
-- Descripción: Añade relación entre Alumnos y Usuarios

-- Agregar columna IdUsuario a la tabla alumnos
ALTER TABLE alumnos
ADD COLUMN IdUsuario INT NULL;

-- Agregar clave foránea hacia la tabla usuarios
ALTER TABLE alumnos
ADD CONSTRAINT FK_Alumnos_Usuarios
FOREIGN KEY (IdUsuario) REFERENCES usuarios(IdUsuario)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Crear índice para mejorar el rendimiento de consultas
CREATE INDEX IDX_Alumnos_IdUsuario ON alumnos(IdUsuario);
