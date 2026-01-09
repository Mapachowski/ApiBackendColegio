# 📚 RESUMEN COMPLETO: SISTEMA DE CALIFICACIONES
## Para implementar API con Claude Code

---

## 🎯 OBJETIVO DEL PROYECTO

Crear un sistema de calificaciones para un colegio que gestione:
- Asignaciones de docentes a cursos
- Unidades académicas (4 por curso)
- Actividades y calificaciones
- Cálculo automático de promedios

---

## 📊 ESTRUCTURA DE LA BASE DE DATOS

### Tablas Existentes (Ya creadas)
```
- usuarios (IdUsuario, NombreUsuario, NombreCompleto, Contrasena, IdRol)
- alumnos (IdAlumno, Matricula, Nombres, Apellidos, IdFamilia)
- grados (IdGrado, NombreGrado, IdNivel, Mensualidad)
- secciones (IdSeccion, NombreSeccion)
- jornadas (IdJornada, NombreJornada)
- cursos (idCurso, idGrado, Curso, CodigoSire)
- inscripciones (IdInscripcion, IdAlumno, IdGrado, IdSeccion, IdJornada, CicloEscolar)
```

### Tablas Nuevas (Creadas para este sistema)
```
1. docentes
   - idDocente (PK)
   - idUsuario (FK -> usuarios.IdUsuario, UNIQUE)
   - NombreDocente VARCHAR(200)
   - Email, Telefono, Especialidad
   - Estado, CreadoPor, FechaCreado

2. asignacion_docente
   - IdAsignacionDocente (PK)
   - IdDocente (FK -> docentes.idDocente)
   - IdCurso (FK -> cursos.idCurso)
   - IdGrado (FK -> grados.IdGrado)
   - IdSeccion (FK -> secciones.IdSeccion)
   - IdJornada (FK -> jornadas.IdJornada)
   - Anio INT
   - Estado, CreadoPor, FechaCreado

3. unidades
   - IdUnidad (PK)
   - IdAsignacionDocente (FK -> asignacion_docente.IdAsignacionDocente)
   - NumeroUnidad TINYINT (1-4)
   - NombreUnidad VARCHAR(100)
   - PunteoZona DECIMAL(5,2) DEFAULT 60.00
   - PunteoFinal DECIMAL(5,2) DEFAULT 40.00
   - Activa TINYINT DEFAULT 0
   - Estado, CreadoPor, FechaCreado

4. actividades
   - IdActividad (PK)
   - IdUnidad (FK -> unidades.IdUnidad)
   - NombreActividad VARCHAR(100)
   - Descripcion TEXT
   - PunteoMaximo DECIMAL(5,2)
   - TipoActividad ENUM('zona', 'final')
   - FechaActividad DATE
   - Estado, CreadoPor, FechaCreado

5. calificaciones
   - IdCalificacion (PK)
   - IdActividad (FK -> actividades.IdActividad)
   - IdAlumno (FK -> alumnos.IdAlumno)
   - Punteo DECIMAL(5,2) NULL
   - Observaciones TEXT
   - UNIQUE (IdActividad, IdAlumno)
   - CreadoPor, FechaCreado
```

---

## 🔗 RELACIONES IMPORTANTES

```
usuarios (1) ---> (0..1) docentes
docentes (1) ---> (N) asignacion_docente
cursos (1) ---> (N) asignacion_docente
asignacion_docente (1) ---> (4) unidades
unidades (1) ---> (N) actividades
actividades (1) ---> (N) calificaciones
alumnos (1) ---> (N) calificaciones
```

---

## 🛠️ STORED PROCEDURES

### 1. sp_asignar_docente_curso
**Propósito:** Asignar un docente a un curso y crear automáticamente 4 unidades

**Parámetros IN:**
```sql
p_IdDocente INT
p_IdCurso INT
p_IdGrado INT
p_IdSeccion INT
p_IdJornada INT
p_Anio INT
p_CreadoPor VARCHAR(50)
```

**Parámetros OUT:**
```sql
p_IdAsignacion INT      -- ID de la asignación creada
p_Success BOOLEAN       -- TRUE si exitoso
p_Mensaje VARCHAR(255)  -- Mensaje descriptivo
```

**Validaciones:**
- Verifica que el docente exista
- Verifica que el curso exista
- Valida que no exista duplicado de asignación
- Crea 4 unidades automáticamente (solo Unidad 1 activa)

**Uso en API:**
```javascript
// Endpoint: POST /api/asignaciones
// Body: { idDocente, idCurso, idGrado, idSeccion, idJornada, anio }
```

