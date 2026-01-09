# Autenticación JWT - Guía de Uso

## ¿Qué se implementó?

Se agregó un middleware de autenticación JWT que protege **todas las rutas** de la API excepto `/api/login`.

---

## ¿Por qué `/login` NO está protegido?

`/login` es el endpoint que **genera el token JWT**. Si lo protegemos con JWT, tendríamos un problema circular:

```
❌ PROBLEMA:
Usuario → necesita token para acceder a /login
       → pero /login es donde obtiene el token
       → IMPOSIBLE

✅ SOLUCIÓN:
Usuario → POST /api/login (sin token)
       → Valida credenciales
       → Devuelve token JWT
       → Usa ese token para todas las demás rutas
```

---

## Cómo usar la API ahora

### 1️⃣ Hacer Login (obtener el token)

**Endpoint:** `POST http://localhost:4000/api/login`

**Body (JSON):**
```json
{
  "NombreUsuario": "tu_usuario",
  "Contrasena": "tu_contraseña"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Login exitoso",
  "usuario": {
    "IdUsuario": 1,
    "NombreUsuario": "admin",
    "NombreCompleto": "Administrador",
    "IdRol": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Guarda el token** - Lo necesitarás para todas las demás peticiones.

---

### 2️⃣ Usar el token en rutas protegidas

Para **cualquier otra ruta** (alumnos, pagos, usuarios, etc.), debes incluir el token en el header `Authorization`:

**Header requerido:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Ejemplos con diferentes herramientas

### 📮 Postman

1. Haz login en `POST http://localhost:4000/api/login`
2. Copia el `token` de la respuesta
3. Para cualquier otra petición:
   - Ve a la pestaña **Headers**
   - Agrega un header:
     - Key: `Authorization`
     - Value: `Bearer TU_TOKEN_AQUÍ`

**O usa la pestaña "Authorization":**
- Type: `Bearer Token`
- Token: `TU_TOKEN_AQUÍ`

---

### 🌐 JavaScript (Fetch)

```javascript
// 1. Hacer login
const loginResponse = await fetch('http://localhost:4000/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    NombreUsuario: 'admin',
    Contrasena: 'miContraseña'
  })
});

const { token } = await loginResponse.json();

// 2. Usar el token en otras peticiones
const alumnosResponse = await fetch('http://localhost:4000/api/alumnos', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const alumnos = await alumnosResponse.json();
```

---

### 🔧 cURL

```bash
# 1. Hacer login
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"NombreUsuario":"admin","Contrasena":"miContraseña"}'

# 2. Guardar el token de la respuesta
# Luego usarlo en otras peticiones:
curl -X GET http://localhost:4000/api/alumnos \
  -H "Authorization: Bearer TU_TOKEN_AQUÍ"
```

---

### ⚛️ React (con Axios)

```javascript
import axios from 'axios';

// 1. Hacer login
const login = async (usuario, contraseña) => {
  const response = await axios.post('http://localhost:4000/api/login', {
    NombreUsuario: usuario,
    Contrasena: contraseña
  });

  const token = response.data.token;

  // Guardar el token en localStorage
  localStorage.setItem('token', token);
};

// 2. Configurar axios para usar el token automáticamente
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Ahora todas las peticiones incluirán el token automáticamente
const obtenerAlumnos = async () => {
  const response = await axios.get('http://localhost:4000/api/alumnos');
  return response.data;
};
```

---

## Mensajes de error

### ❌ Sin token
```json
{
  "success": false,
  "error": "No se proporcionó token de autenticación"
}
```

### ❌ Token con formato incorrecto
```json
{
  "success": false,
  "error": "Formato de token inválido. Use: Bearer <token>"
}
```

### ❌ Token expirado (después de 2 horas)
```json
{
  "success": false,
  "error": "Token expirado. Por favor, inicie sesión nuevamente"
}
```

### ❌ Token inválido
```json
{
  "success": false,
  "error": "Token inválido"
}
```

---

## Información del usuario en los controladores

El middleware agrega la información del usuario autenticado a `req.usuario`:

```javascript
// Dentro de cualquier controlador protegido
exports.miControlador = async (req, res) => {
  console.log(req.usuario.id);   // ID del usuario autenticado
  console.log(req.usuario.rol);  // Rol del usuario autenticado

  // Puedes usar esto para validaciones adicionales
  if (req.usuario.rol !== 1) {
    return res.status(403).json({ error: 'No tienes permisos' });
  }
};
```

---

## Duración del token

El token expira después de **2 horas**. Después de ese tiempo, el usuario debe hacer login nuevamente.

Para cambiar la duración, edita el archivo `backend/src/controllers/loginController.js`:

```javascript
const token = jwt.sign(
  { id: usuarioDB.IdUsuario, rol: usuarioDB.IdRol },
  process.env.JWT_SECRET,
  { expiresIn: '2h' }  // ← Cambia esto (ej: '24h', '7d', '30m')
);
```

---

## Configuración del JWT_SECRET

**⚠️ IMPORTANTE:** El `JWT_SECRET` en `.env` debe ser una clave **aleatoria y secreta**.

**Para generar una nueva clave:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Nunca compartas esta clave** y asegúrate de que `.env` esté en `.gitignore`.

---

## Rutas protegidas vs públicas

### ✅ Ruta PÚBLICA (no requiere token):
- `POST /api/login`

### 🔒 Rutas PROTEGIDAS (requieren token):
- `GET/POST/PUT/DELETE /api/alumnos`
- `GET/POST/PUT/DELETE /api/grados`
- `GET/POST/PUT/DELETE /api/inscripciones`
- `GET/POST/PUT/DELETE /api/familias`
- `GET/POST/PUT/DELETE /api/pagos`
- `GET/POST/PUT/DELETE /api/usuarios`
- `GET/POST/PUT/DELETE /api/responsables`
- `GET/POST/PUT/DELETE /api/bitacoras`
- `GET/POST/PUT/DELETE /api/jornadas`
- `GET/POST/PUT/DELETE /api/metodopagos`
- `GET/POST/PUT/DELETE /api/niveles`
- `GET/POST/PUT/DELETE /api/roles`
- `GET/POST/PUT/DELETE /api/secciones`
- `GET/POST/PUT/DELETE /api/tipopagos`
- `GET/POST/PUT/DELETE /api/fichasmedicas`
- `GET/POST/PUT/DELETE /api/responsable-tipo`

---

## Arquitectura de seguridad

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ 1. POST /api/login (sin token)
       ▼
┌─────────────────────┐
│  loginController    │  ← Valida credenciales
│  Genera JWT token   │
└──────┬──────────────┘
       │
       │ 2. Devuelve token
       ▼
┌─────────────┐
│   Cliente   │  ← Guarda el token
└──────┬──────┘
       │
       │ 3. GET /api/alumnos
       │    Header: Authorization: Bearer <token>
       ▼
┌─────────────────────┐
│  authMiddleware     │  ← Verifica token
│  Valida firma       │
│  Verifica expiración│
└──────┬──────────────┘
       │
       │ 4. Token válido → continúa
       ▼
┌─────────────────────┐
│  alumnosController  │  ← Ejecuta la lógica
└─────────────────────┘
```

---

## Testing

Puedes probar que la autenticación funciona:

```bash
# ❌ Sin token - debe fallar
curl http://localhost:4000/api/alumnos

# ✅ Con token - debe funcionar
curl http://localhost:4000/api/alumnos \
  -H "Authorization: Bearer TU_TOKEN_AQUÍ"
```
