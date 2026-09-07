const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory } = require('../controllers/messageController');
const verifyToken = require('../middleware/authMiddleware');

// Ruta: POST /api/messages (Enviar un mensaje nuevo)
router.post('/', verifyToken, sendMessage);

// Ruta: GET /api/messages/:friendId (Obtener historial con un amigo específico)
router.get('/:friendId', verifyToken, getChatHistory);

module.exports = router;