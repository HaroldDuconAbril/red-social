// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { safeCompare } = require('../utils/tokens');

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Extrae el JWT SOLO de la cookie httpOnly o del header Authorization.
// Ya NO se acepta el token por query string (?token=...): eso terminaba
// filtrándose en el historial del navegador, en referrers y en los logs
// del servidor.
const extractToken = (req) => {
    if (req.cookies?.token) return { token: req.cookies.token, viaCookie: true };

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return { token: authHeader.slice(7), viaCookie: false };
    }
    return { token: null, viaCookie: false };
};

const verifyToken = async (req, res, next) => {
    const { token, viaCookie } = extractToken(req);

    if (!token) {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere un token de autenticación.' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }

    const userId = decoded.id || decoded.userId || decoded.user_id;
    if (!userId) {
        return res.status(401).json({ error: 'Token válido, pero no contiene id de usuario.' });
    }

    // La cookie viaja automáticamente en cada petición del navegador, así que
    // (a diferencia de un header Authorization puesto a mano) es vulnerable a
    // CSRF si no comprobamos también un token separado que un sitio externo
    // no podría conocer.
    //
    // Frontend y backend viven en dominios distintos (Vercel/Render), así que
    // NO usamos una segunda cookie legible (el JS de un dominio no puede leer
    // cookies de otro dominio, aunque el navegador sí las mande). En vez de
    // eso, el token CSRF va como claim firmado dentro del propio JWT
    // (decoded.csrf) y el frontend lo reenvía como header porque se lo
    // entregamos una sola vez en el body de la respuesta de login/2FA/me.
    // Un atacante que arma una petición cross-site no puede leer ese body
    // (no es su origen) ni conoce el JWT (es httpOnly), así que no puede
    // adivinar el valor a poner en el header.
    if (viaCookie && MUTATING_METHODS.has(req.method)) {
        const csrfHeader = req.headers['x-csrf-token'];
        if (!decoded.csrf || !csrfHeader || !safeCompare(decoded.csrf, csrfHeader)) {
            return res.status(403).json({ error: 'Token CSRF inválido o ausente.' });
        }
    }

    try {
        // Revisamos que el token no haya sido invalidado (logout, cambio de
        // rol, cambio de contraseña, etc.) comparando la versión que trae
        // contra la que está guardada en la base de datos.
        const result = await pool.query('SELECT token_version FROM users WHERE id = $1', [userId]);
        const currentVersion = result.rows[0]?.token_version ?? 0;
        const tokenVersion = decoded.tokenVersion ?? 0;

        if (result.rows.length === 0 || tokenVersion !== currentVersion) {
            return res.status(401).json({ error: 'La sesión ya no es válida. Inicia sesión nuevamente.' });
        }
    } catch (error) {
        console.error('Error verificando la versión del token:', error);
        return res.status(500).json({ error: 'No se pudo verificar la sesión.' });
    }

    req.user = { ...decoded, id: userId };
    next();
};

module.exports = verifyToken;