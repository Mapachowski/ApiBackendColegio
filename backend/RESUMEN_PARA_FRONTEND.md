# 📋 Resumen de Cambios - Sistema de Actividades (Para Frontend)

## 🎯 Cambios Implementados en el Backend

Se implementó el sistema de actividades con una estrategia flexible que permite a los docentes crear actividades a lo largo de la unidad, con validaciones críticas en puntos estratégicos.

---

## 🔑 Reglas de Negocio Confirmadas

### 1. **Creación de Actividades**
- ✅ Los docentes pueden crear actividades en **cualquier momento** durante la unidad activa
- ✅ **NO es un wizard** - pueden agregar actividades progresivamente
- ⚠️ **FechaActividad es OBLIGATORIA** para todas las actividades
- ⚠️ La validación de suma **NO es obligatoria** (solo advertencia)

### 2. **Modificación de Actividades**
- ❌ **NO se puede modificar una actividad si la fecha límite ya pasó** (403 Forbidden)
- ❌ **NO se puede cambiar PunteoMaximo si hay estudiantes calificados** (403 Forbidden)
- ✅ **SÍ se puede** modificar nombre/descripción antes de la fecha límite

### 3. **Calificación del Examen Final**
- ❌ **BLOQUEADO** si las actividades de zona NO suman el punteo esperado (403 Forbidden)
- ✅ Esto **obliga** al docente a completar las actividades de zona antes de calificar el final

### 4. **Cierre de Unidades**
- 🔒 **Solo el Admin** puede cerrar unidades
- 🔒 **Solo el Admin** puede activar la siguiente unidad
- 📊 **Admin tiene un reporte** de unidades incompletas

---

## 📡 Endpoints Disponibles para el Frontend

### **Actividades**

#### 1. Obtener actividades de una unidad
```http
GET /api/actividades/unidad/:idUnidad
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "IdActividad": 1,
      "IdUnidad": 1,
      "NombreActividad": "Tarea 1",
      "Descripcion": "...",
      "PunteoMaximo": 10.00,
      "TipoActividad": "zona",
      "FechaActividad": "2025-02-15",
      "Estado": true
    }
  ],
  "totales": {
    "zona": 50,
    "final": 40,
    "total": 90
  },
  "cantidad": 6
}
```

---

#### 2. Crear actividades por lote
```http
POST /api/actividades/unidad/:idUnidad/batch
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "CreadoPor": "emilio.aragon",
  "actividades": [
    {
      "NombreActividad": "Tarea 1",
      "Descripcion": "Ejercicios del libro",
      "PunteoMaximo": 10.00,
      "TipoActividad": "zona",
      "FechaActividad": "2025-02-15"
    },
    {
      "NombreActividad": "Examen Final",
      "Descripcion": "Evaluación final",
      "PunteoMaximo": 40.00,
      "TipoActividad": "final",
      "FechaActividad": "2025-03-15"
    }
  ]
}
```

**Respuesta exitosa (con advertencia):**
```json
{
  "success": true,
  "data": [...],
  "message": "2 actividades creadas exitosamente.",
  "totales": {
    "zona": 50,
    "final": 40,
    "total": 90
  },
  "advertencias": [
    "Las actividades de ZONA suman 50 pero deben sumar 60"
  ],
  "mensaje_advertencia": "ADVERTENCIA: Los punteos no suman correctamente. El docente NO podrá calificar el examen final hasta que la zona sume 100%."
}
```

**UI Recommendation:**
- Mostrar las `advertencias` como warning (no error)
- Explicar que no podrán calificar el final hasta completar zona

---

#### 3. Validar suma (en tiempo real)
```http
POST /api/actividades/unidad/:idUnidad/validar-suma
Authorization: Bearer {token}
```

**Body:**
```json
{
  "actividades": [
    { "PunteoMaximo": 10, "TipoActividad": "zona" },
    { "PunteoMaximo": 40, "TipoActividad": "final" }
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "valido": false,
  "detalles": {
    "zona": {
      "suma": 50,
      "esperado": 60,
      "diferencia": 10,
      "valido": false
    },
    "final": {
      "suma": 40,
      "esperado": 40,
      "diferencia": 0,
      "valido": true
    }
  }
}
```

