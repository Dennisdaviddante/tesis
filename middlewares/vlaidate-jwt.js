/**
 * Middleware de validación de JWT
 * Verifica que el token sea válido y agrega la información del usuario al request
 */

const jwt = require('jsonwebtoken');
const User = require('../models/user');

const validateJWT = async (req = request, res = response, next) => {
    try {
        const token = req.header('x-token');

        if (!token) {
            return res.status(401).json({
                msg: 'No hay token en la petición'
            });
        }

        // Verificar token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRETORPRIVATEKEY);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    msg: 'Token expirado, por favor inicie sesión nuevamente'
                });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    msg: 'Token no válido'
                });
            }
            throw error;
        }

        // Leer el usuario que corresponde al uid
        const user = await User.findById(decoded.uid);

        if (!user) {
            return res.status(401).json({
                msg: 'Token no válido - usuario no existe en DB'
            });
        }

        // Verificar si el usuario está activo
        if (!user.status) {
            return res.status(401).json({
                msg: 'Token no válido - usuario inactivo'
            });
        }

        req.user = user;
        next();

    } catch (error) {
        console.log('Error en validateJWT:', error);
        return res.status(500).json({
            msg: 'Error en la validación del token'
        });
    }
}

module.exports = { validateJWT };
