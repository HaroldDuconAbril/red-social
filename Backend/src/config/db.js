// src/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    };

// Límites del pool: evita agotar las conexiones disponibles en Neon si sube el tráfico
poolConfig.max = 15;
poolConfig.idleTimeoutMillis = 30000;
poolConfig.connectionTimeoutMillis = 5000;

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
    console.error('⚠️ Error inesperado en una conexión inactiva del pool (probablemente Neon cerró la conexión por inactividad):', err.message);
});

pool.connect()
    .then(() => console.log('✅ Conectado a la base de datos PostgreSQL'))
    .catch((err) => console.error('❌ Error de conexión a la base de datos:', err.stack));

module.exports = pool;