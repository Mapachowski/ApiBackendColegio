# 📚 ANÁLISIS: Endpoints para Módulo Aula del Estudiante

## ✅ LO QUE YA EXISTE

### **1. Inscripciones del Alumno**
```javascript
// ✅ EXISTE
GET /api/inscripciones/buscar-alumno?idAlumno=1234&cicloEscolar=2026
```

**Respuesta actual:**
```json
{
  "success": true,
  "data": {
    "IdInscripcion": 1,
    "IdAlumno": 1234,
    "IdGrado": 5,
    "IdSeccion": 2,
    "IdJornada": 1,
    "CicloEscolar": "2026",
    "Estado": true
  }
}
```

### **2. Estructura de Actividades**
```javascript
// ✅ EXISTE - Modelo completo
{
  "IdActividad": 1,
  "IdUnidad": 5,
  "NombreActividad": "Tarea de Matemáticas",
  "Descripcion": "Resolver ejercicios...",
  "PunteoMaximo": 15.00,
  "TipoActividad": "zona",  // o "final"
  "FechaActividad": "2025-12-25",
  "Estado": true,
  "CreadoPor": "emilio.aragon",
  "FechaCreado": "2025-12-20T10:00:00.000Z",
  "ModificadoPor": null,
  "FechaModificado": null
}
```

### **3. Actividades por ID**
```javascript
// ✅ EXISTE
GET /api/actividades/:id
GET /api/actividades/:id/calificaciones
```

---

## ❌ LO QUE FALTA IMPLEMENTAR

### **1. Endpoint: Cursos del Estudiante** ⚠️ FALTA
```javascript
// ❌ NO EXISTE - NECESITA IMPLEMENTARSE
GET /api/alumnos/:idAlumno/cursos?anio=2026

// Alternativa actual (requiere múltiples calls):
// 1. GET /api/inscripciones/buscar-alumno?idAlumno=X&cicloEscolar=2026
// 2. Extraer: IdGrado, IdSeccion, IdJornada
// 3. GET /api/asignaciones?idGrado=X&idSeccion=Y&idJornada=Z&anio=2026
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "IdAsignacionDocente": 1,
      "IdCurso": 18,
      "NombreCurso": "Matemáticas",
      "IdDocente": 5,
      "NombreDocente": "Emilio Aragón",
      "IdGrado": 5,
      "NombreGrado": "Quinto Primaria",
      "IdSeccion": 1,
      "NombreSeccion": "A",
      "IdJornada": 1,
      "NombreJornada": "Matutina",
      "Anio": 2026
    }
  ]
}
```

---

### **2. Endpoint: Actividades por Asignación** ⚠️ FALTA
```javascript
// ❌ NO EXISTE - NECESITA IMPLEMENTARSE
GET /api/asignaciones/:idAsignacion/actividades

// o mejor aún para el alumno:
GET /api/asignaciones/:idAsignacion/actividades-alumno?idAlumno=1234
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "IdActividad": 1,
      "NombreActividad": "Tarea 1 - Suma y Resta",
      "Descripcion": "Ejercicios básicos",
      "PunteoMaximo": 15.00,
      "TipoActividad": "zona",
      "FechaActividad": "2025-12-25",
      "IdUnidad": 5,
      "NumeroUnidad": 1,
      "NombreUnidad": "Unidad 1",
      // Si incluye calificación del alumno:
      "IdCalificacion": 123,
      "Punteo": 14.50,
      "Observaciones": "Muy bien"
    }
  ]
}
```

---

### **3. Endpoint: Inscripción Actual del Alumno** ⚠️ FALTA
```javascript
// ❌ NO EXISTE - NECESITA IMPLEMENTARSE
GET /api/alumnos/:idAlumno/inscripcion-actual

// Actualmente existe:
GET /api/inscripciones/buscar-alumno?idAlumno=1234&cicloEscolar=2026
// Pero requiere saber el ciclo escolar
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "IdInscripcion": 1,
    "IdAlumno": 1234,
    "Matricula": "2026-001",
    "NombreCompleto": "Juan Pérez",
    "IdGrado": 5,
    "NombreGrado": "Quinto Primaria",
    "IdSeccion": 1,
    "NombreSeccion": "A",
    "IdJornada": 1,
    "NombreJornada": "Matutina",
    "CicloEscolar": "2026",
    "Estado": true
  }
}
```

---

### **4. Endpoint: Obtener IdAlumno del Usuario Logueado** ⚠️ FALTA
```javascript
// ❌ NO EXISTE - NECESITA IMPLEMENTARSE
GET /api/auth/me
// o
GET /api/usuarios/perfil

// JWT actual solo tiene:
{
  IdUsuario: 5,
  NombreUsuario: "juan.perez",
  NombreCompleto: "Juan Pérez",
  IdRol: 4  // Rol de estudiante
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "IdUsuario": 5,
    "NombreUsuario": "juan.perez",
    "NombreCompleto": "Juan Pérez",
    "IdRol": 4,
    "NombreRol": "Estudiante",
    // NUEVO:
    "IdAlumno": 1234,  // ← ESTE ES EL DATO CLAVE
    "Matricula": "2026-001"
  }
}
```

