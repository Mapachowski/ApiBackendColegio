const express = require('express');
const router = express.Router();
const familiasController = require('../controllers/familiasController'); // Importa el controlador

// Rutas para familias
router.get('/completas', familiasController.getFamiliasCompletas);  // GET /api/familias/completas
router.get('/', familiasController.getAll);          // GET /api/familias
router.get('/:id', familiasController.getById);      // GET /api/familias/:id
router.post('/', familiasController.create);         // POST /api/familias
router.put('/:id', familiasController.update);       // PUT /api/familias/:id
router.delete('/:id', familiasController.delete);    // DELETE /api/familias/:id

module.exports = router;