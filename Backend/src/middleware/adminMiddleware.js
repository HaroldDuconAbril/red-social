const pool = require('../config/db');

const requireAdmin = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows[0]?.role !== 'admin') {
            return res.status(403).json({ error: 'Se requieren permisos de administrador.' });
        }

        req.user.role = 'admin';
        next();
    } catch (error) {
        console.error('Error verificando permisos de administrador:', error);
        res.status(500).json({ error: 'No se pudieron verificar los permisos.' });
    }
};

module.exports = requireAdmin;