// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { safeCompare } = require('../utils/tokens');

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);


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

 
    if (viaCookie && MUTATING_METHODS.has(req.method)) {
        const csrfCookie = req.cookies?.csrf_token;
        const csrfHeader = req.headers['x-csrf-token'];
        if (!csrfCookie || !csrfHeader || !safeCompare(csrfCookie, csrfHeader)) {
            return res.status(403).json({ error: 'Token CSRF inválido o ausente.' });
        }
    }

    try {
   
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