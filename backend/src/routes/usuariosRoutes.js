const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController'); // Importa el controlador

// Rutas para usuarios
router.get('/', usuariosController.getAll);          // GET /api/usuarios
router.get('/:id', usuariosController.getById);      // GET /api/usuarios/:id
router.post('/', usuariosController.create);         // POST /api/usuarios
router.put('/:id', usuariosController.update);       // PUT /api/usuarios/:id
router.delete('/:id', usuariosController.delete);    // DELETE /api/usuarios/:id

module.exports = router;