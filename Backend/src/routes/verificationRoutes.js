// src/routes/verificationRoutes.js
const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { submitVerificationRequest, getVerificationFile } = require('../controllers/verificationController');
const verifyFileToken = require('../middleware/fileAuthMiddleware');

const router = express.Router();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
        folder: 'red_social/verification',
        public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`,
        type: 'authenticated', // privado: nadie accede sin URL firmada
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    })
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 2 },
    fileFilter: (req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'), false);
    }
});

router.post(
    '/request',
    upload.fields([
        { name: 'full_body_photo', maxCount: 1 },
        { name: 'sign_photo', maxCount: 1 }
    ]),
    submitVerificationRequest
);

router.get('/file/:filename', verifyFileToken, getVerificationFile);

module.exports = router;