// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

// --- Rutas Públicas ---
router.post('/register', authController.finalRegistration);
router.post('/login', authController.login);
router.post('/verify-2fa', authController.verify2FALogin);
router.post('/set-password', authController.setPassword); 
router.post('/logout', authController.logout);

// --- Rutas Protegidas ---
router.post('/generate-2fa', verifyToken, authController.generate2FA);

module.exports = router;