---

### 2. sp_crear_unidades_asignacion
**Propósito:** Crear las 4 unidades para una asignación (llamado automáticamente)

**Parámetros:**
```sql
p_IdAsignacion INT
p_CreadoPor VARCHAR(50)
```

**Comportamiento:**
- Crea Unidad 1: Activa=1 (60 zona + 40 final)
- Crea Unidad 2-4: Activa=0 (60 zona + 40 final)

---

### 3. sp_validar_punteos_unidad
**Propósito:** Validar que las actividades de una unidad sumen correctamente

**Parámetros IN:**
```sql
p_IdUnidad INT
```

**Parámetros OUT:**
```sql
p_Valido BOOLEAN
p_ZonaConfig DECIMAL(5,2)   -- Configurado: 60
p_ZonaActual DECIMAL(5,2)   -- Suma actual de actividades zona
p_FinalConfig DECIMAL(5,2)  -- Configurado: 40
p_FinalActual DECIMAL(5,2)  -- Suma actual de actividades final
p_Mensaje VARCHAR(255)
```

**Uso en API:**
```javascript
// Endpoint: GET /api/unidades/:id/validar
// Retorna si la unidad puede activarse
```

---

### 4. sp_validar_calificacion
**Propósito:** Validar antes de ingresar/actualizar una calificación

**Parámetros IN:**
```sql
p_IdActividad INT
p_IdAlumno INT
p_Punteo DECIMAL(5,2)
```

**Parámetros OUT:**
```sql
p_Valido BOOLEAN
p_Mensaje VARCHAR(255)
```

**Validaciones:**
- Actividad existe y está activa
- Punteo está en rango (0 a PunteoMaximo)
- Alumno existe y está inscrito

**Uso en API:**
```javascript
// Endpoint: POST /api/calificaciones
// Validar antes de INSERT/UPDATE
```

---

## ⚡ TRIGGERS

### 1. tr_crear_calificaciones_actividad
**Evento:** AFTER INSERT ON actividades

**Comportamiento:**
- Cuando se crea una actividad (Estado=1)
- Automáticamente crea registros en `calificaciones` con Punteo=NULL
- Para TODOS los alumnos inscritos en ese grado/sección

**Importante para la API:**
- Al crear una actividad vía POST, las calificaciones se crean automáticamente
- No necesitas crear calificaciones manualmente

---

### 2. tr_validar_activacion_unidad
**Evento:** BEFORE UPDATE ON unidades

**Comportamiento:**
- Si intentas cambiar Activa de 0 a 1
- Valida que las actividades sumen exactamente 60 (zona) + 40 (final)
- Si no suma correctamente, RECHAZA la actualización con error

**Importante para la API:**
- Al activar una unidad (PUT /api/unidades/:id/activar)
- Puede fallar con error 45000 si punteos incorrectos
- Manejar este error en el catch

---

## 👁️ VISTAS

### 1. vw_calificaciones_alumno_unidad
**Propósito:** Ver calificaciones detalladas por alumno y unidad

**Campos principales:**
```sql
IdAlumno, Matricula, NombreCompleto, Nombres, Apellidos
IdUnidad, NumeroUnidad, NombreUnidad
NombreCurso, NombreGrado, NombreSeccion, NombreJornada
PunteoZonaMax (60), PunteoZonaObtenido
PunteoFinalMax (40), PunteoFinalObtenido
TotalUnidad (suma de zona + final)
EstadoUnidad ('Aprobado' si >= 60, sino 'Reprobado')
UnidadCompletada (TRUE si todas las calificaciones tienen punteo)
```

**Uso en API:**
```javascript
// Endpoint: GET /api/alumnos/:id/calificaciones?unidad=1
// Endpoint: GET /api/calificaciones/unidad/:idUnidad
```

---

### 2. vw_promedio_anual
**Propósito:** Calcular promedio de las 4 unidades por alumno/curso

**Campos principales:**
```sql
IdAlumno, Matricula, NombreCompleto
NombreCurso, NombreGrado, NombreSeccion
Unidad1, Unidad2, Unidad3, Unidad4 (punteos de cada unidad)
PromedioAnual (suma de 4 unidades / 4)
EstadoFinal ('Aprobado' si promedio >= 60)
```

**Uso en API:**
```javascript
// Endpoint: GET /api/alumnos/:id/promedio
// Endpoint: GET /api/reportes/promedios-curso/:idCurso
```

---

### 3. vw_actividades_unidad
**Propósito:** Ver configuración de actividades por unidad

