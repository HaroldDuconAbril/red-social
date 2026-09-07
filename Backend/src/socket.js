
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const pool = require('./config/db');

const setupSocket = (server) => {
    // Inicializamos socket.io y permitimos que cualquier frontend se conecte (CORS)
    const io = socketIo(server, {
        cors: {
            origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
            methods: ['GET', 'POST']
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Autenticación requerida.'));

        try {
            socket.user = jwt.verify(token, process.env.JWT_SECRET);
            next();
        } catch (error) {
            next(new Error('Token inválido o expirado.'));
        }
    });

    io.on('connection', (socket) => {
        console.log('⚡ Nuevo cliente conectado al socket:', socket.id);

        // Cuando un usuario inicia sesión, se une a una "sala privada" con su propio ID de base de datos
        socket.on('joinRoom', () => {
            socket.join(String(socket.user.id));
            console.log(`Usuario autenticado ${socket.user.id} se unió a su sala privada.`);
        });

        // Escuchamos cuando alguien envía un mensaje nuevo
        socket.on('sendMessage', async (data) => {
            const { receiverId, content } = data || {};

            if (!receiverId || typeof content !== 'string' || !content.trim()) return;

            try {
                const friendship = await pool.query(
                    `SELECT 1 FROM friendships
                     WHERE status = 'aceptada'
                     AND ((sender_id = $1 AND receiver_id = $2)
                       OR (sender_id = $2 AND receiver_id = $1))
                     LIMIT 1`,
                    [socket.user.id, receiverId]
                );

                if (friendship.rows.length === 0) return;

                // 1. Guardar el mensaje en la base de datos PostgreSQL
                const newMessage = await pool.query(
                    `INSERT INTO messages (sender_id, receiver_id, content) 
                     VALUES ($1, $2, $3) RETURNING *`,
                    [socket.user.id, receiverId, content.trim()]
                );

                const savedMessage = newMessage.rows[0];

                // 2. Enviar el mensaje EN TIEMPO REAL a la sala del receptor
                io.to(String(receiverId)).emit('receiveMessage', savedMessage);
                
                // 3. Confirmarle al emisor que su mensaje se envió correctamente
                io.to(String(socket.user.id)).emit('messageSent', savedMessage);

            } catch (error) {
                console.error('Error guardando el mensaje en DB:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('🔌 Cliente desconectado:', socket.id);
        });
    });
};

module.exports = setupSocket;