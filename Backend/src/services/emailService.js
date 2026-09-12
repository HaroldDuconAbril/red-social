const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Escapa el HTML básico para que un valor inesperado no pueda romper la
// estructura del correo o inyectar markup/scripts si algún día el link
// dejara de ser generado siempre por nosotros mismos.
const escapeHtml = (value) =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const sendApprovalEmail = async (toEmail, link) => {
    try {
        // El link ya lo construimos nosotros (FRONTEND_ORIGIN + token), pero
        // igual validamos que sea una URL http(s) bien formada antes de
        // interpolarlo en el HTML del correo, y lo escapamos por si acaso.
        const parsedUrl = new URL(link);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new Error('Enlace de activación con protocolo no permitido.');
        }
        const safeLink = escapeHtml(parsedUrl.toString());

        const { data, error } = await resend.emails.send({
            from: 'Administración - Red Social <Autorizaciones@haducon.shop>',
            to: toEmail,
            subject: '¡Tu solicitud ha sido aprobada!',
            html: `
                <h1>¡Felicidades!</h1>
                <p>Tu identidad ha sido verificada correctamente por nuestro equipo.</p>
                <p>Ya puedes completar la creación de tu usuario, contraseña y foto de perfil ingresando al siguiente enlace:</p>
                <a href="${safeLink}">Completar mi registro</a>
                <p>Este enlace es privado, de un solo uso y expira pronto. Si no fuiste tú quien solicitó esto, ignora este correo.</p>
            `
        });

        if (error) {
            console.error('❌ Error al enviar el correo con Resend:', error);
            throw new Error(error.message || 'Error al enviar el correo');
        }

        console.log(`✅ Correo de aprobación enviado exitosamente a ${toEmail}`);
        return true;
    } catch (error) {
        console.error('❌ Error crítico al intentar enviar el correo:', error.message);
        throw error;
    }
};

module.exports = {
    sendApprovalEmail
};