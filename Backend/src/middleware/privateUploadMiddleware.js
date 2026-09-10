const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { detectImageMime } = require('../utils/imageSignature');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

// Igual que uploadMiddleware.js: guardamos en memoria para poder revisar los
// bytes reales del archivo antes de subirlo, en vez de confiar en el
// mimetype/extension declarados por quien sube el archivo.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
        return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'), false);
};

const multerUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

const uploadBufferToCloudinary = (buffer, { publicId }) =>
    new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'red_social/private',
                public_id: publicId,
                type: 'authenticated', // Clave: NO es público, nadie accede sin URL firmada
                transformation: [{ width: 2000, height: 2000, crop: 'limit' }]
            },
            (error, result) => (error ? reject(error) : resolve(result))
        );
        uploadStream.end(buffer);
    });

const validateAndUpload = async (req, res, next) => {
    try {
        if (!req.file) return next();

        const detectedMime = detectImageMime(req.file.buffer);
        if (!detectedMime || !ALLOWED_MIMES.includes(detectedMime)) {
            return res.status(400).json({ error: 'Solo se permiten imágenes JPG, PNG o WEBP.' });
        }

        const publicId = `${req.user.id}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const result = await uploadBufferToCloudinary(req.file.buffer, { publicId });

        // profileController.uploadPrivatePhoto espera req.file.filename como
        // el public_id de Cloudinary (así generaba las URLs firmadas antes).
        req.file.path = result.secure_url;
        req.file.filename = result.public_id;
        next();
    } catch (error) {
        console.error('Error subiendo imagen privada a Cloudinary:', error);
        res.status(500).json({ error: 'No se pudo procesar la imagen.' });
    }
};

module.exports = {
    single: (fieldName) => [multerUpload.single(fieldName), validateAndUpload]
};