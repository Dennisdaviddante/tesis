const { Router } = require('express');
const {check} = require('express-validator');
const { login, validateToken } = require('../controllers/auth.controller');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');
const router = Router();


// Ruta para validar el token y obtener información del usuario
router.get('/', validateJWT, validateToken);

router.post('/login',[
    check('email', 'the email is not valid').isEmail(),
    check('password', 'the password is not valid').not().isEmpty(),
    validateFields
] ,login)
router.get('/me', validateJWT, async (req, res) => {
    res.json({ user: req.user });
  });
module.exports = router;
 