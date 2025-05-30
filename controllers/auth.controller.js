const { request, response } = require('express');
const User  = require('../models/user');
const bcrypt = require('bcryptjs');
const { generateJWT } = require('../helpers/generate-jwt');

const validateToken = async (req = request, res = response) => {
    try {
        // El usuario ya está validado por el middleware validateJWT
        const user = req.user;

        res.json({
            ok: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.log('Error en validateToken:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error en el servidor'
        });
    }
}

const login = async (req, res= response) => {

    const { email, password } = req.body;
    
    try {
        // 1. Verificar si el usuario existe y está activo
        const user = await User.findOne({ email, status: true });
        if (!user) {
            return res.status(400).json({
                msg: "Usuario/contraseña no válidos"
            });
        }

        // 2. Verificar la contraseña
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                msg: "Usuario/contraseña no válidos"
            });
        }

        // 3. Generar el JWT
        const token = await generateJWT(user.id);

        // 4. Devolver respuesta
        res.json({
            msg: 'Login exitoso',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            },
            token
        });

    } catch (error) {
        console.log('Error en login:', error);
        res.status(500).json({
            msg: 'Error en el servidor'
        });
    }
}

module.exports = { login, validateToken }