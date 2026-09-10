// src/routes/authRoutes.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

const twoFaLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 8,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.body?.userId || 'sin-id'}`,
    message: { error: 'Demasiados intentos de verificación. Inténtalo más tarde.' }
});

// --- Rutas Públicas ---
router.post('/register', authController.finalRegistration);
router.post('/login', authController.login);
router.post('/verify-2fa', twoFaLimiter, authController.verify2FALogin);
router.post('/set-password', authController.setPassword);
router.post('/logout', authController.logout);

// --- Rutas Protegidas ---
router.post('/generate-2fa', verifyToken, authController.generate2FA);

router.get('/me', verifyToken, authController.getMe);

module.exports = router;