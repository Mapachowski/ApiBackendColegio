# Ejemplo de Uso del Sistema de Manejo de Errores

## 📝 Cómo Usar en los Controladores

### Opción 1: Usar `catchAsync` (Recomendado)

**Elimina la necesidad de try-catch en funciones async**

```javascript
const { catchAsync, AppError } = require('../middleware/errorHandler');
const Alumno = require('../models/Alumno');

// ❌ ANTES (con try-catch manual)
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const alumno = await Alumno.findByPk(id);

    if (!alumno) {
      return res.status(404).json({
        success: false,
        error: 'Alumno no encontrado'
      });
    }

    res.json({ success: true, data: alumno });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ DESPUÉS (con catchAsync y AppError)
exports.getById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const alumno = await Alumno.findByPk(id);

  if (!alumno) {
    return next(new AppError('Alumno no encontrado', 404));
  }

  res.json({ success: true, data: alumno });
});
```

**Beneficios:**
- ✅ Menos código
- ✅ Más legible
- ✅ Manejo centralizado de errores
- ✅ Los errores async se capturan automáticamente

---

### Opción 2: Usar `next(error)` Manualmente

```javascript
const { AppError } = require('../middleware/errorHandler');
const Alumno = require('../models/Alumno');

exports.create = async (req, res, next) => {
  try {
    const { IdColaborador, Matricula } = req.body;

    // Validación personalizada
    if (!IdColaborador || isNaN(IdColaborador)) {
      return next(new AppError('IdColaborador es requerido y debe ser un número', 400));
    }

    // Verificar si matrícula ya existe
    const existente = await Alumno.findOne({ where: { Matricula } });
    if (existente) {
      return next(new AppError('La matrícula ya existe', 409)); // 409 Conflict
    }

    const nuevoAlumno = await Alumno.create(req.body);
    res.status(201).json({ success: true, data: nuevoAlumno });

  } catch (error) {
    // Pasar error al middleware de errores
    next(error);
  }
};
```

---

## 🎯 Códigos de Estado HTTP Comunes

| Código | Nombre | Cuándo Usar |
|--------|--------|-------------|
| 200 | OK | Petición exitosa |
| 201 | Created | Recurso creado exitosamente |
| 204 | No Content | Petición exitosa sin contenido |
| 400 | Bad Request | Datos de entrada inválidos |
| 401 | Unauthorized | No autenticado (falta token) |
| 403 | Forbidden | Autenticado pero sin permisos |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto (ej: duplicado) |
| 422 | Unprocessable Entity | Validación fallida |
| 429 | Too Many Requests | Rate limit alcanzado |
| 500 | Internal Server Error | Error del servidor |
| 503 | Service Unavailable | Servicio no disponible |

---

## 📋 Ejemplos por Escenario

### 1. Recurso no encontrado (404)

```javascript
exports.getById = catchAsync(async (req, res, next) => {
  const alumno = await Alumno.findByPk(req.params.id);

  if (!alumno) {
    return next(new AppError('Alumno no encontrado', 404));
  }

  res.json({ success: true, data: alumno });
});
```

---

### 2. Validación de entrada (400)

```javascript
exports.create = catchAsync(async (req, res, next) => {
  const { Nombres, Apellidos } = req.body;

  if (!Nombres || Nombres.trim() === '') {
    return next(new AppError('El nombre es requerido', 400));
  }

  if (!Apellidos || Apellidos.trim() === '') {
    return next(new AppError('Los apellidos son requeridos', 400));
  }

  const alumno = await Alumno.create(req.body);
  res.status(201).json({ success: true, data: alumno });
});
```

---

### 3. Recurso duplicado (409)

```javascript
exports.create = catchAsync(async (req, res, next) => {
  const { Matricula } = req.body;

  const existente = await Alumno.findOne({ where: { Matricula } });
  if (existente) {
    return next(new AppError('La matrícula ya está registrada', 409));
  }

  const alumno = await Alumno.create(req.body);
  res.status(201).json({ success: true, data: alumno });
});
```

---

### 4. Sin permisos (403)

```javascript
exports.delete = catchAsync(async (req, res, next) => {
  // req.usuario viene del authMiddleware
  if (req.usuario.rol !== 1) { // 1 = Admin
    return next(new AppError('No tienes permisos para eliminar alumnos', 403));
  }

  const alumno = await Alumno.findByPk(req.params.id);
  if (!alumno) {
    return next(new AppError('Alumno no encontrado', 404));
  }

  await alumno.destroy();
  res.status(204).send(); // No content
});
```

---

### 5. Error de base de datos

