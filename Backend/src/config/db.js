// src/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Si existe DATABASE_URL (Neon en producción), la usamos con SSL.
// Si no (desarrollo local), usamos las variables sueltas de siempre.
const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    })
    : new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    pool.on('error', (err) => {
    console.error('⚠️ Error inesperado en una conexión inactiva del pool (probablemente Neon cerró la conexión por inactividad):', err.message);
});

// Comprobamos la conexión inicial
pool.connect()
    .then(() => console.log('✅ Conectado a la base de datos PostgreSQL'))
    .catch((err) => console.error('❌ Error de conexión a la base de datos:', err.stack));

module.exports = pool;