const pool = require('../config/db');

// 1. Guardar y enviar un mensaje nuevo
const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiver_id, content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
        }

        const friendship = await pool.query(
            `SELECT 1 FROM friendships
             WHERE status = 'aceptada'
             AND ((sender_id = $1 AND receiver_id = $2)
               OR (sender_id = $2 AND receiver_id = $1))
             LIMIT 1`,
            [senderId, receiver_id]
        );

        if (friendship.rows.length === 0) {
            return res.status(403).json({ error: 'Solo puedes escribir a tus amigos aceptados.' });
        }

        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, content) 
             VALUES ($1, $2, $3) 
             RETURNING id, sender_id, receiver_id, content, is_read, created_at`,
            [senderId, receiver_id, content.trim()]
        );

        res.status(201).json({ message: 'Mensaje enviado', data: result.rows[0] });
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 2. Obtener el historial de chat con un amigo
const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id; // Mi ID
        const { friendId } = req.params; // El ID de mi amigo

        // 1. Regla de privacidad estricta: Verificar si realmente son amigos aceptados
        const friendCheck = await pool.query(
            `SELECT * FROM friendships 
             WHERE status = 'aceptada' 
             AND ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))`,
            [userId, friendId]
        );

        if (friendCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Acceso denegado. Solo puedes chatear con usuarios que sean tus amigos.' });
        }

        // 2. Traer el historial de mensajes entre ambos, ordenados por fecha (usando created_at)
        const messagesQuery = await pool.query(
            `SELECT * FROM messages 
             WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at ASC`,
            [userId, friendId]
        );

        // 3. Marcar como leídos los mensajes que mi amigo me envió a mí al abrir el chat
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