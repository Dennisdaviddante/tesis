/**
 * Rutas para la gestión de usuarios
 * Maneja la creación, actualización y eliminación de usuarios
 */

const { Router } = require('express');
const { check } = require('express-validator');
const User = require('../models/user');
const { userget, userpost, userdelete, userput, getAdmin } = require('../controllers/user.controller.js');
const { validateFields } = require('../middlewares/validate-fields');
const { esRoleValid, esEmailValid } = require('../helpers/db-validator');
const { validateJWT } = require('../middlewares/vlaidate-jwt.js');

const router = Router();

/**
 * GET /api/users
 * Obtiene la lista de psicólogos
 * Solo accesible por administradores
 */
router.get('/', [
    validateJWT
], userget)

/**
 * GET /api/users/admin
 * Obtiene los datos del administrador
 */
router.get('/admin', getAdmin)

// Middleware condicional para validar JWT
const conditionalJWT = async (req, res, next) => {
    try {
        const { role } = req.body;
        
        // Si es un intento de crear admin, verificar si ya existe uno
        const adminExists = await User.exists({ role: 'ADMIN' });
        
        if (!adminExists) {
            console.log('No existe admin, permitiendo creación sin token');
            return next();
        }

        // Verificar si hay token
        const token = req.header('x-token');
        if (!token) {
            return res.status(401).json({
                msg: 'No hay token en la petición'
            });
        }

        try {
            // Para cualquier otro caso, validar el token
            return validateJWT(req, res, next);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    msg: 'Token expirado, por favor inicie sesión nuevamente'
                });
            }
            throw error;
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Error en la validación del token'
        });
    }
};

router.post('/', [
    conditionalJWT,
    check('firstName', 'El nombre es obligatorio').not().isEmpty(),
    check('lastName', 'El apellido es obligatorio').not().isEmpty(),
    check('password', 'El password debe ser de mas de 6 letras').isLength({min:6}),
    check('email', 'El correo no es valido').isEmail(),
    check('email').custom(esEmailValid),
    check('role').custom(esRoleValid),
    validateFields
], userpost)

/**
 * DELETE /api/users/:id
 * Desactiva un usuario (soft delete)
 * Solo accesible por administradores
 */
router.delete('/:id', [
    validateJWT,
    check('id', 'No es un ID válido').isMongoId(),
    validateFields
], userdelete)

/**
 * PUT /api/users/:id
 * Actualizar datos de usuario
 * Requiere token JWT
 */
router.put('/:id', [
    validateJWT,
    check('id', 'No es un ID válido').isMongoId(),
    check('firstName', 'El nombre es obligatorio').optional().not().isEmpty(),
    check('lastName', 'El apellido es obligatorio').optional().not().isEmpty(),
    check('email', 'El correo no es válido').optional().isEmail(),
    check('email').optional().custom(esEmailValid),
    check('password', 'La contraseña debe tener al menos 6 caracteres').optional().isLength({ min: 6 }),
    validateFields
], userput)



module.exports = router; 