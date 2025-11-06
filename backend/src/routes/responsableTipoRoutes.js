const express = require('express');
const router = express.Router();
const responsableTipoController = require('../controllers/responsableTipoController');

// GET /api/responsable-tipo
router.get('/', responsableTipoController.getAll);

module.exports = router;