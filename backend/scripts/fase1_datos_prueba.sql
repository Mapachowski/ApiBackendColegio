-- ========================================
-- FASE 1 - Datos de Prueba
-- ========================================
-- Propósito: Insertar datos de prueba para validar las tablas
-- Fecha: 2025-12-29
-- ========================================

-- ========================================
-- 1. CONFIGURAR FECHA LÍMITE EN UNIDAD 1
-- ========================================
UPDATE unidades
SET
  FechaLimiteCalificacion = '2026-01-05 23:59:59',
  NotificacionesEnviadas = FALSE,
  Cerrada = FALSE
WHERE IdUnidad = 1;

SELECT
  IdUnidad,
  NumeroUnidad,
  NombreUnidad,
  Cerrada,
  FechaLimiteCalificacion,
  NotificacionesEnviadas
FROM unidades
WHERE IdUnidad = 1;

-- ========================================
-- 2. CREAR ESTADOS DE CURSOS (3 ESCENARIOS)
-- ========================================

-- Escenario 1: Curso LISTO (todo completo)
-- Buscar un curso y docente reales de tu BD
INSERT INTO estado_cursos_unidad (
  IdUnidad,
  IdCurso,
  IdDocente,
  ActividadesSuman100,
  PuntajeActual,
  TotalEstudiantes,
  EstudiantesCalificados,
  PorcentajeCompletado,
  EstadoGeneral,
  DetallesPendientes
) VALUES (
  1,      -- Unidad 1
  1,      -- Curso (reemplazar con ID real)
  10,     -- Docente (reemplazar con ID real)
  TRUE,   -- Actividades suman 100
  100.00,
  25,     -- 25 estudiantes
  25,     -- Todos calificados
  100.00,
  'LISTO',
  NULL    -- Sin pendientes
)
ON DUPLICATE KEY UPDATE
  ActividadesSuman100 = TRUE,
  PuntajeActual = 100.00,
  TotalEstudiantes = 25,
  EstudiantesCalificados = 25,
  PorcentajeCompletado = 100.00,
  EstadoGeneral = 'LISTO',
  DetallesPendientes = NULL;

-- Escenario 2: Curso PENDIENTE (falta calificar algunos estudiantes)
INSERT INTO estado_cursos_unidad (
  IdUnidad,
  IdCurso,
  IdDocente,
  ActividadesSuman100,
  PuntajeActual,
  TotalEstudiantes,
  EstudiantesCalificados,
  PorcentajeCompletado,
  EstadoGeneral,
  DetallesPendientes
) VALUES (
  1,
  2,      -- Curso diferente
  11,     -- Docente diferente
  TRUE,
  100.00,
  30,     -- 30 estudiantes
  27,     -- 27 calificados (faltan 3)
  90.00,
  'PENDIENTE',
  '{"estudiantesPendientes": 3}'
)
ON DUPLICATE KEY UPDATE
  ActividadesSuman100 = TRUE,
  PuntajeActual = 100.00,
  TotalEstudiantes = 30,
  EstudiantesCalificados = 27,
  PorcentajeCompletado = 90.00,
  EstadoGeneral = 'PENDIENTE',
  DetallesPendientes = '{"estudiantesPendientes": 3}';

-- Escenario 3: Curso INCOMPLETO (actividades no suman 100 y faltan calificaciones)
INSERT INTO estado_cursos_unidad (
  IdUnidad,
  IdCurso,
  IdDocente,
  ActividadesSuman100,
  PuntajeActual,
  TotalEstudiantes,
  EstudiantesCalificados,
  PorcentajeCompletado,
  EstadoGeneral,
  DetallesPendientes
) VALUES (
  1,
  3,      -- Curso diferente
  12,     -- Docente diferente
  FALSE,  -- Actividades NO suman 100
  95.00,  -- Solo suman 95
  28,     -- 28 estudiantes
  20,     -- 20 calificados (faltan 8)
  71.43,
  'INCOMPLETO',
  '{"actividades": {"suman100": false, "puntajeActual": 95, "faltante": 5}, "estudiantesPendientes": 8}'
)
ON DUPLICATE KEY UPDATE
  ActividadesSuman100 = FALSE,
  PuntajeActual = 95.00,
  TotalEstudiantes = 28,
  EstudiantesCalificados = 20,
  PorcentajeCompletado = 71.43,
  EstadoGeneral = 'INCOMPLETO',
  DetallesPendientes = '{"actividades": {"suman100": false, "puntajeActual": 95, "faltante": 5}, "estudiantesPendientes": 8}';

-- Verificar inserción
SELECT
  e.IdEstado,
  e.IdUnidad,
  e.IdCurso,
  c.Curso AS NombreCurso,
  e.ActividadesSuman100,
  e.PuntajeActual,
  e.TotalEstudiantes,
  e.EstudiantesCalificados,
  e.PorcentajeCompletado,
  e.EstadoGeneral
