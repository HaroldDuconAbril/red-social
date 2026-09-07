const pool = require('../config/db');

const getMyRooms = async (req, res) => {
    try {
        const userId = req.user.id;
        
        let query;
        // Si el usuario es administrador, puede ver TODAS las salas para moderar
        if (req.user.role === 'admin') {
            query = await pool.query('SELECT * FROM group_rooms WHERE is_active = true ORDER BY created_at DESC');
        } else {
            // Si es usuario normal, solo ve las salas a las que fue invitado
            query = await pool.query(
                `SELECT g.* FROM group_rooms g
                 JOIN room_participants rp ON g.id = rp.room_id
                 WHERE rp.user_id = $1 AND g.is_active = true
                 ORDER BY g.created_at DESC`,
                [userId]
            );
        }
        
        res.status(200).json({ rooms: query.rows });
    } catch (error) {
        console.error('Error al obtener mis salas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};
// 2. Obtener el historial de mensajes de una sala
const getRoomMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const access = await pool.query(
            `SELECT 1 FROM room_participants
             WHERE room_id = $1 AND user_id = $2
             LIMIT 1`,
            [roomId, req.user.id]
        );

        if (access.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes acceso a esta sala.' });
        }

        const messages = await pool.query(
            `SELECT m.*, u.username AS sender_name 
             FROM room_messages m
             JOIN users u ON m.user_id = u.id
             WHERE m.room_id = $1
             ORDER BY m.created_at ASC`,
            [roomId]
        );
        res.status(200).json(messages.rows);
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({ error: 'Error al cargar mensajes' });
    }
};

// 3. Enviar y guardar un mensaje en la sala
const sendRoomMessage = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { message } = req.body;
        const userId = req.user.id;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
        }

        const access = await pool.query(
            `SELECT 1 FROM room_participants
             WHERE room_id = $1 AND user_id = $2
             LIMIT 1`,
            [roomId, userId]
        );

        if (access.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes acceso a esta sala.' });
        }

        const newMessage = await pool.query(
            `INSERT INTO room_messages (room_id, user_id, message) 
             VALUES ($1, $2, $3) 
             RETURNING id, room_id, user_id, message, created_at`,
            [roomId, userId, message]
        );

        // Obtenemos el nombre del remitente para enviarlo de una vez al frontend
        const userQuery = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
        const sender_name = userQuery.rows[0].username;

        res.status(201).json({
            ...newMessage.rows[0],
            sender_name
        });
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
};

module.exports = {
    getMyRooms,
    getRoomMessages,
    sendRoomMessage,
};