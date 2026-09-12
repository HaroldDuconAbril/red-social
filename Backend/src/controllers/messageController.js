const pool = require('../config/db');

// Determina si dos usuarios pueden escribirse: o son amigos aceptados, o
// alguno de los dos es admin (el admin puede contactar a cualquiera, y
// cualquiera puede responderle al admin sin necesitar aceptar solicitud).
const canMessage = async (userAId, userBId, userARole) => {
    if (userARole === 'admin') return true;

    const otherUser = await pool.query('SELECT role FROM users WHERE id = $1', [userBId]);
    if (otherUser.rows[0]?.role === 'admin') return true;

    const friendship = await pool.query(
        `SELECT 1 FROM friendships
         WHERE status = 'aceptada'
         AND ((sender_id = $1 AND receiver_id = $2)
           OR (sender_id = $2 AND receiver_id = $1))
         LIMIT 1`,
        [userAId, userBId]
    );
    return friendship.rows.length > 0;
};

// 1. Guardar y enviar un mensaje nuevo
const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiver_id, content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
        }

        const authorized = await canMessage(senderId, receiver_id, req.user.role);
        if (!authorized) {
            return res.status(403).json({ error: 'Solo puedes escribir a tus amigos aceptados.' });
        }

        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, content) 
             VALUES ($1, $2, $3) 
             RETURNING id, sender_id, receiver_id, content, is_read, created_at`,
            [senderId, receiver_id, content.trim().slice(0, 2000)]
        );

        res.status(201).json({ message: 'Mensaje enviado', data: result.rows[0] });
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 2. Obtener el historial de chat con un amigo (o con el admin, o el admin con cualquiera)
const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.params;

        const authorized = await canMessage(userId, friendId, req.user.role);
        if (!authorized) {
            return res.status(403).json({ error: 'Acceso denegado. Solo puedes chatear con usuarios que sean tus amigos.' });
        }

        const messagesQuery = await pool.query(
            `SELECT * FROM messages 
             WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at ASC`,
            [userId, friendId]
        );

        await pool.query(
            `UPDATE messages SET is_read = true 
             WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
            [friendId, userId]
        );

        res.status(200).json({
            message: 'Historial de chat cargado',
            messages: messagesQuery.rows
        });

    } catch (error) {
        console.error('Error al cargar el historial de chat:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

module.exports = {
    sendMessage,
    getChatHistory
};