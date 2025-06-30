const { Router } = require('express');
const { check } = require('express-validator');
const { validateJWT } = require('../middlewares/vlaidate-jwt');
const { validateFields } = require('../middlewares/validate-fields');
const { esEmailValid } = require('../helpers/db-validator');
const { 
    createStudent, 
    getStudents, 
    updateStudent, 
    deleteStudent,
    searchStudents,
    addClinicalNote,
    updateClinicalNote,
    deleteClinicalNote,
    getStudentById,
    getStudentsWithAssessment
} = require('../controllers/student.controller');

const router = Router();

// Todas las rutas requieren token
router.use(validateJWT);

// Obtener estudiantes
router.get('/', getStudents);
router.get('/by-psychologist/:id', validateJWT, getStudentsWithAssessment);
// Obtener estudiante por ID
router.get('/:id', [
    validateJWT,
    check('id', 'No es un ID válido').isMongoId(),
    validateFields
], getStudentById);

// Crear estudiante
/**
 * POST /api/students
 * Crear un nuevo estudiante
 * Solo accesible por psicólogos autenticados
 */
router.post('/', [
    check('firstName', 'El nombre es obligatorio').not().isEmpty(),
    check('lastName', 'El apellido es obligatorio').not().isEmpty(),
    check('age', 'La edad es obligatoria y debe ser un número').isInt({ min: 0 }),
    check('phone', 'El teléfono es obligatorio').not().isEmpty(),
    check('email', 'El email no es válido').isEmail(),
    check('email').custom(esEmailValid),
    check('city', 'La ciudad es obligatoria').not().isEmpty(),
    check('gender', 'El género debe ser MASCULINO, FEMENINO u OTRO').isIn(['MASCULINO', 'FEMENINO', 'OTRO']),
    check('career', 'La carrera es obligatoria').not().isEmpty(),
    check('level', 'El nivel académico es obligatorio').not().isEmpty(),
    check('employmentStatus', 'La situación laboral debe ser válida')
        .isIn(['EMPLEADO', 'DESEMPLEADO', 'ESTUDIANTE_TIEMPO_COMPLETO']),
    check('income', 'Los ingresos deben ser un número válido').isNumeric(),
    validateFields
], createStudent);

/**
 * PUT /api/students/:id
 * Actualizar datos de un estudiante
 * Solo el psicólogo asignado o admin pueden actualizar
 */
router.put('/:id', [
    validateJWT,
    check('id', 'No es un ID válido').isMongoId(),
    check('firstName', 'El nombre es obligatorio').optional().not().isEmpty(),
    check('lastName', 'El apellido es obligatorio').optional().not().isEmpty(),
    check('age', 'La edad debe ser un número válido').optional().isInt({ min: 0 }),
    check('phone', 'El teléfono es obligatorio').optional().not().isEmpty(),
    check('email', 'El email no es válido').optional().isEmail(),
    check('city', 'La ciudad es obligatoria').optional().not().isEmpty(),
    check('gender', 'El género debe ser MASCULINO, FEMENINO u OTRO')
        .optional().isIn(['MASCULINO', 'FEMENINO', 'OTRO']),
    check('career', 'La carrera es obligatoria').optional().not().isEmpty(),
    check('level', 'El nivel académico es obligatorio').optional().not().isEmpty(),
    check('employmentStatus', 'La situación laboral debe ser válida')
        .optional().isIn(['EMPLEADO', 'DESEMPLEADO', 'ESTUDIANTE_TIEMPO_COMPLETO']),
    check('income', 'Los ingresos deben ser un número válido').optional().isNumeric(),
    validateFields
], updateStudent);

/**
 * DELETE /api/students/:id
 * Desactiva un estudiante (soft delete)
 * Solo el psicólogo asignado o admin pueden desactivar
 */
router.delete('/:id', [
    validateJWT,
    check('id', 'No es un ID válido').isMongoId(),
    validateFields
], deleteStudent);

/**
 * GET /api/students/search
 * Busca estudiantes por nombre
 * Requiere token JWT
 */
router.get('/search', [
    validateJWT,
    check('firstName', 'El nombre a buscar es requerido').not().isEmpty(),
    validateFields
], searchStudents);

/**
 * PUT /api/students/:id/clinical-notes/:noteId
 * Actualiza una nota clínica
 * Solo el psicólogo que creó la nota puede actualizarla
 */
router.put('/:id/clinical-notes/:noteId', [
    validateJWT,
    check('id', 'No es un ID válido').isMongoId(),
    check('noteId', 'No es un ID válido').isMongoId(),
    check('note', 'La nota es obligatoria').not().isEmpty(),
    validateFields
], updateClinicalNote);

/**
 * DELETE /api/students/:id/clinical-notes/:noteId
 * Elimina una nota clínica
 * Solo el psicólogo que creó la nota puede eliminarla
 */
router.delete('/:id/clinical-notes/:noteId', [
    validateJWT,
    check('id', 'No es un ID válido').isMongoId(),
    check('noteId', 'No es un ID válido').isMongoId(),
    validateFields
], deleteClinicalNote);

/**
 * POST /api/students/:id/clinical-notes
 * Agrega una nota clínica a un estudiante
 * Solo el psicólogo asignado puede agregar notas
 */
router.post('/:id/clinical-notes', [
    validateJWT,
    check('id', 'No es un ID válido').isMongoId(),
    check('note', 'La nota clínica es obligatoria').not().isEmpty(),
    validateFields
], addClinicalNote);

module.exports = router;
