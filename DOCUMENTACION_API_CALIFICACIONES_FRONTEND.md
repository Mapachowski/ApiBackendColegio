# 📚 DOCUMENTACIÓN API - SISTEMA DE CALIFICACIONES
## Para equipo Frontend React

---

## 📋 ÍNDICE
1. [Introducción](#introducción)
2. [Autenticación](#autenticación)
3. [Modelos de Datos](#modelos-de-datos)
4. [Endpoints Disponibles](#endpoints-disponibles)
5. [Flujo de Uso](#flujo-de-uso)
6. [Ejemplos de Peticiones y Respuestas](#ejemplos-de-peticiones-y-respuestas)
7. [Reglas de Negocio Importantes](#reglas-de-negocio-importantes)
8. [Manejo de Errores](#manejo-de-errores)
9. [Casos de Uso Comunes](#casos-de-uso-comunes)

---

## 🎯 INTRODUCCIÓN

Este sistema permite gestionar calificaciones de un colegio con las siguientes características:

- **Docentes** se asignan a cursos específicos
- Cada asignación crea automáticamente **4 unidades**
- Cada unidad tiene actividades de **zona (60 pts)** y **final (40 pts)**
- Las **calificaciones** se crean automáticamente cuando se crea una actividad
- El sistema calcula **promedios automáticamente** usando vistas de base de datos

### Base URL
```
http://localhost:3000/api
```

### Tecnología Backend
- Node.js + Express
- Sequelize ORM
- MySQL con Stored Procedures y Triggers

---

## 🔐 AUTENTICACIÓN

### Login
Todas las rutas (excepto `/login`) requieren autenticación con JWT.

**Endpoint:** `POST /api/login`

**Request:**
```json
{
  "nombreUsuario": "emilio.aragon",
  "contrasena": "password123"
}
```

**Response exitoso:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "IdUsuario": 5,
      "NombreUsuario": "emilio.aragon",
      "NombreCompleto": "Emilio Aragón",
      "IdRol": 2
    }
  }
}
```

### Headers Requeridos
Todas las peticiones autenticadas deben incluir:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 📊 MODELOS DE DATOS

### 1. Docente
```typescript
interface Docente {
  idDocente: number;
  idUsuario: number;           // FK a usuarios (UNIQUE)
  NombreDocente: string;
  Email?: string;
  Telefono?: string;
  Especialidad?: string;
  Estado: boolean;
  CreadoPor?: string;
  FechaCreado?: Date;
  ModificadoPor?: string;
  FechaModificado?: Date;
}
```

### 2. AsignacionDocente
```typescript
interface AsignacionDocente {
  IdAsignacionDocente: number;
  IdDocente: number;           // FK a docentes
  IdCurso: number;             // FK a cursos
  IdGrado: number;             // FK a grados
  IdSeccion: number;           // FK a secciones
  IdJornada: number;           // FK a jornadas
  Anio: number;
  Estado: boolean;
  CreadoPor?: string;
  FechaCreado?: Date;
  ModificadoPor?: string;
  FechaModificado?: Date;
}
```

### 3. Unidad
```typescript
interface Unidad {
  IdUnidad: number;
  IdAsignacionDocente: number; // FK a asignacion_docente
  NumeroUnidad: number;        // 1-4
  NombreUnidad: string;
  PunteoZona: number;          // DEFAULT 60.00
  PunteoFinal: number;         // DEFAULT 40.00
  Activa: number;              // 0 o 1
  Estado: boolean;
  CreadoPor?: string;
  FechaCreado?: Date;
  ModificadoPor?: string;
  FechaModificado?: Date;
}
```

### 4. Actividad
```typescript
interface Actividad {
  IdActividad: number;
  IdUnidad: number;            // FK a unidades
  NombreActividad: string;
  Descripcion?: string;
  PunteoMaximo: number;
  TipoActividad: 'zona' | 'final';
  FechaActividad?: Date;
  Estado: boolean;
  CreadoPor?: string;
  FechaCreado?: Date;
  ModificadoPor?: string;
  FechaModificado?: Date;
}
```

### 5. Calificacion
```typescript
interface Calificacion {
  IdCalificacion: number;
  IdActividad: number;         // FK a actividades
  IdAlumno: number;            // FK a alumnos
  Punteo?: number;             // NULL hasta que se ingrese
  Observaciones?: string;
  CreadoPor?: string;
  FechaCreado?: Date;
  ModificadoPor?: string;
  FechaModificado?: Date;
}
```

### 6. Vistas (Solo lectura)

#### vw_asignaciones_docente
```typescript
interface VistaAsignacionDocente {
  IdAsignacionDocente: number;
  idDocente: number;
  NombreDocente: string;
  idCurso: number;
  NombreCurso: string;
  NombreGrado: string;
  NombreSeccion: string;
  NombreJornada: string;
  Anio: number;
  TotalUnidades: number;
  TotalActividades: number;
  TotalAlumnos: number;
}
```

#### vw_actividades_unidad
```typescript
interface VistaActividadesUnidad {
  IdUnidad: number;
  NumeroUnidad: number;
  NombreUnidad: string;
  NombreCurso: string;
  NombreGrado: string;
  NombreSeccion: string;
  NombreDocente: string;
  PunteoZona: number;          // Configurado (60)
  PunteoZonaActual: number;    // Suma actual de actividades
  PunteoFinal: number;         // Configurado (40)
  PunteoFinalActual: number;   // Suma actual de actividades
  TotalActividadesZona: number;
  TotalActividadesFinal: number;
  ZonaCompleta: boolean;       // TRUE si suma 60
  FinalCompleto: boolean;      // TRUE si suma 40
  Activa: number;
}
```

#### vw_calificaciones_alumno_unidad
```typescript
interface VistaCalificacionesAlumno {
  IdAlumno: number;
  Matricula: string;
  NombreCompleto: string;
  Nombres: string;
  Apellidos: string;
  IdUnidad: number;
  NumeroUnidad: number;
  NombreUnidad: string;
  NombreCurso: string;
  NombreGrado: string;
  NombreSeccion: string;
  NombreJornada: string;
  PunteoZonaMax: number;       // 60
  PunteoZonaObtenido: number;
  PunteoFinalMax: number;      // 40
  PunteoFinalObtenido: number;
  TotalUnidad: number;         // Suma de zona + final
  EstadoUnidad: string;        // 'Aprobado' o 'Reprobado'
  UnidadCompletada: boolean;   // TRUE si todas tienen punteo
}
```

#### vw_promedio_anual
```typescript
interface VistaPromedioAnual {
  IdAlumno: number;
  Matricula: string;
  NombreCompleto: string;
  NombreCurso: string;
  NombreGrado: string;
  NombreSeccion: string;
  Unidad1: number;
  Unidad2: number;
  Unidad3: number;
  Unidad4: number;
  PromedioAnual: number;       // Suma de 4 / 4
  EstadoFinal: string;         // 'Aprobado' si >= 60
}
```

---

## 🛣️ ENDPOINTS DISPONIBLES

### 👨‍🏫 DOCENTES

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/docentes` | Listar todos los docentes activos |
| GET | `/api/docentes/:id` | Ver un docente específico |
| GET | `/api/docentes/:id/asignaciones` | Ver asignaciones del docente |
| POST | `/api/docentes` | Crear nuevo docente |
| PUT | `/api/docentes/:id` | Actualizar docente |
| DELETE | `/api/docentes/:id` | Eliminar (desactivar) docente |

### 📚 ASIGNACIONES

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/asignaciones` | Listar todas las asignaciones |
| GET | `/api/asignaciones/:id` | Ver una asignación |
| GET | `/api/asignaciones/:id/unidades` | Ver unidades de la asignación |
| POST | `/api/asignaciones` | Crear asignación (crea 4 unidades automáticamente) |
| PUT | `/api/asignaciones/:id` | Actualizar asignación |
| DELETE | `/api/asignaciones/:id` | Eliminar (desactivar) asignación |

### 📖 UNIDADES

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/unidades/:id` | Ver una unidad |
| GET | `/api/unidades/:id/resumen` | Ver resumen con actividades (vista) |
| GET | `/api/unidades/:id/actividades` | Listar actividades de la unidad |
| GET | `/api/unidades/:id/validar` | Validar si puede activarse (60+40) |
| PUT | `/api/unidades/:id/activar` | Activar unidad (valida automáticamente) |
| PUT | `/api/unidades/:id` | Actualizar unidad |

### ✏️ ACTIVIDADES

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/actividades/:id` | Ver una actividad |
| GET | `/api/actividades/:id/calificaciones` | Ver calificaciones de la actividad |
| POST | `/api/actividades` | Crear actividad (crea calificaciones automáticamente) |
| PUT | `/api/actividades/:id` | Actualizar actividad |
| DELETE | `/api/actividades/:id` | Eliminar (desactivar) actividad |

### 📊 CALIFICACIONES

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/calificaciones/:id` | Ver una calificación |
| GET | `/api/calificaciones/actividad/:id` | Ver calificaciones por actividad |
| GET | `/api/calificaciones/alumno/:id` | Ver calificaciones de un alumno |
| GET | `/api/calificaciones/alumno/:id?unidad=1` | Ver calificaciones por unidad |
| GET | `/api/calificaciones/alumno/:id/promedio` | Ver promedio anual del alumno |
| PUT | `/api/calificaciones/:id` | Actualizar una calificación |
| PUT | `/api/calificaciones/batch` | Actualizar múltiples calificaciones |

---

## 🔄 FLUJO DE USO

### 1️⃣ Crear Docente
```javascript
POST /api/docentes
{
  "idUsuario": 5,
  "NombreDocente": "Emilio Aragón",
  "Email": "emilio@colegio.com",
  "Telefono": "1234-5678",
  "Especialidad": "Matemáticas",
  "CreadoPor": "admin"
}
```

### 2️⃣ Crear Asignación (Automáticamente crea 4 unidades)
```javascript
POST /api/asignaciones
{
  "idDocente": 5,
  "idCurso": 1,
  "idGrado": 1,
  "idSeccion": 1,
  "idJornada": 1,
  "anio": 2025,
  "CreadoPor": "admin"
}

// Respuesta:
{
  "success": true,
  "data": { "idAsignacion": 1 },
  "message": "Asignación creada exitosamente. Se crearon 4 unidades automáticamente."
}
```

### 3️⃣ Crear Actividades para Unidad 1

**Actividades de Zona (4 x 15pts = 60pts):**
```javascript
POST /api/actividades
{
  "IdUnidad": 1,
  "NombreActividad": "Tarea 1",
  "PunteoMaximo": 15.00,
  "TipoActividad": "zona",
  "FechaActividad": "2025-02-15",
  "CreadoPor": "admin"
}
// Repetir 4 veces para completar 60 puntos
```

**Actividad Final (1 x 40pts):**
```javascript
POST /api/actividades
{
  "IdUnidad": 1,
  "NombreActividad": "Examen Final",
  "PunteoMaximo": 40.00,
  "TipoActividad": "final",
  "FechaActividad": "2025-03-10",
  "CreadoPor": "admin"
}
```

**Importante:** Al crear cada actividad, el **trigger automáticamente crea calificaciones** (con Punteo=NULL) para todos los alumnos inscritos en ese grado/sección.

### 4️⃣ Validar Punteos
```javascript
GET /api/unidades/1/validar

// Respuesta:
{
  "success": true,
  "data": {
    "valido": true,
    "zonaConfig": 60.00,
    "zonaActual": 60.00,
    "finalConfig": 40.00,
    "finalActual": 40.00,
    "mensaje": "Punteos válidos. La unidad puede activarse."
  }
}
```

### 5️⃣ Activar Unidad
```javascript
PUT /api/unidades/1/activar
{
  "ModificadoPor": "admin"
}

// Si falla (no suma 60+40):
{
  "success": false,
  "message": "No se puede activar: Zona suma 45.00 de 60.00 requeridos"
}
```

### 6️⃣ Ingresar Calificaciones
```javascript
// Opción 1: Una por una
PUT /api/calificaciones/1
{
  "Punteo": 14.50,
  "Observaciones": "Excelente trabajo",
  "ModificadoPor": "emilio.aragon"
}

// Opción 2: Múltiples (Batch)
PUT /api/calificaciones/batch
{
  "ModificadoPor": "emilio.aragon",
  "calificaciones": [
    { "IdCalificacion": 1, "Punteo": 14.50, "Observaciones": "Muy bien" },
    { "IdCalificacion": 2, "Punteo": 12.00, "Observaciones": "Bien" },
    { "IdCalificacion": 3, "Punteo": 15.00, "Observaciones": "Excelente" }
  ]
}
```

### 7️⃣ Consultar Calificaciones y Promedios
```javascript
// Ver calificaciones de un alumno en una unidad
GET /api/calificaciones/alumno/1?unidad=1

// Ver promedio anual
GET /api/calificaciones/alumno/1/promedio
```

---

## 📝 EJEMPLOS DE PETICIONES Y RESPUESTAS

### Crear Docente

**Request:**
```javascript
POST /api/docentes
Content-Type: application/json
Authorization: Bearer eyJhbGc...

{
  "idUsuario": 5,
  "NombreDocente": "Emilio Aragón",
  "Email": "emilio@colegio.com",
  "Telefono": "1234-5678",
  "Especialidad": "Matemáticas",
  "CreadoPor": "admin"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "idDocente": 5,
    "idUsuario": 5,
    "NombreDocente": "Emilio Aragón",
    "Email": "emilio@colegio.com",
    "Telefono": "1234-5678",
    "Especialidad": "Matemáticas",
    "Estado": true,
    "CreadoPor": "admin",
    "FechaCreado": "2025-01-15T10:30:00.000Z"
  }
}
```

### Listar Asignaciones de un Docente

**Request:**
```javascript
GET /api/docentes/5/asignaciones
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "IdAsignacionDocente": 1,
      "idDocente": 5,
      "NombreDocente": "Emilio Aragón",
      "idCurso": 1,
      "NombreCurso": "Matemáticas",
      "NombreGrado": "Primero Básico",
      "NombreSeccion": "A",
      "NombreJornada": "Matutina",
      "Anio": 2025,
      "TotalUnidades": 4,
      "TotalActividades": 20,
      "TotalAlumnos": 35
    }
  ]
}
```

### Ver Resumen de Unidad

**Request:**
```javascript
GET /api/unidades/1/resumen
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "IdUnidad": 1,
    "NumeroUnidad": 1,
    "NombreUnidad": "Unidad 1",
    "NombreCurso": "Matemáticas",
    "NombreGrado": "Primero Básico",
    "NombreSeccion": "A",
    "NombreDocente": "Emilio Aragón",
    "PunteoZona": 60.00,
    "PunteoZonaActual": 60.00,
    "PunteoFinal": 40.00,
    "PunteoFinalActual": 40.00,
    "TotalActividadesZona": 4,
    "TotalActividadesFinal": 1,
    "ZonaCompleta": true,
    "FinalCompleto": true,
    "Activa": 1
  }
}
```

### Ver Calificaciones de un Alumno

**Request:**
```javascript
GET /api/calificaciones/alumno/15?unidad=1
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "IdAlumno": 15,
      "Matricula": "2025-001",
      "NombreCompleto": "Juan Pérez",
      "Nombres": "Juan",
      "Apellidos": "Pérez",
      "IdUnidad": 1,
      "NumeroUnidad": 1,
      "NombreUnidad": "Unidad 1",
      "NombreCurso": "Matemáticas",
      "NombreGrado": "Primero Básico",
      "NombreSeccion": "A",
      "NombreJornada": "Matutina",
      "PunteoZonaMax": 60.00,
      "PunteoZonaObtenido": 55.50,
      "PunteoFinalMax": 40.00,
      "PunteoFinalObtenido": 35.00,
      "TotalUnidad": 90.50,
      "EstadoUnidad": "Aprobado",
      "UnidadCompletada": true
    }
  ]
}
```

### Ver Promedio Anual

**Request:**
```javascript
GET /api/calificaciones/alumno/15/promedio
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "IdAlumno": 15,
      "Matricula": "2025-001",
      "NombreCompleto": "Juan Pérez",
      "NombreCurso": "Matemáticas",
      "NombreGrado": "Primero Básico",
      "NombreSeccion": "A",
      "Unidad1": 90.50,
      "Unidad2": 85.00,
      "Unidad3": 88.00,
      "Unidad4": 92.00,
      "PromedioAnual": 88.88,
      "EstadoFinal": "Aprobado"
    }
  ]
}
```

### Actualizar Calificación con Validación

**Request:**
```javascript
PUT /api/calificaciones/25
Content-Type: application/json
Authorization: Bearer eyJhbGc...

{
  "Punteo": 14.50,
  "Observaciones": "Excelente trabajo, solo pequeños errores en el ejercicio 3",
  "ModificadoPor": "emilio.aragon"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "IdCalificacion": 25,
    "IdActividad": 5,
    "IdAlumno": 15,
    "Punteo": 14.50,
    "Observaciones": "Excelente trabajo, solo pequeños errores en el ejercicio 3",
    "ModificadoPor": "emilio.aragon",
    "FechaModificado": "2025-01-15T14:30:00.000Z"
  },
  "message": "Calificación actualizada exitosamente"
}
```

---

## ⚠️ REGLAS DE NEGOCIO IMPORTANTES

### 1. Punteos por Unidad
- **Zona:** 60 puntos (actividades múltiples)
- **Final:** 40 puntos (usualmente 1 examen)
- **Total:** 100 puntos por unidad

### 2. Aprobación
- **Unidad aprobada:** >= 60 puntos
- **Curso aprobado:** promedio de 4 unidades >= 60

### 3. Activación de Unidades
- Solo se puede activar si las actividades suman **exactamente 60+40**
- Solo la Unidad 1 se crea activa por defecto
- Unidades 2-4 deben ser activadas manualmente después de configurar actividades

### 4. Calificaciones Automáticas
- Se crean automáticamente al crear una actividad
- Inicialmente tienen `Punteo = NULL`
- Solo se pueden ingresar si la actividad está activa (`Estado = 1`)

### 5. Asignaciones
- Un docente puede tener múltiples asignaciones
- No puede haber asignaciones duplicadas (mismo docente, curso, grado, sección, jornada, año)

### 6. Validaciones de Punteos
- El punteo no puede ser negativo
- El punteo no puede exceder el `PunteoMaximo` de la actividad
- El stored procedure `sp_validar_calificacion` valida automáticamente

---

## 🚨 MANEJO DE ERRORES

### Estructura de Error Estándar

```json
{
  "success": false,
  "error": "Mensaje de error descriptivo"
}
```

o

```json
{
  "success": false,
  "message": "Mensaje de error descriptivo"
}
```

### Códigos de Estado HTTP

| Código | Significado | Cuándo se usa |
|--------|-------------|---------------|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Datos inválidos o validación fallida |
| 401 | Unauthorized | Token inválido o expirado |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Registro duplicado |
| 500 | Internal Server Error | Error del servidor |

### Errores Comunes

#### 1. Error de Trigger (Punteos incorrectos)

**Request:**
```javascript
PUT /api/unidades/1/activar
{ "ModificadoPor": "admin" }
```

**Response (400):**
```json
{
  "success": false,
  "message": "No se puede activar la unidad. Zona suma 45.00 de 60.00 requeridos, Final suma 40.00 de 40.00 requeridos"
}
```

**Cómo manejar en React:**
```javascript
try {
  const response = await fetch('/api/unidades/1/activar', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ModificadoPor: 'admin' })
  });

  const data = await response.json();

  if (!data.success) {
    // Mostrar error al usuario
    alert(data.message);
  }
} catch (error) {
  console.error('Error:', error);
}
```

#### 2. Calificación excede punteo máximo

**Request:**
```javascript
PUT /api/calificaciones/25
{ "Punteo": 99.00, "ModificadoPor": "admin" }
```

**Response (400):**
```json
{
  "success": false,
  "message": "El punteo 99.00 excede el máximo permitido de 15.00"
}
```

#### 3. Asignación duplicada

**Request:**
```javascript
POST /api/asignaciones
{ /* datos duplicados */ }
```

**Response (400):**
```json
{
  "success": false,
  "message": "Ya existe una asignación para este docente en este curso/grado/sección/jornada/año"
}
```

#### 4. Token inválido o expirado

**Response (401):**
```json
{
  "success": false,
  "error": "Token inválido o expirado"
}
```

**Cómo manejar:**
```javascript
if (response.status === 401) {
  // Redirigir a login
  localStorage.removeItem('token');
  navigate('/login');
}
```

#### 5. Campo requerido faltante

**Request:**
```javascript
POST /api/docentes
{ "NombreDocente": "Juan" }  // Falta idUsuario
```

**Response (400):**
```json
{
  "success": false,
  "error": "idUsuario is required"
}
```

---

## 💡 CASOS DE USO COMUNES

### Caso 1: Dashboard de Docente

**Objetivo:** Mostrar todas las asignaciones del docente con estadísticas

```javascript
// 1. Obtener asignaciones del docente
const response = await fetch(`/api/docentes/${idDocente}/asignaciones`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();

// data contiene:
// - NombreCurso
// - NombreGrado, NombreSeccion, NombreJornada
// - TotalUnidades
// - TotalActividades
// - TotalAlumnos
```

**Componente React sugerido:**
```jsx
function DashboardDocente({ idDocente }) {
  const [asignaciones, setAsignaciones] = useState([]);

  useEffect(() => {
    fetch(`/api/docentes/${idDocente}/asignaciones`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setAsignaciones(data.data));
  }, [idDocente]);

  return (
    <div>
      {asignaciones.map(asig => (
        <Card key={asig.IdAsignacionDocente}>
          <h3>{asig.NombreCurso}</h3>
          <p>{asig.NombreGrado} - Sección {asig.NombreSeccion}</p>
          <p>Unidades: {asig.TotalUnidades}</p>
          <p>Actividades: {asig.TotalActividades}</p>
          <p>Alumnos: {asig.TotalAlumnos}</p>
        </Card>
      ))}
    </div>
  );
}
```

### Caso 2: Configurar Actividades de una Unidad

**Objetivo:** Permitir al docente crear actividades y validar antes de activar

```javascript
// 1. Ver estado actual de la unidad
const resumen = await fetch(`/api/unidades/${idUnidad}/resumen`);
const { data } = await resumen.json();

// Mostrar progreso:
// - PunteoZonaActual / PunteoZona (ej: 45/60)
// - PunteoFinalActual / PunteoFinal (ej: 40/40)

// 2. Crear actividad
await fetch('/api/actividades', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    IdUnidad: idUnidad,
    NombreActividad: "Tarea 1",
    PunteoMaximo: 15.00,
    TipoActividad: "zona",
    CreadoPor: username
  })
});

// 3. Validar si puede activarse
const validacion = await fetch(`/api/unidades/${idUnidad}/validar`);
const { data: resultado } = await validacion.json();

if (resultado.valido) {
  // Mostrar botón "Activar Unidad"
} else {
  // Mostrar mensaje de error
  alert(resultado.mensaje);
}
```

**Componente React sugerido:**
```jsx
function ConfigurarUnidad({ idUnidad }) {
  const [resumen, setResumen] = useState(null);
  const [validacion, setValidacion] = useState(null);

  const cargarResumen = async () => {
    const res = await fetch(`/api/unidades/${idUnidad}/resumen`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { data } = await res.json();
    setResumen(data);
  };

  const validarPunteos = async () => {
    const res = await fetch(`/api/unidades/${idUnidad}/validar`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { data } = await res.json();
    setValidacion(data);
  };

  const activarUnidad = async () => {
    const res = await fetch(`/api/unidades/${idUnidad}/activar`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ModificadoPor: username })
    });
    const result = await res.json();
    if (result.success) {
      alert('Unidad activada exitosamente');
    } else {
      alert(result.message);
    }
  };

  return (
    <div>
      <h2>Configurar Unidad {resumen?.NumeroUnidad}</h2>

      {/* Progreso de Zona */}
      <ProgressBar
        label="Zona"
        current={resumen?.PunteoZonaActual}
        max={resumen?.PunteoZona}
      />

      {/* Progreso de Final */}
      <ProgressBar
        label="Final"
        current={resumen?.PunteoFinalActual}
        max={resumen?.PunteoFinal}
      />

      {/* Botón validar */}
      <button onClick={validarPunteos}>Validar</button>

      {/* Botón activar (solo si válido) */}
      {validacion?.valido && (
        <button onClick={activarUnidad}>Activar Unidad</button>
      )}

      {/* Mensaje de error */}
      {validacion && !validacion.valido && (
        <Alert severity="error">{validacion.mensaje}</Alert>
      )}
    </div>
  );
}
```

### Caso 3: Ingresar Calificaciones Masivamente

**Objetivo:** Permitir ingresar todas las calificaciones de una actividad

```javascript
// 1. Obtener todas las calificaciones de la actividad
const response = await fetch(`/api/actividades/${idActividad}/calificaciones`);
const { data: calificaciones } = await response.json();

// 2. Usuario ingresa punteos en un formulario

// 3. Guardar todas las calificaciones en batch
await fetch('/api/calificaciones/batch', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ModificadoPor: username,
    calificaciones: calificaciones.map(cal => ({
      IdCalificacion: cal.IdCalificacion,
      Punteo: cal.nuevoPunteo, // Del formulario
      Observaciones: cal.observaciones
    }))
  })
});
```

**Componente React sugerido:**
```jsx
function IngresarCalificaciones({ idActividad }) {
  const [calificaciones, setCalificaciones] = useState([]);

  useEffect(() => {
    fetch(`/api/actividades/${idActividad}/calificaciones`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setCalificaciones(data.data));
  }, [idActividad]);

  const actualizarPunteo = (idCalificacion, punteo) => {
    setCalificaciones(prev => prev.map(cal =>
      cal.IdCalificacion === idCalificacion
        ? { ...cal, nuevoPunteo: punteo }
        : cal
    ));
  };

  const guardarTodas = async () => {
    const response = await fetch('/api/calificaciones/batch', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ModificadoPor: username,
        calificaciones: calificaciones.map(cal => ({
          IdCalificacion: cal.IdCalificacion,
          Punteo: cal.nuevoPunteo || cal.Punteo,
          Observaciones: cal.Observaciones
        }))
      })
    });

    const result = await response.json();
    if (result.success) {
      alert(`${result.data.actualizadas} calificaciones actualizadas`);
    }
  };

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Matrícula</th>
            <th>Punteo (Max: {calificaciones[0]?.PunteoMaximo})</th>
          </tr>
        </thead>
        <tbody>
          {calificaciones.map(cal => (
            <tr key={cal.IdCalificacion}>
              <td>{cal.Apellidos}, {cal.Nombres}</td>
              <td>{cal.Matricula}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  max={cal.PunteoMaximo}
                  step="0.5"
                  value={cal.nuevoPunteo || cal.Punteo || ''}
                  onChange={(e) => actualizarPunteo(
                    cal.IdCalificacion,
                    parseFloat(e.target.value)
                  )}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={guardarTodas}>Guardar Todas</button>
    </div>
  );
}
```

### Caso 4: Ver Reporte de Calificaciones de un Alumno

**Objetivo:** Mostrar todas las calificaciones y promedio de un alumno

```javascript
// 1. Obtener calificaciones por unidad
const calificaciones = await Promise.all([1, 2, 3, 4].map(async (numUnidad) => {
  const res = await fetch(`/api/calificaciones/alumno/${idAlumno}?unidad=${numUnidad}`);
  const { data } = await res.json();
  return data[0]; // Primera (y única) fila
}));

// 2. Obtener promedio anual
const promedio = await fetch(`/api/calificaciones/alumno/${idAlumno}/promedio`);
const { data: promedioData } = await promedio.json();
```

**Componente React sugerido:**
```jsx
function ReporteAlumno({ idAlumno }) {
  const [calificaciones, setCalificaciones] = useState([]);
  const [promedio, setPromedio] = useState(null);

  useEffect(() => {
    // Cargar calificaciones por unidad
    Promise.all([1, 2, 3, 4].map(numUnidad =>
      fetch(`/api/calificaciones/alumno/${idAlumno}?unidad=${numUnidad}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json())
    )).then(results => {
      setCalificaciones(results.map(r => r.data[0]));
    });

    // Cargar promedio
    fetch(`/api/calificaciones/alumno/${idAlumno}/promedio`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setPromedio(data.data[0]));
  }, [idAlumno]);

  return (
    <div>
      <h2>{promedio?.NombreCompleto}</h2>
      <p>Matrícula: {promedio?.Matricula}</p>

      <table>
        <thead>
          <tr>
            <th>Unidad</th>
            <th>Zona (60)</th>
            <th>Final (40)</th>
            <th>Total (100)</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {calificaciones.map(cal => (
            <tr key={cal?.IdUnidad}>
              <td>{cal?.NumeroUnidad}</td>
              <td>{cal?.PunteoZonaObtenido}</td>
              <td>{cal?.PunteoFinalObtenido}</td>
              <td>{cal?.TotalUnidad}</td>
              <td>{cal?.EstadoUnidad}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>Promedio Anual</th>
            <th colSpan="2"></th>
            <th>{promedio?.PromedioAnual?.toFixed(2)}</th>
            <th>{promedio?.EstadoFinal}</th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
```

---

## 🔧 UTILIDADES PARA REACT

### Hook personalizado para API calls

```javascript
// useApi.js
import { useState, useCallback } from 'react';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || data.error || 'Error en la petición');
      }

      setLoading(false);
      return data.data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  return { callApi, loading, error };
}

// Uso:
function MiComponente() {
  const { callApi, loading, error } = useApi();
  const [docentes, setDocentes] = useState([]);

  useEffect(() => {
    callApi('/docentes')
      .then(data => setDocentes(data))
      .catch(err => console.error(err));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;
  return <div>{/* ... */}</div>;
}
```

### Servicio de API centralizado

```javascript
// services/api.js
const API_URL = 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('token');

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || data.error);
  }

  return data.data;
};

export const docentesApi = {
  getAll: () => request('/docentes'),
  getById: (id) => request(`/docentes/${id}`),
  getAsignaciones: (id) => request(`/docentes/${id}/asignaciones`),
  create: (data) => request('/docentes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/docentes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id, modificadoPor) => request(`/docentes/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ ModificadoPor: modificadoPor }),
  }),
};

