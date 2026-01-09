# Rate Limiting - Protección contra Ataques

## 🚦 ¿Qué es Rate Limiting?

**Rate Limiting** limita la cantidad de peticiones que un usuario puede hacer en un periodo de tiempo, previniendo:

- ✅ Ataques de fuerza bruta
- ✅ Ataques DoS (Denial of Service)
- ✅ Web scraping masivo
- ✅ Abuso de la API

---

## 🎯 Analogía Simple

Imagina un cajero automático:
- Permite 3 intentos de PIN
- Al 4to intento → **Bloquea la tarjeta**

Eso es **exactamente** lo que hace Rate Limiting en tu API.

---

## 🔐 Configuración Implementada

### 1. 🔴 Rate Limiter para LOGIN (Muy Estricto)

**Protege:** `/api/login`
**Límite:** 5 intentos cada 15 minutos
**Motivo:** Prevenir ataques de fuerza bruta

```
Usuario intenta:
POST /login (intento 1) ✅
POST /login (intento 2) ✅
POST /login (intento 3) ✅
POST /login (intento 4) ✅
POST /login (intento 5) ✅
POST /login (intento 6) ⛔ BLOQUEADO

Respuesta:
{
  "success": false,
  "error": "Demasiados intentos de login. Por favor, intenta nuevamente en 15 minutos.",
  "retryAfter": "15 minutos"
}
```

---

### 2. ✅ Rutas Autenticadas - SIN Rate Limiting

**Protege:** Todas las rutas protegidas con JWT
**Límite:** ∞ Sin límite
**Motivo:** Ya están protegidas por autenticación JWT

```
Las rutas autenticadas NO tienen rate limiting porque:

✅ Ya requieren un token JWT válido
✅ El token expira automáticamente (2 horas)
✅ Solo usuarios autenticados pueden acceder
✅ El rate limiting es más importante en rutas públicas

Usuario autenticado puede hacer:
GET /alumnos    (petición 1) ✅
GET /pagos      (petición 2) ✅
POST /alumnos   (petición 3) ✅
... sin límite de peticiones
```

**Ventajas:**
- 🚀 Mejor experiencia de usuario (no se bloquea en uso normal)
- 🔐 Seguridad garantizada por JWT
- ⚡ Frontend puede hacer peticiones rápidas sin preocupaciones

---

## 📊 Tabla de Límites (Actualizada)

| Endpoint | Límite | Ventana de tiempo | Estado |
|----------|--------|-------------------|--------|
| `/api/login` | 5 peticiones | 15 minutos | ✅ **ACTIVO** |
| Rutas autenticadas (JWT) | ∞ Sin límite | - | ✅ **SIN LÍMITE** |
| Rutas públicas futuras | 50 peticiones | 10 minutos | ⚠️ Solo si agregas rutas públicas |

**Nota:** Solo `/api/login` tiene rate limiting activo. Las rutas autenticadas no lo necesitan porque ya están protegidas por JWT.

---

## 🛡️ Ataques que Previene

### 1. Ataque de Fuerza Bruta

**Sin Rate Limiting:**
```
Atacante prueba 10,000 contraseñas por segundo
→ Eventualmente encuentra la correcta
→ ¡HACKEO! 💥
```

**Con Rate Limiting:**
```
Atacante prueba 5 contraseñas
→ Bloqueado por 15 minutos
→ Solo puede probar 480 contraseñas por día
→ ¡ATAQUE INVIABLE! ✅
```

---

### 2. Ataque DoS (Denial of Service)

**Sin Rate Limiting:**
```
Atacante hace 100,000 peticiones por segundo
→ Servidor saturado
→ API caída para todos los usuarios
→ ¡SERVICIO FUERA DE LÍNEA! 💥
```

**Con Rate Limiting:**
```
Atacante hace 100 peticiones
→ Bloqueado automáticamente
→ Servidor sigue funcionando
→ Otros usuarios no afectados ✅
```

---

### 3. Credential Stuffing

**Sin Rate Limiting:**
```
Atacante tiene 1,000,000 de credenciales robadas
→ Prueba todas contra tu API
→ Encuentra cuentas válidas
→ ¡CUENTAS COMPROMETIDAS! 💥
```

**Con Rate Limiting:**
```
Atacante intenta probar credenciales masivamente
→ Bloqueado después de 5 intentos
→ Tardaría años en probar todas
→ ¡ATAQUE INEFECTIVO! ✅
```

---

## 📡 Headers HTTP de Rate Limiting

Cuando se implementa rate limiting, el servidor envía headers informativos:

```http
HTTP/1.1 200 OK
RateLimit-Limit: 100          ← Límite total
RateLimit-Remaining: 95       ← Peticiones restantes
RateLimit-Reset: 1699564800   ← Timestamp cuando se resetea
```

Cuando se alcanza el límite:

```http
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 1699564800
Retry-After: 900              ← Segundos para reintentar (15 min)

{
  "success": false,
  "error": "Demasiados intentos de login..."
}
```

---

## 🧪 Cómo Probar

### Probar límite de login:

