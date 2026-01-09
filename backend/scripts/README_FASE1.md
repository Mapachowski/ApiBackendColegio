# 🗄️ Scripts de Base de Datos - Fase 1: Cierre de Unidades

## 📁 Archivos en esta carpeta

1. **fase1_crear_tabla_notificaciones_docentes.sql** - Crea tabla de notificaciones
2. **fase1_crear_tabla_estado_cursos_unidad.sql** - Crea tabla de estado de cursos
3. **fase1_modificar_tabla_unidades.sql** - Agrega campos a tabla unidades
4. **fase1_datos_prueba.sql** - Datos de prueba (opcional)
5. **fase1_ejecutar_todo.sql** - Script maestro que ejecuta todo

---

## 🚀 Ejecución Rápida

### Opción 1: Ejecutar Todo (Recomendado)

```bash
cd E:\Colegio\ApiBackendColegio\backend\scripts
mysql -u root -p colegio_db < fase1_ejecutar_todo.sql
```

### Opción 2: Ejecutar Individual

```bash
mysql -u root -p colegio_db < fase1_crear_tabla_notificaciones_docentes.sql
mysql -u root -p colegio_db < fase1_crear_tabla_estado_cursos_unidad.sql
mysql -u root -p colegio_db < fase1_modificar_tabla_unidades.sql
```

---

## ✅ Verificación

```sql
-- Ver tablas creadas
SHOW TABLES LIKE '%notificaciones%';
SHOW TABLES LIKE '%estado%';

-- Ver columnas nuevas en unidades
DESCRIBE unidades;
```

---

## 📝 Notas

- ✅ Scripts son seguros: usan `IF NOT EXISTS`
- ✅ Se pueden re-ejecutar sin problemas
- ✅ Datos de prueba son opcionales
- ✅ Foreign keys configuradas correctamente

---

**Documentación completa**: Ver `FASE-1-IMPLEMENTACION-COMPLETADA.md` en carpeta ComunicacionBackFront
