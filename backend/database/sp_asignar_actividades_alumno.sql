-- =====================================================
-- Stored Procedure: sp_asignar_actividades_alumno
-- Descripción: Asigna calificaciones a un alumno
--              inscrito fuera de tiempo
-- =====================================================
-- Uso: CALL sp_asignar_actividades_alumno(IdInscripcion, IdColaborador);
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS sp_asignar_actividades_alumno //

CREATE PROCEDURE sp_asignar_actividades_alumno(
    IN p_IdInscripcion INT,
    IN p_IdColaborador INT
)
BEGIN
    -- Variables
    DECLARE v_IdAlumno INT;
    DECLARE v_IdGrado INT;
    DECLARE v_IdSeccion INT;
    DECLARE v_IdJornada INT;
    DECLARE v_CicloEscolar VARCHAR(10);
    DECLARE v_TotalActividades INT DEFAULT 0;
    DECLARE v_CalificacionesCreadas INT DEFAULT 0;
    DECLARE v_NombreAlumno VARCHAR(255);

    -- Verificar que la inscripción existe
    SELECT
        i.IdAlumno,
        i.IdGrado,
        i.IdSeccion,
        i.IdJornada,
        i.CicloEscolar,
        CONCAT(a.PrimerNombre, ' ', IFNULL(a.SegundoNombre, ''), ' ', a.PrimerApellido, ' ', IFNULL(a.SegundoApellido, '')) AS NombreCompleto
    INTO
        v_IdAlumno,
        v_IdGrado,
        v_IdSeccion,
        v_IdJornada,
        v_CicloEscolar,
        v_NombreAlumno
    FROM inscripciones i
    INNER JOIN alumnos a ON i.IdAlumno = a.IdAlumno
    WHERE i.IdInscripcion = p_IdInscripcion
      AND i.Estado = 1;

    -- Si no existe la inscripción, retornar error
    IF v_IdAlumno IS NULL THEN
        SELECT
            FALSE AS success,
            'Inscripción no encontrada o inactiva' AS mensaje,
            0 AS actividadesEncontradas,
            0 AS calificacionesCreadas;
    ELSE
        -- Contar actividades disponibles para el grupo
        SELECT COUNT(DISTINCT a.IdActividad)
        INTO v_TotalActividades
        FROM asignacion_docente ad
        INNER JOIN unidades u ON ad.IdAsignacionDocente = u.IdAsignacionDocente
        INNER JOIN actividades a ON u.IdUnidad = a.IdUnidad
        WHERE ad.IdGrado = v_IdGrado
          AND ad.IdSeccion = v_IdSeccion
          AND ad.IdJornada = v_IdJornada
          AND ad.Anio = v_CicloEscolar
          AND ad.Estado = 1
          AND u.Estado = 1
          AND a.Estado = 1;

        -- Si no hay actividades
        IF v_TotalActividades = 0 THEN
            SELECT
                TRUE AS success,
                CONCAT('No hay actividades creadas para el grupo del alumno: ', v_NombreAlumno) AS mensaje,
                0 AS actividadesEncontradas,
                0 AS calificacionesCreadas;
        ELSE
            -- Crear calificaciones para actividades que no tenga
            INSERT INTO calificaciones (IdActividad, IdAlumno, Punteo, Observaciones, CreadoPor, FechaCreado)
            SELECT DISTINCT
                a.IdActividad,
                v_IdAlumno,
                NULL,
                'Creado por inscripción fuera de tiempo',
                p_IdColaborador,
                NOW()
            FROM asignacion_docente ad
            INNER JOIN unidades u ON ad.IdAsignacionDocente = u.IdAsignacionDocente
            INNER JOIN actividades a ON u.IdUnidad = a.IdUnidad
            WHERE ad.IdGrado = v_IdGrado
              AND ad.IdSeccion = v_IdSeccion
              AND ad.IdJornada = v_IdJornada
              AND ad.Anio = v_CicloEscolar
              AND ad.Estado = 1
              AND u.Estado = 1
              AND a.Estado = 1
              AND NOT EXISTS (
                  SELECT 1 FROM calificaciones c
                  WHERE c.IdActividad = a.IdActividad
                    AND c.IdAlumno = v_IdAlumno
              );

            -- Obtener cantidad de calificaciones creadas
            SET v_CalificacionesCreadas = ROW_COUNT();

            -- Retornar resultado
            SELECT
                TRUE AS success,
                CASE
                    WHEN v_CalificacionesCreadas > 0 THEN
                        CONCAT('Se asignaron ', v_CalificacionesCreadas, ' actividades al alumno: ', v_NombreAlumno)
                    ELSE
                        CONCAT('El alumno ', v_NombreAlumno, ' ya tiene todas las actividades asignadas')
                END AS mensaje,
                v_TotalActividades AS actividadesEncontradas,
                v_CalificacionesCreadas AS calificacionesCreadas;
        END IF;
    END IF;

END //

DELIMITER ;

-- =====================================================
-- Ejemplo de uso:
-- CALL sp_asignar_actividades_alumno(150, 1);
--
-- Donde:
--   150 = IdInscripcion del alumno
--   1   = IdColaborador que ejecuta la acción
-- =====================================================
