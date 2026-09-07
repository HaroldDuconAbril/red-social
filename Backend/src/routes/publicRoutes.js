const express = require('express');
const router = express.Router();

const { getWallPosts, createWallPost, getActivitiesAds, createActivityAd } = require('../controllers/publicController');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Asumiendo que esta es tu configuración de multer

// Rutas para el muro público
router.get('/wall', getWallPosts);                          // Ver comentarios (Público)
router.post('/wall', verifyToken, createWallPost);          // Dejar un comentario (Requiere Token)

// Rutas para los anuncios de actividades/clasificados
router.get('/activities', getActivitiesAds);                // Ver anuncios (Público)
// Crear anuncio: Requiere Token (que el controller verifica si es admin) y procesa 1 imagen llamada 'activity_image'
router.post('/activities', verifyToken, upload.single('activity_image'), createActivityAd);

module.exports = router;