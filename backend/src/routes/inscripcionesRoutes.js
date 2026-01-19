const express = require('express');
   const router = express.Router();
   const inscripcionController = require('../controllers/inscripcionesController');

   // Rutas para inscripciones
   // Rutas específicas PRIMERO
   router.get('/filtros', inscripcionController.getByFilters); // Filtrar por Grado, Seccion, Jornada
   router.get('/ya-inscrito', inscripcionController.yaInscrito);
   router.get('/buscar-alumno', inscripcionController.getByAlumnoAndCiclo); // Buscar por IdAlumno y CicloEscolar
   router.post('/cambiar-grupo', inscripcionController.cambiarGrupo); // Cambiar sección/jornada de un alumno
   router.post('/asignar-actividades', inscripcionController.asignarActividades); // Asignar actividades a alumno inscrito tarde

   // Rutas generales
   router.get('/', inscripcionController.getAll); // Todas las inscripciones
   router.get('/:id', inscripcionController.getById); // Obtener por ID
   router.post('/', inscripcionController.create); // Crear
   router.put('/:id', inscripcionController.update); // Actualizar
   router.delete('/:id', inscripcionController.delete); // Eliminar (soft delete)

   module.exports = router;