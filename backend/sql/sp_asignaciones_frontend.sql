-- ============================================================
-- STORED PROCEDURES PARA ASIGNACIONES - FRONTEND
-- Fecha: 2025-12-09
-- Descripción: SPs para facilitar la asignación de cursos
-- ============================================================

-- ============================================================
-- 1. SP para filtrar asignaciones con parámetros opcionales
-- ============================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_filtrar_asignaciones$$

CREATE PROCEDURE sp_filtrar_asignaciones(
    IN p_Anio INT,
    IN p_IdGrado INT,
    IN p_IdSeccion INT,
    IN p_IdJornada INT,
    IN p_IdDocente INT
)
BEGIN
    SELECT
        a.IdAsignacionDocente,
        a.IdDocente,
        d.NombreDocente,
        d.Email AS EmailDocente,
        a.IdCurso,
        c.Curso AS NombreCurso,
        c.NoOrden,
        a.IdGrado,
        g.NombreGrado,
        a.IdSeccion,
        s.NombreSeccion,
        a.IdJornada,
        j.NombreJornada,
        a.Anio,
        a.Estado,
        a.CreadoPor,
        a.FechaCreado,
        a.ModificadoPor,
        a.FechaModificado,
        (SELECT COUNT(*) FROM unidades u WHERE u.IdAsignacionDocente = a.IdAsignacionDocente) AS TotalUnidades,
        (SELECT COUNT(*) FROM actividades act
         JOIN unidades un ON act.IdUnidad = un.IdUnidad
         WHERE un.IdAsignacionDocente = a.IdAsignacionDocente) AS TotalActividades
    FROM asignacion_docente a
    INNER JOIN docentes d ON a.IdDocente = d.idDocente
    INNER JOIN cursos c ON a.IdCurso = c.idCurso
    INNER JOIN grados g ON a.IdGrado = g.IdGrado
    INNER JOIN secciones s ON a.IdSeccion = s.IdSeccion
    INNER JOIN jornadas j ON a.IdJornada = j.IdJornada
    WHERE a.Estado = 1
      AND (p_Anio IS NULL OR a.Anio = p_Anio)
      AND (p_IdGrado IS NULL OR a.IdGrado = p_IdGrado)
      AND (p_IdSeccion IS NULL OR a.IdSeccion = p_IdSeccion)
      AND (p_IdJornada IS NULL OR a.IdJornada = p_IdJornada)
      AND (p_IdDocente IS NULL OR a.IdDocente = p_IdDocente)
    ORDER BY
        g.NombreGrado,
        s.NombreSeccion,
        j.NombreJornada,
        c.NoOrden;
END$$

DELIMITER ;

-- ============================================================
-- 2. SP para validar asignación duplicada
-- ============================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_validar_asignacion_duplicada$$

CREATE PROCEDURE sp_validar_asignacion_duplicada(
    IN p_IdDocente INT,
    IN p_IdCurso INT,
    IN p_IdGrado INT,
    IN p_IdSeccion INT,
    IN p_IdJornada INT,
    IN p_Anio INT
)
BEGIN
    SELECT
        CASE
            WHEN COUNT(*) > 0 THEN TRUE
            ELSE FALSE
        END AS Existe,
        MAX(a.IdAsignacionDocente) AS IdAsignacionExistente,
        MAX(d.NombreDocente) AS NombreDocente,
        MAX(c.Curso) AS NombreCurso,
        MAX(g.NombreGrado) AS NombreGrado,
        MAX(s.NombreSeccion) AS NombreSeccion,
        MAX(j.NombreJornada) AS NombreJornada,
        MAX(a.Anio) AS Anio,
        CASE
            WHEN COUNT(*) > 0 THEN CONCAT(
                'Ya existe una asignación: ',
                MAX(d.NombreDocente), ' - ',
                MAX(c.Curso), ' en ',
                MAX(g.NombreGrado), ' ',
                MAX(s.NombreSeccion), ' ',
                MAX(j.NombreJornada), ' (',
                MAX(a.Anio), ')'
            )
            ELSE 'No existe duplicado. Puede crear la asignación.'
        END AS Mensaje
    FROM asignacion_docente a
    INNER JOIN docentes d ON a.IdDocente = d.idDocente
    INNER JOIN cursos c ON a.IdCurso = c.idCurso
    INNER JOIN grados g ON a.IdGrado = g.IdGrado
    INNER JOIN secciones s ON a.IdSeccion = s.IdSeccion
    INNER JOIN jornadas j ON a.IdJornada = j.IdJornada
    WHERE a.IdDocente = p_IdDocente
      AND a.IdCurso = p_IdCurso
      AND a.IdGrado = p_IdGrado
      AND a.IdSeccion = p_IdSeccion
      AND a.IdJornada = p_IdJornada
      AND a.Anio = p_Anio
      AND a.Estado = 1;
END$$

DELIMITER ;

-- ============================================================
-- 3. SP para obtener cursos disponibles (con estado de asignación)
-- ============================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_cursos_disponibles$$

CREATE PROCEDURE sp_cursos_disponibles(
    IN p_IdGrado INT,
    IN p_IdSeccion INT,
    IN p_IdJornada INT,
    IN p_Anio INT
)
BEGIN
    SELECT
        c.idCurso,
        c.Curso AS NombreCurso,
        c.CodigoSire,
        c.NoOrden,
        c.idGrado,
        g.NombreGrado,
        CASE
            WHEN ad.IdAsignacionDocente IS NOT NULL THEN TRUE
            ELSE FALSE
        END AS YaAsignado,
        d.idDocente AS IdDocenteAsignado,
        d.NombreDocente AS DocenteAsignado,
        ad.IdAsignacionDocente
    FROM cursos c
    INNER JOIN grados g ON c.idGrado = g.IdGrado
    LEFT JOIN asignacion_docente ad ON ad.IdCurso = c.idCurso
        AND ad.IdGrado = p_IdGrado
        AND ad.IdSeccion = p_IdSeccion
        AND ad.IdJornada = p_IdJornada
        AND ad.Anio = p_Anio
        AND ad.Estado = 1
    LEFT JOIN docentes d ON ad.IdDocente = d.idDocente
    WHERE c.Estado = 1
      AND c.idGrado = p_IdGrado
    ORDER BY c.NoOrden;
END$$

DELIMITER ;

-- ============================================================
-- EJEMPLOS DE USO
-- ============================================================

-- Ejemplo 1: Filtrar asignaciones por año 2025
-- CALL sp_filtrar_asignaciones(2025, NULL, NULL, NULL, NULL);

-- Ejemplo 2: Filtrar asignaciones por grado y sección
-- CALL sp_filtrar_asignaciones(2025, 3, 1, NULL, NULL);

-- Ejemplo 3: Validar si existe duplicado
-- CALL sp_validar_asignacion_duplicada(1, 2, 3, 1, 1, 2025);

-- Ejemplo 4: Ver cursos disponibles para Tercero Primaria, Sección A, Matutina, 2025
-- CALL sp_cursos_disponibles(3, 1, 1, 2025);
