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

// Esto ya protege TODAS las rutas de este archivo; no hace falta repetirlo en cada una.
router.use(verifyToken, requireAdmin);

router.get('/verification/pending', getPendingRequests);
router.put('/verification/:id/review', reviewVerificationRequest);

router.post('/force-approve', forceApproveUser);
router.post('/promote-by-email', promoteAdminByEmail);

router.get('/users', getAllUsers);
router.put('/users/:id/group', updateUserGroup);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/promote', promoteToAdmin);

router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.get('/subcategories', getSubcategories);
router.post('/subcategories', createSubcategory);
router.put('/subcategories/:id', updateSubcategory);

router.post('/activities', createActivityAd);

router.get('/rooms', getActiveRooms);
router.post('/rooms', createRoom);
router.put('/rooms/:id/dissolve', dissolveRoom);

module.exports = router;