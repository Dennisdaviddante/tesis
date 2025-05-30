const { response } = require('express');

const isAdmin = (req, res = response, next) => {
    if (!req.user) {
        return res.status(500).json({
            msg: 'Se quiere verificar el rol sin validar el token primero'
        });
    }

    const { role, name } = req.user;

    if (role !== 'ADMIN') {
        return res.status(401).json({
            msg: `${name} no es administrador - No puede hacer esto`
        });
    }

    next();
}

const isPsychologist = (req, res = response, next) => {
    if (!req.user) {
        return res.status(500).json({
            msg: 'Se quiere verificar el rol sin validar el token primero'
        });
    }

    const { role, name } = req.user;

    if (role !== 'PSYCHOLOGIST' && role !== 'ADMIN') {
        return res.status(401).json({
            msg: `${name} no tiene los permisos necesarios para esta acción`
        });
    }

    next();
}

module.exports = {
    isAdmin,
    isPsychologist
}
