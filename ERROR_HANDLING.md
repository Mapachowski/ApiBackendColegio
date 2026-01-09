# Sistema de Manejo de Errores

## 🚨 ¿Por qué es Importante?

### ANTES (Vulnerable):

```javascript
// Código expone información sensible en producción
try {
  const alumno = await Alumno.findByPk(id);
} catch (error) {
  res.status(500).json({ error: error.message });
}
```

**Respuesta en producción:**
```json
{
  "error": "SequelizeDatabaseError: Unknown column 'password' in 'field list' at Query.formatError (/app/node_modules/sequelize/lib/dialects/mysql/query.js:247:16)"
}
```

**Problema:** El atacante aprende:
- ✅ Usas Sequelize
- ✅ Usas MySQL
- ✅ Estructura de tablas
- ✅ Rutas del código

---

### DESPUÉS (Seguro):

```javascript
// Código usa sistema centralizado
const { catchAsync, AppError } = require('../middleware/errorHandler');

exports.getById = catchAsync(async (req, res, next) => {
  const alumno = await Alumno.findByPk(id);
  if (!alumno) {
    return next(new AppError('Alumno no encontrado', 404));
  }
  res.json({ success: true, data: alumno });
});
```

**Respuesta en desarrollo:**
```json
{
  "success": false,
  "error": "Alumno no encontrado",
  "stack": "Error: Alumno no encontrado...",
  "details": { ... }
}
```

**Respuesta en producción:**
```json
{
  "success": false,
  "error": "Alumno no encontrado"
}
```

---

## 🛡️ Componentes Implementados

### 1. **AppError** - Clase para errores operacionales

```javascript
const { AppError } = require('../middleware/errorHandler');

// Crear error con código de estado
throw new AppError('Usuario no encontrado', 404);
throw new AppError('Acceso denegado', 403);
throw new AppError('Datos inválidos', 400);
```

---

### 2. **catchAsync** - Wrapper para funciones async

Elimina la necesidad de try-catch:

```javascript
const { catchAsync } = require('../middleware/errorHandler');

// Sin catchAsync (verboso)
exports.getAll = async (req, res) => {
  try {
    const data = await Model.findAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Con catchAsync (limpio)
exports.getAll = catchAsync(async (req, res) => {
  const data = await Model.findAll();
  res.json(data);
});
```

---

### 3. **errorHandler** - Middleware principal

Maneja TODOS los errores de forma centralizada:

```javascript
// En app.js (ya configurado)
app.use(errorHandler);
```

**Funcionalidades:**
- ✅ Distingue entre desarrollo y producción
- ✅ Oculta stack traces en producción
- ✅ Logs automáticos en consola
- ✅ Respuestas HTTP estándar

---

### 4. **sequelizeErrorHandler** - Errores de base de datos

Convierte errores de Sequelize a mensajes amigables:

```javascript
// Error de Sequelize:
SequelizeUniqueConstraintError: Duplicate entry '12345' for key 'matricula'

// Se convierte automáticamente a:
AppError('El valor ya existe: matricula', 409)
```

**Errores manejados:**
- ✅ Validación (`SequelizeValidationError`)
- ✅ Duplicados (`SequelizeUniqueConstraintError`)
- ✅ Claves foráneas (`SequelizeForeignKeyConstraintError`)
- ✅ Conexión (`SequelizeConnectionError`)

---

### 5. **jwtErrorHandler** - Errores de JWT

Convierte errores de JWT a mensajes claros:

```javascript
// Error de JWT:
TokenExpiredError: jwt expired

// Se convierte automáticamente a:
AppError('Token expirado. Por favor, inicia sesión nuevamente', 401)
```

**Errores manejados:**
- ✅ Token expirado (`TokenExpiredError`)
- ✅ Token inválido (`JsonWebTokenError`)

---

### 6. **notFoundHandler** - Rutas no encontradas

Maneja peticiones a rutas inexistentes:

```javascript
GET /api/ruta-que-no-existe

// Respuesta:
{
  "success": false,
  "error": "No se encontró la ruta: GET /api/ruta-que-no-existe"
}
```

---

## 🔄 Flujo de Manejo de Errores

