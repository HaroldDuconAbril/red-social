const pool = require('../config/db');

// 1. Enviar una solicitud de conexión
const sendRequest = async (req, res) => {
    try {
        const senderId = req.user.id; 
        const { receiver_id } = req.body; 

        if (senderId === receiver_id) {
            return res.status(400).json({ error: 'No puedes enviarte una solicitud a ti mismo.' });
        }

        const existingRequest = await pool.query(
            'SELECT * FROM friendships WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)',
            [senderId, receiver_id]
        );

        if (existingRequest.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe una conexión o solicitud pendiente con este usuario.' });
        }

        const newRequest = await pool.query(
            `INSERT INTO friendships (sender_id, receiver_id, status) VALUES ($1, $2, 'pendiente') RETURNING *`,
            [senderId, receiver_id]
        );

        res.status(201).json({
            message: 'Solicitud enviada con éxito.',
            request: newRequest.rows[0]
        });

    } catch (error) {
        console.error('Error al enviar solicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 2. Ver las solicitudes pendientes
const getPendingRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const requests = await pool.query(
            `SELECT f.id AS friendship_id, u.id AS sender_id, u.username, p.profile_picture_url 
             FROM friendships f
             JOIN users u ON f.sender_id = u.id
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE f.receiver_id = $1 AND f.status = 'pendiente'`,
            [userId]
        );

        res.status(200).json({
            message: 'Solicitudes pendientes obtenidas',
            requests: requests.rows
        });

    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 3. Aceptar o rechazar una solicitud
const respondToRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params; 
        const { status } = req.body; 

        if (!['aceptada', 'rechazada'].includes(status)) {
            return res.status(400).json({ error: 'Estado no válido. Use "aceptada" o "rechazada".' });
        }

        const updatedRequest = await pool.query(
            `UPDATE friendships 
             SET status = $1 
             WHERE id = $2 AND receiver_id = $3 RETURNING *`,
            [status, id, userId]
        );

        if (updatedRequest.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada o no tienes permiso para responderla.' });
        }

        res.status(200).json({
            message: `Solicitud ${status} exitosamente.`,
            friendship: updatedRequest.rows[0]
        });

    } catch (error) {
        console.error('Error al responder solicitud:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 4. Obtener contactos confirmados (Amistades aceptadas)
const getAcceptedConnections = async (req, res) => {
    try {
        const userId = req.user.id;

        // Esta consulta busca el usuario que NO es el usuario logueado
        // usando una lógica de selección condicional (CASE)
        const query = await pool.query(
            `SELECT 
                CASE 
                    WHEN f.sender_id = $1 THEN f.receiver_id 
                    ELSE f.sender_id 
                END AS user_id,
                u.username AS alias_name,
                COALESCE(p.profile_picture_url, '') AS profile_picture_url
             FROM friendships f
             JOIN users u ON (u.id = CASE 
                                        WHEN f.sender_id = $1 THEN f.receiver_id 
                                        ELSE f.sender_id 
                                     END)
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE (f.sender_id = $1 OR f.receiver_id = $1) 
               AND f.status = 'aceptada'`,
            [userId]
        );

        res.status(200).json({ contacts: query.rows });
    } catch (error) {
        console.error('Error al obtener contactos:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

module.exports = {
    sendRequest,
    getPendingRequests,
    respondToRequest,
    getAcceptedConnections
};