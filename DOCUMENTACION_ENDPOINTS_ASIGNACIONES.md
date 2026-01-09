# 📚 DOCUMENTACIÓN - ENDPOINTS DE ASIGNACIONES

## Nuevos Endpoints Implementados para Frontend

---

## 1️⃣ Filtrar Asignaciones

**Endpoint:** `GET /api/asignaciones`

**Descripción:** Obtiene asignaciones con filtros opcionales

**Query Parameters (todos opcionales):**
```typescript
{
  anio?: number;        // Ej: 2025
  idGrado?: number;     // Ej: 3
  idSeccion?: number;   // Ej: 1
  idJornada?: number;   // Ej: 1
  idDocente?: number;   // Ej: 5
}
```

**Ejemplos de uso:**

```javascript
// Sin filtros - trae todas las asignaciones activas
GET /api/asignaciones

// Filtrar por año
GET /api/asignaciones?anio=2025

// Filtrar por grado y sección
GET /api/asignaciones?anio=2025&idGrado=3&idSeccion=1

// Filtrar por docente
GET /api/asignaciones?idDocente=5&anio=2025

// Combinar todos los filtros
GET /api/asignaciones?anio=2025&idGrado=3&idSeccion=1&idJornada=1
```

**Response exitoso:**
```json
{
  "success": true,
  "data": [
    {
      "IdAsignacionDocente": 1,
      "IdDocente": 5,
      "NombreDocente": "Emilio Aragón",
      "EmailDocente": "emilio@colegio.com",
      "IdCurso": 2,
      "NombreCurso": "Matemáticas",
      "NoOrden": 1,
      "IdGrado": 3,
      "NombreGrado": "Tercero Primaria",
      "IdSeccion": 1,
      "NombreSeccion": "A",
      "IdJornada": 1,
      "NombreJornada": "Matutina",
      "Anio": 2025,
      "Estado": true,
      "CreadoPor": "admin",
      "FechaCreado": "2025-01-15T10:30:00.000Z",
      "ModificadoPor": null,
      "FechaModificado": null,
      "TotalUnidades": 4,
      "TotalActividades": 20
    }
  ]
}
```

---

## 2️⃣ Validar Asignación Duplicada

**Endpoint:** `GET /api/asignaciones/validar`

**Descripción:** Valida si ya existe una asignación antes de crearla

**Query Parameters (todos requeridos):**
```typescript
{
  idDocente: number;    // Requerido
  idCurso: number;      // Requerido
  idGrado: number;      // Requerido
  idSeccion: number;    // Requerido
  idJornada: number;    // Requerido
  anio: number;         // Requerido
}
```

**Ejemplo de uso:**

```javascript
GET /api/asignaciones/validar?idDocente=5&idCurso=2&idGrado=3&idSeccion=1&idJornada=1&anio=2025
```

**Response cuando NO existe duplicado:**
```json
{
  "success": true,
  "data": {
    "existe": false,
    "idAsignacionExistente": null,
    "nombreDocente": null,
    "nombreCurso": null,
    "nombreGrado": null,
    "nombreSeccion": null,
    "nombreJornada": null,
    "anio": null,
    "mensaje": "No existe duplicado. Puede crear la asignación."
  }
}
```

**Response cuando SÍ existe duplicado:**
```json
{
  "success": true,
  "data": {
    "existe": true,
    "idAsignacionExistente": 15,
    "nombreDocente": "Emilio Aragón",
    "nombreCurso": "Matemáticas",
    "nombreGrado": "Tercero Primaria",
    "nombreSeccion": "A",
    "nombreJornada": "Matutina",
    "anio": 2025,
    "mensaje": "Ya existe una asignación: Emilio Aragón - Matemáticas en Tercero Primaria A Matutina (2025)"
  }
}
```

**Uso en React:**

