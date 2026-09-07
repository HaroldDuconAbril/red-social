require('dotenv').config();
const http = require('http'); // <-- Importamos módulo HTTP nativo de Node
const app = require('./src/app');
const pool = require('./src/config/db'); 
const setupSocket = require('./src/socket'); // <-- Importamos nuestra configuración de WebSockets

const PORT = process.env.PORT || 5000;

// Creamos el servidor HTTP usando nuestra aplicación de Express
const server = http.createServer(app);

// Inicializamos Socket.io pasándole el servidor HTTP
setupSocket(server);

// Ponemos a escuchar el servidor modificado (no app.listen, sino server.listen)
server.listen(PORT, () => {
    console.log(`🚀 Servidor HTTP y WebSockets corriendo en el puerto ${PORT}`);
});