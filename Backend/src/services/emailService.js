const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendApprovalEmail = async (toEmail, link) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Moderación - Red Social <onboarding@resend.dev>',
            to: toEmail,
            subject: '¡Tu solicitud ha sido aprobada!',
            html: `
                <h1>¡Felicidades!</h1>
                <p>Tu identidad ha sido verificada correctamente por nuestro equipo.</p>
                <p>Ya puedes completar la creación de tu usuario, contraseña y foto de perfil ingresando al siguiente enlace:</p>
                <a href="${link}">Completar mi registro</a>
                <p>Este enlace es privado y de un solo uso.</p>
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