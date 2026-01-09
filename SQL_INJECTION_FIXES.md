# Corrección de Vulnerabilidades SQL Injection

## ✅ Resumen de Cambios

Se corrigieron **todas las vulnerabilidades de SQL Injection** en la API, reemplazando la concatenación de strings con el sistema seguro de `replacements` de Sequelize.

---

## 🔴 Problema: SQL Injection

### ¿Qué es SQL Injection?

Es una vulnerabilidad donde un atacante puede inyectar código SQL malicioso a través de los parámetros de entrada.

### Ejemplo de ataque:

**Código vulnerable:**
```javascript
const query = `CALL sp_ListadoAlumnos('${cicloEscolar}')`;
```

**Input del atacante:**
```
cicloEscolar = "2026'); DROP TABLE alumnos; --"
```

**Query resultante:**
```sql
CALL sp_ListadoAlumnos('2026'); DROP TABLE alumnos; --')
```

**Resultado:** ¡La tabla `alumnos` sería eliminada! 💥

---

## ✅ Solución: Usar `replacements`

Sequelize proporciona un sistema de **parámetros preparados** que escapa automáticamente los valores y previene SQL injection.

### Sintaxis segura:

```javascript
// ❌ VULNERABLE
const query = `CALL sp_Ejemplo(${id}, '${nombre}')`;
await sequelize.query(query);

// ✅ SEGURO
await sequelize.query(
  'CALL sp_Ejemplo(:id, :nombre)',
  {
    replacements: {
      id: id,
      nombre: nombre
    }
  }
);
```

---

## 📝 Archivos Corregidos

### 1. **inscripcionesController.js**

#### Función: `getByFilters`
**Línea:** 85-96

**ANTES (vulnerable):**
```javascript
const query = `CALL colegio.sp_ListadoAlumnosPorInscripcion(
  '${p_CicloEscolar}',  // ⚠️ Vulnerable a SQL injection
  ${gradoId !== null ? gradoId : 'NULL'},
  ${seccionId !== null ? seccionId : 'NULL'},
  ${jornadaId !== null ? jornadaId : 'NULL'}
)`;
const results = await sequelize.query(query, {
  type: sequelize.QueryTypes.SELECT
});
```

**AHORA (seguro):**
```javascript
const results = await sequelize.query(
  'CALL colegio.sp_ListadoAlumnosPorInscripcion(:ciclo, :grado, :seccion, :jornada)',
  {
    replacements: {
      ciclo: p_CicloEscolar,
      grado: gradoId,
      seccion: seccionId,
      jornada: jornadaId
    },
    type: sequelize.QueryTypes.SELECT
  }
);
```

---

#### Función: `getByAlumnoAndCiclo`
**Línea:** 130-139

**ANTES (parcialmente vulnerable):**
```javascript
const escapedCicloEscolar = sequelize.escape(CicloEscolar);
const query = `CALL sp_BuscarAlumnoPorIdEnInscripcion(${alumnoId}, ${escapedCicloEscolar})`;
const results = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
```

**AHORA (seguro):**
```javascript
const results = await sequelize.query(
  'CALL sp_BuscarAlumnoPorIdEnInscripcion(:alumnoId, :ciclo)',
  {
    replacements: {
      alumnoId: alumnoId,
      ciclo: CicloEscolar
    },
    type: sequelize.QueryTypes.SELECT
  }
);
```

---

### 2. **gradosController.js**

#### Función: `getCostoGrado`
**Línea:** 61-66

**ANTES (vulnerable):**
```javascript
const [results] = await sequelize.query(`CALL sp_CostoGrado(${id})`);
```

**AHORA (seguro):**
```javascript
const [results] = await sequelize.query(
  'CALL sp_CostoGrado(:gradoId)',
  {
    replacements: { gradoId: id }
  }
);
```

---

### 3. **pagosController.js**

#### Función: `getMesesPagados`
**Línea:** 63-73

**ANTES (seguro pero mejorado):**
```javascript
const [results] = await sequelize.query(
  `CALL colegio.sp_MesesPagados(?, ?, ?)`,
  {
    replacements: [idAlumno, tipoPago, cicloEscolar],  // Array posicional
    type: Pago.sequelize.QueryTypes.SELECT
  }
);
```

