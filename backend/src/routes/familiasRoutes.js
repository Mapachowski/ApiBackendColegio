const express = require('express');
const router = express.Router();
const familiasController = require('../controllers/familiasController'); // Importa el controlador

// Rutas específicas PRIMERO (antes de las rutas con :id)
router.get('/completas', familiasController.getFamiliasCompletas);  // GET /api/familias/completas
router.get('/hijosporfamilia/:idFamilia', familiasController.getHijosPorFamilia);  // GET /api/familias/hijosporfamilia/:idFamilia
router.get('/hijo/:idAlumno/cursos-detallados', familiasController.getCursosDetalladosHijo);  // GET /api/familias/hijo/:idAlumno/cursos-detallados

// Rutas generales
router.get('/', familiasController.getAll);          // GET /api/familias
router.get('/:id', familiasController.getById);      // GET /api/familias/:id
router.post('/', familiasController.create);         // POST /api/familias
router.put('/:id', familiasController.update);       // PUT /api/familias/:id
router.delete('/:id', familiasController.delete);    // DELETE /api/familias/:id

module.exports = router;