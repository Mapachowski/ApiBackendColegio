const express = require('express');
const router = express.Router();
const gradosController = require('../controllers/gradosController'); // Importa el controlador

// Rutas para grados
// NUEVA RUTA: costo por GradoId
router.get('/costo/:GradoId', gradosController.getCostoGrado);
router.get('/', gradosController.getAll);          // GET /api/grados
router.get('/:id', gradosController.getById);      // GET /api/grados/:id
router.post('/', gradosController.create);         // POST /api/grados
router.put('/:id', gradosController.update);       // PUT /api/grados/:id
router.delete('/:id', gradosController.delete);    // DELETE /api/grados/:id

module.exports = router;