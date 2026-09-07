const express = require('express');
const router = express.Router();
const {
    getMyRooms,
    getRoomMessages,
    sendRoomMessage,
} = require('../controllers/roomController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/my-rooms', verifyToken, getMyRooms);
router.get('/:roomId/messages', verifyToken, getRoomMessages);
router.post('/:roomId/messages', verifyToken, sendRoomMessage);

module.exports = router;