# Backend API

> API RESTful en **Node.js** con **Express**, **Sequelize** (MySQL) y autenticación JWT + bcrypt.  
> Proyecto aislado para desarrollo ordenado y mantenible.

[![Node.js](https://img.shields.io/badge/Node.js-v20-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.1-blue)](https://expressjs.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-v6.37-4B8BBE)](https://sequelize.org/)
[![MySQL](https://img.shields.io/badge/MySQL-v8-blue)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

---

## 🚀 Características

- Autenticación con **JWT**
- Hash de contraseñas con **bcryptjs**
- ORM con **Sequelize** (MySQL)
- CORS habilitado
- Variables de entorno con **dotenv**
- Desarrollo con **nodemon**

---

## 📦 Tecnologías

| Tipo | Paquete | Versión |
|------|--------|--------|
| Runtime | Node.js | ≥ 18 |
| Framework | Express | ^5.1.0 |
| ORM | Sequelize | ^6.37.7 |
| DB | MySQL2 | ^3.15.1 |
| Auth | jsonwebtoken | ^9.0.2 |
| | bcryptjs | ^3.0.2 |
| CORS | cors | ^2.8.5 |
| Dev | nodemon | ^3.1.10 |
| | dotenv | ^17.2.3 |

---

## 🛠️ Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/mapachowsky/backend.git
   cd backend
2. **Instala las dependencias**
   ```bash
   npm install
4. **Configura las variables de entorno**
   ```bash
   cp .env.example .env
6. **Inicia el servidor**
   ```bash
   -npm run dev    # Desarrollo (con nodemon)
   -npm start      # Producción
## ⚙️ Variables de entorno (.env)
    - PORT=3000
    - DB_HOST=localhost
    - DB_USER=root
    - DB_PASS=tu_contraseña
    - DB_NAME=mi_basededatos
    - DB_PORT=3306
    - JWT_SECRET=tu_secreto_muy_seguro_123
    - NODE_ENV=development
## 📡 Scripts disponibles
    - npm run dev     # Inicia con nodemon (autoreload)
    - npm start       # Inicia en producción
## 🗄️ Base de datos
   -MySQL
   -Modelos definidos con Sequelize
   -Archivo principal: src/app.js

##🔐 Autenticación

- Registro y login con hash de contraseñas
- Tokens JWT para sesiones

##📝 Licencia
-Este proyecto está bajo la licencia ISC.
 ##👨‍💻 Autor
- mapachowsky
- Guatemala City, Guatemala 🇬🇹
- @mapachowsky · Github-Mapachowski 
