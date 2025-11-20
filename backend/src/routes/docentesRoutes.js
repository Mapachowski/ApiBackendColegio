const express = require('express');
const router = express.Router();

const DocentesController = require('../controllers/docentesController');

router.get('/', DocentesController.getAll);
router.get('/:id', DocentesController.getById);
router.post('/', DocentesController.create);
router.put('/:id', DocentesController.update);
router.delete('/:id', DocentesController.delete);

module.exports = router;

