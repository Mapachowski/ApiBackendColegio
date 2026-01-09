# 🧪 GUÍA DE PRUEBAS - Endpoints Aula del Estudiante

## 📋 ENDPOINTS IMPLEMENTADOS

Se implementaron 4 nuevos endpoints para el módulo de Aula del Estudiante:

1. ✅ `GET /api/login/perfil` - Obtener perfil del usuario autenticado
2. ✅ `GET /api/alumnos/:id/inscripcion-actual/:anio` - Obtener inscripción del alumno por año
3. ✅ `GET /api/alumnos/:id/cursos-actuales/:anio` - Obtener cursos del alumno por año
4. ✅ `GET /api/asignaciones/:id/actividades-alumno?idAlumno=X` - Obtener actividades con calificaciones

---

## 🔐 AUTENTICACIÓN

Todos los endpoints (excepto login) requieren autenticación JWT. Debes incluir el token en el header:

```
Authorization: Bearer {tu_token_jwt}
```

---

## 📌 ENDPOINT 1: Obtener Perfil del Usuario

### `GET /api/login/perfil`

**Descripción:** Obtiene el perfil completo del usuario autenticado, incluyendo IdAlumno si es estudiante o IdDocente si es profesor.

**Headers:**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "IdUsuario": 5,
    "NombreUsuario": "juan.perez",
    "NombreCompleto": "Juan Pérez García",
    "IdRol": 4,
    "Rol": {
      "IdRol": 4,
      "NombreRol": "Estudiante"
    },
    "IdAlumno": 1234,
    "Matricula": "2026-001",
    "IdDocente": null,
    "NombreDocente": null
  }
}
```

**Respuesta Error (404):**
```json
{
  "success": false,
  "error": "Usuario no encontrado"
}
```

**Ejemplo cURL:**
```bash
curl -X GET "http://localhost:3000/api/login/perfil" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ejemplo Fetch (JavaScript):**
```javascript
const response = await fetch('http://localhost:3000/api/login/perfil', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
console.log(data);
```

---

## 📌 ENDPOINT 2: Obtener Inscripción del Alumno por Año

### `GET /api/alumnos/:id/inscripcion-actual/:anio`

**Descripción:** Obtiene la inscripción del alumno para un año específico con todos los detalles de grado, sección y jornada.

**Parámetros de Ruta:**
- `id` (number, requerido): IdAlumno
- `anio` (string, requerido): Año del ciclo escolar (4 dígitos, ejemplo: 2026)

**Headers:**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Ejemplo de Petición:**
```
GET /api/alumnos/1234/inscripcion-actual/2026
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "IdInscripcion": 1,
    "IdAlumno": 1234,
    "Matricula": "2026-001",
    "NombreCompleto": "Juan Pérez García",
    "IdGrado": 5,
    "NombreGrado": "Quinto Primaria",
    "IdSeccion": 1,
    "NombreSeccion": "A",
    "IdJornada": 1,
    "NombreJornada": "Matutina",
    "CicloEscolar": "2025",
    "Estado": 1
  }
}
```

**Respuesta Error (400):**
```json
{
  "success": false,
  "error": "El año es requerido y debe ser un número de 4 dígitos (ejemplo: 2026)"
}
```

**Respuesta Error (404):**
```json
{
  "success": false,
  "error": "No se encontró inscripción activa para el alumno en el año 2026"
}
```

