const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Probar conexión
sequelize.authenticate()
  .then(() => console.log('Conexión a MySQL exitosa'))
  .catch(err => console.error('Error de conexión:', err));

module.exports = sequelize; // ← ¡IMPORTANTE!