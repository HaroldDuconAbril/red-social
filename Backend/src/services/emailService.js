const nodemailer = require('nodemailer');

const sendApprovalEmail = async (toEmail, link) => {
    // 1. Crear el transportador (transporter) configurado para Gmail
    //    Usamos host/port explícitos (en vez de "service: 'gmail'") y
    //    forzamos IPv4 (family: 4) porque el entorno de Render a veces
    //    falla al conectar por IPv6 a los servidores de Gmail.
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        family: 4,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    });

    // 2. Configurar el contenido del correo
    const mailOptions = {
        from: `"Moderación - Red Social" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "¡Tu solicitud ha sido aprobada!",
        html: `
            <h1>¡Felicidades!</h1>
            <p>Tu identidad ha sido verificada correctamente por nuestro equipo.</p>
            <p>Ya puedes completar la creación de tu usuario, contraseña y foto de perfil ingresando al siguiente enlace:</p>
            <a href="${link}">Completar mi registro</a>
            <p>Este enlace es privado y de un solo uso.</p>
        `
    };

    // 3. Enviar el correo
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Correo de aprobación enviado exitosamente a ${toEmail}`);
        return true;
    } catch (error) {
        console.error('❌ Error crítico al intentar enviar el correo con Nodemailer:', error.message);
        throw error; 
    }
};

module.exports = {
    sendApprovalEmail
};