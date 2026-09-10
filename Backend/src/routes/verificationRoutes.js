// src/routes/verificationRoutes.js
const express=require('express');
const multer=require('multer');
const path=require('path');
const fs=require('fs');
const {submitVerificationRequest,getVerificationFile}=require('../controllers/verificationController');
const verifyFileToken=require('../middleware/fileAuthMiddleware');
const { detectImageMime } = require('../utils/imageSignature');

const router=express.Router();

const uploadDir=path.join(__dirname,'../../uploads/verification');

if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir,{recursive:true});
}

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,uploadDir);
    },
    filename:(req,file,cb)=>{
        const extension = file.mimetype === 'image/png'
            ? '.png'
            : file.mimetype === 'image/webp'
                ? '.webp'
                : '.jpg';
        const uniqueName=`${Date.now()}-${Math.round(Math.random()*1E9)}${extension}`;
        cb(null,uniqueName);
    }
});

const upload=multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 2 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'), false);
    }
});

// El mimetype declarado ya se filtró arriba, pero como estos archivos se
// guardan directo en disco (no pasan por Cloudinary, que re-codifica la
// imagen), validamos también el contenido real ("magic numbers") antes de
// dejar que el controlador los use. Cualquier archivo que no sea realmente
// una imagen de los formatos permitidos se borra de inmediato.
const validateUploadedImages = (req, res, next) => {
    const files = [
        req.files?.full_body_photo?.[0],
        req.files?.sign_photo?.[0]
    ].filter(Boolean);

    try {
        for (const file of files) {
            const buffer = fs.readFileSync(file.path);
            const detectedMime = detectImageMime(buffer);
            if (!detectedMime || !ALLOWED_MIMES.includes(detectedMime)) {
                files.forEach((f) => fs.unlink(f.path, () => {}));
                return res.status(400).json({ error: 'Uno de los archivos no es una imagen válida.' });
            }
        }
        next();
    } catch (error) {
        console.error('Error validando imágenes de verificación:', error);
        files.forEach((f) => fs.unlink(f.path, () => {}));
        res.status(500).json({ error: 'No se pudieron procesar los archivos.' });
    }
};

router.post(
    '/request',
    upload.fields([
        {name:'full_body_photo',maxCount:1},
        {name:'sign_photo',maxCount:1}
    ]),
    validateUploadedImages,
    submitVerificationRequest
);

router.get('/file/:filename',verifyFileToken,getVerificationFile);

module.exports=router;