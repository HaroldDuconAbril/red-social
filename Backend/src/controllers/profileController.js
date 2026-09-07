const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 1. Obtener mi perfil (Ahora incluye categoría y subcategoría)
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({ error: 'Usuario no identificado.' });
        }

        const profileQuery = await pool.query(
            `SELECT 
                u.id,
                u.username AS alias_name,
                u.email,
                u.role,
                COALESCE(p.profile_type::text, 'No definido') AS profile_type,
                COALESCE(p.description, '') AS bio,
                COALESCE(p.location, '') AS location,
                COALESCE(p.profile_picture_url, '') AS profile_picture_url,
                p.subcategory_id,
                COALESCE(c.name, 'Sin Categoría') AS category_name,
                COALESCE(s.name, 'Sin Grupo') AS subcategory_name
             FROM users u
             LEFT JOIN profiles p ON u.id = p.user_id
             LEFT JOIN subcategories s ON p.subcategory_id = s.id
             LEFT JOIN categories c ON s.category_id = c.id
             WHERE u.id = $1`,
            [userId]
        );

        if (profileQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.status(200).json(profileQuery.rows[0]);
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ error: 'Error interno.' });
    }
};

// 2. Actualizar mi perfil
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio, alias_name, location } = req.body; 
        let profile_picture_url = null;

        if (!userId) {
            return res.status(401).json({ error: 'Usuario no identificado.' });
        }

        if (req.file) {
            profile_picture_url = req.file.path;
        }

        if (alias_name) {
            await pool.query(
                'UPDATE users SET username = $1 WHERE id = $2',
                [alias_name, userId]
            );
        }

        const existingProfile = await pool.query(
            'SELECT user_id FROM profiles WHERE user_id = $1',
            [userId]
        );

        let updatedProfile;

        if (existingProfile.rows.length === 0) {
            updatedProfile = await pool.query(
                `INSERT INTO profiles (user_id, description, location, profile_picture_url)
                 VALUES ($1, $2, $3, $4)
                 RETURNING description AS bio, location, profile_picture_url`,
                [userId, bio || '', location || '', profile_picture_url || '']
            );
        } else if (profile_picture_url) {
            updatedProfile = await pool.query(
                `UPDATE profiles
                 SET description = $1, location = $2, profile_picture_url = $3, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $4
                 RETURNING description AS bio, location, profile_picture_url`,
                [bio || '', location || '', profile_picture_url, userId]
            );
        } else {
            updatedProfile = await pool.query(
                `UPDATE profiles
                 SET description = $1, location = $2, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $3
                 RETURNING description AS bio, location, profile_picture_url`,
                [bio || '', location || '', userId]
            );
        }

        res.status(200).json({
            message: 'Perfil actualizado exitosamente',
            profile: updatedProfile.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({ error: 'Error interno.' });
    }
};

