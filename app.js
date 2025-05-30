// Cargar variables de entorno
require('dotenv').config();

// Verificar variables de entorno requeridas
if (!process.env.SECRETORPRIVATEKEY) {
    console.error('ERROR: La variable de entorno SECRETORPRIVATEKEY no está definida');
    console.error('Por favor, crea un archivo .env en la raíz del proyecto con el siguiente contenido:');
    console.error('SECRETORPRIVATEKEY=TuClaveSecretaAqui123');
    process.exit(1);
}

const Server = require('./models/server');

const server = new Server();

server.listen();