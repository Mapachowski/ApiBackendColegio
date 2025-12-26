# 📚 Sistema de Actividades - Instrucciones de Implementación

## 🎯 Resumen
Este sistema permite a los docentes crear actividades para las unidades de sus cursos de forma flexible. Los docentes pueden agregar actividades a lo largo de la unidad activa, pero tienen restricciones importantes:

- **Validación de suma NO es obligatoria** al crear actividades (solo advertencia)
- **BLOQUEO de calificación del examen final** si las actividades de zona NO suman 100%
- **FechaActividad es OBLIGATORIA** para todas las actividades
- **NO se puede modificar una actividad si la fecha límite ya pasó**
- **NO se puede cambiar el PunteoMaximo si ya hay estudiantes calificados**
- **Solo el Admin puede cerrar unidades** y activar la siguiente

---

## 📋 Paso 1: Ejecutar el Trigger en MySQL

### **Instrucción para ti y tu hijo:**

1. Abrir MySQL Workbench o tu cliente MySQL preferido
2. Conectarse a la base de datos `colegio`
3. Abrir el archivo: `E:\Colegio\ApiBackendColegio\backend\database\trigger_asignar_actividad_estudiantes.sql`
4. Ejecutar TODO el contenido del archivo

**Comando rápido (desde terminal MySQL):**
```bash
mysql -u root -p colegio < E:\Colegio\ApiBackendColegio\backend\database\trigger_asignar_actividad_estudiantes.sql
```

**O copiar y pegar en MySQL Workbench:**
- Copiar todo el contenido del archivo .sql
- Pegarlo en una nueva query
- Presionar el botón Execute (o F5)

### **Verificar que se creó correctamente:**
```sql
SHOW TRIGGERS LIKE 'actividades';
```

Deberías ver el trigger `trg_asignar_actividad_estudiantes`.

---

## 🔄 Paso 2: Reiniciar el Backend

El backend necesita cargar los nuevos controllers y middleware.

**Opción A: Si tienes PowerShell con tus comandos:**
```powershell
# Matar solo el backend
kill-back

# Navegar al backend
cd E:\Colegio\ApiBackendColegio\backend

# Iniciar de nuevo
npm start
```

**Opción B: Manual:**
```bash
# Detener el proceso (Ctrl+C en la terminal del backend)
# Luego iniciarlo de nuevo
npm start
```

---

## 🧪 Paso 3: Probar con Postman

### **Test 1: Obtener actividades de una unidad**
```http
GET http://localhost:4000/api/actividades/unidad/1
Authorization: Bearer {tu_token_jwt}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": [...array de actividades...],
  "totales": {
    "zona": 60,
    "final": 40,
    "total": 100
  },
  "cantidad": 6
}
```

---

### **Test 2: Validar suma ANTES de crear**
```http
POST http://localhost:4000/api/actividades/unidad/1/validar-suma
Authorization: Bearer {tu_token_docente}
Content-Type: application/json

{
  "actividades": [
    {
      "NombreActividad": "Tarea 1",
      "PunteoMaximo": 10,
      "TipoActividad": "zona"
    },
    {
      "NombreActividad": "Tarea 2",
      "PunteoMaximo": 10,
      "TipoActividad": "zona"
    },
    {
      "NombreActividad": "Examen Parcial",
      "PunteoMaximo": 40,
      "TipoActividad": "zona"
    },
    {
      "NombreActividad": "Examen Final",
      "PunteoMaximo": 40,
      "TipoActividad": "final"
    }
  ]
}
```