// 3. Obtener la comunidad (Con soporte para Admin global o Usuarios segmentados)
const getAllProfiles = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({ error: 'Usuario no identificado.' });
        }

        const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const userRole = userCheck.rows[0]?.role;

        if (userRole === 'admin') {
            const adminQuery = await pool.query(
                `SELECT 
                    u.id AS user_id,
                    u.username AS alias_name,
                    u.role,
                    COALESCE(p.profile_type::text, 'No definido') AS profile_type,
                    COALESCE(p.description, '') AS bio,
                    COALESCE(p.location, '') AS location,
                    COALESCE(p.profile_picture_url, '') AS profile_picture_url,
                    c.name AS category_name,
                    s.name AS subcategory_name
                 FROM users u
                 LEFT JOIN profiles p ON u.id = p.user_id
                 LEFT JOIN subcategories s ON p.subcategory_id = s.id
                 LEFT JOIN categories c ON s.category_id = c.id
                 WHERE u.id != $1`,
                [userId]
            );
            return res.status(200).json(adminQuery.rows);
        }

        const userCategoryQuery = await pool.query(
            'SELECT subcategory_id FROM profiles WHERE user_id = $1',
            [userId]
        );

        const mySubcategoryId = userCategoryQuery.rows[0]?.subcategory_id;

        if (!mySubcategoryId) {
            return res.status(200).json([]);
        }

        const query = await pool.query(
            `SELECT 
                u.id AS user_id,
                u.username AS alias_name,
                u.role,
                COALESCE(p.profile_type::text, 'No definido') AS profile_type,
                COALESCE(p.description, '') AS bio,
                COALESCE(p.location, '') AS location,
                COALESCE(p.profile_picture_url, '') AS profile_picture_url,
                c.name AS category_name,
                s.name AS subcategory_name
             FROM users u
             JOIN profiles p ON u.id = p.user_id
             LEFT JOIN subcategories s ON p.subcategory_id = s.id
             LEFT JOIN categories c ON s.category_id = c.id
             WHERE u.id != $1 
               AND p.subcategory_id = $2`,
            [userId, mySubcategoryId]
        );

        res.status(200).json(query.rows);
    } catch (error) {
        console.error('Error al obtener perfiles:', error);
        res.status(500).json({ error: 'Error al cargar la comunidad' });
    }
};

