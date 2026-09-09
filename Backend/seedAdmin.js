// backend/seedAdmin.js
const pool = require('./src/config/db'); 
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        if (!email || !password || password.length < 12) {
            throw new Error('ADMIN_EMAIL y ADMIN_PASSWORD deben configurarse; la contraseña debe tener al menos 12 caracteres.');
        }
        const saltRounds = 10;
        
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // AQUI ESTÁ EL CAMBIO: Usamos 'password_hash' en lugar de 'password'
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, role) 
             VALUES ($1, $2, $3, $4) RETURNING id, email`,
            ['SuperAdmin', email, hashedPassword, 'admin']
        );

        console.log('✅ Administrador creado exitosamente:', result.rows[0]);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creando al administrador:', error);
        process.exit(1);
    }
};

createAdmin();