const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
        folder: 'red_social/private',
        public_id: `${req.user.id}-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
        type: 'authenticated', // Clave: NO es público, nadie accede sin URL firmada
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    })
});

module.exports = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'), false);
    }
});