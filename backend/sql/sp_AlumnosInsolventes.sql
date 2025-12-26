-- Stored Procedure: sp_AlumnosInsolventes
-- Descripción: Obtiene los alumnos insolventes según el ciclo escolar y mes
-- Parámetros:
--   @CicloEscolar: Año del ciclo escolar (ej. 2025)
--   @Mes: Número del mes (1-10)
-- Retorna:
--   Carnet, NombreAlumno, Matricula, NombreGrado, NombreSeccion, NombreJornada, MesesPendientes

DELIMITER $$

CREATE PROCEDURE sp_AlumnosInsolventes(
    IN p_CicloEscolar VARCHAR(4),
    IN p_Mes INT
)
BEGIN
    -- Aquí va la lógica del stored procedure
    -- Este es un ejemplo de estructura, deberás adaptarlo a tu lógica de negocio

    SELECT
        a.Matricula AS Carnet,
        CONCAT(a.Nombres, ' ', a.Apellidos) AS NombreAlumno,
        a.Matricula,
        g.NombreGrado,
        s.NombreSeccion,
        j.NombreJornada,
        -- Aquí deberás calcular los meses pendientes según tu lógica
        'Febrero, Marzo, Abril' AS MesesPendientes
    FROM
        alumnos a
        INNER JOIN inscripciones i ON a.IdAlumno = i.IdAlumno
        INNER JOIN grados g ON i.IdGrado = g.IdGrado
        INNER JOIN secciones s ON i.IdSeccion = s.IdSeccion
        INNER JOIN jornadas j ON i.IdJornada = j.IdJornada
    WHERE
        i.CicloEscolar = p_CicloEscolar
        AND a.Estado = 1
        -- Aquí agregarás la lógica para filtrar alumnos insolventes según el mes
    ORDER BY
        g.NombreGrado,
        s.NombreSeccion,
        a.Apellidos,
        a.Nombres;
END$$

DELIMITER ;
