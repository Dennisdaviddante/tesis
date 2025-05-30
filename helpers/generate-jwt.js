const jwt = require('jsonwebtoken');

const generateJWT = (uid = '') => {
    return new Promise((resolve, reject) => {
        try {
            // Verificar que el uid existe
            if (!uid) {
                reject('Se requiere un ID de usuario para generar el token');
                return;
            }

            // Configurar el payload
            const payload = { uid };

            // Generar el token con expiración de 24 horas
            jwt.sign(
                payload, 
                process.env.SECRETORPRIVATEKEY, 
                { expiresIn: '24h' },
                (err, token) => {
                    if (err) {
                        console.log('Error al generar token:', err);
                        reject('No se pudo generar el token');
                    } else {
                        resolve(token);
                    }
                }
            );

        } catch (error) {
            console.log('Error en generateJWT:', error);
            reject('Error al generar el token');
        }
    });
}

module.exports = { generateJWT }