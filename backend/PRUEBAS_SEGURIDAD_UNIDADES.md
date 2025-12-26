# 🔒 Pruebas de Seguridad - Sistema de Unidades

## Resumen
Este documento contiene casos de prueba para verificar que el middleware `validarPropiedadUnidad` protege correctamente los endpoints de modificación de unidades.

---

## ⚙️ Configuración del Middleware

El middleware valida:
- **Admin (rol 1)**: Acceso completo a todas las unidades
- **Operador (rol 2)**: Acceso completo a todas las unidades
- **Docente (rol 4)**: Solo puede modificar sus propias unidades
- **Otros roles**: Sin acceso

---

## 📋 Casos de Prueba

### ✅ Caso 1: Admin puede modificar cualquier unidad
**Usuario**: Admin (rol 1)
**Endpoint**: `PUT /api/unidades/:id/punteos`
**Resultado esperado**: ✅ Permitir modificación sin restricciones

```bash
# Login como admin
POST http://localhost:4000/api/login
{
  "NombreUsuario": "admin",
  "Contrasena": "admin123"
}

# Modificar cualquier unidad (usar token del admin)
PUT http://localhost:4000/api/unidades/5/punteos
Authorization: Bearer {token_admin}
{
  "PunteoZona": 70,
  "PunteoFinal": 30,
  "ModificadoPor": "admin"
}
```

**Validación**:
- ✅ Status 200
- ✅ Unidad actualizada sin validar propiedad
- ✅ Log: "Admin/Operador - Acceso permitido"

---

### ✅ Caso 2: Docente puede modificar SU propia unidad
**Usuario**: Docente (rol 4)
**Endpoint**: `PUT /api/unidades/:id/punteos`
**Condición**: La unidad pertenece a una asignación del docente
**Resultado esperado**: ✅ Permitir modificación

```bash
# Login como docente
POST http://localhost:4000/api/login
{
  "NombreUsuario": "docente1",
  "Contrasena": "password123"
}

# Obtener asignaciones del docente para saber qué unidades le pertenecen
GET http://localhost:4000/api/asignaciones
Authorization: Bearer {token_docente}

# Modificar una unidad de SU asignación
PUT http://localhost:4000/api/unidades/10/punteos
Authorization: Bearer {token_docente}
{
  "PunteoZona": 90,
  "PunteoFinal": 10,
  "ModificadoPor": "docente1"
}
```

**Validación**:
- ✅ Status 200
- ✅ Unidad actualizada correctamente
- ✅ Log: "Docente - Acceso permitido a su propia unidad"

---

### ❌ Caso 3: Docente NO puede modificar unidad de OTRO docente
**Usuario**: Docente (rol 4)
**Endpoint**: `PUT /api/unidades/:id/punteos`
**Condición**: La unidad pertenece a OTRO docente
**Resultado esperado**: ❌ Denegar acceso (403 Forbidden)

```bash
# Login como docente1
POST http://localhost:4000/api/login
{
  "NombreUsuario": "docente1",
  "Contrasena": "password123"
}

# Intentar modificar unidad de docente2 (usar ID de unidad que NO le pertenece)
PUT http://localhost:4000/api/unidades/25/punteos
Authorization: Bearer {token_docente1}
{
  "PunteoZona": 100,
  "PunteoFinal": 0,
  "ModificadoPor": "docente1"
}
```

**Validación**:
- ❌ Status 403 (Forbidden)
- ❌ Mensaje: "No tienes permiso para modificar esta unidad. Solo puedes modificar tus propias unidades."
- ✅ Log: "Acceso denegado - La unidad no pertenece al docente"
- ✅ La unidad NO se modifica en la base de datos

---

### ❌ Caso 4: Docente malicioso con Postman/curl
**Escenario**: Un docente intenta hackear el sistema usando Postman directamente
**Usuario**: Docente (rol 4)
**Endpoint**: `PUT /api/unidades/:id/punteos`
**Resultado esperado**: ❌ Protección exitosa

```bash
# Docente obtiene token válido
POST http://localhost:4000/api/login
{
  "NombreUsuario": "docente_malicioso",
  "Contrasena": "password123"
}

# INTENTO DE ATAQUE: Modificar unidad que no le pertenece
# usando directamente curl/Postman
PUT http://localhost:4000/api/unidades/99/punteos
Authorization: Bearer {token_docente_malicioso}
{
  "PunteoZona": 0,
  "PunteoFinal": 100,
  "ModificadoPor": "hacker"
}
```

**Validación**:
- ❌ Status 403 (Forbidden)
- ❌ El backend valida SIEMPRE la propiedad, sin importar la herramienta
- ✅ Protección efectiva contra ataques

---

### ✅ Caso 5: Cerrar y abrir siguiente unidad
**Usuario**: Docente (rol 4)
**Endpoint**: `POST /api/unidades/asignacion/:idAsignacion/cerrar-y-abrir`
**Condición**: La asignación pertenece al docente
**Resultado esperado**: ✅ Permitir operación

