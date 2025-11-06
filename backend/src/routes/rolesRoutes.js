const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rolesController');

// Rutas para roles
router.get('/', rolController.getRoles); // Obtener todos los roles (filtrados por Estado: true)
router.get('/:id', rolController.getRolById); // Obtener un rol por ID
router.post('/', rolController.createRol); // Crear un nuevo rol
router.put('/:id', rolController.updateRol); // Actualizar un rol
router.delete('/:id', rolController.deleteRol); // Eliminar un rol (soft delete)

module.exports = router;