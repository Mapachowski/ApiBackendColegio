const express = require('express');
const router = express.Router();
const alumnosController = require('../controllers/alumnosController'); // Importa el controlador

// Rutas para alumnos
// RUTAS ESPECÍFICAS PRIMERO
router.get('/existe-matricula', alumnosController.existeMatricula);
router.get('/siguiente-carnet', alumnosController.getSiguienteCarnet);
router.get('/alumnos-expulsados', alumnosController.getAlumnosExpulsados);
router.get('/', alumnosController.getAll);          // GET /api/alumnos

// Rutas con :id y paths específicos (ANTES de la ruta genérica :id)
router.get('/:id/cursos-actuales/:anio', alumnosController.getCursosActuales); // GET /api/alumnos/:id/cursos-actuales/:anio
router.get('/:id/inscripcion-actual/:anio', alumnosController.getInscripcionActual); // GET /api/alumnos/:id/inscripcion-actual/:anio
router.get('/:id/actividades/:anio', alumnosController.getTodasActividadesAlumno); // GET /api/alumnos/:id/actividades/:anio

router.get('/:id', alumnosController.getById);      // GET /api/alumnos/:id

router.post('/', alumnosController.create);         // POST /api/alumnos
router.put('/regresar-estudiante', alumnosController.regresarEstudiante); // PUT /api/alumnos/regresar-estudiante
router.put('/:id', alumnosController.update);       // PUT /api/alumnos/:id
router.delete('/:id', alumnosController.delete);    // DELETE /api/alumnos/:id


module.exports = router;