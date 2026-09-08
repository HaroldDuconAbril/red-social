const pool = require('../config/db');

// Obtener calificaciones públicas de un usuario (promedio + lista anónima)
const getUserReviews = async (req, res) => {
    try {
        const { userId } = req.params;

        const avgResult = await pool.query(
            `SELECT COALESCE(AVG(rating), 0)::numeric(10,2) AS average, COUNT(*)::int AS count
             FROM profile_reviews WHERE reviewed_user_id = $1`,
            [userId]
        );

        const reviewsResult = await pool.query(
            `SELECT rating, comment, created_at
             FROM profile_reviews
             WHERE reviewed_user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );

        res.status(200).json({
            average: parseFloat(avgResult.rows[0].average),
            count: avgResult.rows[0].count,
            reviews: reviewsResult.rows
        });
    } catch (error) {
        console.error('Error al obtener calificaciones:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Obtener la calificación que el usuario logueado ya dejó (si existe)
const getMyReview = async (req, res) => {
    try {
        const { userId } = req.params;
        const reviewerId = req.user.id;

        const result = await pool.query(
            `SELECT rating, comment FROM profile_reviews
             WHERE reviewed_user_id = $1 AND reviewer_id = $2`,
            [userId, reviewerId]
        );

        res.status(200).json(result.rows[0] || null);
    } catch (error) {
        console.error('Error al obtener mi calificación:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Crear o actualizar (upsert) la calificación propia de un usuario
const upsertReview = async (req, res) => {
    try {
        const { userId } = req.params;
        const reviewerId = req.user.id;
        const { rating, comment } = req.body;

        if (userId === reviewerId) {
            return res.status(400).json({ error: 'No puedes calificarte a ti mismo.' });
        }

        const ratingNum = parseInt(rating, 10);
        if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ error: 'La calificación debe ser un número entre 1 y 5.' });
        }

        const result = await pool.query(
            `INSERT INTO profile_reviews (reviewer_id, reviewed_user_id, rating, comment)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (reviewer_id, reviewed_user_id)
             DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
             RETURNING rating, comment, created_at`,
            [reviewerId, userId, ratingNum, (comment || '').trim().slice(0, 500)]
        );

        res.status(200).json({ message: 'Calificación guardada', review: result.rows[0] });
    } catch (error) {
        console.error('Error al guardar calificación:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

module.exports = {
    getUserReviews,
    getMyReview,
    upsertReview
};