const jwt = require('jsonwebtoken');

const verifyFileToken = (req, res, next) => {
    const header = req.headers.authorization || req.headers.Authorization;
    const token = header?.startsWith('Bearer ')
        ? header.slice(7)
        : req.query.token;

    if (!token) return res.status(401).json({ error: 'Autenticación requerida.' });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        req.user.id = req.user.id || req.user.userId || req.user.user_id;
        if (!req.user.id) return res.status(401).json({ error: 'Token sin usuario válido.' });
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

module.exports = verifyFileToken;
