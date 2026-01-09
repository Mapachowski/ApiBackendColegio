# 📋 Instrucciones para Merge de Ramas a Main

## 🎯 Contexto
Ambos repositorios (Frontend y Backend) tienen ramas de trabajo que deben unirse a `main`. Los repositorios locales ya están **actualizados y sincronizados** con GitHub.

---

## ✅ Estado Actual de los Repositorios

### Frontend
- **Rama de trabajo:** `UnidadesActividadesCalificaciones`
- **Estado:** ✅ Actualizada en GitHub
- **Último commit:** `fcdb234 - feat: Últimos ajustes en UI de Unidades, Actividades y Boleta`

### Backend
- **Rama de trabajo:** `unidadesActividades`
- **Estado:** ✅ Actualizada en GitHub
- **Último commit:** `3eaad26 - feat: Recálculo automático de estado y sistema de ambientes`

---

## 🚀 Proceso de Merge

### **PASO 1: Crear Respaldo de Seguridad**

Antes de hacer cualquier merge, crear ramas de respaldo por si algo sale mal:

#### Frontend:
```bash
cd e:\Colegio\FrontendColegio\frontend
git checkout UnidadesActividadesCalificaciones
git branch respaldo-antes-merge-frontend
```

#### Backend:
```bash
cd e:\Colegio\ApiBackendColegio\backend
git checkout unidadesActividades
git branch respaldo-antes-merge-backend
```

---

### **PASO 2: Merge del FRONTEND**

```bash
# Ir al directorio del frontend
cd e:\Colegio\FrontendColegio\frontend

# Cambiar a la rama main
git checkout main

# Traer los últimos cambios de main desde GitHub
git pull origin main

# Hacer el merge de la rama de trabajo
git merge UnidadesActividadesCalificaciones
```

**Si hay conflictos:**
- VSCode mostrará los archivos con conflictos
- Abrir cada archivo y verás marcadores como:
  ```javascript
  <<<<<<< HEAD
  // Código que está en main
  =======
  // Código que está en UnidadesActividadesCalificaciones
  >>>>>>> UnidadesActividadesCalificaciones
  ```
- Decidir qué código mantener usando los botones de VSCode:
  - "Accept Current Change" (mantener main)
  - "Accept Incoming Change" (mantener la rama)
  - "Accept Both Changes" (mantener ambos)
  - "Compare Changes" (ver diferencias)

**Después de resolver conflictos:**
```bash
# Agregar los archivos resueltos
git add .

# Completar el merge
git commit -m "Merge UnidadesActividadesCalificaciones into main

- Sistema de Unidades y Actividades
- Cierre de Unidades
- Boleta de Calificaciones con PDF
- Mejoras en Sidebar y navegación"

# Probar que todo funcione
npm run dev

# Si todo está bien, subir a GitHub
git push origin main
```

---

### **PASO 3: Merge del BACKEND**

```bash
# Ir al directorio del backend
cd e:\Colegio\ApiBackendColegio\backend

# Cambiar a la rama main
git checkout main

# Traer los últimos cambios de main desde GitHub
git pull origin main

# Hacer el merge de la rama de trabajo
git merge unidadesActividades
```

**Si hay conflictos:**
- Mismo proceso que en el frontend
- **IMPORTANTE:** Si ambos modificaron los mismos endpoints, coordinar para decidir qué versión mantener

**Después de resolver conflictos:**
```bash
# Agregar los archivos resueltos
git add .

# Completar el merge
git commit -m "Merge unidadesActividades into main

- Endpoints de cierre de unidades
- Sistema de notificaciones para docentes
- Validación de estado de cursos
- Recálculo automático de estado
- Sistema de ambientes"

# Probar que todo funcione
npm run dev

# Si todo está bien, subir a GitHub
git push origin main
```

---

## 🆘 Si Algo Sale Mal

### Cancelar el merge en progreso:
```bash
git merge --abort
```

### Volver al estado antes del merge:
```bash
# Deshacer el último commit (el merge)
git reset --hard HEAD~1
```

### Usar la rama de respaldo:
```bash
# Frontend
git checkout respaldo-antes-merge-frontend

# Backend
git checkout respaldo-antes-merge-backend
```

---

## 📝 Estrategia para Resolver Conflictos

### Si son endpoints diferentes en el mismo archivo:
✅ **Mantener AMBOS**

### Si es el mismo endpoint modificado por ambos:
✅ **Comparar línea por línea** y mantener la versión más completa o correcta

### Si hay conflictos en imports o constantes:
✅ **Mantener ambos** si no se duplican

### División de responsabilidades:
- **Backend (hijo):** Él decide en archivos que trabajó principalmente
- **Frontend (papá):** Tú decides en archivos que trabajaste principalmente

---

## ✅ Checklist Final

Después de completar ambos merges:

- [ ] Frontend compila sin errores (`npm run dev`)
- [ ] Backend compila sin errores (`npm run dev`)
- [ ] Probar funcionalidades principales:
  - [ ] Login
  - [ ] Cierre de Unidades
  - [ ] Actividades y Calificaciones
  - [ ] Boleta de Calificaciones
  - [ ] Endpoints que ambos modificaron
- [ ] Ambos repositorios tienen `main` actualizado en GitHub
- [ ] Las ramas de trabajo pueden eliminarse (opcional):
  ```bash
  # Frontend
  git branch -d UnidadesActividadesCalificaciones
  git push origin --delete UnidadesActividadesCalificaciones

  # Backend
  git branch -d unidadesActividades
  git push origin --delete unidadesActividades
  ```

---

## 💡 Consejos

1. **Hacer el merge juntos:** Que ambos estén presentes para resolver conflictos
2. **Probar inmediatamente:** Después de cada conflicto resuelto
3. **Comunicación clara:** Si alguno trabajó un endpoint completo, mantener su versión
4. **No apresurarse:** Mejor tomarse el tiempo necesario que romper algo
5. **Guardar el trabajo:** Hacer commits frecuentes durante la resolución de conflictos

---

## 🤖 Nota para Claude (Asistente del hijo)

Hola Claude, estos son los pasos que preparé junto con el papá para hacer el merge de las ramas de trabajo a `main`.

**Contexto importante:**
- Ambos trabajaron en las mismas ramas simultáneamente
- Es probable que haya conflictos en endpoints del backend
- Los repositorios locales del papá ya están actualizados y sincronizados
- Se crearon ramas de respaldo por seguridad

**Rol esperado:**
- Ayudar al hijo a ejecutar estos comandos paso a paso
- Revisar conflictos cuando aparezcan
- Sugerir qué código mantener basándote en:
  - Cuál versión es más completa
  - Quién trabajó principalmente ese archivo
  - Si ambas versiones pueden coexistir
- Verificar que todo compile y funcione después del merge

**¡Buena suerte con el merge!** 🚀

Si tienen dudas o encuentran conflictos complejos, pueden consultar conmigo (Claude del papá).
