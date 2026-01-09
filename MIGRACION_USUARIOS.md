# 📚 DOCUMENTACIÓN - MIGRACIÓN DE USUARIOS

Este documento contiene **todos los endpoints necesarios** para migrar usuarios a alumnos y familias.

---

## 📌 ÍNDICE

1. [Endpoints de Consulta (GET)](#1-endpoints-de-consulta-get)
2. [Endpoints de Creación/Actualización (POST/PUT)](#2-endpoints-de-creaciónactualización-postput)
3. [Ejemplos de Insomnia](#3-ejemplos-de-insomnia)
4. [Flujo de Migración Recomendado](#4-flujo-de-migración-recomendado)

---

## 1. ENDPOINTS DE CONSULTA (GET)

### 1.1. Obtener Alumnos sin Usuario

**Endpoint:**
```
GET /api/alumnos?sinUsuario=true
```

**Descripción:** Devuelve todos los alumnos que **NO** tienen `IdUsuario` asignado (es NULL).

**Headers:**
```
Authorization: Bearer <TOKEN_JWT>
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "IdAlumno": 1,
      "Matricula": "2026-001",
      "Nombres": "Juan Carlos",
      "Apellidos": "Pérez López",
      "IdFamilia": 5,
      "IdUsuario": null,
      "Estado": true,
      "CreadoPor": 1,
      "FechaCreado": "2026-01-15T12:30:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 1.2. Obtener Alumnos de una Familia

**Endpoint:**
```
GET /api/alumnos?idFamilia=5
```

**Descripción:** Devuelve todos los alumnos que pertenecen a la familia con `IdFamilia = 5`.

**Headers:**
```
Authorization: Bearer <TOKEN_JWT>
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "IdAlumno": 1,
      "Matricula": "2026-001",
      "Nombres": "Juan Carlos",
      "Apellidos": "Pérez López",
      "IdFamilia": 5,
      "IdUsuario": null,
      "Estado": true
    },
    {
      "IdAlumno": 2,
      "Matricula": "2026-002",
      "Nombres": "María José",
      "Apellidos": "Pérez López",
      "IdFamilia": 5,
      "IdUsuario": null,
      "Estado": true
    }
  ],
  "total": 2
}
```

---

### 1.3. Combinar Filtros (Sin Usuario Y de una Familia)

**Endpoint:**
```
GET /api/alumnos?sinUsuario=true&idFamilia=5
```

**Descripción:** Devuelve alumnos de la familia 5 que **NO** tienen usuario asignado.

---

### 1.4. Obtener Familias sin Usuario

**Endpoint:**
```
GET /api/familias?sinUsuario=true
```

**Descripción:** Devuelve todas las familias que **NO** tienen `IdUsuario` asignado.

**Headers:**
```
Authorization: Bearer <TOKEN_JWT>
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "IdFamilia": 5,
      "NombreFamilia": "Familia Pérez López",
      "Direccion": "Zona 10, Ciudad",
      "TelefonoContacto": "1234-5678",
      "EmailContacto": "perez@example.com",
      "IdUsuario": null,
      "Estado": true,
      "CreadoPor": 1,
      "FechaCreado": "2026-01-10T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 1.5. Obtener Todos los Alumnos (Sin Filtros)

**Endpoint:**
```
GET /api/alumnos
```

**Descripción:** Devuelve **todos** los alumnos activos (Estado = true), sin importar si tienen usuario o no.

---

### 1.6. Obtener Todas las Familias (Sin Filtros)

**Endpoint:**
```
GET /api/familias
```

**Descripción:** Devuelve **todas** las familias activas.

---

## 2. ENDPOINTS DE CREACIÓN/ACTUALIZACIÓN (POST/PUT)

### 2.1. Crear Usuario

**Endpoint:**
```
POST /api/usuarios
```

**Headers:**
```
Authorization: Bearer <TOKEN_JWT>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "NombreUsuario": "jperez2026",
  "NombreCompleto": "Juan Carlos Pérez López",
  "Contrasena": "MiPassword123!",
  "IdRol": 3,
  "IdColaborador": 1
}
```

**Campos:**
- `NombreUsuario` (string, **obligatorio**): Nombre de usuario único
- `NombreCompleto` (string, **obligatorio**): Nombre completo del usuario
- `Contrasena` (string, **obligatorio**): Contraseña en texto plano (se encriptará automáticamente)
- `IdRol` (integer, **obligatorio**): ID del rol (1=Admin, 2=Docente, 3=Alumno, 4=Padre de Familia)
- `IdColaborador` (integer, **obligatorio**): ID del colaborador que crea el usuario

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "data": {
    "IdUsuario": 42,
    "NombreUsuario": "jperez2026",
    "NombreCompleto": "Juan Carlos Pérez López",
    "Contrasena": "$2a$10$abcdef...", // Encriptada
    "IdRol": 3,
    "Estado": true,
    "FechaCreado": "2026-01-20T14:30:00.000Z"
  }
}
```

**Errores Posibles:**
- `400`: Faltan campos requeridos o IdColaborador inválido
- `400`: La contraseña es requerida
- `500`: Error de base de datos (ej: NombreUsuario duplicado)

---

### 2.2. Actualizar Alumno (Asignar Usuario)

**Endpoint:**
```
PUT /api/alumnos/:id
```

**Ejemplo:**
```
PUT /api/alumnos/1
```

**Headers:**
```
Authorization: Bearer <TOKEN_JWT>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "IdUsuario": 42,
  "IdColaborador": 1
}
```

**Campos:**
- `IdUsuario` (integer, **obligatorio**): ID del usuario a asignar al alumno
- `IdColaborador` (integer, **obligatorio**): ID del colaborador que hace la actualización
- **Opcional:** Puedes enviar otros campos del alumno si deseas actualizarlos también

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "IdAlumno": 1,
    "Matricula": "2026-001",
    "Nombres": "Juan Carlos",
    "Apellidos": "Pérez López",
    "IdUsuario": 42,
    "Estado": true,
    "ModificadoPor": 1,
    "FechaModificado": "2026-01-20T14:35:00.000Z"
  }
}
```

