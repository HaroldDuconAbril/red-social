// src/routes/verificationRoutes.js
const express=require('express');
const multer=require('multer');
const path=require('path');
const fs=require('fs');
const {submitVerificationRequest,getVerificationFile}=require('../controllers/verificationController');
const verifyFileToken=require('../middleware/fileAuthMiddleware');

const router=express.Router();

const uploadDir=path.join(__dirname,'../../uploads/verification');

if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir,{recursive:true});
}

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
        if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'), false);
    }
});

router.post(
    '/request',
    upload.fields([
        {name:'full_body_photo',maxCount:1},
        {name:'sign_photo',maxCount:1}
    ]),
    submitVerificationRequest
);

router.get('/file/:filename',verifyFileToken,getVerificationFile);

module.exports=router;