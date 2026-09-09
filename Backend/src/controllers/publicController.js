const pool = require('../config/db');

const getWallPosts = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, alias_name, content, created_at FROM public_wall_posts ORDER BY created_at DESC LIMIT 50'
        );
        res.status(200).json({
            message: 'Muro público cargado',
            posts: result.rows
        });
    } catch (error) {
        console.error('Error al cargar el muro público:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

const createWallPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'El contenido es obligatorio.' });
        }

        const trimmedContent = content.trim().slice(0, 250);

        const userQuery = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
        const aliasName = userQuery.rows.length > 0 ? userQuery.rows[0].username : 'Anónimo';

        const newPost = await pool.query(
            `INSERT INTO public_wall_posts (alias_name, content)
             VALUES ($1, $2) RETURNING *`,
            [aliasName, trimmedContent]
        );

        res.status(201).json({
            message: 'Publicación creada con éxito',
            post: newPost.rows[0]
        });

    } catch (error) {
        console.error('Error al crear publicación pública:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

const getActivitiesAds = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, title, description, event_date, location, image_url, created_at FROM activities_ads ORDER BY created_at DESC'
        );
        res.status(200).json({
            message: 'Anuncios de actividades cargados',
            activities: result.rows
        });
    } catch (error) {
        console.error('Error al cargar actividades:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

const createActivityAd = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado. Solo los administradores pueden publicar anuncios.' });
        }

        const { title, description, location, event_date } = req.body;
        let image_url = null;

        if (req.file) {
            image_url = req.file.path;
        }

        const newAd = await pool.query(
            `INSERT INTO activities_ads (title, description, location, event_date, image_url)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [title, description, location, event_date || null, image_url]
        );

        res.status(201).json({
            message: 'Anuncio publicado exitosamente',
            activity: newAd.rows[0]
        });
    } catch (error) {
        console.error('Error al crear anuncio:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

module.exports = {
    getWallPosts,
    createWallPost,
    getActivitiesAds,
    createActivityAd
};