```javascript
// Los errores de Sequelize se manejan automáticamente
exports.create = catchAsync(async (req, res, next) => {
  // Si hay error de validación de Sequelize, el middleware lo convierte a:
  // AppError('Error de validación: ...', 400)

  // Si hay error de clave foránea, se convierte a:
  // AppError('No se puede realizar la operación: viola restricciones de integridad', 400)

  const alumno = await Alumno.create(req.body);
  res.status(201).json({ success: true, data: alumno });
});
```

---

## 🔄 Comparación: Desarrollo vs Producción

### Desarrollo (NODE_ENV=development):

**Request:**
```
GET /api/alumnos/999999
```

**Response:**
```json
{
  "success": false,
  "error": "Alumno no encontrado",
  "stack": "Error: Alumno no encontrado\n    at /app/controllers/alumnosController.js:15:11\n    ...",
  "details": {
    "statusCode": 404,
    "isOperational": true,
    "name": "AppError",
    "path": "/api/alumnos/999999",
    "method": "GET"
  }
}
```

---

### Producción (NODE_ENV=production):

**Request:**
```
GET /api/alumnos/999999
```

**Response:**
```json
{
  "success": false,
  "error": "Alumno no encontrado"
}
```

**Si hay un error de programación (bug):**
```json
{
  "success": false,
  "error": "Error interno del servidor. Por favor, contacta al administrador."
}
```

---

## 🚫 Ruta No Encontrada (404)

Si accedes a una ruta que no existe:

**Request:**
```
GET /api/ruta-inexistente
```

**Response:**
```json
{
  "success": false,
  "error": "No se encontró la ruta: GET /api/ruta-inexistente"
}
```

---

## 🛠️ Mejores Prácticas

### 1. Usar `catchAsync` para funciones async

```javascript
// ✅ BIEN
exports.getAll = catchAsync(async (req, res, next) => {
  const alumnos = await Alumno.findAll();
  res.json({ success: true, data: alumnos });
});

// ❌ MAL (muy verboso)
exports.getAll = async (req, res) => {
  try {
    const alumnos = await Alumno.findAll();
    res.json({ success: true, data: alumnos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

---

### 2. Validar ANTES de consultar la base de datos

```javascript
// ✅ BIEN
exports.getById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Validar primero
  if (!id || isNaN(id)) {
    return next(new AppError('ID inválido', 400));
  }

  // Luego consultar
  const alumno = await Alumno.findByPk(id);
  if (!alumno) {
    return next(new AppError('Alumno no encontrado', 404));
  }

  res.json({ success: true, data: alumno });
});
```

---

### 3. Usar códigos de estado HTTP apropiados

```javascript
// ✅ BIEN
return next(new AppError('Alumno no encontrado', 404));
return next(new AppError('Matrícula duplicada', 409));
return next(new AppError('Datos inválidos', 400));

// ❌ MAL (siempre 500)
return next(new AppError('Alumno no encontrado')); // statusCode por defecto es 500
```

---

### 4. Mensajes descriptivos pero NO sensibles

```javascript
// ✅ BIEN (descriptivo pero seguro)
return next(new AppError('No se pudo crear el alumno: la matrícula ya existe', 409));

// ❌ MAL (expone detalles de la DB)
return next(new AppError('SequelizeUniqueConstraintError: Duplicate entry "12345" for key "matricula"', 500));

// ✅ El middleware convierte automáticamente errores de Sequelize a mensajes seguros
```

---

## 📊 Logs en Consola

### Errores 404 (warnings):
```
⚠️ ERROR 404: Alumno no encontrado
```

### Errores 500 (críticos):
```
❌ ERROR 500: Error {
  statusCode: 500,
  message: 'Cannot read property "Nombres" of undefined',
  stack: 'Error: Cannot read property...'
}
```

---

## 🔍 Debugging

Si necesitas más información en desarrollo:

```javascript
exports.create = catchAsync(async (req, res, next) => {
  console.log('📥 Body recibido:', req.body);
  console.log('👤 Usuario autenticado:', req.usuario);

  const alumno = await Alumno.create(req.body);

  console.log('✅ Alumno creado:', alumno.toJSON());

  res.status(201).json({ success: true, data: alumno });
});
```

En producción, estos logs seguirán funcionando pero el stack trace no se enviará al cliente.

---

## ✅ Migración Gradual

No necesitas actualizar todos los controladores de inmediato. Puedes:

1. **Nuevos controladores:** Usar `catchAsync` desde el inicio
2. **Controladores existentes:** Migrar gradualmente cuando los edites
3. **Errores de Sequelize:** Ya se manejan automáticamente ✅
4. **Errores de JWT:** Ya se manejan automáticamente ✅

El sistema es **retrocompatible**: los controladores antiguos con try-catch seguirán funcionando.
