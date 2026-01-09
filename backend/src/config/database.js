const { Sequelize } = require('sequelize');
require('dotenv').config();

// 🔹 Conexión a la base de datos MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME,      // Nombre de la base de datos
  process.env.DB_USER,      // Usuario
  process.env.DB_PASS,      // 👈 Usamos DB_PASS para coincidir con .env
  {
    host: process.env.DB_HOST,   // Host (127.0.0.1)
    port: process.env.DB_PORT,   // Puerto (3306)
    dialect: 'mysql',
    dialectOptions: {
    multipleStatements: true   // ← ESTO ES LA CLAVE
  },
    logging: false,              // Evita mostrar logs en consola
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// 🔍 Probar conexión
sequelize.authenticate()
  .then(() => console.log('✅ Conexión a MySQL exitosa'))
  .catch(err => console.error('❌ Error de conexión:', err));

module.exports = sequelize; // ¡Importante exportar para los modelos!