**AHORA (más claro y mantenible):**
```javascript
const [results] = await sequelize.query(
  'CALL colegio.sp_MesesPagados(:idAlumno, :tipoPago, :cicloEscolar)',
  {
    replacements: {
      idAlumno: idAlumno,      // Objeto con nombres
      tipoPago: tipoPago,
      cicloEscolar: cicloEscolar
    },
    type: Pago.sequelize.QueryTypes.SELECT
  }
);
```

**Nota:** Este ya usaba `replacements` pero con sintaxis posicional `?`. Se mejoró para usar nombres explícitos que son más legibles.

---

### 4. **alumnosController.js**

#### Estado: ✅ Ya estaba seguro

- **Línea 49:** `CALL sp_SiguienteCarnet()` - Sin parámetros, no vulnerable
- **Líneas 76-82:** Ya usa `replacements` correctamente

```javascript
await sequelize.query(
  'CALL SP_ExisteMatricula(:matricula, @existe)',
  {
    replacements: { matricula },
    type: sequelize.QueryTypes.RAW
  }
);
```

---

## 🛡️ Beneficios de `replacements`

### 1. **Seguridad**
- Previene SQL Injection automáticamente
- Escapa caracteres especiales
- Valida tipos de datos

### 2. **Legibilidad**
```javascript
// ❌ Difícil de leer
const query = `CALL sp(${a}, '${b}', ${c})`;

// ✅ Claro y mantenible
await sequelize.query('CALL sp(:a, :b, :c)', {
  replacements: { a, b, c }
});
```

### 3. **Mantenibilidad**
- Fácil de modificar parámetros
- Fácil de debuggear
- Nombres descriptivos

---

## 📋 Tipos de `replacements`

### Opción 1: Nombres (Recomendado)
```javascript
await sequelize.query(
  'CALL sp(:nombre, :edad)',
  {
    replacements: {
      nombre: 'Juan',
      edad: 25
    }
  }
);
```

### Opción 2: Posiciones
```javascript
await sequelize.query(
  'CALL sp(?, ?)',
  {
    replacements: ['Juan', 25]  // Orden importa
  }
);
```

**Recomendación:** Usar nombres (`:parametro`) en lugar de posiciones (`?`) para mayor claridad.

---

## 🧪 Cómo probar que está seguro

### Intento de ataque (debe fallar):

```javascript
// Frontend malicioso intenta:
const ciclo = "2026'); DROP TABLE alumnos; --";

// La API recibe:
await sequelize.query(
  'CALL sp(:ciclo)',
  {
    replacements: { ciclo: ciclo }
  }
);

// Sequelize escapa automáticamente:
// CALL sp('2026\'); DROP TABLE alumnos; --')
// ✅ Se trata como STRING, no como código SQL
```

---

## 📊 Resumen de Vulnerabilidades Corregidas

| Archivo | Función | Línea | Severidad | Estado |
|---------|---------|-------|-----------|--------|
| inscripcionesController.js | getByFilters | 85-96 | 🔴 CRÍTICA | ✅ Corregido |
| inscripcionesController.js | getByAlumnoAndCiclo | 130-139 | 🟡 MEDIA | ✅ Corregido |
| gradosController.js | getCostoGrado | 61-66 | 🔴 CRÍTICA | ✅ Corregido |
| pagosController.js | getMesesPagados | 63-73 | 🟢 YA SEGURO | ✅ Mejorado |
| alumnosController.js | - | - | 🟢 YA SEGURO | ✅ Sin cambios |

---

## ✅ Checklist de Seguridad SQL

Cuando agregues nuevas queries, verifica:

- [ ] ¿Usa `replacements` en lugar de concatenación?
- [ ] ¿Los parámetros tienen nombres descriptivos?
- [ ] ¿Se validan los tipos de datos antes de la query?
- [ ] ¿No hay interpolación de strings con `` `${variable}` ``?
- [ ] ¿No usa `sequelize.escape()` manualmente?

---

## 🎯 Próximas Mejoras Recomendadas

1. **Rate Limiting** - Prevenir fuerza bruta
2. **Helmet.js** - Headers de seguridad HTTP
3. **Validación de roles** - Controlar acceso basado en permisos
4. **Logging de auditoría** - Registrar operaciones críticas
5. **Cambiar credenciales** - DB_PASS y JWT_SECRET más seguros

---

## 📚 Referencias

- [Sequelize Raw Queries](https://sequelize.org/docs/v6/core-concepts/raw-queries/)
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [Sequelize Replacements](https://sequelize.org/docs/v6/core-concepts/raw-queries/#replacements)
