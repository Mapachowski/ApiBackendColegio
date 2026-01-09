# 📚 Documentación API - Gestión de Unidades

**Fecha:** 2024-12-23
**Backend API:** http://localhost:4000/api
**Autor:** Sistema de gestión escolar

---

## 🎯 Resumen General

Se implementó un sistema completo para gestionar las **4 unidades** que se crean automáticamente cuando se asigna un docente a un curso.

### Características principales:
- ✅ Las 4 unidades se crean automáticamente al crear una asignación
- ✅ Valores por defecto: **60 zona + 40 examen final = 100**
- ✅ Los valores son **configurables** (70/30, 90/10, 100/0, etc.)
- ✅ **Validación estricta**: La suma SIEMPRE debe ser 100
- ✅ Sistema para **cerrar una unidad y abrir la siguiente**
- ✅ Solo una unidad puede estar activa a la vez

---

## 📋 Endpoints Disponibles

### 1. Obtener unidades de una asignación
```http
GET /api/unidades/asignacion/:idAsignacion
```

**Descripción:** Retorna las 4 unidades de una asignación específica ordenadas por número.

**Parámetros:**
- `idAsignacion` (path) - ID de la asignación docente

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "IdUnidad": 1,
      "IdAsignacionDocente": 5,
      "NumeroUnidad": 1,
      "NombreUnidad": "Primera Unidad",
      "PunteoZona": "60.00",
      "PunteoFinal": "40.00",
      "Activa": 1,
      "Estado": 1,
      "CreadoPor": "admin",
      "FechaCreado": "2024-12-23T10:00:00.000Z",
      "ModificadoPor": null,
      "FechaModificado": null
    },
    {
      "IdUnidad": 2,
      "IdAsignacionDocente": 5,
      "NumeroUnidad": 2,
      "NombreUnidad": "Segunda Unidad",
      "PunteoZona": "60.00",
      "PunteoFinal": "40.00",
      "Activa": 0,
      "Estado": 1,
      "CreadoPor": "admin",
      "FechaCreado": "2024-12-23T10:00:00.000Z"
    },
    {
      "IdUnidad": 3,
      "IdAsignacionDocente": 5,
      "NumeroUnidad": 3,
      "NombreUnidad": "Tercera Unidad",
      "PunteoZona": "60.00",
      "PunteoFinal": "40.00",
      "Activa": 0,
      "Estado": 1
    },
    {
      "IdUnidad": 4,
      "IdAsignacionDocente": 5,
      "NumeroUnidad": 4,
      "NombreUnidad": "Cuarta Unidad",
      "PunteoZona": "60.00",
      "PunteoFinal": "40.00",
      "Activa": 0,
      "Estado": 1
    }
  ]
}
```

---

### 2. Actualizar punteos de una unidad
```http
PUT /api/unidades/:id/punteos
```

**Descripción:** Actualiza SOLO los valores de PunteoZona y PunteoFinal de una unidad.

**Parámetros:**
- `id` (path) - ID de la unidad a actualizar

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "PunteoZona": 70,
  "PunteoFinal": 30,
  "ModificadoPor": "admin"
}
```

**Ejemplos de configuraciones válidas:**
```json
// Opción 1: 60/40 (por defecto)
{ "PunteoZona": 60, "PunteoFinal": 40, "ModificadoPor": "admin" }

// Opción 2: 70/30
{ "PunteoZona": 70, "PunteoFinal": 30, "ModificadoPor": "admin" }

// Opción 3: 90/10
{ "PunteoZona": 90, "PunteoFinal": 10, "ModificadoPor": "admin" }

// Opción 4: 100/0 (solo zona, sin examen)
{ "PunteoZona": 100, "PunteoFinal": 0, "ModificadoPor": "admin" }

// Opción 5: 0/100 (solo examen final)
{ "PunteoZona": 0, "PunteoFinal": 100, "ModificadoPor": "admin" }
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "IdUnidad": 1,
    "IdAsignacionDocente": 5,
    "NumeroUnidad": 1,
    "NombreUnidad": "Primera Unidad",
    "PunteoZona": "70.00",
    "PunteoFinal": "30.00",
    "Activa": 1,
    "Estado": 1,
    "ModificadoPor": "admin",
    "FechaModificado": "2024-12-23T11:30:00.000Z"
  },
  "message": "Punteos actualizados: 70 zona + 30 examen final = 100"
}
```

**Respuesta de error (400):**
```json
{
  "success": false,
  "error": "La suma de PunteoZona (60) + PunteoFinal (50) debe ser exactamente 100. Suma actual: 110"
}
```

---

### 3. Cerrar unidad activa y abrir la siguiente
```http
POST /api/unidades/asignacion/:idAsignacion/cerrar-y-abrir
```

**Descripción:** Cierra la unidad actualmente activa y abre la siguiente automáticamente. Útil para avanzar al siguiente bimestre.

