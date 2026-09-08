const express = require('express');
const router = express.Router();
const { getUserReviews, getMyReview, upsertReview } = require('../controllers/reviewController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/:userId', verifyToken, getUserReviews);
router.get('/:userId/mine', verifyToken, getMyReview);
router.post('/:userId', verifyToken, upsertReview);

module.exports = router;