**Errores Posibles:**
- `400`: IdColaborador es requerido o inválido
- `404`: Alumno no encontrado
- `500`: Error de base de datos

---

### 2.3. Actualizar Familia (Asignar Usuario)

**Endpoint:**
```
PUT /api/familias/:id
```

**Ejemplo:**
```
PUT /api/familias/5
```

**Headers:**
```
Authorization: Bearer <TOKEN_JWT>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "IdUsuario": 43,
  "IdColaborador": 1
}
```

**Campos:**
- `IdUsuario` (integer, **obligatorio**): ID del usuario a asignar a la familia
- `IdColaborador` (integer, **obligatorio**): ID del colaborador que hace la actualización

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "IdFamilia": 5,
    "NombreFamilia": "Familia Pérez López",
    "Direccion": "Zona 10, Ciudad",
    "IdUsuario": 43,
    "Estado": true,
    "ModificadoPor": 1,
    "FechaModificado": "2026-01-20T14:40:00.000Z"
  }
}
```

---

## 3. EJEMPLOS DE INSOMNIA

### 📦 COLECCIÓN COMPLETA DE INSOMNIA

Puedes importar este JSON en Insomnia para probar todos los endpoints:

```json
{
  "name": "Migración de Usuarios",
  "description": "Endpoints para asignar usuarios a alumnos y familias",
  "requests": [
    {
      "name": "1. Login (Obtener Token)",
      "method": "POST",
      "url": "http://localhost:4000/api/login",
      "headers": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ],
      "body": {
        "mimeType": "application/json",
        "text": "{\n  \"NombreUsuario\": \"admin\",\n  \"Contrasena\": \"admin123\"\n}"
      }
    },
    {
      "name": "2. Obtener Alumnos sin Usuario",
      "method": "GET",
      "url": "http://localhost:4000/api/alumnos?sinUsuario=true",
      "headers": [
        {
          "name": "Authorization",
          "value": "Bearer TU_TOKEN_AQUI"
        }
      ]
    },
    {
      "name": "3. Obtener Alumnos de una Familia",
      "method": "GET",
      "url": "http://localhost:4000/api/alumnos?idFamilia=5",
      "headers": [
        {
          "name": "Authorization",
          "value": "Bearer TU_TOKEN_AQUI"
        }
      ]
    },
    {
      "name": "4. Obtener Familias sin Usuario",
      "method": "GET",
      "url": "http://localhost:4000/api/familias?sinUsuario=true",
      "headers": [
        {
          "name": "Authorization",
          "value": "Bearer TU_TOKEN_AQUI"
        }
      ]
    },
    {
      "name": "5. Crear Usuario (Alumno)",
      "method": "POST",
      "url": "http://localhost:4000/api/usuarios",
      "headers": [
        {
          "name": "Authorization",
          "value": "Bearer TU_TOKEN_AQUI"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ],
      "body": {
        "mimeType": "application/json",
        "text": "{\n  \"NombreUsuario\": \"jperez2026\",\n  \"NombreCompleto\": \"Juan Carlos Pérez López\",\n  \"Contrasena\": \"MiPassword123!\",\n  \"IdRol\": 3,\n  \"IdColaborador\": 1\n}"
      }
    },
    {
      "name": "6. Crear Usuario (Familia)",
      "method": "POST",
      "url": "http://localhost:4000/api/usuarios",
      "headers": [
        {
          "name": "Authorization",
          "value": "Bearer TU_TOKEN_AQUI"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ],
      "body": {
        "mimeType": "application/json",
        "text": "{\n  \"NombreUsuario\": \"familia_perez\",\n  \"NombreCompleto\": \"Familia Pérez López\",\n  \"Contrasena\": \"Familia123!\",\n  \"IdRol\": 4,\n  \"IdColaborador\": 1\n}"
      }
    },
    {
      "name": "7. Actualizar Alumno (Asignar Usuario)",
      "method": "PUT",
      "url": "http://localhost:4000/api/alumnos/1",
      "headers": [
        {
          "name": "Authorization",
          "value": "Bearer TU_TOKEN_AQUI"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ],
      "body": {
        "mimeType": "application/json",
        "text": "{\n  \"IdUsuario\": 42,\n  \"IdColaborador\": 1\n}"
      }
    },
    {
      "name": "8. Actualizar Familia (Asignar Usuario)",
      "method": "PUT",
      "url": "http://localhost:4000/api/familias/5",
      "headers": [
        {
          "name": "Authorization",
          "value": "Bearer TU_TOKEN_AQUI"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ],
      "body": {
        "mimeType": "application/json",
        "text": "{\n  \"IdUsuario\": 43,\n  \"IdColaborador\": 1\n}"
      }
    }
  ]
}
```

---

## 4. FLUJO DE MIGRACIÓN RECOMENDADO

### 🔄 PASO A PASO

#### **Para Alumnos:**

1. **Obtener alumnos sin usuario:**
   ```
   GET /api/alumnos?sinUsuario=true
   ```

2. **Para cada alumno, crear usuario:**
   ```
   POST /api/usuarios
   {
     "NombreUsuario": "matricula_del_alumno", // Ejemplo: "2026001"
     "NombreCompleto": "Nombres + Apellidos del alumno",
     "Contrasena": "DefaultPassword2026!",
     "IdRol": 3,
     "IdColaborador": 1
   }
   ```

3. **Asignar el nuevo usuario al alumno:**
   ```
   PUT /api/alumnos/:id
   {
     "IdUsuario": <ID_USUARIO_CREADO>,
     "IdColaborador": 1
   }
   ```

#### **Para Familias:**

1. **Obtener familias sin usuario:**
   ```
   GET /api/familias?sinUsuario=true
   ```

2. **Para cada familia, crear usuario:**
   ```
   POST /api/usuarios
   {
     "NombreUsuario": "familia_apellido", // Ejemplo: "familia_perez"
     "NombreCompleto": "Nombre de la Familia",
     "Contrasena": "FamiliaPassword2026!",
     "IdRol": 4,
     "IdColaborador": 1
   }
   ```

3. **Asignar el nuevo usuario a la familia:**
   ```
   PUT /api/familias/:id
   {
     "IdUsuario": <ID_USUARIO_CREADO>,
     "IdColaborador": 1
   }
   ```

---

### 🎯 EJEMPLO COMPLETO (Curl)

#### 1. Obtener alumnos sin usuario:
```bash
curl -X GET "http://localhost:4000/api/alumnos?sinUsuario=true" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

#### 2. Crear usuario para el alumno:
```bash
curl -X POST "http://localhost:4000/api/usuarios" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "NombreUsuario": "jperez2026",
    "NombreCompleto": "Juan Carlos Pérez López",
    "Contrasena": "MiPassword123!",
    "IdRol": 3,
    "IdColaborador": 1
  }'
```

#### 3. Asignar usuario al alumno:
```bash
curl -X PUT "http://localhost:4000/api/alumnos/1" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "IdUsuario": 42,
    "IdColaborador": 1
  }'
```

---

### 🎯 EJEMPLO COMPLETO (Fetch JavaScript)

```javascript
// 1. Obtener alumnos sin usuario
const obtenerAlumnosSinUsuario = async () => {
  const response = await fetch('http://localhost:4000/api/alumnos?sinUsuario=true', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.data; // Array de alumnos
};

// 2. Crear usuario para un alumno
const crearUsuarioAlumno = async (alumno) => {
  const response = await fetch('http://localhost:4000/api/usuarios', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      NombreUsuario: alumno.Matricula.replace('-', ''), // "2026-001" → "2026001"
      NombreCompleto: `${alumno.Nombres} ${alumno.Apellidos}`,
      Contrasena: 'DefaultPassword2026!',
      IdRol: 3,
      IdColaborador: 1
    })
  });
  const data = await response.json();
  return data.data.IdUsuario; // ID del usuario creado
};

// 3. Asignar usuario al alumno
const asignarUsuarioAlumno = async (idAlumno, idUsuario) => {
  const response = await fetch(`http://localhost:4000/api/alumnos/${idAlumno}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      IdUsuario: idUsuario,
      IdColaborador: 1
    })
  });
  return await response.json();
};