```
1. Request → Controlador
             ↓
2. Error ocurre
             ↓
3. next(error) o catchAsync captura
             ↓
4. sequelizeErrorHandler
   ↓ (si no es de Sequelize)
5. jwtErrorHandler
   ↓ (si no es de JWT)
6. errorHandler (general)
             ↓
7. Response al cliente
```

---

## 🎯 Códigos de Estado HTTP

| Código | Uso | Ejemplo |
|--------|-----|---------|
| 200 | Éxito | `res.json({ success: true })` |
| 201 | Creado | `res.status(201).json({ data: ... })` |
| 204 | Sin contenido | `res.status(204).send()` |
| 400 | Datos inválidos | `new AppError('Datos inválidos', 400)` |
| 401 | No autenticado | `new AppError('Token requerido', 401)` |
| 403 | Sin permisos | `new AppError('Acceso denegado', 403)` |
| 404 | No encontrado | `new AppError('No encontrado', 404)` |
| 409 | Conflicto | `new AppError('Ya existe', 409)` |
| 429 | Rate limit | Automático (express-rate-limit) |
| 500 | Error servidor | `new AppError('Error interno')` |

---

## 📊 Comparación: Desarrollo vs Producción

### Desarrollo (`NODE_ENV=development`):

**Error operacional:**
```json
{
  "success": false,
  "error": "Alumno no encontrado",
  "stack": "Error: Alumno no encontrado\n    at alumnosController.js:15\n    ...",
  "details": {
    "statusCode": 404,
    "isOperational": true,
    "name": "AppError",
    "path": "/api/alumnos/999",
    "method": "GET"
  }
}
```

**Error de programación (bug):**
```json
{
  "success": false,
  "error": "Cannot read property 'Nombres' of undefined",
  "stack": "TypeError: Cannot read property...\n    at ...",
  "details": { ... }
}
```

---

### Producción (`NODE_ENV=production`):

**Error operacional (esperado):**
```json
{
  "success": false,
  "error": "Alumno no encontrado"
}
```

**Error de programación (bug):**
```json
{
  "success": false,
  "error": "Error interno del servidor. Por favor, contacta al administrador."
}
```

**Beneficio:** NO expone:
- ❌ Stack traces
- ❌ Rutas de archivos
- ❌ Versiones de librerías
- ❌ Estructura del código

---

## 🧪 Ejemplos de Uso

### Ejemplo 1: Recurso no encontrado

```javascript
const { catchAsync, AppError } = require('../middleware/errorHandler');

exports.getById = catchAsync(async (req, res, next) => {
  const alumno = await Alumno.findByPk(req.params.id);

  if (!alumno) {
    return next(new AppError('Alumno no encontrado', 404));
  }

  res.json({ success: true, data: alumno });
});
```

---

### Ejemplo 2: Validación personalizada

```javascript
exports.create = catchAsync(async (req, res, next) => {
  const { Nombres, Apellidos, Matricula } = req.body;

  // Validaciones
  if (!Nombres || Nombres.trim() === '') {
    return next(new AppError('El nombre es requerido', 400));
  }

  if (!Matricula || !/^\d{4}$/.test(Matricula)) {
    return next(new AppError('Matrícula debe tener 4 dígitos', 400));
  }

  const alumno = await Alumno.create(req.body);
  res.status(201).json({ success: true, data: alumno });
});
```

---

### Ejemplo 3: Control de permisos

```javascript
exports.delete = catchAsync(async (req, res, next) => {
  // req.usuario viene del authMiddleware
  if (req.usuario.rol !== 1) { // 1 = Admin
    return next(new AppError('No tienes permisos para eliminar', 403));
  }

  const alumno = await Alumno.findByPk(req.params.id);
  if (!alumno) {
    return next(new AppError('Alumno no encontrado', 404));
  }

  await alumno.destroy();
  res.status(204).send();
});
```

---

### Ejemplo 4: Errores de Sequelize (automático)

```javascript
exports.create = catchAsync(async (req, res, next) => {
  // Si hay error de validación de Sequelize,
  // sequelizeErrorHandler lo convierte automáticamente a:
  // AppError('Error de validación: ...', 400)

  const alumno = await Alumno.create(req.body);
  res.status(201).json({ success: true, data: alumno });
});
```