---

#### 4. Crear actividad individual
```http
POST /api/actividades/
Authorization: Bearer {token}
```

**Body:**
```json
{
  "IdUnidad": 1,
  "NombreActividad": "Laboratorio 1",
  "Descripcion": "Práctica",
  "PunteoMaximo": 15.00,
  "TipoActividad": "zona",
  "FechaActividad": "2025-02-20",
  "CreadoPor": "usuario"
}
```

---

#### 5. Actualizar actividad
```http
PUT /api/actividades/:id
Authorization: Bearer {token}
```

**Body:**
```json
{
  "NombreActividad": "Laboratorio 1 - Modificado",
  "Descripcion": "Nueva descripción",
  "PunteoMaximo": 20.00,
  "ModificadoPor": "usuario"
}
```

**Errores posibles (403 Forbidden):**

**Fecha límite pasada:**
```json
{
  "success": false,
  "error": "No se puede modificar la actividad porque la fecha límite ya pasó",
  "detalles": {
    "fechaLimite": "2025-01-15",
    "fechaActual": "2025-01-20"
  }
}
```

**Estudiantes calificados:**
```json
{
  "success": false,
  "error": "No se puede modificar el punteo máximo porque ya hay estudiantes calificados",
  "detalles": {
    "estudiantesCalificados": 15,
    "punteoActual": 10,
    "punteoSolicitado": 20
  }
}
```

---

#### 6. Eliminar actividad
```http
DELETE /api/actividades/:id
Authorization: Bearer {token}
```

**Body:**
```json
{
  "ModificadoPor": "usuario"
}
```

---

### **Calificaciones**

#### Actualizar calificación
```http
PUT /api/calificaciones/:id
Authorization: Bearer {token}
```

**Body:**
```json
{
  "Punteo": 85.00,
  "Observaciones": "Excelente",
  "ModificadoPor": "usuario"
}
```

**Error si intenta calificar final con zona incompleta (403):**
```json
{
  "success": false,
  "error": "No se puede calificar el examen final porque las actividades de ZONA no suman correctamente",
  "detalles": {
    "zonaActual": 50,
    "zonaEsperada": 60,
    "diferencia": 10,
    "mensaje": "Falta configurar 10 puntos en actividades de zona"
  }
}
```

**UI Recommendation:**
- Validar zona completa ANTES de mostrar formulario de calificación final
- Deshabilitar botón "Calificar Final" si zona incompleta
- Mostrar mensaje preventivo

---

### **Unidades (Admin)**

#### Reporte de unidades incompletas
```http
GET /api/unidades/reporte-incompletas
Authorization: Bearer {token_admin}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "IdUnidad": 5,
      "NumeroUnidad": 1,
      "NombreUnidad": "Unidad 1",
      "curso": "Matemática",
      "grado": "Primero Básico",
      "seccion": "A",
      "jornada": "Matutina",
      "docente": "Juan Pérez",
      "zona": {
        "esperado": 60,
        "actual": 50,
        "diferencia": 10,
        "incompleta": true,
        "cantidadActividades": 3
      },
      "final": {
        "esperado": 40,
        "actual": 40,
        "diferencia": 0,
        "incompleta": false,
        "cantidadActividades": 1
      },
      "bloqueaFinal": true
    }
  ],
  "total": 1,
  "mensaje": "Se encontraron 1 unidades con actividades incompletas"
}
```

---

## 🎨 Recomendaciones UX

### 1. Formulario de Actividades

**Validación en tiempo real:**
```javascript
async function validarEnTiempoReal(idUnidad, actividades) {
  const res = await fetch(`/api/actividades/unidad/${idUnidad}/validar-suma`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actividades })
  });
  const data = await res.json();

  if (!data.valido) {
    mostrarAdvertencia(data.detalles);
  }
}
```

**Indicadores visuales:**
- 🟢 Verde: Suma correcta
- 🟡 Amarillo: Incompleta (mostrar diferencia)
- 🔴 Rojo: Excede límite

---

### 2. Lista de Actividades

