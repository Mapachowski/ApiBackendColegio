const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosController'); // ✅ sube un nivel

// 🔹 Rutas para pagos
router.get('/meses-pagados/:idAlumno/:tipoPago/:cicloEscolar', pagosController.getMesesPagados);
router.get('/reporte', pagosController.getReportePagos);
router.get('/hoy', pagosController.getPagosHoy);
router.get('/insolventes', pagosController.getInsolventes);
router.get('/buscar', pagosController.buscarPagos);
router.get('/numero/:numeroRecibo', pagosController.getByNumeroRecibo);
router.get('/', pagosController.getAll);
router.get('/:id', pagosController.getById);
router.post('/', pagosController.create);
router.put('/:id', pagosController.update);
router.delete('/:id', pagosController.delete);

module.exports = router;
