// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getPendingRequests, 
    reviewVerificationRequest, 
    forceApproveUser,
    promoteAdminByEmail,
    createActivityAd, 
    getAllUsers,
    updateUserGroup,
    deleteUser,
    promoteToAdmin,
    getCategories,
    createCategory,
    updateCategory,
    getSubcategories,
    createSubcategory,
    updateSubcategory,
    getActiveRooms,
    createRoom,
    dissolveRoom
} = require('../controllers/adminController');
const verifyToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.use(verifyToken, requireAdmin);

// Rutas de Verificación
router.get('/verification/pending', verifyToken, getPendingRequests);
router.put('/verification/:id/review', verifyToken, reviewVerificationRequest);

// Rutas de Acciones Especiales
router.post('/force-approve', verifyToken, forceApproveUser);
router.post('/promote-by-email', verifyToken, promoteAdminByEmail);

// Rutas de Usuarios
router.get('/users', verifyToken, getAllUsers);
router.put('/users/:id/group', verifyToken, updateUserGroup);
router.delete('/users/:id', verifyToken, deleteUser);
router.put('/users/:id/promote', verifyToken, promoteToAdmin); 

// Rutas de Categorías y Subcategorías
router.get('/categories', verifyToken, getCategories);
router.post('/categories', verifyToken, createCategory);
router.put('/categories/:id', verifyToken, updateCategory);
router.get('/subcategories', verifyToken, getSubcategories);
router.post('/subcategories', verifyToken, createSubcategory);
router.put('/subcategories/:id', verifyToken, updateSubcategory);

// Rutas de Actividades
router.post('/activities', verifyToken, createActivityAd);

// Rutas de Salas Grupales (Admin)
router.get('/rooms', verifyToken, getActiveRooms);
router.post('/rooms', verifyToken, createRoom);
router.put('/rooms/:id/dissolve', verifyToken, dissolveRoom);

module.exports = router;