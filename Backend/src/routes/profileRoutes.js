// src/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Asegúrate de que esta ruta sea la correcta para tu proyecto
const privateUpload = require('../middleware/privateUploadMiddleware');
const verifyFileToken = require('../middleware/fileAuthMiddleware');

// Ruta para obtener el perfil propio
router.get('/me', verifyToken, profileController.getMyProfile);

// Ruta para actualizar el perfil
router.put('/me', verifyToken, upload.single('profile_picture'), profileController.updateProfile);

// Ruta para obtener todos los perfiles (Explorar)
router.get('/all', verifyToken, profileController.getAllProfiles);

// Ruta para subir fotos a la galería privada
router.post('/gallery', verifyToken, privateUpload.single('private_photo'), profileController.uploadPrivatePhoto);

// Ruta para obtener las fotos de tu galería privada
router.get('/gallery', verifyToken, profileController.getMyPrivatePhotos);

// Ruta para eliminar una foto específica de la galería
router.delete('/gallery/:photoId', verifyToken, profileController.deletePrivatePhoto);
router.get('/gallery/file/:filename', verifyFileToken, profileController.getPrivatePhoto);

// Ruta para ver el perfil detallado y fotos de cualquier usuario (Modal de Explorar)
router.get('/user/:id', verifyToken, profileController.getUserProfileWithPhotos); // <-- Corregido aquí

module.exports = router;