**Ejemplo cURL:**
```bash
curl -X GET "http://localhost:4000/api/alumnos/1234/inscripcion-actual/2026" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ejemplo Fetch (JavaScript):**
```javascript
const idAlumno = 1234;
const anio = 2026;
const response = await fetch(`http://localhost:4000/api/alumnos/${idAlumno}/inscripcion-actual/${anio}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
console.log(data);
```

**⚠️ NOTA:** El año es OBLIGATORIO y debe ser un número de 4 dígitos. El endpoint valida el formato antes de consultar la base de datos.

---

## 📌 ENDPOINT 3: Obtener Cursos del Alumno por Año

### `GET /api/alumnos/:id/cursos-actuales/:anio`

**Descripción:** Obtiene todos los cursos (asignaciones) en los que está inscrito el alumno para un año específico, basado en su grado/sección/jornada del ciclo escolar.

**Parámetros de Ruta:**
- `id` (number, requerido): IdAlumno
- `anio` (string, requerido): Año del ciclo escolar (4 dígitos, ejemplo: 2026)

**Headers:**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Ejemplo de Petición:**
```
GET /api/alumnos/1234/cursos-actuales/2026
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "IdAsignacionDocente": 1,
      "IdCurso": 18,
      "NombreCurso": "Matemáticas",
      "NoOrden": 1,
      "IdDocente": 5,
      "NombreDocente": "Emilio Aragón",
      "IdGrado": 5,
      "NombreGrado": "Quinto Primaria",
      "IdSeccion": 1,
      "NombreSeccion": "A",
      "IdJornada": 1,
      "NombreJornada": "Matutina",
      "Anio": "2026"
    },
    {
      "IdAsignacionDocente": 2,
      "IdCurso": 19,
      "NombreCurso": "Comunicación y Lenguaje",
      "NoOrden": 2,
      "IdDocente": 6,
      "NombreDocente": "María López",
      "IdGrado": 5,
      "NombreGrado": "Quinto Primaria",
      "IdSeccion": 1,
      "NombreSeccion": "A",
      "IdJornada": 1,
      "NombreJornada": "Matutina",
      "Anio": "2026"
    }
  ]
}
```

**Respuesta Error (400):**
```json
{
  "success": false,
  "error": "El año es requerido y debe ser un número de 4 dígitos (ejemplo: 2026)"
}
```

**Respuesta Error (404 - Sin inscripción):**
```json
{
  "success": false,
  "error": "No se encontró inscripción activa para este alumno en el año 2026"
}
```

**Respuesta Exitosa con Array Vacío (Sin cursos asignados):**
```json
{
  "success": true,
  "data": []
}
```
*Esto significa que el alumno SÍ tiene inscripción, pero NO hay asignaciones de docentes creadas para su grado/sección/jornada.*

**Ejemplo cURL:**
```bash
curl -X GET "http://localhost:4000/api/alumnos/1234/cursos-actuales/2026" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ejemplo Fetch (JavaScript):**
```javascript
const idAlumno = 1234;
const anio = 2026;

const response = await fetch(`http://localhost:4000/api/alumnos/${idAlumno}/cursos-actuales/${anio}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
console.log(data);
```

**⚠️ NOTAS:**
- El año es OBLIGATORIO y debe ser un número de 4 dígitos
- Los cursos se ordenan por `NoOrden` (orden del curso en el grado)
- Si retorna `data: []` vacío, significa que hay inscripción pero no hay cursos asignados para ese grado/sección/jornada

---

## 📌 ENDPOINT 4: Obtener Actividades con Calificaciones del Alumno

### `GET /api/asignaciones/:id/actividades-alumno`

**Descripción:** Obtiene todas las actividades de una asignación (curso) junto con las calificaciones del alumno especificado. Si el alumno no tiene calificación en una actividad, los campos de calificación vienen como null.

**Parámetros de Ruta:**
- `id` (number, requerido): IdAsignacionDocente

**Query Parameters:**
- `idAlumno` (number, REQUERIDO): IdAlumno para obtener sus calificaciones

**Headers:**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Ejemplo de Petición:**
```
GET /api/asignaciones/1/actividades-alumno?idAlumno=1234
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "IdActividad": 1,
      "NombreActividad": "Tarea 1 - Suma y Resta",
      "Descripcion": "Resolver ejercicios básicos de suma y resta",
      "PunteoMaximo": 15.00,
      "TipoActividad": "zona",
      "FechaActividad": "2025-12-25",
      "EstadoActividad": 1,
      "IdUnidad": 5,
      "NumeroUnidad": 1,
      "NombreUnidad": "Unidad 1 - Operaciones Básicas",
      "UnidadActiva": 1,
      "IdCalificacion": 123,
      "Punteo": 14.50,
      "Observaciones": "Muy bien, excelente trabajo"
    },
    {
      "IdActividad": 2,
      "NombreActividad": "Examen Parcial Unidad 1",
      "Descripcion": "Evaluación de la primera unidad",
      "PunteoMaximo": 40.00,
      "TipoActividad": "final",
      "FechaActividad": "2025-12-30",
      "EstadoActividad": 1,
      "IdUnidad": 5,
      "NumeroUnidad": 1,
      "NombreUnidad": "Unidad 1 - Operaciones Básicas",
      "UnidadActiva": 1,
      "IdCalificacion": null,
      "Punteo": null,
      "Observaciones": null
    },
    {
      "IdActividad": 3,
      "NombreActividad": "Tarea 1 - Multiplicación",
      "Descripcion": "Ejercicios de tablas de multiplicar",
      "PunteoMaximo": 10.00,
      "TipoActividad": "zona",
      "FechaActividad": "2026-01-05",
      "EstadoActividad": 1,
      "IdUnidad": 6,
      "NumeroUnidad": 2,
      "NombreUnidad": "Unidad 2 - Multiplicación",
      "UnidadActiva": 1,
      "IdCalificacion": null,
      "Punteo": null,
      "Observaciones": null
    }
  ]
}
```

**Respuesta Error (400):**
```json
{
  "success": false,
  "error": "idAlumno es requerido en query params y debe ser un número"
}
```

**Respuesta Error (404):**
```json
{
  "success": false,
  "error": "Asignación no encontrada"
}
```

**Ejemplo cURL:**
```bash
curl -X GET "http://localhost:3000/api/asignaciones/1/actividades-alumno?idAlumno=1234" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ejemplo Fetch (JavaScript):**
```javascript
const idAsignacion = 1;
const idAlumno = 1234;

const response = await fetch(
  `http://localhost:3000/api/asignaciones/${idAsignacion}/actividades-alumno?idAlumno=${idAlumno}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
const data = await response.json();
console.log(data);
```

**⚠️ NOTAS:**
- El año NO se pasa como parámetro porque la **asignación ya tiene un año asociado** en la base de datos
- Las actividades se ordenan por `NumeroUnidad` y luego por `FechaActividad`
- Solo se retornan actividades con `Estado = 1` (activas)
- Si el alumno no tiene calificación en una actividad, los campos `IdCalificacion`, `Punteo` y `Observaciones` serán `null`
- `TipoActividad` puede ser `"zona"` o `"final"`

---

## 🔄 FLUJO COMPLETO DE USO (ACTUALIZADO 2026)

### Paso 1: Login
```javascript
POST /api/login
Body: {
  "NombreUsuario": "juan.perez",
  "Contrasena": "password123"
}

Response: {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "IdUsuario": 5,
    "NombreUsuario": "juan.perez",
    "NombreCompleto": "Juan Pérez García",
    "IdRol": 4
  }
}
```

### Paso 2: Obtener Perfil (para obtener IdAlumno)
```javascript
GET /api/login/perfil
Header: Authorization: Bearer {token}

Response: {
  "success": true,
  "data": {
    "IdUsuario": 5,
    "IdAlumno": 1234,  // ← NECESARIO PARA LOS SIGUIENTES PASOS
    "Matricula": "2026-001",
    ...
  }
}
```

### Paso 3: Obtener Inscripción del Año Actual (2026)
```javascript
GET /api/alumnos/1234/inscripcion-actual/2026  // ← AÑO OBLIGATORIO
Header: Authorization: Bearer {token}

Response: {
  "success": true,
  "data": {
    "IdInscripcion": 1,
    "NombreGrado": "Quinto Primaria",
    "NombreSeccion": "A",
    "CicloEscolar": "2026",
    ...
  }
}
```

### Paso 4: Obtener Cursos del Estudiante (2026)
```javascript
GET /api/alumnos/1234/cursos-actuales/2026  // ← AÑO OBLIGATORIO
Header: Authorization: Bearer {token}

Response: {
  "success": true,
  "data": [
    {
      "IdAsignacionDocente": 1,
      "NombreCurso": "Matemáticas",
      "NombreDocente": "Emilio Aragón",
      "Anio": "2026",
      ...
    },
    {
      "IdAsignacionDocente": 2,
      "NombreCurso": "Comunicación y Lenguaje",
      ...
    }
  ]
}
```

### Paso 5: Ver Actividades de un Curso
```javascript
GET /api/asignaciones/1/actividades-alumno?idAlumno=1234
Header: Authorization: Bearer {token}

Response: {
  "success": true,
  "data": [
    {
      "IdActividad": 1,
      "NombreActividad": "Tarea 1",
      "PunteoMaximo": 15.00,
      "Punteo": 14.50,  // Calificación obtenida
      "Observaciones": "Muy bien",
      ...
    }
  ]
}
```

---

## 🧪 COLECCIÓN DE PRUEBAS PARA INSOMNIA/POSTMAN

### Importar esta colección JSON (Actualizada 2026):

```json
{
  "name": "Aula Estudiante API - 2026",
  "requests": [
    {
      "name": "1. Login",
      "method": "POST",
      "url": "http://localhost:4000/api/login",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "NombreUsuario": "juan.perez",
        "Contrasena": "password123"
      }
    },
    {
      "name": "2. Obtener Perfil",
      "method": "GET",
      "url": "http://localhost:4000/api/login/perfil",
      "headers": {
        "Authorization": "Bearer {{token}}",
        "Content-Type": "application/json"
      }
    },
    {
      "name": "3. Inscripción por Año",
      "method": "GET",
      "url": "http://localhost:4000/api/alumnos/1234/inscripcion-actual/2026",
      "headers": {
        "Authorization": "Bearer {{token}}",
        "Content-Type": "application/json"
      }
    },
    {
      "name": "4. Cursos por Año",
      "method": "GET",
      "url": "http://localhost:4000/api/alumnos/1234/cursos-actuales/2026",
      "headers": {
        "Authorization": "Bearer {{token}}",
        "Content-Type": "application/json"
      }
    },
    {
      "name": "5. Actividades con Calificaciones",
      "method": "GET",
      "url": "http://localhost:4000/api/asignaciones/1/actividades-alumno?idAlumno=1234",
      "headers": {
        "Authorization": "Bearer {{token}}",
        "Content-Type": "application/json"
      }
    }
  ]
}
```

---

## 🔒 SEGURIDAD Y VALIDACIONES

### 1. **Autenticación Requerida**
Todos los endpoints (excepto login) requieren JWT válido en el header Authorization.

### 2. **Validación de Parámetros**
- `idAlumno` debe ser un número válido
- `idAsignacion` debe existir en la base de datos
- `anio` debe ser un string de 4 dígitos (opcional)

### 3. **Recomendación: Validar Autorización**
**IMPORTANTE:** Aunque ya implementamos los endpoints, se recomienda agregar validación para que un alumno solo pueda ver SUS propios datos:

```javascript
// Ejemplo en el controlador:
const { id } = req.params;
const alumnoDelToken = req.user.IdAlumno; // Del JWT

if (parseInt(id) !== parseInt(alumnoDelToken)) {
  return res.status(403).json({
    success: false,
    error: 'No tienes permiso para ver estos datos'
  });
}
```

---

## 🎯 CASOS DE USO PARA EL FRONTEND

### **Caso 1: Dashboard del Estudiante**
```javascript
// Al cargar el dashboard:
1. GET /api/login/perfil → Obtener IdAlumno
2. GET /api/alumnos/{IdAlumno}/inscripcion-actual → Mostrar grado/sección
3. GET /api/alumnos/{IdAlumno}/cursos-actuales → Listar cursos disponibles
```

### **Caso 2: Ver Detalle de un Curso**
```javascript
// Al hacer clic en un curso:
1. GET /api/asignaciones/{IdAsignacion}/actividades-alumno?idAlumno={IdAlumno}
   → Mostrar todas las actividades con sus calificaciones
```

### **Caso 3: Ver Calificaciones por Unidad**
```javascript
// Filtrar las actividades del endpoint 4 por NumeroUnidad:
const actividadesUnidad1 = actividades.filter(a => a.NumeroUnidad === 1);

// Calcular promedio de zona:
const zona = actividadesUnidad1
  .filter(a => a.TipoActividad === 'zona' && a.Punteo !== null)
  .reduce((sum, a) => sum + parseFloat(a.Punteo), 0);

// Obtener nota final:
const notaFinal = actividadesUnidad1
  .find(a => a.TipoActividad === 'final')?.Punteo || 0;

const total = zona + notaFinal;
```

---

## 📊 RESPUESTAS ESTÁNDAR DE ERROR

### 400 - Bad Request
```json
{
  "success": false,
  "error": "Mensaje descriptivo del error de validación"
}
```

### 401 - Unauthorized
```json
{
  "message": "Token no válido o expirado"
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "error": "No tienes permiso para ver estos datos"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": "Recurso no encontrado"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "error": "Mensaje del error técnico"
}
```

---

## ✅ CHECKLIST DE PRUEBAS

Antes de considerar completa la implementación, verifica:

- [ ] Login exitoso y obtención de token
- [ ] Obtener perfil con token válido
- [ ] Obtener inscripción actual con IdAlumno válido
- [ ] Obtener cursos actuales sin parámetro `anio` (usa año actual)
- [ ] Obtener cursos actuales con parámetro `anio` específico
- [ ] Obtener actividades de una asignación con calificaciones del alumno
- [ ] Validar que retorna 404 si no hay inscripción activa
- [ ] Validar que retorna 400 si falta parámetro `idAlumno` en actividades
- [ ] Validar que retorna 401 si no se envía token
- [ ] Validar que las calificaciones vienen como `null` si el alumno no tiene nota

---

## 🚀 PRÓXIMOS PASOS SUGERIDOS

1. **Implementar validación de autorización** (alumno solo ve sus datos)
2. **Agregar paginación** en endpoint de actividades (si hay muchas)
3. **Crear endpoint de resumen** (promedio general del alumno)
4. **Implementar cache** para mejorar rendimiento
5. **Agregar tests unitarios** con Jest o Mocha

---

## 📝 NOTAS FINALES

- Todos los endpoints retornan `success: true/false` para consistencia
- Los campos de fecha usan formato ISO 8601 (YYYY-MM-DD)
- Los campos decimales (Punteo, PunteoMaximo) se retornan como números
- El campo `Estado` es 1 (activo) o 0 (inactivo)
- Las relaciones se hacen con INNER JOIN o LEFT JOIN según corresponda

---

¿Listo para probar? Comienza con el endpoint de login y ve avanzando en orden. ¡Éxito! 🎉
