// src/controllers/adminController.js
const pool = require('../config/db');
const { sendApprovalEmail } = require('../services/emailService');

// Obtener todas las solicitudes pendientes para mostrarlas en el panel
const getPendingRequests = async (req, res) => {
    try {
        const query = await pool.query("SELECT * FROM verification_requests WHERE status = 'pendiente'");
        res.status(200).json(query.rows);
    } catch (error) {
        console.error('Error al obtener solicitudes pendientes:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Evaluar solicitudes de verificación
const reviewVerificationRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, subcategory_id } = req.body; 

        if (!['aprobado', 'rechazado'].includes(status)) {
            return res.status(400).json({ error: 'Estado inválido.' });
        }

        // 1. Actualizamos el estado de la solicitud
        const updateReq = await pool.query(
            `UPDATE verification_requests SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
            [status, req.user.id, id]
        );

        if (updateReq.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada.' });
        }

        const requestData = updateReq.rows[0];

        // 2. Si es aprobado y tenemos subcategory_id, lo guardamos en el perfil
        if (status === 'aprobado' && subcategory_id) {
            const userQuery = await pool.query('SELECT id FROM users WHERE email = $1', [requestData.email]);
            
            if (userQuery.rows.length > 0) {
                const targetUserId = userQuery.rows[0].id;
                
                await pool.query(
                    `INSERT INTO profiles (user_id, subcategory_id) 
                     VALUES ($1, $2) 
                     ON CONFLICT (user_id) 
                     DO UPDATE SET subcategory_id = EXCLUDED.subcategory_id`,
                    [targetUserId, subcategory_id]
                );
            }
        }

        // 3. NUEVO: si fue aprobado, avisamos al usuario por correo
        if (status === 'aprobado') {
            const link = `${process.env.FRONTEND_ORIGIN}/registro-final?email=${requestData.email}`;
            try {
                await sendApprovalEmail(requestData.email, link);
            } catch (emailError) {
                // No queremos que un fallo de correo tumbe la aprobación ya guardada en BD.
                // Solo lo registramos para revisarlo manualmente si hace falta.
                console.error('La solicitud se aprobó pero el correo falló:', emailError.message);
            }
        }

        res.status(200).json({ message: `Solicitud marcada como ${status}.`, request: requestData });
    } catch (error) {
        console.error('Error en revisión manual:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// NUEVA FUNCIÓN: Forzar creación/aprobación por correo (bypass de rechazos)
const forceApproveUser = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'El correo es obligatorio.' });

        const existingReq = await pool.query('SELECT * FROM verification_requests WHERE email = $1', [email]);

        let updatedRequest;
        if (existingReq.rows.length > 0) {
            const result = await pool.query(
                `UPDATE verification_requests SET status = 'aprobado', rejection_count = 0, updated_at = CURRENT_TIMESTAMP WHERE email = $1 RETURNING *`,
                [email]
            );
            updatedRequest = result.rows[0];
        } else {
            const result = await pool.query(
                `INSERT INTO verification_requests (email, status, rejection_count) VALUES ($1, 'aprobado', 0) RETURNING *`,
                [email]
            );
            updatedRequest = result.rows[0];
        }

        const link = `${process.env.FRONTEND_ORIGIN}/registro-final?email=${updatedRequest.email}`;
        await sendApprovalEmail(updatedRequest.email, link);

        res.status(200).json({ message: 'Usuario autorizado forzosamente. Correo enviado.' });
    } catch (error) {
        console.error('Error al forzar aprobación:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// NUEVA FUNCIÓN: Promover a Admin por Correo
const promoteAdminByEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'El correo es obligatorio.' });

        const promotedUser = await pool.query(
            'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, username, email, role',
            ['admin', email]
        );

        if (promotedUser.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado con ese correo.' });
        }

        res.status(200).json({
            message: 'Usuario promovido a admin con éxito.',
            user: promotedUser.rows[0]
        });
    } catch (error) {
        console.error('Error al promover usuario por correo:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

const createActivityAd = async (req, res) => {
    try {
        const { admin_id, title, description, event_date, location } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'El título y la descripción son obligatorios.' });
        }

        const newAd = await pool.query(
            `INSERT INTO activities_ads (admin_id, title, description, event_date, location) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [admin_id || null, title, description, event_date || null, location || null]
        );

        res.status(201).json({
            message: 'Anuncio de actividad creado exitosamente.',
            activity: newAd.rows[0]
        });
    } catch (error) {
        console.error('Error al crear el anuncio:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id, 
                u.username, 
                u.email, 
                u.role,
                p.subcategory_id,
                COALESCE(c.name, 'Sala General') AS category_name,
                COALESCE(s.name, 'Sin Subcategoría') AS subcategory_name
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            LEFT JOIN subcategories s ON p.subcategory_id = s.id
            LEFT JOIN categories c ON s.category_id = c.id
            ORDER BY u.username ASC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error al cargar usuarios.' });
    }
};

const updateUserGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { subcategory_id } = req.body;

        const profileCheck = await pool.query('SELECT user_id FROM profiles WHERE user_id = $1', [id]);

        if (profileCheck.rows.length === 0) {
            await pool.query(
                'INSERT INTO profiles (user_id, subcategory_id) VALUES ($1, $2)',
                [id, subcategory_id || null]
            );
        } else {
            await pool.query(
                'UPDATE profiles SET subcategory_id = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
                [subcategory_id || null, id]
            );
        }

        res.status(200).json({ message: 'Grupo de usuario actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar grupo:', error);
        res.status(500).json({ error: 'Error al actualizar el grupo del usuario.' });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUser = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, username, email, role',
            [id]
        );

        if (deletedUser.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.status(200).json({
            message: 'Usuario eliminado correctamente.',
            user: deletedUser.rows[0]
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error al eliminar usuario.' });
    }
};

const promoteToAdmin = async (req, res) => {
    const { id } = req.params;

    try {
        const promotedUser = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
            ['admin', id]
        );

        if (promotedUser.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.status(200).json({
            message: 'Usuario promovido a admin.',
            user: promotedUser.rows[0]
        });
    } catch (error) {
        console.error('Error al promover usuario:', error);
        res.status(500).json({ error: 'Error al promover usuario.' });
    }
};

const getCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar categorías' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
        }

        const newCategory = await pool.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING *',
            [name.trim()]
        );

        res.status(201).json({
            message: 'Categoría creada con éxito',
            category: newCategory.rows[0]
        });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(500).json({ error: 'Error al crear la categoría.' });
    }
};

const getSubcategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM subcategories ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar subcategorías' });
    }
};

const createSubcategory = async (req, res) => {
    try {
        const { category_id, name } = req.body;
        if (!category_id || !name || !name.trim()) {
            return res.status(400).json({ error: 'La categoría principal y el nombre son obligatorios.' });
        }

        const newSubcategory = await pool.query(
            'INSERT INTO subcategories (category_id, name) VALUES ($1, $2) RETURNING *',
            [category_id, name.trim()]
        );

        res.status(201).json({
            message: 'Subcategoría creada con éxito',
            subcategory: newSubcategory.rows[0]
        });
    } catch (error) {
        console.error('Error al crear subcategoría:', error);
        res.status(500).json({ error: 'Error al crear la subcategoría.' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
        }

        const updated = await pool.query(
            'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
            [name.trim(), id]
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada.' });
        }

        res.status(200).json({
            message: 'Categoría actualizada con éxito',
            category: updated.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({ error: 'Error al actualizar la categoría.' });
    }
};

const updateSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'El nombre del grupo es obligatorio.' });
        }

        const updated = await pool.query(
            'UPDATE subcategories SET name = $1 WHERE id = $2 RETURNING *',
            [name.trim(), id]
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({ error: 'Subcategoría no encontrada.' });
        }

        res.status(200).json({
            message: 'Subcategoría actualizada con éxito',
            subcategory: updated.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar subcategoría:', error);
        res.status(500).json({ error: 'Error al actualizar la subcategoría.' });
    }
};

const getActiveRooms = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM group_rooms WHERE is_active = true ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar las salas.' });
    }
};

const createRoom = async (req, res) => {
    try {
        const { name, room_type, participants } = req.body;

        if (!name || !room_type) {
            return res.status(400).json({ error: 'El nombre y tipo de sala son obligatorios.' });
        }

        const newRoom = await pool.query(
            `INSERT INTO group_rooms (name, room_type) VALUES ($1, $2) RETURNING *`,
            [name, room_type]
        );
        const roomId = newRoom.rows[0].id;

        if (participants && participants.length > 0) {
            for (let userId of participants) {
                await pool.query(
                    `INSERT INTO room_participants (room_id, user_id) VALUES ($1, $2)`,
                    [roomId, userId]
                );
            }
        }

        res.status(201).json({ message: 'Sala creada exitosamente.', room: newRoom.rows[0] });
    } catch (error) {
        console.error('Error al crear sala:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

const dissolveRoom = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE group_rooms SET is_active = false WHERE id = $1', [id]);
        res.status(200).json({ message: 'Sala disuelta exitosamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al disolver la sala.' });
    }
};

module.exports = {
    getPendingRequests,
    reviewVerificationRequest,
    forceApproveUser,
    promoteAdminByEmail,
    createActivityAd,
    getAllUsers,
    updateUserGroup,
    deleteUser,
    promoteToAdmin,
    getCategories,
    createCategory,
    updateCategory,
    getSubcategories,
    createSubcategory,
    updateSubcategory,
    getActiveRooms,
    createRoom,
    dissolveRoom
};