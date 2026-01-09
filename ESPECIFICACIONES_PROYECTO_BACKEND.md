# 📘 ESPECIFICACIONES COMPLETAS DEL PROYECTO - BACKEND API COLEGIO

## 📋 ÍNDICE
1. [Información General](#información-general)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Estructura de Carpetas](#estructura-de-carpetas)
5. [Base de Datos](#base-de-datos)
6. [Autenticación y Seguridad](#autenticación-y-seguridad)
7. [Convenciones de Código](#convenciones-de-código)
8. [Modelos de Datos](#modelos-de-datos)
9. [Endpoints Disponibles](#endpoints-disponibles)
10. [Stored Procedures](#stored-procedures)
11. [Flujos de Negocio](#flujos-de-negocio)
12. [Reglas de Auditoría](#reglas-de-auditoría)
13. [Manejo de Errores](#manejo-de-errores)
14. [Variables de Entorno](#variables-de-entorno)

---

## 🎯 INFORMACIÓN GENERAL

### **Nombre del Proyecto**
Backend API - Sistema de Gestión Escolar

### **Propósito**
API REST para gestionar un colegio que incluye:
- Gestión de alumnos, familias y responsables
- Sistema de inscripciones y pagos
- Sistema de calificaciones (docentes, asignaciones, unidades, actividades)
- Sistema de usuarios con roles
- Auditoría completa de operaciones

### **Puerto**
```
http://localhost:4000
```

### **Base URL de la API**
```
http://localhost:4000/api
```

---

## 🏗️ ARQUITECTURA DEL PROYECTO

### **Patrón de Diseño**
- **MVC (Model-View-Controller)** adaptado para API REST
  - **Models**: Definición de esquemas con Sequelize ORM
  - **Controllers**: Lógica de negocio
  - **Routes**: Definición de endpoints

### **Capas del Proyecto**
```
┌─────────────────────────────────────┐
│         Cliente (React)             │
└──────────────┬──────────────────────┘
               │ HTTP/HTTPS
               │ Authorization: Bearer JWT
┌──────────────▼──────────────────────┐
│   Middleware (Auth, Rate Limiting)  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Routes (Express Router)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Controllers (Business Logic)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Models (Sequelize ORM)           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      MySQL Database                 │
│   (Stored Procedures, Triggers)     │
└─────────────────────────────────────┘
```

---

## 💻 TECNOLOGÍAS UTILIZADAS

### **Backend**
- **Node.js** (v18+)
- **Express.js** (Framework web)
- **Sequelize** (ORM para MySQL)
- **MySQL** (Base de datos relacional)

### **Autenticación y Seguridad**
- **JWT (jsonwebtoken)** - Autenticación basada en tokens
- **bcryptjs** - Encriptación de contraseñas
- **helmet** - Seguridad de headers HTTP
- **express-rate-limit** - Rate limiting para prevenir ataques

### **Utilidades**
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Variables de entorno
- **mysql2** - Driver MySQL para Node.js

---

## 📁 ESTRUCTURA DE CARPETAS

```
BackendAPI/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # Configuración de Sequelize
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    # Verificación JWT
│   │   │   ├── rateLimiter.js       # Rate limiting
│   │   │   └── errorHandler.js      # Manejo de errores (si existe)
│   │   ├── models/                  # Modelos Sequelize
│   │   │   ├── Alumno.js
│   │   │   ├── Usuario.js
│   │   │   ├── Familia.js
│   │   │   ├── Responsable.js
│   │   │   ├── Grado.js
│   │   │   ├── Seccion.js
│   │   │   ├── Jornada.js
│   │   │   ├── Inscripcion.js
│   │   │   ├── Pago.js
│   │   │   ├── Bitacora.js
│   │   │   ├── Curso.js             # NUEVO
│   │   │   ├── Docente.js           # NUEVO
│   │   │   ├── AsignacionDocente.js # NUEVO
│   │   │   ├── Unidad.js            # NUEVO
│   │   │   ├── Actividad.js         # NUEVO
│   │   │   └── Calificacion.js      # NUEVO
│   │   ├── controllers/             # Lógica de negocio
│   │   │   ├── alumnosController.js
│   │   │   ├── usuariosController.js
│   │   │   ├── familiasController.js
│   │   │   ├── responsablesController.js
│   │   │   ├── gradosController.js
│   │   │   ├── inscripcionesController.js
│   │   │   ├── pagosController.js
│   │   │   ├── bitacorasController.js
│   │   │   ├── loginController.js
│   │   │   ├── cursosController.js          # NUEVO
│   │   │   ├── docentesController.js        # NUEVO
│   │   │   ├── asignacionesController.js    # NUEVO
│   │   │   ├── unidadesController.js        # NUEVO
│   │   │   ├── actividadesController.js     # NUEVO
│   │   │   └── calificacionesController.js  # NUEVO
│   │   ├── routes/                  # Definición de rutas
│   │   │   ├── index.js             # Router principal
│   │   │   ├── alumnosRoutes.js
│   │   │   ├── usuariosRoutes.js
│   │   │   ├── familiasRoutes.js
│   │   │   ├── responsablesRoutes.js
│   │   │   ├── gradosRoutes.js
│   │   │   ├── inscripcionesRoutes.js
│   │   │   ├── pagosRoutes.js
│   │   │   ├── bitacorasRoutes.js
│   │   │   ├── loginRoutes.js
│   │   │   ├── cursosRoutes.js              # NUEVO
│   │   │   ├── docentesRoutes.js            # NUEVO
│   │   │   ├── asignacionesRoutes.js        # NUEVO
│   │   │   ├── unidadesRoutes.js            # NUEVO
│   │   │   ├── actividadesRoutes.js         # NUEVO
│   │   │   └── calificacionesRoutes.js      # NUEVO
│   │   └── app.js                   # Configuración de Express
│   ├── .env                         # Variables de entorno
│   ├── package.json
│   └── package-lock.json
├── sql/                             # Scripts SQL
│   ├── migrations/                  # Migraciones
│   └── stored_procedures/           # Stored Procedures
├── DOCUMENTACION_API_CALIFICACIONES_FRONTEND.md
├── RESUMEN_COMPLETO_PARA_API.md
└── ESPECIFICACIONES_PROYECTO_BACKEND.md (este archivo)
```

---

## 🗄️ BASE DE DATOS

### **Motor**
MySQL 8.0+

### **Nombre de la Base de Datos**
`colegio`

### **Tablas Principales**

#### **Módulo de Usuarios y Seguridad**
- `usuarios` - Usuarios del sistema
- `roles` - Roles de usuario (Administrador, Docente, Secretaria, etc.)

#### **Módulo de Alumnos y Familias**
- `alumnos` - Información de alumnos
- `familias` - Grupos familiares
- `responsables` - Responsables de alumnos (padres, tutores)
- `responsable_tipo` - Tipos de responsable (Padre, Madre, Tutor, etc.)
- `fichas_medicas` - Información médica de alumnos

#### **Módulo Académico**
- `grados` - Grados escolares
- `niveles` - Niveles educativos (Preprimaria, Primaria, etc.)
- `secciones` - Secciones (A, B, C, etc.)
- `jornadas` - Jornadas (Matutina, Vespertina, Nocturna)
- `cursos` - Cursos/Materias por grado
- `inscripciones` - Inscripciones de alumnos

#### **Módulo de Calificaciones** (NUEVO)
- `docentes` - Información de docentes
- `asignacion_docente` - Asignaciones de docentes a cursos
- `unidades` - Unidades académicas (4 por curso)
- `actividades` - Actividades de evaluación (zona/final)
- `calificaciones` - Punteos de alumnos

#### **Módulo de Pagos**
- `pagos` - Registro de pagos
- `tipo_pago` - Tipos de pago (Mensualidad, Inscripción, etc.)
- `metodo_pago` - Métodos de pago (Efectivo, Tarjeta, Transferencia)

#### **Módulo de Auditoría**
- `bitacoras` - Registro de operaciones del sistema

---

## 🔐 AUTENTICACIÓN Y SEGURIDAD

### **Sistema de Autenticación**
- **JWT (JSON Web Tokens)**
- Los tokens se generan en el endpoint `/api/login`
- Cada request protegido debe incluir: `Authorization: Bearer <token>`

### **Estructura del Token JWT**
```javascript
{
  IdUsuario: 5,
  NombreUsuario: "emilio.aragon",
  NombreCompleto: "Emilio Aragón",
  IdRol: 2,
  iat: 1641234567,
  exp: 1641321067  // Expira en 24 horas
}
```

### **Rate Limiting**
- **Login**: 5 intentos cada 15 minutos
- **Rutas protegidas**: Sin rate limiting (ya protegidas por JWT)

### **Seguridad de Contraseñas**
- **bcrypt** con salt rounds = 10
- Las contraseñas se encriptan antes de guardar
- Nunca se almacenan en texto plano

### **Headers de Seguridad (Helmet)**
```javascript
helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
})
```

### **CORS**
```javascript
cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
})
```

---

## 📐 CONVENCIONES DE CÓDIGO

### **Nombres de Archivos**
- **Modelos**: PascalCase (`Alumno.js`, `AsignacionDocente.js`)
- **Controladores**: camelCase + Controller (`alumnosController.js`)
- **Rutas**: camelCase + Routes (`alumnosRoutes.js`)

### **Nombres de Variables**
- **Modelos Sequelize**: PascalCase (`Alumno`, `Usuario`)
- **Instancias**: camelCase (`nuevoAlumno`, `usuario`)
- **Constantes**: UPPER_SNAKE_CASE (`DB_HOST`, `JWT_SECRET`)

### **Nombres en Base de Datos vs Código**

#### **Tablas EXISTENTES (estilo antiguo)**
- Campos de auditoría son **INTEGER**: `CreadoPor`, `ModificadoPor`
- Se recibe `IdColaborador` en el body
- Ejemplo: Alumnos, Pagos, Familias

#### **Tablas NUEVAS (sistema de calificaciones)**
- Campos de auditoría son **STRING(50)**: `CreadoPor`, `ModificadoPor`
- Se recibe `CreadoPor` directamente en el body
- Ejemplo: Docentes, Asignaciones, Unidades, Actividades, Calificaciones

### **Estructura de Respuestas**
```javascript
// Éxito
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "Mensaje de error"
}
// o
{
  "success": false,
  "message": "Mensaje de error"
}
```

### **Códigos HTTP**
- **200** - OK (operación exitosa)
- **201** - Created (recurso creado)
- **400** - Bad Request (datos inválidos)
- **401** - Unauthorized (sin autenticación)
- **404** - Not Found (recurso no encontrado)
- **409** - Conflict (registro duplicado)
- **500** - Internal Server Error (error del servidor)

---

## 📊 MODELOS DE DATOS

### **Convención de Campos Comunes**

#### **En Tablas EXISTENTES**
```javascript
{
  CreadoPor: DataTypes.INTEGER,        // ID del colaborador
  FechaCreado: DataTypes.DATE,
  ModificadoPor: DataTypes.INTEGER,    // ID del colaborador
  FechaModificado: DataTypes.DATE,
  Estado: DataTypes.BOOLEAN            // true = activo, false = inactivo
}
```

#### **En Tablas NUEVAS (Calificaciones)**
```javascript
{
  CreadoPor: DataTypes.STRING(50),     // Username
  FechaCreado: DataTypes.DATE,
  ModificadoPor: DataTypes.STRING(50), // Username
  FechaModificado: DataTypes.DATE,
  Estado: DataTypes.BOOLEAN
}
```

### **Relaciones Importantes**

```
usuarios (1) ─── (0..1) docentes
usuarios (1) ─── (0..1) alumnos
familias (1) ─── (N) alumnos
familias (1) ─── (N) responsables
alumnos (1) ─── (N) inscripciones
alumnos (1) ─── (N) pagos
alumnos (1) ─── (N) calificaciones

docentes (1) ─── (N) asignacion_docente
cursos (1) ─── (N) asignacion_docente
grados (1) ─── (N) asignacion_docente
asignacion_docente (1) ─── (4) unidades
unidades (1) ─── (N) actividades
actividades (1) ─── (N) calificaciones
```

---

## 🛣️ ENDPOINTS DISPONIBLES

### **Formato General**
```
[MÉTODO] /api/[recurso]/[parámetros]
```

### **Autenticación**
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| POST | `/api/login` | ❌ NO | Iniciar sesión (devuelve JWT) |

### **Usuarios**
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/api/usuarios` | ✅ SÍ | Listar todos los usuarios |
| GET | `/api/usuarios/:id` | ✅ SÍ | Ver un usuario |
| POST | `/api/usuarios` | ✅ SÍ | Crear usuario |
| PUT | `/api/usuarios/:id` | ✅ SÍ | Actualizar usuario |
| PUT | `/api/usuarios/:id/soft-reset` | ✅ SÍ | Resetear contraseña |
| DELETE | `/api/usuarios/:id` | ✅ SÍ | Eliminar usuario |

### **Alumnos**
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/api/alumnos` | ✅ SÍ | Listar alumnos activos |
| GET | `/api/alumnos/:id` | ✅ SÍ | Ver un alumno |
| GET | `/api/alumnos/existe-matricula?matricula=X` | ✅ SÍ | Validar matrícula |
| GET | `/api/alumnos/siguiente-carnet` | ✅ SÍ | Obtener siguiente carné |
| GET | `/api/alumnos/alumnos-expulsados` | ✅ SÍ | Listar expulsados |
| POST | `/api/alumnos` | ✅ SÍ | Crear alumno |
| PUT | `/api/alumnos/:id` | ✅ SÍ | Actualizar alumno |
| PUT | `/api/alumnos/regresar-estudiante` | ✅ SÍ | Regresar alumno |
| DELETE | `/api/alumnos/:id` | ✅ SÍ | Eliminar alumno |

### **Familias**
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/api/familias` | ✅ SÍ | Listar familias |
| GET | `/api/familias/:id` | ✅ SÍ | Ver una familia |
| GET | `/api/familias/completas` | ✅ SÍ | Familias con responsables (SP) |
| POST | `/api/familias` | ✅ SÍ | Crear familia |
| PUT | `/api/familias/:id` | ✅ SÍ | Actualizar familia |
| DELETE | `/api/familias/:id` | ✅ SÍ | Eliminar familia |

### **Responsables**
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/api/responsables` | ✅ SÍ | Listar responsables |
| GET | `/api/responsables/:id` | ✅ SÍ | Ver un responsable |
| GET | `/api/responsables/activos` | ✅ SÍ | Responsables activos (SP) |
| GET | `/api/responsables/por-grado/:ciclo/:grado/:seccion/:jornada` | ✅ SÍ | Por grado (SP) |
| POST | `/api/responsables` | ✅ SÍ | Crear responsable |
| PUT | `/api/responsables/:id` | ✅ SÍ | Actualizar responsable |
| DELETE | `/api/responsables/:id` | ✅ SÍ | Eliminar responsable |

### **Grados**
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/api/grados` | ✅ SÍ | Listar grados |
| GET | `/api/grados/:id` | ✅ SÍ | Ver un grado |
| GET | `/api/grados/:id/costo` | ✅ SÍ | Costo del grado (SP) |
| POST | `/api/grados` | ✅ SÍ | Crear grado |
| PUT | `/api/grados/:id` | ✅ SÍ | Actualizar grado |
| DELETE | `/api/grados/:id` | ✅ SÍ | Eliminar grado |

### **Inscripciones**
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/api/inscripciones` | ✅ SÍ | Listar inscripciones |
| GET | `/api/inscripciones/:id` | ✅ SÍ | Ver una inscripción |
| GET | `/api/inscripciones/listado?ciclo=X&grado=Y&seccion=Z&jornada=W` | ✅ SÍ | Listado por parámetros (SP) |
| GET | `/api/inscripciones/buscar-alumno/:id?ciclo=X` | ✅ SÍ | Buscar alumno (SP) |
| POST | `/api/inscripciones` | ✅ SÍ | Crear inscripción |
| PUT | `/api/inscripciones/:id` | ✅ SÍ | Actualizar inscripción |
| DELETE | `/api/inscripciones/:id` | ✅ SÍ | Eliminar inscripción |

### **Pagos**
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/api/pagos` | ✅ SÍ | Listar pagos |
| GET | `/api/pagos/:id` | ✅ SÍ | Ver un pago |
| GET | `/api/pagos/meses-pagados/:idAlumno/:tipoPago/:cicloEscolar` | ✅ SÍ | Meses pagados (SP) |
| GET | `/api/pagos/numero/:numero` | ✅ SÍ | Buscar por número |
| GET | `/api/pagos/reporte?fechaInicial=X&fechaFinal=Y&cicloEscolar=Z` | ✅ SÍ | Reporte (SP) |
| GET | `/api/pagos/hoy?cicloEscolar=X` | ✅ SÍ | Pagos del día (SP) |
| GET | `/api/pagos/insolventes?cicloEscolar=X&mes=Y` | ✅ SÍ | Alumnos insolventes (SP) |
| POST | `/api/pagos/buscar` | ✅ SÍ | Buscar pagos (SP) |
| POST | `/api/pagos` | ✅ SÍ | Crear pago |
| PUT | `/api/pagos/:id` | ✅ SÍ | Actualizar pago |
| DELETE | `/api/pagos/:id` | ✅ SÍ | Eliminar pago |

### **Cursos** (NUEVO)
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/api/cursos` | ✅ SÍ | Listar cursos |
| GET | `/api/cursos/:id` | ✅ SÍ | Ver un curso |
| GET | `/api/cursos/grado/:idGrado` | ✅ SÍ | Cursos por grado |
| GET | `/api/cursos/por-grado?idGrado=X&idSeccion=Y&idJornada=Z&anio=W` | ✅ SÍ | Cursos con asignaciones (SP) |
| POST | `/api/cursos` | ✅ SÍ | Crear curso |
| PUT | `/api/cursos/:id` | ✅ SÍ | Actualizar curso |
| DELETE | `/api/cursos/:id` | ✅ SÍ | Eliminar curso |

### **Docentes** (NUEVO)
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/api/docentes` | ✅ SÍ | Listar docentes |
| GET | `/api/docentes/:id` | ✅ SÍ | Ver un docente |
| GET | `/api/docentes/:id/asignaciones` | ✅ SÍ | Asignaciones del docente (Vista) |
| POST | `/api/docentes` | ✅ SÍ | Crear docente |
| PUT | `/api/docentes/:id` | ✅ SÍ | Actualizar docente |
| DELETE | `/api/docentes/:id` | ✅ SÍ | Eliminar docente |

### **Asignaciones** (NUEVO)
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/api/asignaciones` | ✅ SÍ | Listar asignaciones (Vista) |
| GET | `/api/asignaciones/:id` | ✅ SÍ | Ver una asignación |
| GET | `/api/asignaciones/:id/unidades` | ✅ SÍ | Unidades de la asignación (Vista) |
| GET | `/api/asignaciones/validar?...` | ✅ SÍ | Validar duplicado (SP) |
| GET | `/api/asignaciones/cursos-disponibles?...` | ✅ SÍ | Cursos disponibles (SP) |
| POST | `/api/asignaciones` | ✅ SÍ | Crear asignación (SP - crea 4 unidades) |
| PUT | `/api/asignaciones/:id` | ✅ SÍ | Actualizar asignación |
| DELETE | `/api/asignaciones/:id` | ✅ SÍ | Eliminar asignación |

### **Unidades** (NUEVO)
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/api/unidades/:id` | ✅ SÍ | Ver una unidad |
| GET | `/api/unidades/:id/resumen` | ✅ SÍ | Resumen de unidad (Vista) |
| GET | `/api/unidades/:id/actividades` | ✅ SÍ | Actividades de la unidad |
| GET | `/api/unidades/:id/validar` | ✅ SÍ | Validar punteos (SP) |
| PUT | `/api/unidades/:id/activar` | ✅ SÍ | Activar unidad (Trigger valida) |
| PUT | `/api/unidades/:id` | ✅ SÍ | Actualizar unidad |

### **Actividades** (NUEVO)
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/api/actividades/:id` | ✅ SÍ | Ver una actividad |
| GET | `/api/actividades/:id/calificaciones` | ✅ SÍ | Calificaciones de la actividad |
| POST | `/api/actividades` | ✅ SÍ | Crear actividad (Trigger crea calificaciones) |
| PUT | `/api/actividades/:id` | ✅ SÍ | Actualizar actividad |
| DELETE | `/api/actividades/:id` | ✅ SÍ | Eliminar actividad |

### **Calificaciones** (NUEVO)
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/api/calificaciones/:id` | ✅ SÍ | Ver una calificación |
| GET | `/api/calificaciones/actividad/:id` | ✅ SÍ | Por actividad |
| GET | `/api/calificaciones/alumno/:id` | ✅ SÍ | Por alumno (Vista) |
| GET | `/api/calificaciones/alumno/:id?unidad=X` | ✅ SÍ | Por alumno y unidad (Vista) |
| GET | `/api/calificaciones/alumno/:id/promedio` | ✅ SÍ | Promedio anual (Vista) |
| PUT | `/api/calificaciones/:id` | ✅ SÍ | Actualizar calificación (SP valida) |
| PUT | `/api/calificaciones/batch` | ✅ SÍ | Actualizar múltiples |

### **Catálogos**
| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/api/roles` | ✅ SÍ | Listar roles |
| GET | `/api/niveles` | ✅ SÍ | Listar niveles |
| GET | `/api/secciones` | ✅ SÍ | Listar secciones |
| GET | `/api/jornadas` | ✅ SÍ | Listar jornadas |
| GET | `/api/tipopagos` | ✅ SÍ | Listar tipos de pago |
| GET | `/api/metodopagos` | ✅ SÍ | Listar métodos de pago |
| GET | `/api/responsable-tipo` | ✅ SÍ | Listar tipos de responsable |

---

## 🔧 STORED PROCEDURES

### **Módulo de Alumnos**
- `sp_SiguienteCarnet()` - Obtiene el siguiente número de carné
- `sp_ExisteMatricula(matricula)` - Valida si una matrícula existe
- `sp_BuscarAlumnosRetirados()` - Lista alumnos retirados
- `sp_RegresarEstudianteAlSistema(idAlumno, idInscripcion, idColaborador)` - Reactiva alumno

### **Módulo de Familias**
- `sp_obtenerfamiliascompletas()` - Familias con responsables y alumnos

### **Módulo de Responsables**
- `sp_ObtenerResponsablesActivos()` - Responsables activos
- `sp_obtenerresponsablesporgrado(ciclo, grado, seccion, jornada)` - Por grado

### **Módulo de Grados**
- `sp_CostoGrado(gradoId)` - Costo de inscripción y mensualidad

### **Módulo de Inscripciones**
- `sp_ListadoAlumnosPorInscripcion(ciclo, grado, seccion, jornada)` - Listado por parámetros
- `sp_BuscarAlumnoPorIdEnInscripcion(alumnoId, ciclo)` - Buscar alumno

### **Módulo de Pagos**
- `sp_MesesPagados(idAlumno, tipoPago, cicloEscolar)` - Meses pagados
- `sp_ReportePagos(fechaInicial, fechaFinal, cicloEscolar)` - Reporte de pagos
- `sp_PagosHoy(cicloEscolar)` - Pagos del día
- `sp_obtenerAlumnosInsolventesPrueba(cicloEscolar, mes)` - Alumnos insolventes
- `sp_BuscarPagos(nombreRecibo, numeroRecibo, cicloEscolar)` - Buscar pagos

### **Módulo de Cursos** (NUEVO)
- `sp_ObtenerCursosPorGrado(idGrado, idSeccion, idJornada, anio)` - Cursos con estado de asignación

### **Módulo de Asignaciones** (NUEVO)
- `sp_asignar_docente_curso(idDocente, idCurso, idGrado, idSeccion, idJornada, anio, creadoPor)` - Crea asignación y 4 unidades
- `sp_crear_unidades_asignacion(idAsignacion, creadoPor)` - Crea las 4 unidades
- `sp_validar_asignacion_duplicada(idCurso, idGrado, idSeccion, idJornada, anio)` - Valida duplicados
- `sp_cursos_disponibles(idGrado, idSeccion, idJornada, anio)` - Cursos sin asignar
- `sp_filtrar_asignaciones(anio, idGrado, idSeccion, idJornada, idDocente)` - Filtrar asignaciones

### **Módulo de Unidades** (NUEVO)
- `sp_validar_punteos_unidad(idUnidad)` - Valida que sume 60+40

### **Módulo de Calificaciones** (NUEVO)
- `sp_validar_calificacion(idActividad, idAlumno, punteo)` - Valida antes de guardar

---

## 🔄 FLUJOS DE NEGOCIO

### **1. Flujo de Creación de Alumno**
```
1. POST /api/alumnos
2. Validar que IdFamilia existe
3. Validar que Matricula no existe (opcional: usar sp_ExisteMatricula)
4. Crear alumno con CreadoPor = IdColaborador
5. Retornar alumno creado
```

### **2. Flujo de Inscripción**
```
1. Verificar que alumno existe
2. Verificar que grado, sección, jornada existen
3. Validar que no existe inscripción duplicada (mismo alumno, ciclo)
4. POST /api/inscripciones
5. Crear inscripción con CreadoPor = IdColaborador
```

### **3. Flujo de Registro de Pago**
```
1. POST /api/pagos
2. Validar que alumno existe
3. Validar que tipo de pago y método de pago existen
4. Generar número de recibo (si aplica)
5. Crear pago con CreadoPor = IdColaborador
6. Retornar pago creado
```

### **4. Flujo de Asignación de Docente** (NUEVO)
```
1. POST /api/asignaciones
2. CALL sp_asignar_docente_curso(...)
3. El SP valida:
   - Que docente existe
   - Que curso existe
   - Que no hay asignación duplicada
4. El SP crea:
   - 1 registro en asignacion_docente
   - 4 unidades automáticamente (solo Unidad 1 activa)
5. Retornar idAsignacion
```

### **5. Flujo de Configuración de Unidad** (NUEVO)
```
1. Crear actividades de zona (hasta sumar 60 pts)
   POST /api/actividades (tipo: "zona")
   - Trigger crea calificaciones (Punteo=NULL) para todos los alumnos

2. Crear actividad final (40 pts)
   POST /api/actividades (tipo: "final")
   - Trigger crea calificaciones (Punteo=NULL) para todos los alumnos

3. Validar punteos
   GET /api/unidades/:id/validar
   - SP valida que suma 60+40

4. Activar unidad
   PUT /api/unidades/:id/activar
   - Trigger valida antes de activar
   - Si no suma 60+40, RECHAZA con error 1644
```

### **6. Flujo de Ingreso de Calificaciones** (NUEVO)
```
1. GET /api/actividades/:id/calificaciones
   - Obtener lista de calificaciones (ya creadas por trigger)

2. PUT /api/calificaciones/:id (para cada alumno)
   - SP sp_validar_calificacion valida:
     - Que actividad existe y está activa
     - Que punteo está en rango (0 a PunteoMaximo)
     - Que alumno existe
   - Actualizar Punteo

3. Opción batch:
   PUT /api/calificaciones/batch
   - Actualizar múltiples calificaciones a la vez
```

### **7. Flujo de Consulta de Calificaciones** (NUEVO)
```
1. GET /api/calificaciones/alumno/:id?unidad=1
   - Usa vista vw_calificaciones_alumno_unidad
   - Retorna: zona, final, total, estado (Aprobado/Reprobado)

2. GET /api/calificaciones/alumno/:id/promedio
   - Usa vista vw_promedio_anual
   - Retorna: Unidad1, Unidad2, Unidad3, Unidad4, PromedioAnual, EstadoFinal
```

---

## 📝 REGLAS DE AUDITORÍA

### **Campos de Auditoría (Tablas EXISTENTES)**
```javascript
// Al CREAR
{
  CreadoPor: IdColaborador,    // INTEGER - ID del usuario
  FechaCreado: new Date()
}

// Al ACTUALIZAR
{
  ModificadoPor: IdColaborador, // INTEGER - ID del usuario
  FechaModificado: new Date()
}

// Al ELIMINAR (soft delete)
{
  Estado: false,
  ModificadoPor: IdColaborador,
  FechaModificado: new Date()
}
```

### **Campos de Auditoría (Tablas NUEVAS - Calificaciones)**
```javascript
// Al CREAR
{
  CreadoPor: "username",        // STRING - Nombre de usuario
  FechaCreado: new Date()
}

// Al ACTUALIZAR
{
  ModificadoPor: "username",    // STRING - Nombre de usuario
  FechaModificado: new Date()
}

// Al ELIMINAR (soft delete)
{
  Estado: false,
  ModificadoPor: "username",
  FechaModificado: new Date()
}
```

### **Validaciones de Auditoría**
```javascript
// En CREAR (tablas existentes)
if (!IdColaborador || isNaN(IdColaborador)) {
  return res.status(400).json({
    success: false,
    error: 'IdColaborador es requerido y debe ser un número'
  });
}

// En CREAR (tablas nuevas)
if (!CreadoPor || CreadoPor.trim() === '') {
  return res.status(400).json({
    success: false,
    error: 'CreadoPor es requerido'
  });
}

// En ACTUALIZAR (tablas existentes)
if (!IdColaborador || isNaN(IdColaborador)) {
  return res.status(400).json({
    success: false,
    error: 'IdColaborador es requerido y debe ser un número'
  });
}

// En ACTUALIZAR (tablas nuevas)
if (!ModificadoPor || ModificadoPor.trim() === '') {
  return res.status(400).json({
    success: false,
    error: 'ModificadoPor es requerido'
  });
}
```

---

## ⚠️ MANEJO DE ERRORES

### **Errores de Sequelize**
```javascript
try {
  // operación
} catch (error) {
  res.status(400).json({ success: false, error: error.message });
}
```

### **Errores de Stored Procedures**
```javascript
// Error del SP (código 1644)
if (error.original && error.original.errno === 1644) {
  return res.status(400).json({
    success: false,
    message: error.original.sqlMessage
  });
}
```

### **Errores Comunes**
- **1062** - Duplicate entry (registro duplicado)
- **1452** - Foreign key constraint (referencia no existe)
- **1406** - Data too long (dato excede longitud)
- **1644** - Error del trigger/SP (validación de negocio)

### **Validaciones Comunes**
```javascript
// Validar ID numérico
if (!id || isNaN(id)) {
  return res.status(400).json({
    success: false,
    error: 'ID es requerido y debe ser un número'
  });
}

// Validar campo obligatorio
if (!campo || campo.trim() === '') {
  return res.status(400).json({
    success: false,
    error: 'Campo es requerido'
  });
}

// Validar registro existe
const registro = await Modelo.findByPk(id);
if (!registro) {
  return res.status(404).json({
    success: false,
    error: 'Registro no encontrado'
  });
}
```

---

## 🔑 VARIABLES DE ENTORNO

### **Archivo `.env`**
```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=colegio
DB_PORT=3306

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura_aqui

# Puerto del servidor
PORT=4000

# Entorno
NODE_ENV=development
```

### **Uso en el Código**
```javascript
require('dotenv').config();

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

const jwtSecret = process.env.JWT_SECRET;
const port = process.env.PORT || 4000;
```

---

## 🚀 COMANDOS IMPORTANTES

### **Instalación**
```bash
cd backend
npm install
```

### **Iniciar Servidor**
```bash
npm start
# o
node src/app.js
```

### **Servidor en Desarrollo (con auto-reload)**
```bash
npm run dev
# o
nodemon src/app.js
```

---

## 📚 DOCUMENTOS RELACIONADOS

1. **RESUMEN_COMPLETO_PARA_API.md** - Documentación del sistema de calificaciones
2. **DOCUMENTACION_API_CALIFICACIONES_FRONTEND.md** - Guía para equipo de frontend
3. **SQL_INJECTION_FIXES.md** - Correcciones de seguridad SQL
4. **ERROR_HANDLING.md** - Manejo de errores
5. **AUTENTICACION_JWT.md** - Sistema de autenticación
6. **HELMET_SECURITY.md** - Configuración de seguridad
7. **RATE_LIMITING.md** - Limitación de peticiones

---

## 🎯 REGLAS DE NEGOCIO IMPORTANTES

### **Sistema de Calificaciones**
1. **Punteos por Unidad**: Zona (60 pts) + Final (40 pts) = 100 pts
2. **Aprobación**: >= 60 puntos por unidad, >= 60 promedio anual
3. **Unidades**: 4 por asignación, solo Unidad 1 activa por defecto
4. **Activación**: Solo si actividades suman EXACTAMENTE 60+40
5. **Calificaciones**: Se crean automáticamente al crear actividad (trigger)

### **Soft Delete**
- Los registros NO se eliminan físicamente
- Se marca `Estado = false`
- Las queries filtran por `Estado = true` por defecto

### **Unicidad**
- **Matrícula de alumno**: única en toda la base
- **Username**: único en tabla usuarios
- **Asignación**: única por (docente, curso, grado, sección, jornada, año)
- **Calificación**: única por (actividad, alumno)

---

## 🔍 DEBUGGING Y LOGS

### **Console.log Importantes**
```javascript
console.log('Ejecutando SP:', spName);
console.error('Error en controller:', error);
console.log('Query params:', req.query);
console.log('Body recibido:', req.body);
```

### **Verificar Token JWT**
```javascript
console.log('User del token:', req.user);
```

### **Ver Query de Sequelize**
```javascript
const [results] = await sequelize.query('QUERY', {
  logging: console.log  // Muestra la query en consola
});
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Al crear un nuevo endpoint:**
- [ ] Crear/actualizar modelo en `models/`
- [ ] Crear controlador en `controllers/`
- [ ] Crear archivo de rutas en `routes/`
- [ ] Registrar rutas en `routes/index.js`
- [ ] Agregar validaciones de entrada
- [ ] Agregar campos de auditoría (CreadoPor/ModificadoPor)
- [ ] Manejar errores apropiadamente
- [ ] Usar `replacements` en queries SQL (prevenir injection)
- [ ] Documentar en este archivo
- [ ] Probar en Insomnia/Postman

---

**Última actualización:** Enero 2025
**Versión del Proyecto:** 2.0
**Autor:** Equipo Backend - Sistema de Gestión Escolar
