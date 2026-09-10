// src/controllers/verificationController.js
const pool=require('../config/db');
const path=require('path');
const fs=require('fs');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+()\-\s]{6,20}$/;

// Borra del disco los archivos que ya se habían guardado si algo más adelante
// falla: antes, un error en el INSERT dejaba fotos huérfanas en el servidor
// para siempre (ocupando espacio y quedando accesibles indefinidamente).
const cleanupUploadedFiles=(req)=>{
    [req.files?.full_body_photo?.[0], req.files?.sign_photo?.[0]]
        .filter(Boolean)
        .forEach((file)=>fs.unlink(file.path, ()=>{}));
};

const submitVerificationRequest=async(req,res)=>{
    try{
        const {email,user_description,phone}=req.body||{};

        if(!email||!user_description){
            cleanupUploadedFiles(req);
            return res.status(400).json({
                error:'Faltan datos obligatorios.',
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        if(!EMAIL_REGEX.test(normalizedEmail)){
            cleanupUploadedFiles(req);
            return res.status(400).json({ error: 'El correo no tiene un formato válido.' });
        }

        if(phone && !PHONE_REGEX.test(phone)){
            cleanupUploadedFiles(req);
            return res.status(400).json({ error: 'El teléfono no tiene un formato válido.' });
        }

        const fullBodyPhoto=req.files?.full_body_photo?.[0];
        const signPhoto=req.files?.sign_photo?.[0];

        if(!fullBodyPhoto||!signPhoto){
            cleanupUploadedFiles(req);
            return res.status(400).json({
                error:'Debes subir ambas fotos.',
            });
        }

        const full_body_photo_url=`/api/verification/file/${fullBodyPhoto.filename}`;
        const sign_photo_url=`/api/verification/file/${signPhoto.filename}`;

        const newRequest=await pool.query(
            `INSERT INTO verification_requests (email,user_description,full_body_photo_url,sign_photo_url,status,rejection_count,phone)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [normalizedEmail,user_description,full_body_photo_url,sign_photo_url,'pendiente',0,phone||null]
        );

        res.status(201).json({
            message:'Solicitud enviada.',
            data:newRequest.rows[0]
        });
    }catch(error){
        console.error('Error al enviar solicitud de verificación:',error);
        cleanupUploadedFiles(req);
        res.status(500).json({
            error:'Error interno del servidor.',
        });
    }
};

const getVerificationFile=async(req,res)=>{
    try{
        const requester=await pool.query('SELECT role FROM users WHERE id = $1',[req.user.id]);
        if(requester.rows[0]?.role !== 'admin'){
            return res.status(403).json({error:'Se requieren permisos de administrador.'});
        }

        const filePath=path.join(__dirname,'../../uploads/verification',path.basename(req.params.filename));
        if(!fs.existsSync(filePath)) return res.status(404).json({error:'Archivo no encontrado.'});
        res.sendFile(filePath);
    }catch(error){
        console.error('Error al servir archivo de verificación:',error);
        res.status(500).json({error:'Error al cargar el archivo.'});
    }
};

module.exports={submitVerificationRequest,getVerificationFile};