**Mostrar totales:**
```jsx
<Totales>
  <div>Zona: {totales.zona} / {esperado.zona}</div>
  <div>Final: {totales.final} / {esperado.final}</div>
  <ProgressBar
    value={totales.total}
    max={100}
    color={totales.total === 100 ? 'green' : 'yellow'}
  />
</Totales>
```

---

### 3. Formulario de Calificaciones (Final)

**Validar ANTES de mostrar:**
```javascript
async function beforeShowFinalGradeForm(idUnidad) {
  const res = await fetch(`/api/actividades/unidad/${idUnidad}`);
  const { totales } = await res.json();
  const unidad = await obtenerUnidad(idUnidad);

  if (totales.zona !== unidad.PunteoZona) {
    alert(`No puede calificar el final. Zona incompleta:
           ${totales.zona}/${unidad.PunteoZona}`);
    return false;
  }
  return true;
}
```

---

### 4. Dashboard Docente

```jsx
<UnidadCard>
  <h3>Unidad 1</h3>
  <EstadoActividades>
    {zonaCompleta ? (
      <Badge color="green">✓ Zona completa</Badge>
    ) : (
      <Badge color="yellow">
        ⚠ Falta {diferencia} puntos
      </Badge>
    )}
  </EstadoActividades>
  <Button disabled={!zonaCompleta}>Calificar Final</Button>
</UnidadCard>
```

---

### 5. Dashboard Admin

```jsx
<Table>
  <thead>
    <tr>
      <th>Curso</th>
      <th>Docente</th>
      <th>Zona (Actual/Esperado)</th>
      <th>Estado</th>
    </tr>
  </thead>
  <tbody>
    {unidadesIncompletas.map(u => (
      <tr key={u.IdUnidad}>
        <td>{u.curso} - {u.grado} {u.seccion}</td>
        <td>{u.docente}</td>
        <td>
          {u.zona.actual} / {u.zona.esperado}
          <span className="diff">
            (falta {u.zona.diferencia})
          </span>
        </td>
        <td>
          {u.bloqueaFinal ? (
            <Badge color="red">Bloqueado</Badge>
          ) : (
            <Badge color="green">OK</Badge>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</Table>
```

---

## 🔒 Seguridad

**Middleware de propiedad:**
- Admin/Operador: Acceso completo
- Docente: Solo sus propias actividades
- Otros: Sin acceso

**Error 403:**
```json
{
  "success": false,
  "error": "No tienes permiso para modificar esta actividad"
}
```

---

## ✅ Flujo Completo

### Flujo Docente

1. Ver unidad activa → `GET /api/actividades/unidad/:id`
2. Agregar actividad → `POST /api/actividades/` (con validación tiempo real)
3. Calificar zona → `PUT /api/calificaciones/:id` (sin restricciones)
4. Calificar final → Validar zona completa → `PUT /api/calificaciones/:id`
5. Modificar actividad → Validar fecha/calificaciones → `PUT /api/actividades/:id`

### Flujo Admin

1. Ver reporte → `GET /api/unidades/reporte-incompletas`
2. Notificar docentes (implementar en frontend)
3. Cerrar unidad → `POST /api/unidades/asignacion/:id/cerrar-y-abrir`

---

## 📝 Notas Importantes

1. **FechaActividad OBLIGATORIA** - Validar en formulario
2. **Advertencias ≠ Errores** - Permitir crear con warning
3. **Validar zona antes de formulario final**
4. **Deshabilitar PunteoMaximo si hay calificaciones**
5. **Trigger MySQL crea calificaciones automáticamente**

---

## 🐛 Códigos HTTP

- **200**: OK
- **201**: Creado
- **400**: Validación fallida
- **403**: Prohibido (fecha, calificaciones, zona)
- **404**: No encontrado
- **500**: Error servidor

**Ejemplo manejo:**
```javascript
try {
  const res = await fetch('/api/actividades/:id', {
    method: 'PUT',
    body: JSON.stringify(data)
  });

  if (res.status === 403) {
    const error = await res.json();
    showError(error.error, error.detalles);
    return;
  }

  if (!res.ok) throw new Error('Error');

  showSuccess('Actualizado');
} catch (err) {
  showError(err.message);
}
```

---

¡Backend listo para frontend! 🚀
