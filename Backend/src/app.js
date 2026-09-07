// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// --- Importación de Rutas ---
const authRoutes = require('./routes/authRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const friendshipRoutes = require('./routes/friendshipRoutes'); // <-- AQUÍ ESTÁ LA BUENA
const publicRoutes = require('./routes/publicRoutes');
const messageRoutes = require('./routes/messageRoutes');
// const connectionRoutes = require('./routes/connectionRoutes'); <-- ELIMINADO PARA EVITAR EL CRASH

const app = express();
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Inténtalo más tarde.' }
});
const verificationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes de verificación.' }
});

// --- Middlewares ---
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// --- Carpeta de fotos públicas ---
// IMPORTANTE: helmet() por defecto bloquea que otro origen (ej. tu frontend en :5173)
// cargue estos recursos, aunque el servidor responda 200 OK. Por eso las fotos
// de perfil no se veían. Le indicamos explícitamente que esta carpeta SÍ puede
// compartirse entre orígenes (ya es pública por diseño), sin afectar el resto
// de las protecciones de helmet en toda la API.
const publicUploadsPath = path.join(__dirname, '../uploads/public');
app.use('/uploads/public', express.static(publicUploadsPath, {
    setHeaders: (res) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// Compatibilidad con URLs viejas tipo /uploads/archivo.jpg (sin el prefijo /public/)
app.use('/uploads', (req, res, next) => {
    if (!/^\/[^/]+$/.test(req.path)) return next();
    express.static(publicUploadsPath, {
        setHeaders: (res) => {
            res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        }
    })(req, res, next);
});

// --- RADAR DE DEBUG (Muy útil para ver qué peticiones llegan) ---
app.use((req, res, next) => {
    console.log(`🕵️‍♂️ Petición entrante: ${req.method} ${req.originalUrl}`);
    next();
});
// ---------------------------------------------------------------

// --- Ruta base de prueba ---
app.get('/', (req, res) => {
    res.send('API de la Red Social funcionando correctamente 🚀');
});

// --- Definición de Rutas ---
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/verification', verificationLimiter, verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/friendships', friendshipRoutes); // <-- AQUÍ LA ENLAZAMOS A LA API
app.use('/api/public', publicRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', require('./routes/roomRoutes'));
// app.use('/api/connections', connectionRoutes); <-- ELIMINADO PARA EVITAR EL CRASH

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'El archivo supera el tamaño permitido.' });
    }
    if (error.message?.includes('Solo se permiten imágenes')) {
        return res.status(400).json({ error: error.message });
    }
    console.error('Error no controlado:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;