**Parámetros:**
- `idAsignacion` (path) - ID de la asignación docente

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "ModificadoPor": "admin"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Unidad 1 cerrada. Unidad 2 activada.",
  "data": {
    "unidadCerrada": {
      "IdUnidad": 1,
      "NumeroUnidad": 1,
      "Activa": 0,
      "FechaModificado": "2024-12-23T12:00:00.000Z"
    },
    "unidadAbierta": {
      "IdUnidad": 2,
      "NumeroUnidad": 2,
      "Activa": 1,
      "FechaModificado": "2024-12-23T12:00:00.000Z"
    }
  }
}
```

**Respuesta de error (404):**
```json
{
  "success": false,
  "error": "No hay ninguna unidad activa en esta asignación"
}
```

**Respuesta de error (400):**
```json
{
  "success": false,
  "error": "No existe una unidad siguiente. La unidad 4 es la última."
}
```

---

### 4. Activar una unidad específica
```http
PUT /api/unidades/:id/activar
```

**Descripción:** Activa una unidad específica manualmente (desactiva automáticamente la que estaba activa).

**Parámetros:**
- `id` (path) - ID de la unidad a activar

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "ModificadoPor": "admin"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Unidad activada exitosamente",
  "data": {
    "IdUnidad": 3,
    "Activa": 1,
    "ModificadoPor": "admin",
    "FechaModificado": "2024-12-23T13:00:00.000Z"
  }
}
```

---

### 5. Obtener una unidad específica
```http
GET /api/unidades/:id
```

**Descripción:** Obtiene los detalles de una unidad individual.

**Parámetros:**
- `id` (path) - ID de la unidad

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "IdUnidad": 1,
    "IdAsignacionDocente": 5,
    "NumeroUnidad": 1,
    "NombreUnidad": "Primera Unidad",
    "PunteoZona": "60.00",
    "PunteoFinal": "40.00",
    "Activa": 1,
    "Estado": 1,
    "CreadoPor": "admin",
    "FechaCreado": "2024-12-23T10:00:00.000Z"
  }
}
```

---

### 6. Actualizar una unidad (general)
```http
PUT /api/unidades/:id
```

**Descripción:** Actualiza cualquier campo de una unidad (nombre, punteos, etc.).

**Parámetros:**
- `id` (path) - ID de la unidad

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "NombreUnidad": "Unidad 1 - Matemáticas Avanzadas",
  "PunteoZona": 70,
  "PunteoFinal": 30,
  "ModificadoPor": "admin"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "IdUnidad": 1,
    "NombreUnidad": "Unidad 1 - Matemáticas Avanzadas",
    "PunteoZona": "70.00",
    "PunteoFinal": "30.00",
    "ModificadoPor": "admin",
    "FechaModificado": "2024-12-23T14:00:00.000Z"
  },
  "message": "Unidad actualizada exitosamente"
}
```

---

## 🎨 Flujo de Uso en el Frontend

### Escenario 1: Ver las unidades de un curso asignado

```javascript
// 1. Obtener las unidades
const response = await apiClient.get(`/unidades/asignacion/${idAsignacion}`);
const unidades = response.data.data;

// 2. Mostrar en una tabla o cards
unidades.forEach(unidad => {
  console.log(`Unidad ${unidad.NumeroUnidad}: ${unidad.NombreUnidad}`);
  console.log(`Configuración: ${unidad.PunteoZona} zona + ${unidad.PunteoFinal} final`);
  console.log(`Activa: ${unidad.Activa ? 'Sí' : 'No'}`);
});
```

---

### Escenario 2: Configurar punteos de una unidad

```javascript
// Ejemplo: Cambiar la Unidad 2 a 90/10
const idUnidad = 2;
const response = await apiClient.put(`/unidades/${idUnidad}/punteos`, {
  PunteoZona: 90,
  PunteoFinal: 10,
  ModificadoPor: user.NombreUsuario
});

if (response.data.success) {
  message.success(response.data.message);
}
```

---

### Escenario 3: Cerrar bimestre y abrir el siguiente

```javascript
// Al final del primer bimestre, cerrar Unidad 1 y abrir Unidad 2
const response = await apiClient.post(
  `/unidades/asignacion/${idAsignacion}/cerrar-y-abrir`,
  {
    ModificadoPor: user.NombreUsuario
  }
);

if (response.data.success) {
  message.success(response.data.message);
  // Recargar las unidades
}
```

---

### Escenario 4: Componente React para gestión de unidades

