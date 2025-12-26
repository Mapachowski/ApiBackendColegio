const express = require('express');
const router = express.Router();
const metodoPagoController = require('../controllers/metodoPagosController');

// Rutas para métodos de pago
router.get('/', metodoPagoController.getMetodosPago); // Obtener todos los métodos de pago (filtrados por Estado: true)
router.get('/:id', metodoPagoController.getMetodoPagoById); // Obtener un método de pago por ID
router.post('/', metodoPagoController.createMetodoPago); // Crear un nuevo método de pago
router.put('/:id', metodoPagoController.updateMetodoPago); // Actualizar un método de pago
router.delete('/:id', metodoPagoController.deleteMetodoPago); // Eliminar un método de pago (soft delete)

module.exports = router;