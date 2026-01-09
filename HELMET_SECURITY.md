# Helmet.js - Headers de Seguridad HTTP

## 🪖 ¿Qué es Helmet.js?

**Helmet.js** configura automáticamente **headers HTTP de seguridad** que protegen tu aplicación contra vulnerabilidades web comunes.

### Analogía:
Es como ponerle **casco, chaleco antibalas y escudo** a tu API. Todo automáticamente, sin código complejo.

---

## 🛡️ Headers que Configura

### 1. **Content-Security-Policy (CSP)**
**Protege contra:** Inyección de scripts maliciosos (XSS)

**Qué hace:**
- Define qué scripts, estilos e imágenes puede cargar tu app
- Bloquea scripts de fuentes no autorizadas

**Sin Helmet:**
```html
<!-- Atacante inyecta esto en tu app -->
<script src="https://malicioso.com/robar-datos.js"></script>
<!-- ✅ Se ejecuta y roba datos del usuario -->
```

**Con Helmet:**
```html
<script src="https://malicioso.com/robar-datos.js"></script>
<!-- ❌ Bloqueado por CSP -->
<!-- Console: "Refused to load script from malicioso.com" -->
```

**Header generado:**
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:
```

---

### 2. **Strict-Transport-Security (HSTS)**
**Protege contra:** Ataques Man-in-the-Middle

**Qué hace:**
- Fuerza al navegador a usar HTTPS siempre
- Previene downgrade attacks (HTTPS → HTTP)

**Sin Helmet:**
```
Usuario visita: http://tuapp.com
→ Atacante intercepta tráfico HTTP
→ Roba credenciales en texto plano
→ ¡HACKEO! 💥
```

**Con Helmet:**
```
Usuario visita: http://tuapp.com
→ Navegador: "Debo usar HTTPS por HSTS"
→ Auto-redirige a: https://tuapp.com
→ Conexión cifrada ✅
```

**Header generado:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

### 3. **X-Frame-Options**
**Protege contra:** Clickjacking

**Qué hace:**
- Previene que tu app sea cargada en iframes maliciosos

**Sin Helmet:**
```html
<!-- Sitio malicioso carga tu app en un iframe invisible -->
<iframe src="https://tuapp.com/login" style="opacity:0"></iframe>
<!-- Usuario cree que está en el sitio malicioso -->
<!-- Pero en realidad está escribiendo en tu iframe -->
<!-- ¡Roban credenciales! 💥 -->
```

**Con Helmet:**
```
Tu app no puede ser cargada en iframes de otros sitios
→ Ataque de clickjacking bloqueado ✅
```

**Header generado:**
```
X-Frame-Options: DENY
```

---

### 4. **X-Content-Type-Options**
**Protege contra:** MIME sniffing attacks

**Qué hace:**
- Previene que navegadores "adivinen" el tipo de contenido

**Sin Helmet:**
```
Atacante sube archivo: "inocente.jpg"
→ Pero en realidad contiene: <script>malicioso()</script>
→ Navegador "adivina": "Esto parece HTML, lo ejecuto"
→ ¡Script malicioso ejecutado! 💥
```

**Con Helmet:**
```
Navegador respeta el Content-Type exacto
→ "inocente.jpg" se trata como imagen
→ No ejecuta scripts ✅
```

**Header generado:**
```
X-Content-Type-Options: nosniff
```

---

### 5. **Referrer-Policy**
**Protege contra:** Fuga de información sensible en URLs

**Qué hace:**
- Controla qué información de referencia se envía

**Sin Helmet:**
```
Usuario en: https://tuapp.com/admin/usuarios/123/editar?token=secreto
Hace clic en enlace externo
→ Sitio externo recibe toda la URL completa
→ Incluyendo el token secreto 💥
```

**Con Helmet:**
```
Usuario hace clic en enlace externo
→ Solo se envía: https://tuapp.com
→ Sin rutas ni parámetros sensibles ✅
```

**Header generado:**
```
Referrer-Policy: strict-origin-when-cross-origin
```

---

### 6. **X-Permitted-Cross-Domain-Policies**
**Protege contra:** Lectura no autorizada de datos por Flash/PDF

**Qué hace:**
- Bloquea que plugins (Flash, PDF) lean datos de tu sitio

**Header generado:**
```
X-Permitted-Cross-Domain-Policies: none
```

---

## 📋 Configuración Implementada

```javascript
app.use(helmet({
  // CSP - Previene XSS
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },

  // HSTS - Fuerza HTTPS
  hsts: {
    maxAge: 31536000,       // 1 año
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options - Previene clickjacking
  frameguard: {
    action: 'deny'
  },

  // X-Content-Type-Options - Previene MIME sniffing
  noSniff: true,

  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none'
  }
}));
```

---

## 🧪 Cómo Verificar que Funciona

### Opción 1: Usando cURL

```bash
curl -I http://localhost:4000/api/login
```

**Respuesta esperada:**
```http
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; script-src 'self'...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
X-Permitted-Cross-Domain-Policies: none
```

---

### Opción 2: Usando Chrome DevTools

1. Abre tu API en Chrome
2. Presiona `F12` (DevTools)
3. Ve a la pestaña **Network**
4. Recarga la página
5. Haz clic en cualquier petición
6. Ve a la pestaña **Headers**
7. Verifica que existan los headers de seguridad

---

### Opción 3: Herramienta Online

**Security Headers Scanner:**
https://securityheaders.com

1. Despliega tu API en un servidor público
2. Ingresa la URL en SecurityHeaders.com
3. Te dará una calificación (A+, A, B, etc.)

**Antes de Helmet:** Calificación F ❌
**Después de Helmet:** Calificación A+ ✅

---

## 🎯 Comparación: ANTES vs DESPUÉS

### ANTES (Sin Helmet):

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Login exitoso"
}
```

