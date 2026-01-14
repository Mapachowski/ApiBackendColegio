/**
 * Script para recalcular los estados de cursos de una unidad específica
 * Útil después de calificar actividades para actualizar el estado
 */

require('dotenv').config();
const sequelize = require('./src/config/database');
const cierreUnidadesController = require('./src/controllers/cierreUnidadesController');

async function recalcularEstados() {
  const numeroUnidad = process.argv[2] || 1;

  console.log(`\n🔄 Recalculando estados de cursos para Unidad ${numeroUnidad}...\n`);

  try {
    // Obtener todas las unidades con ese número
    const [unidades] = await sequelize.query(`
      SELECT IdUnidad, NombreUnidad, IdAsignacionDocente
      FROM unidades
      WHERE NumeroUnidad = ? AND Estado = 1 AND Activa = 1
    `, { replacements: [numeroUnidad] });

    if (unidades.length === 0) {
      console.log(`⚠️  No se encontraron unidades activas con número ${numeroUnidad}`);
      return;
    }

    console.log(`📋 Encontradas ${unidades.length} unidades activas\n`);

    let totalActualizados = 0;

    for (const unidad of unidades) {
      console.log(`⚙️  Procesando: ${unidad.NombreUnidad} (ID: ${unidad.IdUnidad})`);

      // Obtener el curso y docente de la asignación
      const [asignacion] = await sequelize.query(`
        SELECT IdCurso, IdDocente FROM asignacion_docente WHERE IdAsignacionDocente = ?
      `, { replacements: [unidad.IdAsignacionDocente] });

      if (!asignacion || asignacion.length === 0) {
        console.log(`   ⚠️  No se encontró asignación`);
        continue;
      }

      const { IdCurso, IdDocente } = asignacion[0];

      // Llamar a la función de recálculo
      try {
        await cierreUnidadesController.recalcularEstadoCursoSilencioso(
          unidad.IdUnidad,
          IdCurso,
          IdDocente
        );

        console.log(`   ✅ Estado actualizado\n`);
        totalActualizados++;
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    console.log(`✅ Recálculo completado:`);
    console.log(`   - Unidades procesadas: ${unidades.length}`);
    console.log(`   - Estados actualizados: ${totalActualizados}\n`);

  } catch (error) {
    console.error('❌ Error al recalcular estados:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

recalcularEstados();
