const jwt = require('jsonwebtoken');
const pool = require('../config/db');


const verifyFileToken = async (req, res, next) => {
    const cookieToken = req.cookies?.token;
    const header = req.headers.authorization || req.headers.Authorization;
    const headerToken = header?.startsWith('Bearer ') ? header.slice(7) : null;
    const token = cookieToken || headerToken;

    if (!token) return res.status(401).json({ error: 'Autenticación requerida.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id || decoded.userId || decoded.user_id;
        if (!userId) return res.status(401).json({ error: 'Token sin usuario válido.' });

        const result = await pool.query('SELECT token_version FROM users WHERE id = $1', [userId]);
        const currentVersion = result.rows[0]?.token_version ?? 0;
        if (result.rows.length === 0 || (decoded.tokenVersion ?? 0) !== currentVersion) {
            return res.status(401).json({ error: 'La sesión ya no es válida. Inicia sesión nuevamente.' });
        }

        req.user = { ...decoded, id: userId };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

module.exports = verifyFileToken;