// src/routes/friendshipRoutes.js
const express = require('express');
const router = express.Router();

const { 
    sendRequest, 
    getPendingRequests, 
    respondToRequest, 
    getAcceptedConnections // <-- IMPORTANTE: Agregar esta función
} = require('../controllers/friendshipController');
const verifyToken = require('../middleware/authMiddleware');

// Ruta: POST /api/friendships/request (Enviar una solicitud a otro usuario)
router.post('/request', verifyToken, sendRequest);

// Ruta: GET /api/friendships/pending (Ver las solicitudes que me han enviado)
router.get('/pending', verifyToken, getPendingRequests);

// Ruta: PUT /api/friendships/:id/respond (Aceptar o rechazar la solicitud)
router.put('/:id/respond', verifyToken, respondToRequest);

// NUEVA RUTA: GET /api/friendships/contacts (Obtener la lista de chats/contactos aceptados)
router.get('/contacts', verifyToken, getAcceptedConnections);

module.exports = router;