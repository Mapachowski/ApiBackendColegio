const express = require('express');
const router = express.Router();
const tipoPagoController = require('../controllers/tipoPagosController');

// Rutas para tipos de pago
router.get('/', tipoPagoController.getTiposPago); // Obtener todos los tipos de pago (filtrados por Estado: true)
router.get('/:id', tipoPagoController.getTipoPagoById); // Obtener un tipo de pago por ID
router.post('/', tipoPagoController.createTipoPago); // Crear un nuevo tipo de pago
router.put('/:id', tipoPagoController.updateTipoPago); // Actualizar un tipo de pago
router.delete('/:id', tipoPagoController.deleteTipoPago); // Eliminar un tipo de pago (soft delete)

module.exports = router;