```bash
# Intento 1
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"NombreUsuario":"test","Contrasena":"wrong"}'

# Intento 2
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"NombreUsuario":"test","Contrasena":"wrong"}'

# ... repite hasta el intento 6

# Intento 6 (será bloqueado)
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"NombreUsuario":"test","Contrasena":"wrong"}'

# Respuesta:
# {
#   "success": false,
#   "error": "Demasiados intentos de login. Por favor, intenta nuevamente en 15 minutos."
# }
```

---

### Probar límite general:

```bash
# Hacer 101 peticiones rápidamente (ejemplo con loop)
for i in {1..101}; do
  curl http://localhost:4000/api/alumnos \
    -H "Authorization: Bearer TU_TOKEN"
done

# La petición 101 será bloqueada con:
# HTTP/1.1 429 Too Many Requests
```

---

## 🎨 Implementación en el Frontend

### JavaScript/React:

```javascript
const login = async (usuario, password) => {
  try {
    const response = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ NombreUsuario: usuario, Contrasena: password })
    });

    // Verificar si fue bloqueado por rate limiting
    if (response.status === 429) {
      const data = await response.json();
      alert(data.error); // "Demasiados intentos de login..."
      return;
    }

    const data = await response.json();
    // ... manejar login exitoso
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Mostrar intentos restantes:

```javascript
const login = async (usuario, password) => {
  const response = await fetch('http://localhost:4000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ NombreUsuario: usuario, Contrasena: password })
  });

  // Leer headers de rate limiting
  const remaining = response.headers.get('RateLimit-Remaining');
  const limit = response.headers.get('RateLimit-Limit');

  console.log(`Intentos restantes: ${remaining}/${limit}`);

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    alert(`Bloqueado. Reintenta en ${retryAfter} segundos`);
  }
};
```

---

## ⚙️ Configuración Avanzada

### Cambiar límites (editar `rateLimiter.js`):

```javascript
// Hacer login más estricto (3 intentos)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,  // ← Cambiar aquí
  // ...
});

// Hacer API más permisiva (200 peticiones)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,  // ← Cambiar aquí
  // ...
});
```

---

### Rate limiting por usuario autenticado (en lugar de IP):

```javascript
const loginLimiter = rateLimit({
  // ... otras opciones
  keyGenerator: (req) => {
    // Si hay token, usar el ID del usuario
    if (req.usuario?.id) {
      return `user-${req.usuario.id}`;
    }
    // Si no, usar IP
    return req.ip;
  }
});
```

---

### Aplicar rate limiting solo a POST:

```javascript
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  // Solo aplicar a peticiones POST
  skip: (req) => req.method !== 'POST'
});
```

---

## 🔍 Monitoreo y Logs

El sistema registra cuando se alcanza un límite:

```
⚠️ Rate limit alcanzado para IP: 192.168.1.100 en /login
⚠️ Rate limit general alcanzado para IP: 192.168.1.100
⚠️ Rate limit de creación alcanzado para IP: 192.168.1.100 en /api/alumnos
```

Puedes usar estos logs para:
- Detectar intentos de ataque
- Identificar IPs maliciosas
- Ajustar límites según patrones de uso

---

## 🌍 Consideraciones de Producción

### 1. Proxies y Load Balancers

Si usas proxies (como Nginx, Cloudflare), asegúrate de que Express confíe en ellos:

```javascript
// En app.js
app.set('trust proxy', 1);  // Confiar en el primer proxy
```

Esto permite que rate limiting use la IP real del cliente, no la del proxy.

---

### 2. Redis para Store Compartido

Si tienes **múltiples servidores**, usa Redis para compartir el estado del rate limiting:

```bash
npm install rate-limit-redis redis
```

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const client = redis.createClient({
  host: 'localhost',
  port: 6379
});

const loginLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'rl:login:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5
});
```

---

### 3. Whitelist de IPs Confiables

Excluir IPs de confianza del rate limiting:

```javascript
const loginLimiter = rateLimit({
  // ... configuración
  skip: (req) => {
    const trustedIps = ['127.0.0.1', '192.168.1.50'];
    return trustedIps.includes(req.ip);
  }
});
```

---

## 📊 Resumen de Archivos

| Archivo | Descripción |
|---------|-------------|
| `backend/src/middleware/rateLimiter.js` | Configuración de los limiters |
| `backend/src/routes/index.js` | Aplicación de los limiters |

---

## ✅ Checklist de Seguridad

- [x] Rate limiting en `/login` (previene fuerza bruta)
- [x] Rate limiting general en todas las rutas
- [x] Mensajes de error informativos
- [x] Headers HTTP estándar (RateLimit-*)
- [x] Logs de intentos bloqueados
- [ ] Considerar Redis para producción multi-servidor
- [ ] Configurar `trust proxy` si usas proxies
- [ ] Ajustar límites según análisis de tráfico real

---

## 🎯 Próximas Mejoras Recomendadas

1. **Helmet.js** - Headers de seguridad HTTP
2. **CAPTCHA** - Para login después de múltiples fallos
3. **IP Blacklist** - Bloquear IPs maliciosas permanentemente
4. **Alertas** - Notificar cuando se detectan ataques
5. **Dashboard** - Visualizar métricas de rate limiting

---

## 📚 Referencias

- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)
- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [HTTP 429 Status Code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
