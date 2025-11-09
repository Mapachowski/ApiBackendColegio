const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosController'); // ✅ sube un nivel

// 🔹 Rutas para pagos
router.get('/mesesPagados/:idAlumno/:tipoPago/:cicloEscolar', pagosController.getMesesPagados);
router.get('/', pagosController.getAll);
router.get('/:id', pagosController.getById);
router.get('/numero/:numeroRecibo', pagosController.getByNumeroRecibo);
router.post('/', pagosController.create);
router.put('/:id', pagosController.update);
router.delete('/:id', pagosController.delete);

module.exports = router;
