const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { detectImageMime } = require('../utils/imageSignature');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

// Guardamos en memoria (no en Cloudinary directamente) para poder inspeccionar
// los bytes reales del archivo ANTES de subirlo. El campo "mimetype" que manda
// el navegador es solo una etiqueta declarada por el cliente: cualquiera puede
// renombrar un .php o un .html a .jpg y mandarlo con Content-Type: image/jpeg.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('El archivo no es una imagen válida.'), false);
    }
};

const multerUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

const uploadBufferToCloudinary = (buffer, { folder, publicId }) =>
    new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: publicId,
                // Limita las dimensiones máximas: además de ahorrar espacio,
                // evita subir imágenes "bomba de descompresión" pensadas para
                // consumir memoria/CPU de más al procesarlas.
                transformation: [{ width: 2000, height: 2000, crop: 'limit' }]
            },
            (error, result) => (error ? reject(error) : resolve(result))
        );
        uploadStream.end(buffer);
    });

// Verifica el contenido real del archivo (firma de bytes / "magic numbers")
// antes de subirlo a Cloudinary, y solo entonces lo sube. Reemplaza al
// CloudinaryStorage automático de antes, que confiaba en el mimetype
// declarado por el navegador.
const validateAndUpload = (folder) => async (req, res, next) => {
    try {
        if (!req.file) return next();

        const detectedMime = detectImageMime(req.file.buffer);
        if (!detectedMime || !ALLOWED_MIMES.includes(detectedMime)) {
            return res.status(400).json({ error: 'El archivo no es una imagen válida.' });
        }

        const publicId = `${req.user.id}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const result = await uploadBufferToCloudinary(req.file.buffer, { folder, publicId });

        // Mantenemos la misma forma de req.file que usaban los controladores
        // (path = URL pública, filename = public_id de Cloudinary) para no
        // tener que tocar su código.
        req.file.path = result.secure_url;
        req.file.filename = result.public_id;
        next();
    } catch (error) {
        console.error('Error subiendo imagen a Cloudinary:', error);
        res.status(500).json({ error: 'No se pudo procesar la imagen.' });
    }
};

module.exports = {
    single: (fieldName) => [multerUpload.single(fieldName), validateAndUpload('red_social/public')]
};