```bash
# Login como docente
POST http://localhost:4000/api/login
{
  "NombreUsuario": "docente1",
  "Contrasena": "password123"
}

# Cerrar unidad activa y abrir siguiente
POST http://localhost:4000/api/unidades/asignacion/5/cerrar-y-abrir
Authorization: Bearer {token_docente}
{
  "CerradoPor": "docente1",
  "ActivadoPor": "docente1"
}
```

**Validación**:
- ✅ Status 200
- ✅ Unidad actual cerrada (Activa = 0)
- ✅ Siguiente unidad activada (Activa = 1)

---

### ❌ Caso 6: Cerrar unidad de otro docente
**Usuario**: Docente (rol 4)
**Endpoint**: `POST /api/unidades/asignacion/:idAsignacion/cerrar-y-abrir`
**Condición**: La asignación pertenece a OTRO docente
**Resultado esperado**: ❌ Denegar acceso (403)

```bash
# Login como docente1
POST http://localhost:4000/api/login
{
  "NombreUsuario": "docente1",
  "Contrasena": "password123"
}

# Intentar cerrar/abrir unidad de asignación de docente2
POST http://localhost:4000/api/unidades/asignacion/99/cerrar-y-abrir
Authorization: Bearer {token_docente1}
{
  "CerradoPor": "docente1",
  "ActivadoPor": "docente1"
}
```

**Validación**:
- ❌ Status 403
- ❌ Mensaje de error adecuado
- ✅ Las unidades NO cambian de estado

---

### ✅ Caso 7: Consulta sin restricciones
**Usuario**: Cualquier rol autenticado
**Endpoint**: `GET /api/unidades/asignacion/:idAsignacion`
**Resultado esperado**: ✅ Permitir consulta

```bash
# Cualquier usuario autenticado puede consultar
GET http://localhost:4000/api/unidades/asignacion/5
Authorization: Bearer {cualquier_token_valido}
```

**Validación**:
- ✅ Status 200
- ✅ Retorna las unidades sin restricciones
- ✅ NO se aplica validación de propiedad (solo es consulta)

---

## 🧪 Cómo Ejecutar las Pruebas

### Opción 1: Postman
1. Importar la colección `Postman_Coleccion_Unidades.json`
2. Crear usuarios de prueba con roles diferentes
3. Ejecutar cada caso de prueba manualmente
4. Verificar status codes y respuestas

### Opción 2: curl (Terminal)
```bash
# Ver logs del servidor en una terminal
cd E:\Colegio\ApiBackendColegio\backend
npm start

# En otra terminal, ejecutar los curl de cada caso
curl -X PUT http://localhost:4000/api/unidades/5/punteos \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"PunteoZona":70,"PunteoFinal":30,"ModificadoPor":"admin"}'
```

---

## 📊 Checklist de Validación

- [ ] Admin puede modificar cualquier unidad
- [ ] Operador puede modificar cualquier unidad
- [ ] Docente puede modificar SUS unidades
- [ ] Docente NO puede modificar unidades de otros
- [ ] Middleware bloquea ataques con Postman/curl
- [ ] Consultas (GET) funcionan sin restricciones
- [ ] Logs muestran información correcta
- [ ] Mensajes de error son claros

---

## 🔍 Logs Esperados

Cuando todo funciona correctamente, en la consola del servidor deberías ver:

```
🔒 Validando permisos - Usuario: 5 Rol: 4
👨‍🏫 ID Docente: 3
🔍 Unidad encontrada: true
✅ Docente - Acceso permitido a su propia unidad
```

Cuando se bloquea un ataque:

```
🔒 Validando permisos - Usuario: 5 Rol: 4
👨‍🏫 ID Docente: 3
🔍 Unidad encontrada: false
❌ Acceso denegado - La unidad no pertenece al docente
```

---

## 🛡️ Endpoints Protegidos

| Endpoint | Método | Protegido | Validación |
|----------|--------|-----------|------------|
| `/asignacion/:idAsignacion` | GET | ❌ No | Consulta libre |
| `/:id/validar` | GET | ❌ No | Consulta libre |
| `/:id` | GET | ❌ No | Consulta libre |
| `/asignacion/:idAsignacion/cerrar-y-abrir` | POST | ✅ Sí | Propiedad + Rol |
| `/:id/activar` | PUT | ✅ Sí | Propiedad + Rol |
| `/:id/punteos` | PUT | ✅ Sí | Propiedad + Rol |
| `/:id` | PUT | ✅ Sí | Propiedad + Rol |

---

## 💡 Notas Importantes

1. **El frontend ya tiene validaciones**, pero el backend DEBE validar también (nunca confiar solo en el frontend)
2. **Los logs están habilitados** para debugging - puedes deshabilitarlos en producción
3. **Los roles válidos son**: 1 (Admin), 2 (Operador), 4 (Docente)
4. **La cadena de validación es**: Usuario → Docente → AsignacionDocente → Unidad
5. **Si un usuario no tiene perfil de docente activo**, se deniega el acceso aunque tenga rol 4

---

## 🚀 Próximos Pasos

Una vez validado todo:
1. Ejecutar todos los casos de prueba
2. Verificar que ningún docente puede modificar unidades ajenas
3. Confirmar que admins/operadores mantienen acceso completo
4. Revisar logs para detectar posibles problemas
5. Considerar agregar tests automatizados (opcional)
