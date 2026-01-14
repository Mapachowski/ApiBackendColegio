/**
 * Script para limpiar registros duplicados en estado_cursos_unidad
 * y dejar solo uno por cada combinación IdUnidad + IdCurso
 */

require('dotenv').config();
const sequelize = require('./src/config/database');

async function limpiarDuplicados() {
  console.log('\n🔍 Buscando duplicados en estado_cursos_unidad...\n');

  try {
    const transaction = await sequelize.transaction();

    try {
      // 1. Encontrar duplicados
      const [duplicados] = await sequelize.query(`
        SELECT IdUnidad, IdCurso, COUNT(*) as total, GROUP_CONCAT(IdEstado) as ids
        FROM estado_cursos_unidad
        GROUP BY IdUnidad, IdCurso
        HAVING COUNT(*) > 1
      `, { transaction });

      if (duplicados.length === 0) {
        console.log('✅ No se encontraron duplicados');
        await transaction.commit();
        return;
      }

      console.log(`⚠️  Encontrados ${duplicados.length} grupos de duplicados:\n`);
      duplicados.forEach(dup => {
        console.log(`   - IdUnidad: ${dup.IdUnidad}, IdCurso: ${dup.IdCurso} → ${dup.total} registros (IDs: ${dup.ids})`);
      });

      // 2. Para cada grupo, mantener el más reciente y eliminar los demás
      let totalEliminados = 0;
      for (const dup of duplicados) {
        // Obtener el IdEstado más alto (más reciente)
        const [registros] = await sequelize.query(`
          SELECT IdEstado FROM estado_cursos_unidad
          WHERE IdUnidad = ? AND IdCurso = ?
          ORDER BY IdEstado DESC
        `, {
          replacements: [dup.IdUnidad, dup.IdCurso],
          transaction
        });

        // Mantener el primero (más reciente), eliminar los demás
        const mantener = registros[0].IdEstado;
        const eliminar = registros.slice(1).map(r => r.IdEstado);

        await sequelize.query(`
          DELETE FROM estado_cursos_unidad
          WHERE IdEstado IN (${eliminar.join(',')})
        `, { transaction });

        totalEliminados += eliminar.length;
        console.log(`   ✓ Mantenido IdEstado ${mantener}, eliminados: ${eliminar.join(', ')}`);
      }

      await transaction.commit();

      console.log(`\n✅ Limpieza completada:`);
      console.log(`   - Registros duplicados eliminados: ${totalEliminados}`);
      console.log(`   - Grupos de duplicados resueltos: ${duplicados.length}`);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error al limpiar duplicados:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

limpiarDuplicados();