// 4. Flujo completo
const migrarAlumnos = async () => {
  const alumnos = await obtenerAlumnosSinUsuario();

  for (const alumno of alumnos) {
    const idUsuario = await crearUsuarioAlumno(alumno);
    await asignarUsuarioAlumno(alumno.IdAlumno, idUsuario);
    console.log(`✅ Migrado: ${alumno.Nombres} ${alumno.Apellidos}`);
  }
};
```

---

## 📝 NOTAS IMPORTANTES

### ⚠️ Consideraciones de Seguridad

1. **Contraseñas por Defecto**: Si usas contraseñas por defecto (ej: "DefaultPassword2026!"), considera:
   - Forzar cambio de contraseña en el primer login
   - Enviar email/SMS a familias con sus credenciales

2. **Validación de Duplicados**: El backend NO valida si el usuario ya existe antes de actualizar alumno/familia. Debes asegurarte de:
   - Verificar que el usuario no esté asignado a otro alumno/familia
   - Manejar errores de usuario duplicado al crear

3. **IdColaborador**: Todos los endpoints requieren `IdColaborador` en el body. En tu frontend debes:
   - Obtener el IdUsuario del usuario autenticado
   - Enviarlo como `IdColaborador` en cada petición

### 🔑 Roles Disponibles

| IdRol | NombreRol         | Uso                     |
|-------|-------------------|-------------------------|
| 1     | Administrador     | Admin del sistema       |
| 2     | Docente           | Profesores              |
| 3     | Alumno            | Estudiantes             |
| 4     | Padre de Familia  | Familias/Tutores        |

### ✅ Validaciones del Backend

- **Usuarios**: NombreUsuario debe ser único
- **Contraseñas**: Se encriptan automáticamente con bcrypt
- **Estado**: Se crea con Estado=true por defecto
- **Filtros**: Los query params son opcionales y se pueden combinar

---

## 🚀 RESUMEN DE ENDPOINTS

| Método | Endpoint                        | Descripción                          |
|--------|---------------------------------|--------------------------------------|
| GET    | `/api/alumnos?sinUsuario=true`  | Alumnos sin usuario                  |
| GET    | `/api/alumnos?idFamilia=X`      | Alumnos de una familia               |
| GET    | `/api/familias?sinUsuario=true` | Familias sin usuario                 |
| POST   | `/api/usuarios`                 | Crear nuevo usuario                  |
| PUT    | `/api/alumnos/:id`              | Actualizar alumno (asignar usuario)  |
| PUT    | `/api/familias/:id`             | Actualizar familia (asignar usuario) |

---

**Fecha de creación:** 29/12/2025
**Versión:** 1.0
