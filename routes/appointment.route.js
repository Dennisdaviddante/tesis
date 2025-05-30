const { Router } = require('express');
const { check } = require('express-validator');
const { validateJWT } = require('../middlewares/vlaidate-jwt');
const { validateFields } = require('../middlewares/validate-fields');
const { 
    createAppointment,
    getAppointments,
    updateAppointment,
    cancelAppointment
} = require('../controllers/appointment.controller');

const router = Router();

// Todas las rutas requieren token
router.use(validateJWT);

/**
 * GET /api/appointments
 * Obtener todas las citas
 * Query params opcionales:
 * - status: PENDIENTE | COMPLETADA | CANCELADA
 */
router.get('/', getAppointments);

/**
 * POST /api/appointments
 * Crear una nueva cita
 */
router.post('/', [
    validateJWT,
    check('studentId', 'El ID del estudiante no es válido').isMongoId(),
    check('date', 'La fecha y hora es obligatoria').not().isEmpty(),
    check('reason', 'El motivo de la cita es obligatorio').not().isEmpty(),
    validateFields
], createAppointment);

/**
 * PUT /api/appointments/:id
 * Actualizar una cita
 */
router.put('/:id', [
    validateJWT,
    check('id', 'No es un ID válido').isMongoId(),
    validateFields
], updateAppointment);

/**
 * DELETE /api/appointments/:id
 * Cancelar una cita (soft delete)
 */
router.delete('/:id', [
    validateJWT,
    check('id', 'No es un ID válido').isMongoId(),
    validateFields
], cancelAppointment);

module.exports = router;
