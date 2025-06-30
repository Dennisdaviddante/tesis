const { Router } = require('express');
const { check } = require('express-validator');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');
const { isPsychologist } = require('../middlewares/validate-roles');
const {
    createAssessment,
    getAssessments,
    getAssessmentById,
    getStatistics,
    updateFinalRemarks
} = require('../controllers/suicideAssessment.controller');

const router = Router();

// Todas las rutas necesitan token y ser psicólogo
router.use(validateJWT);
router.use(isPsychologist);
// Actualizar observaciones generales después de guardar la evaluación
router.put('/:id/remarks', [
    check('id', 'El ID no es válido').isMongoId(),
    check('finalRemarks', 'Las observaciones no pueden estar vacías').not().isEmpty(),
    validateFields
], updateFinalRemarks);
// Crear una nueva evaluación
router.post('/', [
    check('studentId', 'El ID del estudiante es obligatorio').isMongoId(),
    check('deathWish.present', 'El campo deathWish.present es obligatorio').isBoolean(),
    check('nonSpecificActiveSuicidalThoughts.present', 'El campo nonSpecificActiveSuicidalThoughts.present es obligatorio').isBoolean(),
    check('activeSuicidalIdeationWithMethods.present', 'El campo activeSuicidalIdeationWithMethods.present es obligatorio').isBoolean(),
    check('activeSuicidalIdeationWithIntent.present', 'El campo activeSuicidalIdeationWithIntent.present es obligatorio').isBoolean(),
    check('activeSuicidalIdeationWithPlan.present', 'El campo activeSuicidalIdeationWithPlan.present es obligatorio').isBoolean(),
    validateFields
], createAssessment);

// Obtener estadísticas detalladas
router.get('/statistics', getStatistics);

// Obtener todas las evaluaciones
router.get('/', getAssessments);

// Obtener una evaluación específica
router.get('/:id', [
    check('id', 'El ID no es válido').isMongoId(),
    validateFields
], getAssessmentById);

module.exports = router;
