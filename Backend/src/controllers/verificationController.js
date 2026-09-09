// src/controllers/verificationController.js
const pool = require('../config/db');
const cloudinary = require('cloudinary').v2;

const submitVerificationRequest = async (req, res) => {
    try {
        const { email, user_description, phone } = req.body || {};

        if (!email || !user_description) {
            return res.status(400).json({ error: 'Faltan datos obligatorios.' });
        }

        const fullBodyPhoto = req.files?.full_body_photo?.[0];
        const signPhoto = req.files?.sign_photo?.[0];

        if (!fullBodyPhoto || !signPhoto) {
            return res.status(400).json({ error: 'Debes subir ambas fotos.' });
        }

        // req.file.filename aquí es el public_id de Cloudinary (gracias a multer-storage-cloudinary)
        const full_body_photo_url = `/api/verification/file/${encodeURIComponent(fullBodyPhoto.filename)}`;
        const sign_photo_url = `/api/verification/file/${encodeURIComponent(signPhoto.filename)}`;

        const newRequest = await pool.query(
            `INSERT INTO verification_requests (email, user_description, full_body_photo_url, sign_photo_url, status, rejection_count, phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [email, user_description, full_body_photo_url, sign_photo_url, 'pendiente', 0, phone || null]
        );

        res.status(201).json({
            message: 'Solicitud enviada.',
            data: newRequest.rows[0]
        });
    } catch (error) {
        console.error('Error al enviar solicitud de verificación:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

const getVerificationFile = async (req, res) => {
    try {
        const requester = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
        if (requester.rows[0]?.role !== 'admin') {
            return res.status(403).json({ error: 'Se requieren permisos de administrador.' });
        }

        const publicId = decodeURIComponent(req.params.filename);

        const expiresAt = Math.floor(Date.now() / 1000) + 300; // 5 minutos
        const signedUrl = cloudinary.utils.private_download_url(publicId, null, {
            type: 'authenticated',
            resource_type: 'image',
            expires_at: expiresAt
        });

        return res.redirect(signedUrl);
    } catch (error) {
        console.error('Error al servir archivo de verificación:', error);
        res.status(500).json({ error: 'Error al cargar el archivo.' });
    }
};

module.exports = { submitVerificationRequest, getVerificationFile };