export const asignacionesApi = {
  getAll: () => request('/asignaciones'),
  getById: (id) => request(`/asignaciones/${id}`),
  getUnidades: (id) => request(`/asignaciones/${id}/unidades`),
  create: (data) => request('/asignaciones', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const unidadesApi = {
  getById: (id) => request(`/unidades/${id}`),
  getResumen: (id) => request(`/unidades/${id}/resumen`),
  getActividades: (id) => request(`/unidades/${id}/actividades`),
  validar: (id) => request(`/unidades/${id}/validar`),
  activar: (id, modificadoPor) => request(`/unidades/${id}/activar`, {
    method: 'PUT',
    body: JSON.stringify({ ModificadoPor: modificadoPor }),
  }),
};

export const actividadesApi = {
  getById: (id) => request(`/actividades/${id}`),
  getCalificaciones: (id) => request(`/actividades/${id}/calificaciones`),
  create: (data) => request('/actividades', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const calificacionesApi = {
  getById: (id) => request(`/calificaciones/${id}`),
  getPorActividad: (id) => request(`/calificaciones/actividad/${id}`),
  getPorAlumno: (id, unidad) => request(
    `/calificaciones/alumno/${id}${unidad ? `?unidad=${unidad}` : ''}`
  ),
  getPromedio: (id) => request(`/calificaciones/alumno/${id}/promedio`),
  update: (id, data) => request(`/calificaciones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateBatch: (calificaciones, modificadoPor) => request('/calificaciones/batch', {
    method: 'PUT',
    body: JSON.stringify({ calificaciones, ModificadoPor: modificadoPor }),
  }),
};

// Uso:
import { docentesApi } from './services/api';

function MiComponente() {
  const [docentes, setDocentes] = useState([]);

  useEffect(() => {
    docentesApi.getAll()
      .then(data => setDocentes(data))
      .catch(err => console.error(err));
  }, []);
}
```

---

## 📌 NOTAS FINALES

### Campos CreadoPor y ModificadoPor
Todos los endpoints de creación y modificación requieren estos campos:
- **CreadoPor:** Usuario que crea el registro (string)
- **ModificadoPor:** Usuario que modifica el registro (string)

Puedes obtenerlos del contexto de autenticación o del token JWT.

### Automatizaciones del Backend
El backend maneja automáticamente:
1. **Creación de 4 unidades** al crear una asignación
2. **Creación de calificaciones** (Punteo=NULL) al crear una actividad
3. **Validación de punteos** (60+40) al activar una unidad
4. **Cálculo de promedios** mediante vistas de base de datos

### Rate Limiting
- **Login:** 5 intentos cada 15 minutos
- **Rutas protegidas:** 100 peticiones cada 15 minutos

### Seguridad
- Todas las rutas (excepto `/login`) requieren token JWT
- El token debe enviarse en el header `Authorization: Bearer TOKEN`
- Los stored procedures usan `replacements` para prevenir SQL injection

### Pruebas
Antes de implementar en frontend, prueba todos los endpoints en Insomnia/Postman usando los JSONs de ejemplo proporcionados.

---

## 📞 SOPORTE

Si tienes dudas sobre algún endpoint o necesitas ejemplos adicionales, consulta:
- **Archivo de resumen:** `RESUMEN_COMPLETO_PARA_API.md`
- **Código fuente backend:** `backend/src/`
- **Documentación de errores:** Sección "Manejo de Errores" en este documento

---

**Última actualización:** Enero 2025
**Versión API:** 1.0
**Backend:** Node.js + Express + Sequelize + MySQL