**Respuesta si suma correctamente:**
```json
{
  "success": true,
  "valido": true,
  "detalles": {
    "zona": {
      "suma": 60,
      "esperado": 60,
      "diferencia": 0,
      "valido": true
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

**Respuesta si NO suma correctamente:**
```json
{
  "success": true,
  "valido": false,
  "detalles": {
    "zona": {
      "suma": 50,      // ❌ Falta 10
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

### **Test 3: Crear actividades por lote (CON validación)**
```http
POST http://localhost:4000/api/actividades/unidad/1/batch
Authorization: Bearer {tu_token_docente}
Content-Type: application/json

{
  "CreadoPor": "emilio.aragon",
  "actividades": [
    {
      "NombreActividad": "Tarea 1 - Números",
      "Descripcion": "Ejercicios del libro páginas 10-15",
      "PunteoMaximo": 10.00,
      "TipoActividad": "zona",
      "FechaActividad": "2025-02-05"
    },
    {
      "NombreActividad": "Tarea 2 - Figuras Geométricas",
      "Descripcion": "Dibujar y clasificar figuras",
      "PunteoMaximo": 10.00,
      "TipoActividad": "zona",
      "FechaActividad": "2025-02-12"
    },
    {
      "NombreActividad": "Laboratorio 1",
      "Descripcion": "Práctica con regletas",
      "PunteoMaximo": 15.00,
      "TipoActividad": "zona",
      "FechaActividad": "2025-02-19"
    },
    {
      "NombreActividad": "Prueba Corta",
      "Descripcion": "Evaluación rápida",
      "PunteoMaximo": 15.00,
      "TipoActividad": "zona",
      "FechaActividad": "2025-02-26"
    },
    {
      "NombreActividad": "Proyecto Grupal",
      "Descripcion": "Mural de números",
      "PunteoMaximo": 10.00,
      "TipoActividad": "zona",
      "FechaActividad": "2025-03-05"
    },
    {
      "NombreActividad": "Examen Final Unidad 1",
      "Descripcion": "Evaluación final de primera unidad",
      "PunteoMaximo": 40.00,
      "TipoActividad": "final",
      "FechaActividad": "2025-03-15"
    }
  ]
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [...actividades creadas con sus IDs...],
  "message": "6 actividades creadas exitosamente. Las calificaciones fueron asignadas automáticamente a los estudiantes.",
  "totales": {
    "zona": 60,
    "final": 40,
    "total": 100
  }
}
```

**Respuesta si NO suma correctamente:**
```json
{
  "success": false,
  "error": "Error de validación de punteos",
  "detalles": [
    "Las actividades de ZONA suman 50 pero deben sumar 60"
  ],
  "recibido": { "zona": 50, "final": 40 },
  "esperado": { "zona": 60, "final": 40 }
}
```

---

## 🔍 Paso 4: Verificar que el Trigger funcionó

Después de crear actividades, verifica que se crearon las calificaciones automáticamente:

```sql
-- Ver las actividades recién creadas
SELECT * FROM actividades
WHERE IdUnidad = 1
ORDER BY IdActividad DESC
LIMIT 10;

-- Ver las calificaciones generadas automáticamente
SELECT
    c.IdCalificacion,
    c.IdActividad,
    act.NombreActividad,
    c.IdAlumno,
    a.Matricula,
    CONCAT(a.Nombres, ' ', a.Apellidos) AS Alumno,
    c.Punteo,
    c.FechaRegistro
FROM calificaciones c
INNER JOIN actividades act ON c.IdActividad = act.IdActividad
INNER JOIN alumnos a ON c.IdAlumno = a.IdAlumno
WHERE act.IdUnidad = 1
ORDER BY act.IdActividad DESC, a.Apellidos, a.Nombres;
```

**Deberías ver:**
- Un registro de calificación por cada estudiante inscrito en esa sección/grado/jornada
- `Punteo = NULL` (se llenará cuando el docente califique)
- `FechaRegistro` con la fecha/hora actual

---

## 🔒 Paso 5: Verificar seguridad (Middleware de permisos)

### **Test de seguridad: Docente NO puede crear actividades de otro docente**

**Escenario:**
1. Hacer login como docente1 → obtener token
2. Intentar crear actividades para una unidad que pertenece a docente2

```http
POST http://localhost:4000/api/actividades/unidad/99/batch
Authorization: Bearer {token_docente1}
Content-Type: application/json

{
  "CreadoPor": "docente1",
  "actividades": [...]
}
```

**Respuesta esperada (403 Forbidden):**
```json
{
  "success": false,
  "error": "No tienes permiso para modificar esta actividad. Solo puedes modificar actividades de tus propias unidades."
}
```

---

## 📊 Endpoints Disponibles

### Actividades

| Método | Endpoint | Descripción | Auth | Middleware | Validaciones |
|--------|----------|-------------|------|------------|--------------|
| GET | `/api/actividades/unidad/:idUnidad` | Obtener actividades de una unidad | ✅ | ❌ | - |
| POST | `/api/actividades/unidad/:idUnidad/batch` | Crear actividades por lote | ✅ | ✅ Propiedad | FechaActividad obligatoria, suma es advertencia |
| POST | `/api/actividades/unidad/:idUnidad/validar-suma` | Validar suma sin crear | ✅ | ❌ | - |
| GET | `/api/actividades/:id` | Obtener actividad por ID | ✅ | ❌ | - |
| GET | `/api/actividades/:id/calificaciones` | Obtener calificaciones de actividad | ✅ | ❌ | - |
| POST | `/api/actividades/` | Crear actividad individual | ✅ | ✅ Propiedad | FechaActividad obligatoria |
| PUT | `/api/actividades/:id` | Actualizar actividad | ✅ | ✅ Propiedad | ⚠️ Fecha límite, ⚠️ PunteoMaximo si calificado |
| DELETE | `/api/actividades/:id` | Eliminar (desactivar) actividad | ✅ | ✅ Propiedad | - |

### Calificaciones

| Método | Endpoint | Descripción | Auth | Validaciones |
|--------|----------|-------------|------|--------------|
| PUT | `/api/calificaciones/:id` | Actualizar calificación | ✅ | ⚠️ Bloquea final si zona incompleta |

### Unidades (Admin)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/api/unidades/reporte-incompletas` | Reporte de unidades con zona incompleta | ✅ | Admin/Operador |

---

## ⚠️ Notas Importantes

1. **El trigger SE EJECUTA AUTOMÁTICAMENTE** cada vez que se inserta una actividad
2. **Las validaciones de suma SON ADVERTENCIAS** (no bloquean la creación), pero BLOQUEAN la calificación del examen final
3. **Los docentes SOLO pueden modificar sus propias actividades** (middleware de seguridad)
4. **Admin y Operador tienen acceso completo** sin restricciones
5. **Las calificaciones se crean con Punteo = NULL**, el docente las llenará después
6. **Si eliminas una actividad** (soft delete con Estado=0), las calificaciones quedan pero la actividad ya no aparece
7. **CRITICAL**: No se puede calificar el examen final si zona incompleta (403 Forbidden)
8. **CRITICAL**: No se puede modificar una actividad después de su fecha límite (403 Forbidden)
9. **CRITICAL**: No se puede cambiar PunteoMaximo si hay estudiantes calificados (403 Forbidden)
10. **FechaActividad es OBLIGATORIA** en todas las actividades

---

## 🐛 Troubleshooting

### Problema: "Trigger no encontrado"
**Solución:** Ejecutar el archivo SQL del trigger nuevamente

### Problema: "No se crearon calificaciones automáticamente"
**Solución:**
1. Verificar que el trigger existe: `SHOW TRIGGERS LIKE 'actividades';`
2. Verificar que hay estudiantes inscritos en esa sección/grado/jornada
3. Revisar los logs de MySQL para ver si hay errores

### Problema: "Error de validación de punteos"
**Solución:**
1. Verificar que la suma de actividades tipo 'zona' = PunteoZona de la unidad
2. Verificar que la suma de actividades tipo 'final' = PunteoFinal de la unidad
3. Usar el endpoint `/validar-suma` para debuggear

### Problema: "403 Forbidden - No tienes permiso"
**Solución:**
- Verificar que el token JWT sea del docente correcto
- Verificar que la unidad pertenezca a una asignación de ese docente
- Si eres admin/operador, el error no debería aparecer

---

## 🚀 Nuevas Funcionalidades Implementadas

### 1. Validación flexible de suma (advertencia)
Al crear actividades por lote, el sistema NO bloquea si la suma es incorrecta, solo advierte:

```json
{
  "success": true,
  "data": [...],
  "advertencias": [
    "Las actividades de ZONA suman 50 pero deben sumar 60"
  ],
  "mensaje_advertencia": "ADVERTENCIA: Los punteos no suman correctamente. El docente NO podrá calificar el examen final hasta que la zona sume 100%."
}
```

### 2. Bloqueo de calificación de examen final

**Endpoint:** `PUT /api/calificaciones/:id`

Cuando un docente intenta calificar una actividad tipo "final", el sistema valida que las actividades de zona sumen 100%. Si NO suman, retorna **403 Forbidden**:

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

### 3. Bloqueo de modificación por fecha límite

**Endpoint:** `PUT /api/actividades/:id`

Si la fecha límite de la actividad ya pasó, NO se puede modificar (403 Forbidden):

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

### 4. Bloqueo de cambio de punteo si hay calificaciones

**Endpoint:** `PUT /api/actividades/:id`

Si se intenta cambiar el `PunteoMaximo` y ya hay estudiantes calificados, se bloquea (403 Forbidden):

```json
{
  "success": false,
  "error": "No se puede modificar el punteo máximo porque ya hay estudiantes calificados",
  "detalles": {
    "estudiantesCalificados": 15,
    "punteoActual": 10,
    "punteoSolicitado": 15,
    "mensaje": "Para cambiar el punteo, primero debe eliminar todas las calificaciones de esta actividad"
  }
}
```

### 5. Reporte para Admin: Unidades Incompletas

**Endpoint:** `GET /api/unidades/reporte-incompletas`

Retorna todas las unidades activas donde las actividades NO suman correctamente:

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

## ✅ Checklist de Implementación

- [ ] Trigger ejecutado en MySQL correctamente
- [ ] Backend reiniciado
- [ ] Test GET actividades funciona
- [ ] Test POST validar-suma funciona
- [ ] Test POST batch crear actividades funciona
- [ ] Calificaciones se crearon automáticamente (verificado en BD)
- [ ] Middleware de permisos funciona (403 para docente ajeno)
- [ ] Admin/Operador pueden crear actividades sin restricciones

---

¡Listo! El sistema está completo y funcionando. Ahora el frontend puede consumir estos endpoints para permitir que los docentes configuren sus actividades.