```jsx
import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, message } from 'antd';
import apiClient from '../api/apiClient';

const GestionUnidades = ({ idAsignacion }) => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    cargarUnidades();
  }, [idAsignacion]);

  const cargarUnidades = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/unidades/asignacion/${idAsignacion}`);
      setUnidades(response.data.data);
    } catch (error) {
      message.error('Error al cargar unidades');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalConfiguracion = (unidad) => {
    setUnidadSeleccionada(unidad);
    form.setFieldsValue({
      PunteoZona: parseFloat(unidad.PunteoZona),
      PunteoFinal: parseFloat(unidad.PunteoFinal),
    });
    setModalVisible(true);
  };

  const guardarConfiguracion = async (values) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await apiClient.put(`/unidades/${unidadSeleccionada.IdUnidad}/punteos`, {
        ...values,
        ModificadoPor: user.NombreUsuario,
      });
      message.success('Punteos actualizados correctamente');
      setModalVisible(false);
      cargarUnidades();
    } catch (error) {
      message.error(error.response?.data?.error || 'Error al actualizar');
    }
  };

  const cerrarYAbrirSiguiente = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await apiClient.post(
        `/unidades/asignacion/${idAsignacion}/cerrar-y-abrir`,
        { ModificadoPor: user.NombreUsuario }
      );
      message.success(response.data.message);
      cargarUnidades();
    } catch (error) {
      message.error(error.response?.data?.error || 'Error al cerrar unidad');
    }
  };

  const columns = [
    {
      title: 'Unidad',
      dataIndex: 'NumeroUnidad',
      render: (num) => `Unidad ${num}`,
    },
    {
      title: 'Nombre',
      dataIndex: 'NombreUnidad',
    },
    {
      title: 'Punteo Zona',
      dataIndex: 'PunteoZona',
      render: (val) => `${parseFloat(val)} pts`,
    },
    {
      title: 'Punteo Final',
      dataIndex: 'PunteoFinal',
      render: (val) => `${parseFloat(val)} pts`,
    },
    {
      title: 'Estado',
      dataIndex: 'Activa',
      render: (activa) => (
        <span style={{ color: activa ? 'green' : 'gray' }}>
          {activa ? '🟢 Activa' : '⚫ Cerrada'}
        </span>
      ),
    },
    {
      title: 'Acciones',
      render: (_, record) => (
        <Button onClick={() => abrirModalConfiguracion(record)}>
          Configurar Punteos
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={cerrarYAbrirSiguiente}>
          Cerrar unidad activa y abrir siguiente
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={unidades}
        loading={loading}
        rowKey="IdUnidad"
        pagination={false}
      />

      <Modal
        title="Configurar Punteos de Unidad"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={guardarConfiguracion} layout="vertical">
          <Form.Item
            label="Punteo Zona"
            name="PunteoZona"
            rules={[
              { required: true, message: 'Requerido' },
              {
                validator: (_, value) => {
                  const final = form.getFieldValue('PunteoFinal');
                  if (value + final !== 100) {
                    return Promise.reject('La suma debe ser 100');
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Punteo Final"
            name="PunteoFinal"
            rules={[
              { required: true, message: 'Requerido' },
              {
                validator: (_, value) => {
                  const zona = form.getFieldValue('PunteoZona');
                  if (zona + value !== 100) {
                    return Promise.reject('La suma debe ser 100');
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Guardar Configuración
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GestionUnidades;
```

---

## ⚠️ Validaciones Importantes

### 1. Suma de punteos = 100
```javascript
// SIEMPRE validar en el frontend antes de enviar
const zona = parseFloat(formValues.PunteoZona);
const final = parseFloat(formValues.PunteoFinal);

if (zona + final !== 100) {
  message.error('La suma de zona y final debe ser exactamente 100');
  return;
}
```

### 2. Solo una unidad activa
- El backend garantiza que solo una unidad esté activa a la vez
- Al activar una nueva, la anterior se cierra automáticamente

### 3. No se pueden eliminar unidades
- Las unidades solo se pueden desactivar (`Estado = 0`)
- No hay endpoint DELETE

---

## 🔒 Seguridad

Todos los endpoints requieren:
- **JWT Token** válido en el header `Authorization: Bearer <token>`
- Campo **`ModificadoPor`** en el body para auditoría

---

## 📌 Notas para el Frontend

1. **Mostrar unidad activa visualmente**: Usa un badge verde o highlight
2. **Validar suma = 100**: Implementa validación en tiempo real en los inputs
3. **Deshabilitar botón "Cerrar y Abrir"**: Si ya está en la Unidad 4
4. **Mostrar presets comunes**: Botones rápidos para 60/40, 70/30, 90/10, 100/0
5. **Confirmación antes de cerrar**: Modal de confirmación antes de `cerrar-y-abrir`

---

## 🚀 Próximos pasos sugeridos

1. Crear componente de gestión de unidades en el frontend
2. Agregar vista de unidades en el detalle de asignación
3. Implementar configuración rápida de punteos
4. Dashboard mostrando qué unidad está activa por curso

---

**Documento generado:** 2024-12-23
**Backend version:** 1.0.0
**Endpoints base:** http://localhost:4000/api