**Campos principales:**
```sql
IdUnidad, NumeroUnidad, NombreUnidad
NombreCurso, NombreGrado, NombreSeccion, NombreDocente
PunteoZona (60), PunteoZonaActual (suma de actividades zona)
PunteoFinal (40), PunteoFinalActual (suma de actividades final)
TotalActividadesZona, TotalActividadesFinal
ZonaCompleta (TRUE si suma 60), FinalCompleto (TRUE si suma 40)
Activa (0 o 1)
```

**Uso en API:**
```javascript
// Endpoint: GET /api/unidades/:id/resumen
// Endpoint: GET /api/docentes/:id/unidades
```

---

### 4. vw_asignaciones_docente (EXTRA)
**Propósito:** Ver todas las asignaciones de docentes

**Campos principales:**
```sql
IdAsignacionDocente, idDocente, NombreDocente
idCurso, NombreCurso
NombreGrado, NombreSeccion, NombreJornada, Anio
TotalUnidades (cuenta unidades creadas)
TotalActividades (cuenta todas las actividades)
TotalAlumnos (cuenta alumnos inscritos)
```

**Uso en API:**
```javascript
// Endpoint: GET /api/docentes/:id/asignaciones
// Endpoint: GET /api/asignaciones (listar todas)
```

---

## 🔄 FLUJO DEL SISTEMA

### 1. ASIGNAR DOCENTE A CURSO
```
POST /api/asignaciones
  ↓
CALL sp_asignar_docente_curso()
  ↓
Se crea asignacion_docente
  ↓
Automáticamente se crean 4 unidades (solo Unidad 1 activa)
```

### 2. CREAR ACTIVIDADES PARA UNA UNIDAD
```
POST /api/actividades
Body: { idUnidad, nombreActividad, punteoMaximo, tipoActividad }
  ↓
INSERT INTO actividades
  ↓
TRIGGER tr_crear_calificaciones_actividad se dispara
  ↓
Automáticamente se crean calificaciones (Punteo=NULL) para todos los alumnos
```

### 3. ACTIVAR UNA UNIDAD
```
PUT /api/unidades/:id/activar
  ↓
UPDATE unidades SET Activa = 1
  ↓
TRIGGER tr_validar_activacion_unidad se dispara
  ↓
Valida que actividades sumen 60+40
  ↓
Si OK: Activa la unidad
Si FALLA: Error 45000 (punteos incorrectos)
```

### 4. INGRESAR CALIFICACIONES
```
PUT /api/calificaciones/:id
Body: { punteo }
  ↓
Opcional: CALL sp_validar_calificacion() para validar
  ↓
UPDATE calificaciones SET Punteo = X
  ↓
Las vistas recalculan automáticamente promedios
```

---

## 🎯 ENDPOINTS RECOMENDADOS PARA LA API

### Docentes
```
GET    /api/docentes                    - Listar todos
GET    /api/docentes/:id                - Ver uno
POST   /api/docentes                    - Crear
PUT    /api/docentes/:id                - Actualizar
DELETE /api/docentes/:id                - Eliminar
GET    /api/docentes/:id/asignaciones   - Ver asignaciones del docente
```

### Asignaciones
```
GET    /api/asignaciones                - Listar todas
GET    /api/asignaciones/:id            - Ver una
POST   /api/asignaciones                - Crear (llama al SP)
PUT    /api/asignaciones/:id            - Actualizar
DELETE /api/asignaciones/:id            - Eliminar
GET    /api/asignaciones/:id/unidades   - Ver unidades de la asignación
```

### Unidades
```
GET    /api/unidades/:id                - Ver una
PUT    /api/unidades/:id                - Actualizar
PUT    /api/unidades/:id/activar        - Activar unidad (trigger valida)
GET    /api/unidades/:id/validar        - Validar punteos (llama al SP)
GET    /api/unidades/:id/resumen        - Ver resumen (usa vista)
GET    /api/unidades/:id/actividades    - Listar actividades
```

### Actividades
```
GET    /api/actividades/:id             - Ver una
POST   /api/actividades                 - Crear (trigger crea calificaciones)
PUT    /api/actividades/:id             - Actualizar
DELETE /api/actividades/:id             - Eliminar
GET    /api/actividades/:id/calificaciones - Ver calificaciones
```

### Calificaciones
```
GET    /api/calificaciones/:id          - Ver una
PUT    /api/calificaciones/:id          - Actualizar punteo
GET    /api/calificaciones/actividad/:id - Por actividad
GET    /api/calificaciones/alumno/:id   - Por alumno
```

