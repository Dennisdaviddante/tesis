const { Router } = require('express');
const { getAdminStats } = require('../controllers/statistics.controller');
const { validateJWT } = require('../middlewares/validate-jwt');
const { isAdmin } = require('../middlewares/validate-roles');

const router = Router();

// Obtener estadísticas (solo admin)
router.get('/admin', [
    validateJWT,
    isAdmin
], getAdminStats);

module.exports = router;
