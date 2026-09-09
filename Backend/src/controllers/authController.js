const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const qrcode = require('qrcode');

// 1. Login
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

// 2. Generar 2FA
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

// 3. Verificar 2FA
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

// 4. Configurar Contraseña y Crear Perfil
// IMPORTANTE: ahora exige un 'token' de activación de un solo uso, generado al aprobar
// la solicitud (ver adminController.js). Sin esto, cualquiera que supiera un correo ya
// aprobado podía crear la contraseña de esa cuenta él mismo (toma de cuenta).
const setPassword = async (req, res) => {
    const client = await pool.connect();
    try {
        const { email, password, profileType, token } = req.body;

        if (!email || !password || !token) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Faltan datos requeridos o el enlace es inválido.' });
        }

        await client.query('BEGIN');

        const userCheck = await client.query("SELECT * FROM users WHERE email = $1", [email]);

        if (userCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: 'La cuenta ya existe. Usa el flujo autenticado de recuperación de contraseña.'
            });
        }

        // Verificamos que el token sea el correcto, corresponda a una solicitud aprobada,
        // y no haya expirado (48 horas desde que se generó al aprobar).
        const requestCheck = await client.query(
            `SELECT * FROM verification_requests
             WHERE email = $1 AND status = 'aprobado'
               AND activation_token = $2
               AND activation_token_expires_at > NOW()`,
            [email, token]
        );

        if (requestCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'El enlace es inválido, ya fue usado, o expiró.' });
        }

        const requestData = requestCheck.rows[0];
        const username = requestData.username || email.split('@')[0];

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await client.query(
            "INSERT INTO users (email, username, password_hash, role) VALUES ($1, $2, $3, 'usuario') RETURNING id",
            [email, username, hashedPassword]
        );

        const finalProfileType = profileType || requestData.profile_type || 'chico_solo';

        await client.query(
            "INSERT INTO profiles (user_id, profile_type) VALUES ($1, $2)",
            [newUser.rows[0].id, finalProfileType]
        );

        // Invalidamos el token para que el enlace no pueda reutilizarse nunca más
        await client.query(
            `UPDATE verification_requests SET activation_token = NULL, activation_token_expires_at = NULL WHERE email = $1`,
            [email]
        );

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

// 5. Logout
const logout = (req, res) => {
    res.status(200).json({ message: 'Sesión cerrada correctamente.' });
};

module.exports = {
    login,
    generate2FA,
    verify2FALogin,
    setPassword,
    logout
};