### Alumnos (Consultas)
```
GET    /api/alumnos/:id/calificaciones?unidad=1  - Ver calificaciones por unidad
GET    /api/alumnos/:id/promedio                 - Ver promedio anual
GET    /api/alumnos/:id/unidad/:idUnidad         - Detalle de una unidad
```

### Reportes
```
GET    /api/reportes/curso/:id/calificaciones    - Todos los alumnos
GET    /api/reportes/curso/:id/promedios         - Promedios del curso
GET    /api/reportes/unidad/:id/completitud      - Estadísticas de completitud
```

---

## 💾 EJEMPLO DE CÓDIGO PARA API (Node.js/Express)

### Crear Asignación
```javascript
// POST /api/asignaciones
router.post('/asignaciones', async (req, res) => {
  const { idDocente, idCurso, idGrado, idSeccion, idJornada, anio } = req.body;
  
  try {
    const [results] = await pool.query(
      'CALL sp_asignar_docente_curso(?, ?, ?, ?, ?, ?, ?, @idAsig, @success, @mensaje)',
      [idDocente, idCurso, idGrado, idSeccion, idJornada, anio, req.user.username]
    );
    
    const [output] = await pool.query(
      'SELECT @idAsig as idAsignacion, @success as success, @mensaje as mensaje'
    );
    
    if (output[0].success) {
      res.status(201).json({
        success: true,
        data: { idAsignacion: output[0].idAsignacion },
        message: output[0].mensaje
      });
    } else {
      res.status(400).json({
        success: false,
        message: output[0].mensaje
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Crear Actividad
```javascript
// POST /api/actividades
router.post('/actividades', async (req, res) => {
  const { idUnidad, nombreActividad, descripcion, punteoMaximo, tipoActividad } = req.body;
  
  try {
    // El trigger se encargará de crear las calificaciones automáticamente
    const [result] = await pool.query(
      `INSERT INTO actividades 
       (IdUnidad, NombreActividad, Descripcion, PunteoMaximo, TipoActividad, CreadoPor, FechaCreado)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [idUnidad, nombreActividad, descripcion, punteoMaximo, tipoActividad, req.user.username]
    );
    
    res.status(201).json({
      success: true,
      data: { idActividad: result.insertId },
      message: 'Actividad creada y calificaciones generadas automáticamente'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Activar Unidad
```javascript
// PUT /api/unidades/:id/activar
router.put('/unidades/:id/activar', async (req, res) => {
  const { id } = req.params;
  
  try {
    // El trigger validará que los punteos sumen correctamente
    await pool.query(
      'UPDATE unidades SET Activa = 1, ModificadoPor = ? WHERE IdUnidad = ?',
      [req.user.username, id]
    );
    
    res.json({
      success: true,
      message: 'Unidad activada exitosamente'
    });
  } catch (error) {
    // Error 45000 = punteos incorrectos (del trigger)
    if (error.errno === 1644) {
      res.status(400).json({
        success: false,
        message: error.sqlMessage
      });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});
```

### Ver Calificaciones de Alumno
```javascript
// GET /api/alumnos/:id/calificaciones
router.get('/alumnos/:id/calificaciones', async (req, res) => {
  const { id } = req.params;
  const { unidad } = req.query;
  
  try {
    let query = 'SELECT * FROM vw_calificaciones_alumno_unidad WHERE IdAlumno = ?';
    let params = [id];
    
    if (unidad) {
      query += ' AND NumeroUnidad = ?';
      params.push(unidad);
    }
    
    const [results] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Ver Promedio Anual
```javascript
// GET /api/alumnos/:id/promedio
router.get('/alumnos/:id/promedio', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [results] = await pool.query(
      'SELECT * FROM vw_promedio_anual WHERE IdAlumno = ?',
      [id]
    );
    
    res.json({
      success: true,
      data: results[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

## 📝 REGLAS DE NEGOCIO IMPORTANTES

1. **Punteos por Unidad:**
   - Zona: 60 puntos (actividades múltiples)
   - Final: 40 puntos (usualmente 1 examen)
   - Total: 100 puntos por unidad

2. **Aprobación:**
   - Unidad aprobada: >= 60 puntos
   - Curso aprobado: promedio de 4 unidades >= 60

3. **Activación de Unidades:**
   - Solo se puede activar si las actividades suman exactamente 60+40
   - Solo la Unidad 1 se crea activa por defecto
   - Unidades 2-4 deben ser activadas manualmente después de configurar actividades

4. **Calificaciones:**
   - Se crean automáticamente al crear una actividad
   - Inicialmente tienen Punteo = NULL
   - Solo se pueden ingresar si la actividad está activa (Estado = 1)

5. **Asignaciones:**
   - Un docente puede tener múltiples asignaciones
   - No puede haber asignaciones duplicadas (mismo docente, curso, grado, sección, jornada, año)

---

## 🚨 ERRORES COMUNES Y MANEJO

```javascript
// Error codes importantes
const ErrorCodes = {
  TRIGGER_VALIDATION: 1644,      // Error del trigger de validación
  FOREIGN_KEY: 1452,              // Referencia no existe
  DUPLICATE_ENTRY: 1062,          // Registro duplicado
  DATA_TOO_LONG: 1406            // Dato excede longitud
};

// Manejo centralizado
function handleDatabaseError(error) {
  switch(error.errno) {
    case 1644:
      return { status: 400, message: error.sqlMessage };
    case 1452:
      return { status: 400, message: 'Referencia inválida en la base de datos' };
    case 1062:
      return { status: 409, message: 'El registro ya existe' };
    default:
      return { status: 500, message: 'Error interno del servidor' };
  }
}
```

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

1. **Autenticación:**
   - Los docentes solo pueden ver/modificar sus propias asignaciones
   - Los alumnos solo pueden ver sus propias calificaciones
   - Administradores tienen acceso completo

2. **Validaciones:**
   - Siempre validar IDs antes de operaciones
   - Usar stored procedures para operaciones críticas
   - Validar rangos de punteos (0 a PunteoMaximo)

3. **Auditoría:**
   - Todas las tablas tienen CreadoPor/FechaCreado
   - Registrar ModificadoPor/FechaModificado en updates

---

## 📊 DATOS DE PRUEBA DISPONIBLES

```
Docente de prueba:
- ID: 5
- Usuario: emilio.aragon
- Nombre: Emilio Aragón

Grados disponibles: 16 (Preprimaria a Sexto Perito)
Secciones: A, B, C, D
Jornadas: Matutina, Vespertina, Nocturna
Cursos: 174 cursos disponibles
Alumnos: 457 alumnos con inscripciones activas
```

---

## 📁 ARCHIVOS SQL IMPORTANTES

1. **TABLAS_ADAPTADAS.sql** - Crea las 5 tablas nuevas
2. **RELACIONES_FOREIGN_KEYS.sql** - Crea todas las relaciones
3. **03_STORED_PROCEDURES_ADAPTADOS.sql** - 4 stored procedures
4. **04_TRIGGERS_ADAPTADOS.sql** - 2 triggers
5. **05_VISTAS_ADAPTADAS.sql** - 4 vistas (con corrección de vw_promedio_anual)
6. **06_DATOS_PRUEBA_CON_TUS_DATOS.sql** - Script de prueba con datos reales

---

## ✅ CHECKLIST PARA IMPLEMENTAR API

- [ ] Configurar conexión a base de datos MySQL
- [ ] Crear middleware de autenticación
- [ ] Implementar endpoints de docentes
- [ ] Implementar endpoints de asignaciones (usando SP)
- [ ] Implementar endpoints de unidades
- [ ] Implementar endpoints de actividades
- [ ] Implementar endpoints de calificaciones
- [ ] Implementar endpoints de consultas (usando vistas)
- [ ] Implementar manejo de errores centralizado
- [ ] Agregar validaciones de entrada
- [ ] Documentar API (Swagger/OpenAPI)
- [ ] Crear tests unitarios
- [ ] Crear tests de integración

---

## 🎓 FLUJO COMPLETO DE EJEMPLO

```
1. Docente inicia sesión → POST /api/auth/login
2. Sistema crea asignación → POST /api/asignaciones
   (Automáticamente crea 4 unidades)
3. Docente crea actividades → POST /api/actividades (x6 veces)
   (Trigger crea calificaciones automáticamente)
4. Docente valida configuración → GET /api/unidades/:id/validar
5. Docente activa unidad → PUT /api/unidades/:id/activar
   (Trigger valida punteos)
6. Docente ingresa calificaciones → PUT /api/calificaciones/:id (x muchos)
7. Sistema calcula promedios → GET /api/alumnos/:id/promedio
   (Vista calcula automáticamente)
```

---

## 📞 RESUMEN FINAL

- **5 tablas nuevas** creadas e integradas con tu BD existente
- **4 stored procedures** para operaciones críticas
- **2 triggers** para automatización
- **4 vistas** para consultas optimizadas
- Sistema completo de 60 zona + 40 final
- Validaciones automáticas de integridad
- Cálculo automático de promedios

**TODO ESTÁ LISTO PARA IMPLEMENTAR LA API** 🚀