FROM estado_cursos_unidad e
INNER JOIN cursos c ON e.IdCurso = c.idCurso
WHERE e.IdUnidad = 1
ORDER BY e.EstadoGeneral, e.PorcentajeCompletado;

-- ========================================
-- 3. CREAR NOTIFICACIONES PARA DOCENTES
-- ========================================

-- Notificación para docente con calificaciones pendientes (Escenario 2)
INSERT INTO notificaciones_docentes (
  IdDocente,
  IdCurso,
  IdUnidad,
  TipoNotificacion,
  Mensaje,
  FechaLimite,
  Leida
) VALUES (
  11,     -- Docente del curso PENDIENTE
  2,      -- Curso PENDIENTE
  1,      -- Unidad 1
  'CALIFICACIONES_PENDIENTES',
  'Tienes 3 estudiantes sin calificar. Por favor completa las calificaciones antes de la fecha límite.',
  '2026-01-05 23:59:59',
  FALSE
)
ON DUPLICATE KEY UPDATE
  Mensaje = 'Tienes 3 estudiantes sin calificar. Por favor completa las calificaciones antes de la fecha límite.',
  FechaLimite = '2026-01-05 23:59:59';

-- Notificación para docente con actividades incompletas (Escenario 3)
INSERT INTO notificaciones_docentes (
  IdDocente,
  IdCurso,
  IdUnidad,
  TipoNotificacion,
  Mensaje,
  FechaLimite,
  Leida
) VALUES (
  12,     -- Docente del curso INCOMPLETO
  3,      -- Curso INCOMPLETO
  1,      -- Unidad 1
  'ACTIVIDADES_INCOMPLETAS',
  'Tus actividades suman 95 puntos. Deben sumar exactamente 100 puntos.',
  '2026-01-05 23:59:59',
  FALSE
)
ON DUPLICATE KEY UPDATE
  Mensaje = 'Tus actividades suman 95 puntos. Deben sumar exactamente 100 puntos.',
  FechaLimite = '2026-01-05 23:59:59';

-- Notificación adicional para docente con calificaciones pendientes (Escenario 3)
INSERT INTO notificaciones_docentes (
  IdDocente,
  IdCurso,
  IdUnidad,
  TipoNotificacion,
  Mensaje,
  FechaLimite,
  Leida
) VALUES (
  12,     -- Docente del curso INCOMPLETO
  3,      -- Curso INCOMPLETO
  1,      -- Unidad 1
  'CALIFICACIONES_PENDIENTES',
  'Tienes 8 estudiantes sin calificar. Por favor completa las calificaciones.',
  '2026-01-05 23:59:59',
  FALSE
)
ON DUPLICATE KEY UPDATE
  Mensaje = 'Tienes 8 estudiantes sin calificar. Por favor completa las calificaciones.',
  FechaLimite = '2026-01-05 23:59:59';

-- Verificar inserción de notificaciones
SELECT
  n.IdNotificacion,
  n.IdDocente,
  c.Curso AS NombreCurso,
  u.NombreUnidad,
  n.TipoNotificacion,
  n.Mensaje,
  n.FechaLimite,
  n.Leida,
  n.FechaCreacion
FROM notificaciones_docentes n
INNER JOIN cursos c ON n.IdCurso = c.idCurso
INNER JOIN unidades u ON n.IdUnidad = u.IdUnidad
WHERE n.IdUnidad = 1
ORDER BY n.IdDocente, n.TipoNotificacion;

-- ========================================
-- 4. RESUMEN DEL ESTADO
-- ========================================

SELECT '=== RESUMEN DE UNIDAD 1 ===' AS Titulo;

-- Estado de la unidad
SELECT
  IdUnidad,
  NumeroUnidad,
  NombreUnidad,
  Cerrada,
  FechaLimiteCalificacion,
  NotificacionesEnviadas,
  CASE
    WHEN FechaLimiteCalificacion IS NULL THEN 'Sin fecha límite'
    WHEN FechaLimiteCalificacion < NOW() THEN 'VENCIDA'
    ELSE CONCAT('Faltan ', DATEDIFF(FechaLimiteCalificacion, NOW()), ' días')
  END AS EstadoFechaLimite
FROM unidades
WHERE IdUnidad = 1;

-- Resumen de cursos por estado
SELECT
  EstadoGeneral,
  COUNT(*) AS CantidadCursos,
  ROUND(AVG(PorcentajeCompletado), 2) AS PromedioCompletado
FROM estado_cursos_unidad
WHERE IdUnidad = 1
GROUP BY EstadoGeneral
ORDER BY
  FIELD(EstadoGeneral, 'LISTO', 'PENDIENTE', 'INCOMPLETO');

-- Notificaciones no leídas
SELECT
  COUNT(*) AS NotificacionesNoLeidas
FROM notificaciones_docentes
WHERE IdUnidad = 1 AND Leida = FALSE;
