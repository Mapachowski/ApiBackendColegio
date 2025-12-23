const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const routes = require('./routes/index');
const cors = require('cors');
const helmet = require('helmet');

dotenv.config();

const app = express();

// ============================================
// CONFIGURACIÓN DE TRUST PROXY
// ============================================
// Necesario cuando la app está detrás de un proxy reverso (Nginx, Cloudflare, etc.)
// Permite obtener la IP real del cliente para rate limiting
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Confiar en el primer proxy
}

// ============================================
// HELMET.JS - Headers de Seguridad HTTP
// ============================================
// Configura automáticamente múltiples headers de seguridad
// Protege contra: XSS, Clickjacking, MIME sniffing, etc.
app.use(helmet({
  // Content Security Policy - Previene inyección de scripts
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Permite estilos inline (ajustar según necesidad)
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },

  // HSTS - Fuerza HTTPS (solo en producción)
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options - Previene clickjacking
  frameguard: {
    action: 'deny' // No permite que la app sea cargada en iframes
  },

  // X-Content-Type-Options - Previene MIME sniffing
  noSniff: true,

  // Referrer-Policy - Controla información de referencia
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none'
  }
}));

// ✅ Lista de orígenes permitidos
const allowedOrigins = [
  'http://localhost:3000',                  // desarrollo local
  'https://colegiocandelaria.edu.gt',       // dominio principal
  'https://www.colegiocandelaria.edu.gt'    // con www
];

// ✅ Configuración de CORS Mejorada
app.use(cors({
  origin: function (origin, callback) {
    // En desarrollo: permitir herramientas sin origen (Postman, curl, etc.)
    // En producción: comentar esta línea para mayor seguridad
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('🛑 CORS bloqueado para:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Solo métodos necesarios
  credentials: true, // Permite cookies y headers de autenticación
  optionsSuccessStatus: 200, // Algunos navegadores antiguos (IE11) necesitan esto
  maxAge: 86400, // Cache de preflight requests por 24 horas
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

// ============================================
// MANEJO DE ERRORES
// ============================================
const {
  errorHandler,
  notFoundHandler,
  sequelizeErrorHandler,
  jwtErrorHandler
} = require('./middleware/errorHandler');

// 1. Manejo de rutas no encontradas (404)
// IMPORTANTE: Debe ir DESPUÉS de todas las rutas
app.use(notFoundHandler);

// 2. Manejadores de errores específicos
app.use(sequelizeErrorHandler); // Errores de base de datos
app.use(jwtErrorHandler);       // Errores de JWT

// 3. Manejador de errores general
// IMPORTANTE: Debe ser el ÚLTIMO middleware
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
