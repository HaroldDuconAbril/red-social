const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const qrcode = require('qrcode');
const { hashToken, generateCsrfToken } = require('../utils/tokens');
const { setSessionCookies, clearSessionCookies } = require('../utils/cookies');

const TOKEN_TTL = '2h';

const signSession = (user) => jwt.sign(
    { id: user.id, role: user.role, tokenVersion: user.token_version ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL }
);

const issueSession = (res, user) => {
    const token = signSession(user);
    const csrfToken = generateCsrfToken();
    setSessionCookies(res, { token, csrfToken });
};

// Busca una solicitud de verificación aprobada y con un token de activación
// vigente y no usado todavía. Se usa tanto en el registro final como en
// set-password, así el enlace del correo es la única forma de probar que la
// persona realmente controla ese correo (antes bastaba con conocerlo).
const findRequestByActivationToken = async (client, rawToken) => {
    if (!rawToken) return null;
    const hashed = hashToken(rawToken);
    const result = await client.query(
        `SELECT * FROM verification_requests
         WHERE activation_token_hash = $1
           AND status = 'aprobado'
           AND activation_token_used_at IS NULL
           AND activation_token_expires_at > NOW()`,
        [hashed]
    );
    return result.rows[0] || null;
};

// 1. Registro Final (flujo antiguo, ya no lo usa el frontend actual, pero se
// deja funcional y con la misma validación de token de activación por si
// algún cliente todavía lo usa).
const finalRegistration = async (req, res) => {
    const client = await pool.connect();
    try {
        const { token, username, password, profile_type } = req.body;

        if (!token || !username || !password || !profile_type) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        const requestData = await findRequestByActivationToken(client, token);
        if (!requestData) {
            return res.status(403).json({ error: 'Enlace de activación inválido, expirado o ya utilizado.' });
        }
        const email = requestData.email;

        const userCheck = await client.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userCheck.rows.length > 0) return res.status(409).json({ error: 'El correo o el nombre de usuario ya están en uso.' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        await client.query('BEGIN');

        const newUser = await client.query(
            "INSERT INTO users (email, username, password_hash, role) VALUES ($1, $2, $3, 'usuario') RETURNING id",
            [email, username, password_hash]
        );
        const userId = newUser.rows[0].id;

        await client.query(`INSERT INTO profiles (user_id, profile_type) VALUES ($1, $2)`, [userId, profile_type]);

        // El token de activación es de un solo uso: lo invalidamos apenas se usa.
        await client.query(
            'UPDATE verification_requests SET activation_token_used_at = NOW() WHERE id = $1',
            [requestData.id]
        );

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

        issueSession(res, user);

        const userResponse = { id: user.id, username: user.username, email: user.email, role: user.role };
        res.status(200).json({ message: 'Inicio de sesión exitoso', user: userResponse });
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
        if (!userId || !token2FA) {
            return res.status(400).json({ error: 'Código 2FA inválido.' });
        }

        const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        // Respuesta uniforme sin importar si el usuario existe, para no dejar
        // enumerar userIds válidos por diferencia de mensajes/tiempos.
        if (userQuery.rows.length === 0) {
            return res.status(401).json({ error: 'Código 2FA inválido.' });
        }

        const user = userQuery.rows[0];
        const isValid = user.two_factor_secret && authenticator.check(token2FA, user.two_factor_secret);

        if (!isValid) return res.status(401).json({ error: 'Código 2FA inválido.' });

        if (!user.two_factor_enabled) {
            await pool.query('UPDATE users SET two_factor_enabled = true WHERE id = $1', [userId]);
        }

        issueSession(res, user);

        const userResponse = { id: user.id, username: user.username, email: user.email, role: user.role };
        res.status(200).json({ message: 'Autenticación exitosa', user: userResponse });
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar 2FA.' });
    }
};

// 5. Configurar Contraseña y Crear Perfil (enlace de activación por correo)
const setPassword = async (req, res) => {
    const client = await pool.connect();
    try {
        const { token, password, profileType } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Faltan datos requeridos.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
        }

        await client.query('BEGIN');

        const requestData = await findRequestByActivationToken(client, token);
        if (!requestData) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El enlace de activación es inválido, expiró o ya fue usado.' });
        }

        const email = requestData.email;
        const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: 'La cuenta ya existe. Usa el flujo autenticado de recuperación de contraseña.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const username = requestData.username || email.split('@')[0];

        const newUser = await client.query(
            "INSERT INTO users (email, username, password_hash, role) VALUES ($1, $2, $3, 'usuario') RETURNING id",
            [email, username, hashedPassword]
        );

        const finalProfileType = profileType || requestData.profile_type || 'chico_solo';
        await client.query(
            "INSERT INTO profiles (user_id, profile_type) VALUES ($1, $2)",
            [newUser.rows[0].id, finalProfileType]
        );

        // Token de un solo uso: se marca como consumido en la misma transacción
        // para que un segundo intento con el mismo enlace ya no funcione.
        await client.query(
            'UPDATE verification_requests SET activation_token_used_at = NOW() WHERE id = $1',
            [requestData.id]
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

// 6. Logout: además de borrar las cookies, invalidamos el token del lado del
// servidor subiendo token_version. Así, si alguien más tuviera una copia del
// JWT (robado antes del logout), deja de servir de inmediato en vez de seguir
// siendo válido hasta que expire por su cuenta.
const logout = async (req, res) => {
    try {
        const cookieToken = req.cookies?.token;
        const authHeader = req.headers.authorization || req.headers.Authorization;
        const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        const token = cookieToken || headerToken;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userId = decoded.id || decoded.userId || decoded.user_id;
                if (userId) {
                    await pool.query('UPDATE users SET token_version = token_version + 1 WHERE id = $1', [userId]);
                }
            } catch (_) {
                // Token ya inválido/expirado: no hay nada que invalidar, seguimos igual.
            }
        }

        clearSessionCookies(res);
        res.status(200).json({ message: 'Sesión cerrada correctamente.' });
    } catch (error) {
        clearSessionCookies(res);
        res.status(200).json({ message: 'Sesión cerrada correctamente.' });
    }
};

// 7. Sesión actual: permite al frontend saber quién está logueado a partir de
// la cookie httpOnly, sin tener que guardar el JWT ni el usuario en
// localStorage.
const getMe = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
        res.status(200).json({ user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

module.exports = {
    finalRegistration,
    login,
    generate2FA,
    verify2FALogin,
    setPassword,
    logout,
    getMe
};