/**
 * Script temporal para calcular TODAS las notas_unidad existentes
 * Ejecutar una sola vez después de agregar el cálculo automático
 */

const sequelize = require('./src/config/database');
const notasUnidadController = require('./src/controllers/notasUnidadController');
const Unidad = require('./src/models/Unidad');
const { QueryTypes } = require('sequelize');

async function calcularTodasLasNotas() {
  try {
    console.log('🚀 Iniciando cálculo de TODAS las notas_unidad...\n');

    // Obtener todas las unidades con actividades
    const [unidadesConActividades] = await sequelize.query(`
      SELECT DISTINCT
        a.IdUnidad,
        u.NumeroUnidad,
        u.NombreUnidad,
        u.IdAsignacionDocente
      FROM actividades a
      INNER JOIN unidades u ON a.IdUnidad = u.IdUnidad
      WHERE a.Estado = 1 AND u.Estado = 1
      ORDER BY a.IdUnidad
    `);

    console.log(`📊 Total de unidades con actividades: ${unidadesConActividades.length}`);

    let totalProcesados = 0;
    let totalErrores = 0;

    for (const unidadInfo of unidadesConActividades) {
      const { IdUnidad, NumeroUnidad, NombreUnidad, IdAsignacionDocente } = unidadInfo;

      console.log(`\n📖 Procesando ${NombreUnidad} (ID: ${IdUnidad})...`);

      try {
        // Obtener la unidad completa
        const unidad = await Unidad.findByPk(IdUnidad);

        if (!unidad) {
          console.log(`  ⚠️  Unidad ${IdUnidad} no encontrada`);
          continue;
        }

        // Obtener todos los alumnos que tienen calificaciones en esta unidad
        const [alumnosConCalificaciones] = await sequelize.query(`
          SELECT DISTINCT c.IdAlumno
          FROM calificaciones c
          INNER JOIN actividades a ON c.IdActividad = a.IdActividad
          WHERE a.IdUnidad = :idUnidad
          ORDER BY c.IdAlumno
        `, {
          replacements: { idUnidad: IdUnidad }
        });

        console.log(`  👥 Alumnos con calificaciones: ${alumnosConCalificaciones.length}`);

        let procesados = 0;
        let errores = 0;

        // Calcular nota para cada alumno
        for (const { IdAlumno } of alumnosConCalificaciones) {
          try {
            await notasUnidadController.calcularNotaAlumnoInterno(
              IdUnidad,
              IdAlumno,
              unidad,
              null  // null en lugar de 'Sistema' porque RegistradoPor es INT
            );
            procesados++;
          } catch (error) {
            console.error(`  ❌ Error al calcular nota del alumno ${IdAlumno}:`, error.message);
            errores++;
          }
        }

        console.log(`  ✅ Procesados: ${procesados} | ❌ Errores: ${errores}`);
        totalProcesados += procesados;
        totalErrores += errores;

      } catch (error) {
        console.error(`  ❌ Error al procesar unidad ${IdUnidad}:`, error.message);
        totalErrores++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(60));
    console.log(`✅ Total notas calculadas: ${totalProcesados}`);
    console.log(`❌ Total errores: ${totalErrores}`);
    console.log('='.repeat(60));
    console.log('\n🎉 Proceso completado!');

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Ejecutar
calcularTodasLasNotas();