// 4. Subir foto a la Galería Privada
const uploadPrivatePhoto = async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen.' });
        }

        // req.file.filename aquí es el public_id de Cloudinary (ej: red_social/private/uuid-123-456)
        // Lo guardamos tal cual: es lo que necesitamos luego para generar la URL firmada
        const photoUrl = req.file.filename;

        const newPhoto = await pool.query(
            `INSERT INTO private_photos (user_id, photo_url) 
             VALUES ($1, $2) RETURNING id, photo_url, created_at`,
            [userId, photoUrl]
        );

        res.status(201).json({ 
            message: 'Foto privada subida exitosamente', 
            photo: {
                ...newPhoto.rows[0],
                // Devolvemos también la URL de acceso lista para usar en el <img>
                access_url: `/api/profiles/gallery/file/${encodeURIComponent(photoUrl)}`
            }
        });
    } catch (error) {
        console.error('Error al subir foto privada:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// 5. Obtener fotos del usuario actual
const getMyPrivatePhotos = async (req, res) => {
    try {
        const photos = await pool.query(
            'SELECT id, photo_url FROM private_photos WHERE user_id = $1 ORDER BY created_at DESC', 
            [req.user.id]
        );
        // photo_url aquí es el public_id de Cloudinary; armamos la URL de nuestro propio
        // endpoint (que a su vez valida permisos y redirige a la URL firmada)
        const withAccessUrl = photos.rows.map(p => ({
            ...p,
            access_url: `/api/profiles/gallery/file/${encodeURIComponent(p.photo_url)}`
        }));
        res.status(200).json(withAccessUrl);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar fotos.' });
    }
};

// 6. Eliminar foto específica
const deletePrivatePhoto = async (req, res) => {
    try {
        const { photoId } = req.params;
        const photo = await pool.query(
            'SELECT photo_url FROM private_photos WHERE id = $1 AND user_id = $2',
            [photoId, req.user.id]
        );

        if (photo.rows.length > 0) {
            // Borramos también el archivo real en Cloudinary, no solo el registro en BD
            await cloudinary.uploader.destroy(photo.rows[0].photo_url, { type: 'authenticated' });
        }

        await pool.query('DELETE FROM private_photos WHERE id = $1 AND user_id = $2', [photoId, req.user.id]);
        res.status(200).json({ message: 'Foto eliminada' });
    } catch (error) {
        console.error('Error al eliminar foto privada:', error);
        res.status(500).json({ error: 'Error al eliminar.' });
    }
};

// filename aquí llega como el public_id de Cloudinary (puede incluir "/", por eso decodeURIComponent)
const getPrivatePhoto = async (req, res) => {
    try {
        const publicId = decodeURIComponent(req.params.filename);

        const photoQuery = await pool.query(
            'SELECT user_id FROM private_photos WHERE photo_url = $1',
            [publicId]
        );

        if (photoQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Foto no encontrada.' });
        }

        const ownerId = photoQuery.rows[0].user_id;
        const requester = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
        let allowed = requester.rows[0]?.role === 'admin' || ownerId === req.user.id;

        if (!allowed) {
            const friendship = await pool.query(
                `SELECT 1 FROM friendships
                 WHERE status = 'aceptada'
                 AND ((sender_id = $1 AND receiver_id = $2)
                   OR (sender_id = $2 AND receiver_id = $1))
                 LIMIT 1`,
                [req.user.id, ownerId]
            );
            allowed = friendship.rows.length > 0;
        }

        if (!allowed) return res.status(403).json({ error: 'No tienes acceso a esta foto.' });

        // Generamos una URL firmada de Cloudinary, válida solo un rato corto (5 minutos)
        const expiresAt = Math.floor(Date.now() / 1000) + 300;
        const signedUrl = cloudinary.utils.private_download_url(publicId, null, {
            type: 'authenticated',
            resource_type: 'image',
            expires_at: expiresAt
        });

        return res.redirect(signedUrl);
    } catch (error) {
        console.error('Error al servir foto privada:', error);
        res.status(500).json({ error: 'Error al cargar la foto.' });
    }
};

// 7. Obtener perfil detallado y fotos (Con bloqueo de privacidad)
const getUserProfileWithPhotos = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const requesterId = req.user.id;
        
        const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [requesterId]);
        const requesterRole = userCheck.rows[0]?.role;

        const profileQuery = await pool.query(
            `SELECT 
                u.id AS user_id,
                u.username AS alias_name,
                u.email,
                u.role,
                COALESCE(p.profile_type::text, 'No definido') AS profile_type,
                COALESCE(p.description, '') AS bio,
                COALESCE(p.location, '') AS location,
                COALESCE(p.profile_picture_url, '') AS profile_picture_url,
                c.name AS category_name,
                s.name AS subcategory_name
             FROM users u
             LEFT JOIN profiles p ON u.id = p.user_id
             LEFT JOIN subcategories s ON p.subcategory_id = s.id
             LEFT JOIN categories c ON s.category_id = c.id
             WHERE u.id = $1`,
            [targetUserId]
        );

        if (profileQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Perfil no encontrado.' });
        }

        let isFriend = false;
        
        if (requesterRole === 'admin' || requesterId === targetUserId) {
            isFriend = true;
        } else {
            const friendCheck = await pool.query(
                `SELECT * FROM friendships 
                 WHERE ((sender_id = $1 AND receiver_id = $2) 
                    OR (sender_id = $2 AND receiver_id = $1))
                   AND status = 'aceptada'`,
                [requesterId, targetUserId]
            );
            
            if (friendCheck.rows.length > 0) {
                isFriend = true;
            }
        }

        let photos = [];
        if (isFriend) {
            const photosQuery = await pool.query(
                'SELECT id, photo_url FROM private_photos WHERE user_id = $1 ORDER BY created_at DESC',
                [targetUserId]
            );
            photos = photosQuery.rows.map(p => ({
                ...p,
                access_url: `/api/profiles/gallery/file/${encodeURIComponent(p.photo_url)}`
            }));
        }

        res.status(200).json({
            profile: profileQuery.rows[0],
            photos: photos,
            isFriend: isFriend 
        });

    } catch (error) {
        console.error('Error al obtener perfil de usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

module.exports = {
    getMyProfile,
    updateProfile,
    getAllProfiles,
    uploadPrivatePhoto,
    getMyPrivatePhotos,
    deletePrivatePhoto,
    getPrivatePhoto,
    getUserProfileWithPhotos 
};