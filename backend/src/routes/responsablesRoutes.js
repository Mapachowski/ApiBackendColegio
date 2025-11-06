const express = require('express');
const router = express.Router();
const responsablesController = require('../controllers/responsablesController'); // Importa el controlador

// Rutas para responsables
router.get('/', responsablesController.getAll);          // GET /api/responsables
router.get('/:id', responsablesController.getById);      // GET /api/responsables/:id
router.post('/', responsablesController.create);         // POST /api/responsables
router.put('/:id', responsablesController.update);       // PUT /api/responsables/:id
router.delete('/:id', responsablesController.delete);    // DELETE /api/responsables/:id

module.exports = router;