```javascript
const validarAsignacion = async (formData) => {
  const params = new URLSearchParams({
    idDocente: formData.idDocente,
    idCurso: formData.idCurso,
    idGrado: formData.idGrado,
    idSeccion: formData.idSeccion,
    idJornada: formData.idJornada,
    anio: formData.anio
  });

  const response = await fetch(`/api/asignaciones/validar?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const { data } = await response.json();

  if (data.existe) {
    alert(data.mensaje);
    return false; // No permitir crear
  }

  return true; // OK para crear
};
```

---

## 3️⃣ Obtener Cursos Disponibles

**Endpoint:** `GET /api/asignaciones/cursos-disponibles`

**Descripción:** Obtiene lista de cursos de un grado con su estado de asignación

**Query Parameters (todos requeridos):**
```typescript
{
  idGrado: number;      // Requerido
  idSeccion: number;    // Requerido
  idJornada: number;    // Requerido
  anio: number;         // Requerido
}
```

**Ejemplo de uso:**

```javascript
GET /api/asignaciones/cursos-disponibles?idGrado=3&idSeccion=1&idJornada=1&anio=2025
```

**Response exitoso:**
```json
{
  "success": true,
  "data": [
    {
      "idCurso": 1,
      "NombreCurso": "Matemáticas",
      "CodigoSire": "MAT-301",
      "NoOrden": 1,
      "idGrado": 3,
      "NombreGrado": "Tercero Primaria",
      "YaAsignado": true,
      "IdDocenteAsignado": 5,
      "DocenteAsignado": "Emilio Aragón",
      "IdAsignacionDocente": 15
    },
    {
      "idCurso": 2,
      "NombreCurso": "Lenguaje",
      "CodigoSire": "LEN-301",
      "NoOrden": 2,
      "idGrado": 3,
      "NombreGrado": "Tercero Primaria",
      "YaAsignado": false,
      "IdDocenteAsignado": null,
      "DocenteAsignado": null,
      "IdAsignacionDocente": null
    },
    {
      "idCurso": 3,
      "NombreCurso": "Ciencias Naturales",
      "CodigoSire": "CN-301",
      "NoOrden": 3,
      "idGrado": 3,
      "NombreGrado": "Tercero Primaria",
      "YaAsignado": false,
      "IdDocenteAsignado": null,
      "DocenteAsignado": null,
      "IdAsignacionDocente": null
    }
  ]
}
```

**Uso en React:**

```javascript
const CursosDisponibles = ({ idGrado, idSeccion, idJornada, anio }) => {
  const [cursos, setCursos] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams({ idGrado, idSeccion, idJornada, anio });

    fetch(`/api/asignaciones/cursos-disponibles?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setCursos(data.data));
  }, [idGrado, idSeccion, idJornada, anio]);

  return (
    <div>
      <h3>Cursos de {cursos[0]?.NombreGrado}</h3>
      <table>
        <thead>
          <tr>
            <th>Orden</th>
            <th>Curso</th>
            <th>Estado</th>
            <th>Docente Asignado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cursos.map(curso => (
            <tr key={curso.idCurso}>
              <td>{curso.NoOrden}</td>
              <td>{curso.NombreCurso}</td>
              <td>
                {curso.YaAsignado ? (
                  <span className="badge badge-success">Asignado</span>
                ) : (
                  <span className="badge badge-warning">Pendiente</span>
                )}
              </td>
              <td>{curso.DocenteAsignado || '-'}</td>
              <td>
                {curso.YaAsignado ? (
                  <button onClick={() => editarAsignacion(curso.IdAsignacionDocente)}>
                    Editar
                  </button>
                ) : (
                  <button onClick={() => crearAsignacion(curso.idCurso)}>
                    Asignar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## 🔧 Manejo de Errores

### Error 400 - Parámetros Faltantes

**Request:**
```javascript
GET /api/asignaciones/validar?idDocente=5
```

**Response:**
```json
{
  "success": false,
  "error": "Todos los parámetros son requeridos: idDocente, idCurso, idGrado, idSeccion, idJornada, anio"
}
```

### Error 500 - Error del Servidor

```json
{
  "success": false,
  "error": "Descripción del error del servidor"
}
```

---

## 📋 Resumen de Endpoints

| Endpoint | Método | Descripción | Parámetros |
|----------|--------|-------------|------------|
| `/api/asignaciones` | GET | Lista asignaciones (con filtros) | `anio`, `idGrado`, `idSeccion`, `idJornada`, `idDocente` (todos opcionales) |
| `/api/asignaciones/validar` | GET | Valida duplicados | `idDocente`, `idCurso`, `idGrado`, `idSeccion`, `idJornada`, `anio` (todos requeridos) |
| `/api/asignaciones/cursos-disponibles` | GET | Lista cursos con estado | `idGrado`, `idSeccion`, `idJornada`, `anio` (todos requeridos) |

---

## 💡 Casos de Uso Comunes

### Caso 1: Pantalla de Asignación de Cursos

```javascript
function AsignarCursos() {
  const [grado, setGrado] = useState(null);
  const [seccion, setSeccion] = useState(null);
  const [jornada, setJornada] = useState(null);
  const [anio, setAnio] = useState(2025);
  const [cursos, setCursos] = useState([]);

  // Cuando cambian los filtros
  useEffect(() => {
    if (grado && seccion && jornada && anio) {
      cargarCursosDisponibles();
    }
  }, [grado, seccion, jornada, anio]);

  const cargarCursosDisponibles = async () => {
    const params = new URLSearchParams({
      idGrado: grado,
      idSeccion: seccion,
      idJornada: jornada,
      anio
    });

    const response = await fetch(`/api/asignaciones/cursos-disponibles?${params}`);
    const { data } = await response.json();
    setCursos(data);
  };

  const asignarCurso = async (idCurso, idDocente) => {
    // 1. Validar duplicado
    const params = new URLSearchParams({
      idDocente,
      idCurso,
      idGrado: grado,
      idSeccion: seccion,
      idJornada: jornada,
      anio
    });

    const validacion = await fetch(`/api/asignaciones/validar?${params}`);
    const { data: validacionData } = await validacion.json();

    if (validacionData.existe) {
      alert(validacionData.mensaje);
      return;
    }

    // 2. Crear asignación
    const response = await fetch('/api/asignaciones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        idDocente,
        idCurso,
        idGrado: grado,
        idSeccion: seccion,
        idJornada: jornada,
        anio,
        CreadoPor: username
      })
    });

    if (response.ok) {
      // Recargar cursos disponibles
      cargarCursosDisponibles();
    }
  };

  return (
    // UI aquí
  );
}
```

### Caso 2: Dashboard de Docente con Filtros

```javascript
function DashboardDocente({ idDocente }) {
  const [anio, setAnio] = useState(2025);
  const [asignaciones, setAsignaciones] = useState([]);

  useEffect(() => {
    fetch(`/api/asignaciones?idDocente=${idDocente}&anio=${anio}`)
      .then(res => res.json())
      .then(data => setAsignaciones(data.data));
  }, [idDocente, anio]);

  return (
    <div>
      <h2>Mis Asignaciones - {anio}</h2>
      {asignaciones.map(asig => (
        <Card key={asig.IdAsignacionDocente}>
          <h3>{asig.NombreCurso}</h3>
          <p>{asig.NombreGrado} - Sección {asig.NombreSeccion}</p>
          <p>Jornada: {asig.NombreJornada}</p>
          <p>Unidades: {asig.TotalUnidades}</p>
          <p>Actividades: {asig.TotalActividades}</p>
        </Card>
      ))}
    </div>
  );
}
```

---

**Fecha de creación:** 2025-12-09
**Versión:** 1.0
