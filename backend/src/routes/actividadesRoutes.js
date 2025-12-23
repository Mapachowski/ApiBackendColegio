const express = require('express');
const router = express.Router();
const actividadesController = require('../controllers/actividadesController');

// Rutas específicas primero
router.get('/:id/calificaciones', actividadesController.getCalificaciones);

// Rutas generales
router.get('/:id', actividadesController.getById);
router.post('/', actividadesController.create);
router.put('/:id', actividadesController.update);
router.delete('/:id', actividadesController.delete);

module.exports = router;
