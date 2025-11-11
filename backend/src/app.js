const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const routes = require('./routes/index');
const cors = require('cors');

dotenv.config();

const app = express();

// ✅ Lista de orígenes permitidos
const allowedOrigins = [
  'http://localhost:3000',                  // desarrollo local
  'https://colegiocandelaria.edu.gt',       // dominio principal
  'https://www.colegiocandelaria.edu.gt'    // con www
];

// ✅ Configuración de CORS
app.use(cors({
  origin: function (origin, callback) {
    // Permitir herramientas sin origen (Postman, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('🛑 CORS bloqueado para:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));


// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ← Permite query params complejos


// Prueba de conexión a la base de datos
async function testConnection() {
  try {
    await sequelize.authenticate();
   // console.log('Conexión a la base de datos establecida correctamente.');
   // await sequelize.sync({ alter: true }); // Sincroniza modelos
    console.log('Modelos sincronizados con la base de datos.');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
}

testConnection();

// Monta las rutas bajo /api
app.use('/api', routes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