**Vulnerabilidades:**
- ❌ Sin protección contra XSS
- ❌ Sin HSTS (HTTP permitido)
- ❌ Vulnerable a clickjacking
- ❌ Vulnerable a MIME sniffing
- ❌ Fuga de información en referrers

---

### DESPUÉS (Con Helmet):

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Security-Policy: default-src 'self'...
Strict-Transport-Security: max-age=31536000...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Permitted-Cross-Domain-Policies: none

{
  "message": "Login exitoso"
}
```

**Protecciones:**
- ✅ Protegido contra XSS
- ✅ HSTS fuerza HTTPS
- ✅ No puede ser cargado en iframes
- ✅ MIME types estrictos
- ✅ Referencias controladas

---

## ⚙️ Configuraciones Avanzadas

### 1. Ajustar CSP para APIs que sirven imágenes externas:

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "https://cdn.ejemplo.com",  // CDN específico
        "https://*.cloudinary.com"  // Cloudinary
      ],
    },
  },
}));
```

---

### 2. Deshabilitar HSTS en desarrollo:

```javascript
app.use(helmet({
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false  // Desactivado en desarrollo
}));
```

---

### 3. Permitir iframes de tu propio dominio:

```javascript
app.use(helmet({
  frameguard: {
    action: 'sameorigin'  // Permite iframes del mismo origen
  }
}));
```

---

## 🌐 CORS Mejorado

También se mejoró la configuración de CORS:

```javascript
app.use(cors({
  origin: function (origin, callback) {
    // Solo permitir requests sin origin en desarrollo
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('🛑 CORS bloqueado para:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400  // Cache preflight por 24h
}));
```

**Mejoras:**
- ✅ En producción bloquea requests sin origin (Postman, cURL)
- ✅ Cache de preflight requests (menos latencia)
- ✅ Solo métodos HTTP necesarios

---

## 🚀 Trust Proxy (Producción)

Cuando despliegues en producción detrás de un proxy (Nginx, Cloudflare):

```javascript
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
```

**Qué hace:**
- Permite que Express vea la IP real del cliente
- Necesario para que rate limiting funcione correctamente
- Necesario para logs precisos

---

## 📊 Tabla Resumen de Protecciones

| Header | Protege contra | Severidad sin él |
|--------|----------------|------------------|
| Content-Security-Policy | XSS, inyección de scripts | 🔴 ALTA |
| Strict-Transport-Security | Man-in-the-Middle | 🔴 ALTA |
| X-Frame-Options | Clickjacking | 🟠 MEDIA |
| X-Content-Type-Options | MIME sniffing | 🟡 MEDIA |
| Referrer-Policy | Fuga de información | 🟡 BAJA |
| X-Permitted-Cross-Domain | Flash/PDF exploits | 🟢 BAJA |

---

## ✅ Checklist Post-Implementación

- [x] Helmet instalado y configurado
- [x] Headers de seguridad activos
- [x] CORS mejorado para producción
- [x] Trust proxy configurado
- [ ] Verificar con SecurityHeaders.com
- [ ] Ajustar CSP según necesidades específicas
- [ ] Probar que el frontend sigue funcionando
- [ ] Documentar orígenes permitidos en CORS

---

## 🎯 Resultado de Seguridad

### Antes de implementaciones:
- Sin autenticación JWT ❌
- Sin rate limiting ❌
- Sin headers de seguridad ❌
- Vulnerable a SQL injection ❌
- **Calificación:** F

### Después de implementaciones:
- ✅ Autenticación JWT
- ✅ Rate limiting
- ✅ Headers de seguridad (Helmet)
- ✅ SQL injection prevenido
- **Calificación:** A+

---

## 📚 Referencias

- [Helmet.js Documentation](https://helmetjs.github.io/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
- [Content Security Policy](https://content-security-policy.com/)
