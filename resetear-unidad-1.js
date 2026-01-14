/**
 * Script para resetear la Unidad 1 (o cualquier unidad) y dejarla lista para pruebas
 *
 * QUÉ HACE:
 * 1. Limpia las notas consolidadas de la tabla notas_unidad
 * 2. Reabre las unidades (marca Cerrada = false)
 * 3. Resetea el estado de cursos a PENDIENTE
 * 4. Limpia notificaciones enviadas
 *
 * QUÉ NO HACE:
 * - NO elimina las calificaciones individuales (tabla calificaciones)
 * - NO elimina las actividades creadas
 * - NO modifica la estructura de unidades
 */

require('dotenv').config();
const sequelize = require('./src/config/database');

async function resetearUnidad() {
  const numeroUnidad = process.argv[2] || 1; // Por defecto unidad 1

  console.log(`\n🔄 Reseteando todas las unidades con número ${numeroUnidad}...\n`);

  try {
    // Iniciar transacción
    const transaction = await sequelize.transaction();

    try {
      // 1. Obtener IDs de todas las unidades con ese número
      const [unidades] = await sequelize.query(`
        SELECT IdUnidad, NombreUnidad
        FROM unidades
        WHERE NumeroUnidad = ? AND Estado = 1
      `, {
        replacements: [numeroUnidad],
        transaction
      });

      if (unidades.length === 0) {
        console.log(`⚠️  No se encontraron unidades con número ${numeroUnidad}`);
        await transaction.rollback();
        return;
      }

      console.log(`📋 Encontradas ${unidades.length} unidades:`);
      unidades.forEach(u => console.log(`   - ${u.NombreUnidad} (ID: ${u.IdUnidad})`));
      console.log('');

      const idsUnidades = unidades.map(u => u.IdUnidad);

      // 2. Limpiar notas consolidadas (notas_unidad)
      const [resultNotas] = await sequelize.query(`
        DELETE FROM notas_unidad
        WHERE IdUnidad IN (${idsUnidades.join(',')})
      `, { transaction });

      console.log(`✅ Eliminadas ${resultNotas.affectedRows || 0} notas consolidadas de notas_unidad`);

      // 3. Primero, desactivar TODAS las unidades de las asignaciones afectadas
      const [asignacionesAfectadas] = await sequelize.query(`
        SELECT DISTINCT IdAsignacionDocente FROM unidades WHERE IdUnidad IN (${idsUnidades.join(',')})
      `, { transaction });

      for (const { IdAsignacionDocente } of asignacionesAfectadas) {
        await sequelize.query(`
          UPDATE unidades SET Activa = 0 WHERE IdAsignacionDocente = ?
        `, { replacements: [IdAsignacionDocente], transaction });
      }

      console.log(`✅ Desactivadas todas las unidades de ${asignacionesAfectadas.length} asignaciones`);

      // 4. Resetear estado de las unidades número ${numeroUnidad}
      const [resultUnidades] = await sequelize.query(`
        UPDATE unidades
        SET
          Cerrada = 0,
          Activa = 1,
          FechaCierre = NULL,
          CerradaPorAdmin = NULL,
          NotificacionesEnviadas = 0
        WHERE IdUnidad IN (${idsUnidades.join(',')})
      `, { transaction });

      console.log(`✅ Activadas ${resultUnidades.affectedRows || 0} unidades número ${numeroUnidad}`);

      // 4. Resetear estado de cursos (si existen)
      const [resultEstados] = await sequelize.query(`
        UPDATE estado_cursos_unidad
        SET
          EstadoGeneral = 'PENDIENTE',
          DetallesPendientes = NULL,
          UltimaActualizacion = NOW()
        WHERE IdUnidad IN (${idsUnidades.join(',')})
      `, { transaction });

      console.log(`✅ Reseteados ${resultEstados.affectedRows || 0} estados de cursos`);

      // 5. Eliminar notificaciones relacionadas
      const [resultNotif] = await sequelize.query(`
        DELETE FROM notificaciones_docentes
        WHERE IdUnidad IN (${idsUnidades.join(',')})
      `, { transaction });

      console.log(`✅ Eliminadas ${resultNotif.affectedRows || 0} notificaciones de docentes`);

      // 6. Mostrar resumen de calificaciones que se mantienen
      const [calificaciones] = await sequelize.query(`
        SELECT COUNT(*) as total
        FROM calificaciones c
        INNER JOIN actividades a ON c.IdActividad = a.IdActividad
        WHERE a.IdUnidad IN (${idsUnidades.join(',')})
      `, { transaction });

      console.log(`\n📊 RESUMEN:`);
      console.log(`   - Calificaciones individuales mantenidas: ${calificaciones[0].total}`);
      console.log(`   - Las actividades siguen existiendo`);
      console.log(`   - Las unidades están REABIERTAS para calificar`);
      console.log(`   - Las notas consolidadas fueron eliminadas`);

      // Commit
      await transaction.commit();

      console.log(`\n✅ ¡Unidad ${numeroUnidad} reseteada exitosamente!`);
      console.log(`\n💡 Ahora puedes:`);
      console.log(`   1. Guardar calificaciones (performance mejorada)`);
      console.log(`   2. Cerrar la unidad manualmente`);
      console.log(`   3. Generar notificaciones a docentes`);
      console.log(`   4. Verificar que las notas se calculan al cierre\n`);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error al resetear unidad:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar
resetearUnidad();
