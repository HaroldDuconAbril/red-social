const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Almacenamiento en Cloudinary (carpeta "red_social/public")
const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
        folder: 'red_social/public',
        // Nombre único usando el ID del usuario, igual que antes
        public_id: `${req.user.id}-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    })
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('El archivo no es una imagen válida.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

module.exports = upload;