const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const qrcode = require('qrcode');

// 1. Registro Final
const finalRegistration = async (req, res) => {
    const client = await pool.connect(); 
    try {
        const { email, username, password, profile_type } = req.body;

        if (!email || !username || !password || !profile_type) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        const requestCheck = await client.query("SELECT * FROM verification_requests WHERE email = $1 AND status = 'aprobado'", [email]);
        if (requestCheck.rows.length === 0) return res.status(403).json({ error: 'Este correo no está aprobado o no existe.' });

        const userCheck = await client.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userCheck.rows.length > 0) return res.status(409).json({ error: 'El correo o el nombre de usuario ya están en uso.' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        await client.query('BEGIN');
        
        // Usamos password_hash y el rol 'usuario'
        const newUser = await client.query(
            "INSERT INTO users (email, username, password_hash, role) VALUES ($1, $2, $3, 'usuario') RETURNING id",
            [email, username, password_hash] 
        );
        const userId = newUser.rows[0].id;

        await client.query(`INSERT INTO profiles (user_id, profile_type) VALUES ($1, $2)`, [userId, profile_type]);
        await client.query('COMMIT');

        res.status(201).json({ message: 'Registro completado con éxito.', user: newUser.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        client.release();
    }
};

// 2. Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Faltan credenciales.' });

        const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userQuery.rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas.' });

        const user = userQuery.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas.' });

        if (user.two_factor_enabled) {
            return res.status(200).json({
                message: 'Se requiere código 2FA',
                requires2FA: true,
                userId: user.id 
            });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        // Limpiamos datos sensibles antes de enviar
        const userResponse = { id: user.id, username: user.username, email: user.email, role: user.role };

        res.status(200).json({ message: 'Inicio de sesión exitoso', token, user: userResponse });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 3. Generar 2FA
const generate2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const userQuery = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
        const email = userQuery.rows[0].email;

        const secret = authenticator.generateSecret();
        await pool.query('UPDATE users SET two_factor_secret = $1 WHERE id = $2', [secret, userId]);

        const otpauthUrl = authenticator.keyuri(email, 'Red Social Segura', secret);
        const qrCodeImage = await qrcode.toDataURL(otpauthUrl);

        res.status(200).json({ message: 'Escanea este QR', qrCodeImage, secret });
    } catch (error) {
        res.status(500).json({ error: 'Error al generar 2FA.' });
    }
};

// 4. Verificar 2FA
const verify2FALogin = async (req, res) => {
    try {
        const { userId, token2FA } = req.body;
        const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userQuery.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });

        const user = userQuery.rows[0];
        const isValid = authenticator.check(token2FA, user.two_factor_secret);

        if (!isValid) return res.status(401).json({ error: 'Código 2FA inválido.' });

        if (!user.two_factor_enabled) {
            await pool.query('UPDATE users SET two_factor_enabled = true WHERE id = $1', [userId]);
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        const userResponse = { id: user.id, username: user.username, email: user.email, role: user.role };

        res.status(200).json({ message: 'Autenticación exitosa', token, user: userResponse });
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar 2FA.' });
    }
};

// 5. Configurar Contraseña y Crear Perfil
const setPassword = async (req, res) => {
    const client = await pool.connect();
    try {
        // AHORA RECIBIMOS EL profileType DEL FRONTEND
        const { email, password, profileType } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Faltan datos requeridos.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await client.query('BEGIN');

        // 1. Verificamos si el usuario ya existe en la tabla users
        const userCheck = await client.query("SELECT * FROM users WHERE email = $1", [email]);

        if (userCheck.rows.length === 0) {
            // EL USUARIO NO EXISTE EN LA TABLA USERS.
            // 2. Verificamos si tiene una solicitud aprobada
            const requestCheck = await client.query("SELECT * FROM verification_requests WHERE email = $1 AND status = 'aprobado'", [email]);

            if (requestCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'No se encontró una solicitud aprobada para este correo.' });
            }

            // 3. Extraemos datos y lo insertamos en la tabla users
            const requestData = requestCheck.rows[0];
            const username = requestData.username || email.split('@')[0];

            const newUser = await client.query(
                "INSERT INTO users (email, username, password_hash, role) VALUES ($1, $2, $3, 'usuario') RETURNING id",
                [email, username, hashedPassword] 
            );

            // 4. CREAMOS EL PERFIL
            // Usamos la selección del frontend, o un fallback seguro validado en BD
            const finalProfileType = profileType || requestData.profile_type || 'chico_solo';
            
            await client.query(
                "INSERT INTO profiles (user_id, profile_type) VALUES ($1, $2)",
                [newUser.rows[0].id, finalProfileType]
            );

        } else {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: 'La cuenta ya existe. Usa el flujo autenticado de recuperación de contraseña.'
            });
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Cuenta activada y contraseña configurada con éxito' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al configurar contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        client.release();
    }
};

// 6. Logout
const logout = (req, res) => {
    res.status(200).json({ message: 'Sesión cerrada correctamente.' });
};

module.exports = {
    finalRegistration,
    login,
    generate2FA,
    verify2FALogin,
    setPassword,
    logout
};