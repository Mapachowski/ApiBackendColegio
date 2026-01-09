-- ============================================
-- TRIGGER: Asignación automática de actividades a estudiantes
-- ============================================
--
-- Propósito:
-- Cuando un docente crea una actividad para una unidad,
-- automáticamente se crean registros en la tabla 'calificaciones'
-- para TODOS los estudiantes inscritos en esa sección/grado/jornada.
--
-- Flujo:
-- 1. Se inserta una nueva actividad en la tabla 'actividades'
-- 2. El trigger busca la asignación docente asociada a esa unidad
-- 3. Obtiene todos los alumnos inscritos en esa sección/grado/jornada
-- 4. Crea un registro en 'calificaciones' por cada alumno
--    (con Punteo = NULL, será llenado cuando el docente califique)
-- ============================================

DELIMITER $$

DROP TRIGGER IF EXISTS trg_asignar_actividad_estudiantes$$

CREATE TRIGGER trg_asignar_actividad_estudiantes
AFTER INSERT ON actividades
FOR EACH ROW
BEGIN
    -- Variables para almacenar información de la asignación
    DECLARE v_IdAsignacion INT;
    DECLARE v_IdGrado INT;
    DECLARE v_IdSeccion INT;
    DECLARE v_IdJornada INT;
    DECLARE v_Anio INT;

    -- Obtener información de la asignación docente a partir de la unidad
    SELECT
        ad.IdAsignacionDocente,
        ad.IdGrado,
        ad.IdSeccion,
        ad.IdJornada,
        ad.Anio
    INTO
        v_IdAsignacion,
        v_IdGrado,
        v_IdSeccion,
        v_IdJornada,
        v_Anio
    FROM unidades u
    INNER JOIN asignacion_docente ad ON u.IdAsignacionDocente = ad.IdAsignacionDocente
    WHERE u.IdUnidad = NEW.IdUnidad
    LIMIT 1;

    -- Si se encontró la asignación, crear calificaciones para los estudiantes
    IF v_IdAsignacion IS NOT NULL THEN

        -- Insertar un registro de calificación por cada alumno inscrito
        -- en esa sección, grado, jornada y año
        INSERT INTO calificaciones (
            IdActividad,
            IdAlumno,
            Punteo,
            Observaciones,
            FechaRegistro,
            CreadoPor,
            FechaCreado
        )
        SELECT
            NEW.IdActividad,           -- La actividad recién creada
            i.IdAlumno,                -- Cada alumno inscrito
            NULL,                      -- Punteo vacío (se llenará al calificar)
            NULL,                      -- Sin observaciones inicialmente
            NOW(),                     -- Fecha de registro
            NEW.CreadoPor,             -- Mismo usuario que creó la actividad
            NOW()                      -- Fecha de creación
        FROM inscripciones i
        WHERE
            i.IdGrado = v_IdGrado
            AND i.IdSeccion = v_IdSeccion
            AND i.IdJornada = v_IdJornada
            AND i.CicloEscolar = v_Anio
            AND i.Estado = 1           -- Solo inscripciones activas
            AND NOT EXISTS (           -- Evitar duplicados (por si acaso)
                SELECT 1
                FROM calificaciones c
                WHERE c.IdActividad = NEW.IdActividad
                AND c.IdAlumno = i.IdAlumno
            );

    END IF;

END$$

DELIMITER ;

-- ============================================
-- VERIFICACIÓN DEL TRIGGER
-- ============================================

-- Ver que el trigger se creó correctamente
SHOW TRIGGERS LIKE 'actividades';

-- ============================================
-- PRUEBA DEL TRIGGER
-- ============================================
-- NOTA: Ejecutar estas pruebas solo si quieres verificar que funciona
-- Comentar o descomentar según necesites

/*
-- 1. Ver estudiantes que deberían recibir la actividad
SELECT
    i.IdAlumno,
    a.NombreCompleto,
    i.IdGrado,
    i.IdSeccion,
    i.IdJornada,
    i.CicloEscolar
FROM inscripciones i
INNER JOIN alumnos a ON i.IdAlumno = a.IdAlumno
WHERE
    i.IdGrado = (SELECT IdGrado FROM asignacion_docente
                 INNER JOIN unidades ON asignacion_docente.IdAsignacionDocente = unidades.IdAsignacionDocente
                 WHERE unidades.IdUnidad = 1 LIMIT 1)
    AND i.IdSeccion = (SELECT IdSeccion FROM asignacion_docente
                       INNER JOIN unidades ON asignacion_docente.IdAsignacionDocente = unidades.IdAsignacionDocente
                       WHERE unidades.IdUnidad = 1 LIMIT 1)
    AND i.IdJornada = (SELECT IdJornada FROM asignacion_docente
                       INNER JOIN unidades ON asignacion_docente.IdAsignacionDocente = unidades.IdAsignacionDocente
                       WHERE unidades.IdUnidad = 1 LIMIT 1)
    AND i.Estado = 1;

-- 2. Crear una actividad de prueba (esto disparará el trigger)
INSERT INTO actividades (
    IdUnidad,
    NombreActividad,
    Descripcion,
    PunteoMaximo,
    TipoActividad,
    FechaActividad,
    Estado,
    CreadoPor,
    FechaCreado
) VALUES (
    1,                              -- IdUnidad (ajustar según tu BD)
    'Prueba Trigger',               -- Nombre
    'Actividad creada para probar el trigger',
    5.00,                           -- Punteo
    'zona',                         -- Tipo
    '2025-12-30',                   -- Fecha
    1,                              -- Activo
    'admin',                        -- Creado por
    NOW()                           -- Fecha creación
);

-- 3. Verificar que se crearon las calificaciones automáticamente
SELECT
    c.IdCalificacion,
    c.IdActividad,
    c.IdAlumno,
    a.NombreCompleto AS Alumno,
    c.Punteo,
    c.FechaRegistro
FROM calificaciones c
INNER JOIN alumnos a ON c.IdAlumno = a.IdAlumno
WHERE c.IdActividad = LAST_INSERT_ID()
ORDER BY a.NombreCompleto;

-- 4. Limpiar la prueba (opcional)
-- DELETE FROM calificaciones WHERE IdActividad = LAST_INSERT_ID();
-- DELETE FROM actividades WHERE IdActividad = LAST_INSERT_ID();
*/

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
--
-- 1. El trigger se ejecuta AUTOMÁTICAMENTE cada vez que se inserta
--    una actividad en la tabla 'actividades'
--
-- 2. Crea registros en 'calificaciones' con Punteo = NULL
--    El docente los llenará cuando califique
--
-- 3. Usa la relación:
--    actividades → unidades → asignacion_docente → inscripciones → alumnos
--
-- 4. Solo asigna a estudiantes con Estado = 1 (activos)
--
-- 5. Evita duplicados verificando que no exista ya una calificación
--    para ese alumno en esa actividad
--
-- 6. Si necesitas ELIMINAR el trigger:
--    DROP TRIGGER IF EXISTS trg_asignar_actividad_estudiantes;
--
-- ============================================
