// src/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Comprobamos la conexión inicial
pool.connect()
    .then(() => console.log('✅ Conectado a la base de datos PostgreSQL'))
    .catch((err) => console.error('❌ Error de conexión a la base de datos:', err.stack));

module.exports = pool;