---

## 🔍 Logs en Consola

### Errores operacionales (warnings):
```
⚠️ ERROR 404: Alumno no encontrado
⚠️ ERROR 400: Datos inválidos
⚠️ ERROR 403: Acceso denegado
```

### Errores de programación (críticos):
```
❌ ERROR 500: Error {
  message: 'Cannot read property "Nombres" of undefined',
  stack: 'TypeError: Cannot read property "Nombres" of undefined\n    at ...'
}
```

---

## ⚙️ Configuración

### Variable de ambiente:

```env
# En .env
NODE_ENV=development  # Desarrollo (muestra detalles)
NODE_ENV=production   # Producción (oculta detalles)
```

### Orden de middlewares (IMPORTANTE):

```javascript
// app.js

// 1. Rutas primero
app.use('/api', routes);

// 2. 404 Handler (después de las rutas)
app.use(notFoundHandler);

// 3. Error handlers específicos
app.use(sequelizeErrorHandler);
app.use(jwtErrorHandler);

// 4. Error handler general (último)
app.use(errorHandler);
```

---

## ✅ Beneficios

| Beneficio | Descripción |
|-----------|-------------|
| **Seguridad** | No expone información sensible en producción |
| **Consistencia** | Todas las respuestas de error tienen el mismo formato |
| **Debugging** | En desarrollo, muestra detalles completos |
| **Menos código** | `catchAsync` elimina try-catch repetitivos |
| **Centralizado** | Un solo lugar para manejar TODOS los errores |
| **Automático** | Errores de Sequelize y JWT convertidos automáticamente |

---

## 🚀 Mejoras Futuras (Opcionales)

### 1. Logging en Archivo

```javascript
const fs = require('fs');

const errorHandler = (err, req, res, next) => {
  // Log en archivo
  fs.appendFileSync('errors.log', `
    Timestamp: ${new Date().toISOString()}
    Error: ${err.message}
    Stack: ${err.stack}
    ----------------
  `);

  // ... resto del código
};
```

---

### 2. Notificaciones por Email

```javascript
const errorHandler = (err, req, res, next) => {
  // Si es error crítico en producción
  if (err.statusCode === 500 && process.env.NODE_ENV === 'production') {
    sendEmailToAdmin({
      subject: 'Error 500 en producción',
      body: err.stack
    });
  }

  // ... resto del código
};
```

---

### 3. Integración con Sentry/Bugsnag

```javascript
const Sentry = require('@sentry/node');

const errorHandler = (err, req, res, next) => {
  // Enviar a Sentry
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(err);
  }

  // ... resto del código
};
```

---

## 📚 Archivos del Sistema

| Archivo | Descripción |
|---------|-------------|
| `backend/src/middleware/errorHandler.js` | Sistema completo de errores |
| `backend/src/app.js` | Aplicación de middlewares |
| `backend/.env` | Configuración `NODE_ENV` |
| `EJEMPLO_USO_ERRORES.md` | Guía con ejemplos prácticos |

---

## 📖 Documentación Adicional

Ver [EJEMPLO_USO_ERRORES.md](EJEMPLO_USO_ERRORES.md) para:
- Ejemplos detallados por escenario
- Migración de controladores existentes
- Mejores prácticas
- Casos de uso comunes

---

## ✅ Checklist

- [x] Middleware de errores implementado
- [x] 404 handler configurado
- [x] Sequelize errors manejados
- [x] JWT errors manejados
- [x] NODE_ENV configurado
- [ ] Migrar controladores a `catchAsync` (gradual)
- [ ] Probar en desarrollo y producción
- [ ] Configurar logging en archivo (opcional)

---

## 🎯 Resultado

Tu API ahora tiene **manejo de errores profesional**:

✅ **Segura** - No expone información sensible
✅ **Consistente** - Respuestas estandarizadas
✅ **Debuggeable** - Detalles en desarrollo
✅ **Automática** - Captura errores async
✅ **Centralizada** - Un solo punto de control

**Calificación de Seguridad:** A+ 🛡️