---

### **5. Endpoint: Filtrar Asignaciones** ⚠️ PARCIALMENTE EXISTE
```javascript
// ✅ EXISTE pero no está documentado en routes
GET /api/asignaciones/filtrar?anio=2026&idGrado=5&idSeccion=1&idJornada=1&idDocente=5

// Se usa el SP: sp_filtrar_asignaciones
```

---

## 🛠️ ENDPOINTS A IMPLEMENTAR

### **Prioridad Alta (Necesarios para Aula del Estudiante)**

#### **1. GET /api/alumnos/:idAlumno/cursos-actuales**
```javascript
// Retorna los cursos del alumno basado en su inscripción actual
exports.getCursosActuales = async (req, res) => {
  try {
    const { idAlumno } = req.params;
    const { anio } = req.query; // Opcional, si no se pasa, usa año actual

    // 1. Obtener inscripción del alumno
    const inscripcion = await Inscripcion.findOne({
      where: {
        IdAlumno: idAlumno,
        CicloEscolar: anio || new Date().getFullYear(),
        Estado: true
      }
    });

    if (!inscripcion) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró inscripción activa para este alumno'
      });
    }

    // 2. Obtener asignaciones (cursos) del grado/sección/jornada
    const [results] = await sequelize.query(
      `SELECT
        ad.IdAsignacionDocente,
        ad.IdCurso,
        c.Curso as NombreCurso,
        c.NoOrden,
        ad.IdDocente,
        d.NombreDocente,
        g.IdGrado,
        g.NombreGrado,
        s.IdSeccion,
        s.NombreSeccion,
        j.IdJornada,
        j.NombreJornada,
        ad.Anio
      FROM asignacion_docente ad
      INNER JOIN cursos c ON ad.IdCurso = c.idCurso
      INNER JOIN docentes d ON ad.IdDocente = d.idDocente
      INNER JOIN grados g ON ad.IdGrado = g.IdGrado
      INNER JOIN secciones s ON ad.IdSeccion = s.IdSeccion
      INNER JOIN jornadas j ON ad.IdJornada = j.IdJornada
      WHERE ad.IdGrado = ?
        AND ad.IdSeccion = ?
        AND ad.IdJornada = ?
        AND ad.Anio = ?
        AND ad.Estado = 1
      ORDER BY c.NoOrden`,
      {
        replacements: [
          inscripcion.IdGrado,
          inscripcion.IdSeccion,
          inscripcion.IdJornada,
          inscripcion.CicloEscolar
        ]
      }
    );

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

#### **2. GET /api/asignaciones/:idAsignacion/actividades-alumno**
```javascript
exports.getActividadesConCalificaciones = async (req, res) => {
  try {
    const { idAsignacion } = req.params;
    const { idAlumno } = req.query;

    if (!idAlumno) {
      return res.status(400).json({
        success: false,
        error: 'idAlumno es requerido en query params'
      });
    }

    const [results] = await sequelize.query(
      `SELECT
        a.IdActividad,
        a.NombreActividad,
        a.Descripcion,
        a.PunteoMaximo,
        a.TipoActividad,
        a.FechaActividad,
        u.IdUnidad,
        u.NumeroUnidad,
        u.NombreUnidad,
        u.Activa as UnidadActiva,
        c.IdCalificacion,
        c.Punteo,
        c.Observaciones
      FROM actividades a
      INNER JOIN unidades u ON a.IdUnidad = u.IdUnidad
      LEFT JOIN calificaciones c ON a.IdActividad = c.IdActividad AND c.IdAlumno = ?
      WHERE u.IdAsignacionDocente = ?
        AND a.Estado = 1
      ORDER BY u.NumeroUnidad, a.FechaActividad`,
      {
        replacements: [idAlumno, idAsignacion]
      }
    );

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

#### **3. GET /api/alumnos/:idAlumno/inscripcion-actual**
```javascript
exports.getInscripcionActual = async (req, res) => {
  try {
    const { idAlumno } = req.params;
    const anioActual = new Date().getFullYear();

    const inscripcion = await Inscripcion.findOne({
      where: {
        IdAlumno: idAlumno,
        CicloEscolar: anioActual.toString(),
        Estado: true
      },
      include: [
        { model: Alumno, attributes: ['IdAlumno', 'Matricula', 'Nombres', 'Apellidos'] },
        { model: Grado, attributes: ['IdGrado', 'NombreGrado'] },
        { model: Seccion, attributes: ['IdSeccion', 'NombreSeccion'] },
        { model: Jornada, attributes: ['IdJornada', 'NombreJornada'] },
      ],
    });

    if (!inscripcion) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró inscripción activa para el año actual'
      });
    }

    res.json({ success: true, data: inscripcion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

#### **4. GET /api/auth/perfil**
```javascript
// En loginController.js o crear authController.js
exports.getPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.user.IdUsuario, {
      include: [
        { model: Rol, attributes: ['IdRol', 'NombreRol'] }
      ],
      attributes: ['IdUsuario', 'NombreUsuario', 'NombreCompleto', 'IdRol']
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Buscar si es alumno
    const alumno = await Alumno.findOne({
      where: { IdUsuario: req.user.IdUsuario },
      attributes: ['IdAlumno', 'Matricula']
    });

    // Buscar si es docente
    const docente = await Docente.findOne({
      where: { idUsuario: req.user.IdUsuario },
      attributes: ['idDocente', 'NombreDocente']
    });

    const perfil = {
      ...usuario.toJSON(),
      IdAlumno: alumno ? alumno.IdAlumno : null,
      Matricula: alumno ? alumno.Matricula : null,
      IdDocente: docente ? docente.idDocente : null,
    };

    res.json({ success: true, data: perfil });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

---

## 📋 RESUMEN DE IMPLEMENTACIÓN

### **Archivos a Modificar:**

1. **backend/src/controllers/alumnosController.js**
   - Agregar `getCursosActuales`
   - Agregar `getInscripcionActual`

2. **backend/src/controllers/asignacionesController.js**
   - Agregar `getActividadesConCalificaciones`

3. **backend/src/controllers/loginController.js** (o crear `authController.js`)
   - Agregar `getPerfil`

4. **backend/src/routes/alumnosRoutes.js**
   - Agregar `GET /:id/cursos-actuales`
   - Agregar `GET /:id/inscripcion-actual`

5. **backend/src/routes/asignacionesRoutes.js**
   - Agregar `GET /:id/actividades-alumno`

6. **backend/src/routes/loginRoutes.js** (o crear `authRoutes.js`)
   - Agregar `GET /perfil`

---

## 🎯 FLUJO COMPLETO PARA EL FRONTEND

### **1. Login y Obtener Perfil**
```javascript
// 1. Login
POST /api/login
{
  "nombreUsuario": "juan.perez",
  "contrasena": "password123"
}

// Response: { token: "..." }

// 2. Obtener perfil completo
GET /api/auth/perfil
// Response: { IdUsuario, NombreUsuario, IdRol, IdAlumno, Matricula }
```

### **2. Obtener Inscripción Actual**
```javascript
GET /api/alumnos/1234/inscripcion-actual
// Response: { IdInscripcion, IdGrado, IdSeccion, IdJornada, CicloEscolar }
```

### **3. Obtener Cursos del Estudiante**
```javascript
GET /api/alumnos/1234/cursos-actuales?anio=2026
// Response: [{ IdAsignacionDocente, NombreCurso, NombreDocente, ... }]
```

### **4. Obtener Actividades de un Curso**
```javascript
GET /api/asignaciones/5/actividades-alumno?idAlumno=1234
// Response: [{ IdActividad, NombreActividad, Punteo, ... }]
```

### **5. Ver Calificaciones**
```javascript
GET /api/calificaciones/alumno/1234?unidad=1
// Response: Calificaciones por unidad
```

---

## ✅ RUTA SUGERIDA PARA EL MÓDULO

```javascript
// En React Router:
/dashboard/aula
  /dashboard/aula/cursos              // Lista de cursos
  /dashboard/aula/curso/:idCurso      // Detalle del curso
  /dashboard/aula/actividad/:idActividad  // Detalle de actividad
  /dashboard/aula/calificaciones      // Ver mis calificaciones
```

---

## 🔐 SEGURIDAD IMPORTANTE

### **Validar que el alumno solo vea SUS datos:**
```javascript
// En el controlador:
const { idAlumno } = req.params;
const alumnoDelToken = req.user.IdAlumno; // Del JWT

if (parseInt(idAlumno) !== parseInt(alumnoDelToken)) {
  return res.status(403).json({
    success: false,
    error: 'No tienes permiso para ver estos datos'
  });
}
```

---

## 📝 SIGUIENTE PASO

¿Quieres que implemente estos 4 endpoints nuevos?

1. `GET /api/alumnos/:idAlumno/cursos-actuales`
2. `GET /api/asignaciones/:idAsignacion/actividades-alumno`
3. `GET /api/alumnos/:idAlumno/inscripcion-actual`
4. `GET /api/auth/perfil`

Solo dime y los creo todos con sus validaciones y pruebas. 😊
