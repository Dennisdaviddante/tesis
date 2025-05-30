/**
 * Controlador para la gestión de estudiantes
 * Solo los psicólogos pueden crear y gestionar estudiantes
 */

const { response, request } = require('express');
const Student = require('../models/student');

/**
 * Crear un nuevo estudiante
 * Solo puede ser creado por un psicólogo
 */
const createStudent = async (req = request, res = response) => {
    const {
        firstName, lastName, age, phone, email, city, gender,
        career, level, employmentStatus, income
    } = req.body;

    try {
        // 1. Verificar que el creador sea un psicólogo
        if (req.user.role !== 'PSYCHOLOGIST' && req.user.role !== 'ADMIN') {
            return res.status(401).json({
                msg: 'Solo los psicólogos pueden registrar estudiantes'
            });
        }

        // 2. Verificar que el creador sea psicólogo
        if (req.user.role !== 'PSYCHOLOGIST' && req.user.role !== 'ADMIN') {
            return res.status(401).json({
                msg: 'Solo los psicólogos pueden registrar estudiantes'
            });
        }

        console.log('Creando estudiante con psicólogo:', {
            psychologistId: req.user._id,
            psychologistRole: req.user.role
        });

        // 3. Crear el perfil de estudiante
        const studentData = {
            firstName,
            lastName,
            age,
            phone,
            email,
            city,
            gender,
            career,
            level,
            employmentStatus,
            income,
            assignedPsychologist: req.user._id // Asignar al psicólogo que lo está creando
        };

        const student = new Student(studentData);
        await student.save();

        // 4. Retornar respuesta
        res.status(201).json({
            msg: 'Estudiante creado exitosamente',
            student
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al crear estudiante'
        });
    }
};

/**
 * Obtener lista de estudiantes
 * Los psicólogos solo ven sus estudiantes asignados
 */
const getStudents = async (req = request, res = response) => {
    try {
        console.log('Usuario solicitando estudiantes:', {
            userId: req.user._id,
            userRole: req.user.role
        });

        // Construir query base
        let query = { status: true }; // Solo mostrar estudiantes activos
        
        // Si es psicólogo, solo ver sus estudiantes asignados
        if (req.user.role === 'PSYCHOLOGIST') {
            query.assignedPsychologist = req.user._id;
            console.log('Filtrando por psicólogo:', query);
        }

        // Obtener estudiantes con populate del psicólogo asignado
        const students = await Student.find(query)
            .populate('assignedPsychologist', ['firstName', 'lastName', 'email']);


        // Contar total de estudiantes que cumplen con el filtro
        const total = await Student.countDocuments(query);

        res.json({
            total,
            students
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al obtener estudiantes'
        });
    }
};

/**
 * PUT /api/students/:id
 * Actualiza los datos de un estudiante
 * Solo el psicólogo asignado o un admin pueden actualizar
 */
const updateStudent = async (req = request, res = response) => {
    const { id } = req.params;
    const { email, ...data } = req.body;

    try {
        // 1. Verificar que el estudiante existe
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                msg: 'Estudiante no encontrado'
            });
        }

        // 2. Verificar permisos
        const isAdmin = req.user.role === 'ADMIN';
        const isPsychologist = req.user.role === 'PSYCHOLOGIST';
        const isAssignedPsychologist = student.assignedPsychologist.toString() === req.user._id.toString();

        if (!isAdmin && (!isPsychologist || !isAssignedPsychologist)) {
            return res.status(401).json({
                msg: 'No tienes permisos para actualizar este estudiante'
            });
        }

        // 3. Si se intenta actualizar el email, verificar que no exista
        if (email && email !== student.email) {
            const emailExists = await Student.findOne({ email });
            if (emailExists) {
                return res.status(400).json({
                    msg: 'El correo ya está registrado'
                });
            }
        }

        // 4. Actualizar estudiante
        const updatedStudent = await Student.findByIdAndUpdate(id, { ...data, email }, { new: true })
            .populate('assignedPsychologist', ['firstName', 'lastName', 'email']);

        res.json({
            msg: 'Estudiante actualizado exitosamente',
            student: updatedStudent
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al actualizar estudiante'
        });
    }
};

/**
 * DELETE /api/students/:id
 * Desactiva un estudiante (soft delete)
 * Solo el psicólogo asignado o admin pueden desactivar
 */
const deleteStudent = async(req = request, res = response) => {
    const { id } = req.params;

    try {
        // 1. Verificar que el estudiante existe
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                msg: 'Estudiante no encontrado'
            });
        }

        // 2. Verificar permisos
        console.log('Datos del estudiante:', student);
        console.log('Datos del usuario:', req.user);

        // Si es admin, permitir siempre
        if (req.user.role === 'ADMIN') {
            console.log('Usuario es admin, permitiendo operación');
        }
        // Si es psicólogo, verificar que sea el asignado
        else if (req.user.role === 'PSYCHOLOGIST') {
            const studentPsychologistId = student.assignedPsychologist?.toString();
            const requestingUserId = req.user._id?.toString();
            
            console.log('Comparando IDs:', {
                studentPsychologistId,
                requestingUserId,
                match: studentPsychologistId === requestingUserId
            });

            if (studentPsychologistId !== requestingUserId) {
                return res.status(401).json({
                    msg: 'No tienes permisos para desactivar este estudiante',
                    debug: {
                        studentPsychologistId,
                        requestingUserId
                    }
                });
            }
        }
        // Cualquier otro rol no tiene permiso
        else {
            return res.status(401).json({
                msg: 'No tienes permisos para desactivar estudiantes'
            });
        }

        // 3. Desactivar estudiante (soft delete)
        const updatedStudent = await Student.findByIdAndUpdate(id, 
            { status: false },
            { new: true }
        ).populate('assignedPsychologist', ['firstName', 'lastName', 'email']);

        res.json({
            msg: 'Estudiante desactivado exitosamente',
            student: updatedStudent
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al desactivar estudiante'
        });
    }
};

/**
 * GET /api/students/search
 * Busca estudiantes por nombre
 * Los psicólogos solo pueden buscar entre sus estudiantes asignados
 */
const searchStudents = async (req = request, res = response) => {
    try {
        const { firstName } = req.query;

        if (!firstName) {
            return res.status(400).json({
                msg: 'El parámetro firstName es requerido'
            });
        }

        // Construir query base
        let query = { 
            status: true,
            firstName: new RegExp(firstName, 'i') // búsqueda case insensitive
        };

        // Si es psicólogo, solo buscar en sus estudiantes asignados
        if (req.user.role === 'PSYCHOLOGIST') {
            query.assignedPsychologist = req.user._id;
        }

        // Buscar estudiantes
        const students = await Student.find(query)
            .populate('assignedPsychologist', ['firstName', 'lastName', 'email']);

        res.json({
            total: students.length,
            students
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al buscar estudiantes'
        });
    }
};

/**
 * POST /api/students/:id/clinical-notes
 * Agrega una nota clínica a un estudiante
 * Solo el psicólogo asignado puede agregar notas
 */
const addClinicalNote = async (req = request, res = response) => {
    const { id } = req.params;
    const { note } = req.body;

    try {
        // 1. Verificar que el estudiante existe
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                msg: 'Estudiante no encontrado'
            });
        }

        // 2. Verificar que el psicólogo sea el asignado al estudiante
        if (student.assignedPsychologist.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                msg: 'No tienes permisos para agregar notas a este estudiante'
            });
        }

        // 3. Agregar la nota clínica
        student.clinicalNotes.push({
            note,
            createdBy: req.user._id
        });

        // 4. Guardar el estudiante actualizado
        await student.save();

        // 5. Obtener el estudiante actualizado con las notas pobladas
        const updatedStudent = await Student.findById(id)
            .populate('clinicalNotes.createdBy', ['firstName', 'lastName'])
            .populate('assignedPsychologist', ['firstName', 'lastName', 'email']);

        res.json({
            msg: 'Nota clínica agregada exitosamente',
            student: updatedStudent
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al agregar nota clínica'
        });
    }
};

/**
 * GET /api/students/:id
 * Obtiene un estudiante por su ID
 * - Admin puede ver cualquier estudiante
 * - Psicólogo solo puede ver sus estudiantes asignados
 */
const getStudentById = async(req = request, res = response) => {
    const { id } = req.params;

    try {
        // 1. Buscar estudiante con sus datos básicos
        const student = await Student.findById(id)
            .populate('assignedPsychologist', ['firstName', 'lastName', 'email'])
            .populate('clinicalNotes.createdBy', ['firstName', 'lastName']);

        // 2. Verificar que existe
        if (!student) {
            return res.status(404).json({
                msg: 'Estudiante no encontrado'
            });
        }

        // 3. Verificar permisos
        const isAdmin = req.user.role === 'ADMIN';
        const isPsychologist = req.user.role === 'PSYCHOLOGIST';
        const isAssignedPsychologist = student.assignedPsychologist._id.toString() === req.user._id.toString();

        if (!isAdmin && (!isPsychologist || !isAssignedPsychologist)) {
            return res.status(401).json({
                msg: 'No tienes permisos para ver este estudiante'
            });
        }

        // 4. Obtener las evaluaciones del estudiante
        const SuicideAssessment = require('../models/suicideAssessment');
        const assessments = await SuicideAssessment.find({ student: id })
            .populate('psychologist', ['firstName', 'lastName'])
            .sort({ date: -1 }); // Ordenar por fecha, más recientes primero

        // 5. Obtener las citas del estudiante
        const Appointment = require('../models/appointment');
        const appointments = await Appointment.find({ 
            student: id,
            active: true // Solo citas activas
        })
        .populate('psychologist', ['firstName', 'lastName'])
        .sort({ date: -1 }); // Ordenar por fecha, más recientes primero

        // 6. Preparar respuesta con toda la información
        const studentData = student.toObject();
        studentData.assessments = assessments;
        studentData.appointments = appointments;

        // 7. Ordenar notas clínicas por fecha, más recientes primero
        if (studentData.clinicalNotes && studentData.clinicalNotes.length > 0) {
            studentData.clinicalNotes.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        res.json(studentData);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al obtener estudiante'
        });
    }
};

/**
 * PUT /api/students/:id/clinical-notes/:noteId
 * Actualiza una nota clínica
 * Solo el psicólogo que creó la nota puede actualizarla
 */
const updateClinicalNote = async (req = request, res = response) => {
    const { id, noteId } = req.params;
    const { note } = req.body;

    try {
        // 1. Verificar que el estudiante existe
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                msg: 'Estudiante no encontrado'
            });
        }

        // 2. Encontrar la nota
        const clinicalNote = student.clinicalNotes.id(noteId);
        if (!clinicalNote) {
            return res.status(404).json({
                msg: 'Nota clínica no encontrada'
            });
        }

        // 3. Verificar que el psicólogo sea el creador de la nota
        if (clinicalNote.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                msg: 'No tienes permisos para editar esta nota'
            });
        }

        // 4. Actualizar la nota
        clinicalNote.note = note;
        await student.save();

        // 5. Obtener el estudiante actualizado con las notas pobladas
        const updatedStudent = await Student.findById(id)
            .populate('clinicalNotes.createdBy', ['firstName', 'lastName'])
            .populate('assignedPsychologist', ['firstName', 'lastName', 'email']);

        res.json({
            msg: 'Nota clínica actualizada exitosamente',
            student: updatedStudent
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al actualizar nota clínica'
        });
    }
};

/**
 * DELETE /api/students/:id/clinical-notes/:noteId
 * Elimina una nota clínica
 * Solo el psicólogo que creó la nota puede eliminarla
 */
const deleteClinicalNote = async (req = request, res = response) => {
    const { id, noteId } = req.params;

    try {
        // 1. Verificar que el estudiante existe
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                msg: 'Estudiante no encontrado'
            });
        }

        // 2. Encontrar la nota
        const clinicalNote = student.clinicalNotes.id(noteId);
        if (!clinicalNote) {
            return res.status(404).json({
                msg: 'Nota clínica no encontrada'
            });
        }

        // 3. Verificar que el psicólogo sea el creador de la nota
        if (clinicalNote.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                msg: 'No tienes permisos para eliminar esta nota'
            });
        }

        // 4. Eliminar la nota
        student.clinicalNotes.pull(noteId);
        await student.save();

        // 5. Obtener el estudiante actualizado con las notas pobladas
        const updatedStudent = await Student.findById(id)
            .populate('clinicalNotes.createdBy', ['firstName', 'lastName'])
            .populate('assignedPsychologist', ['firstName', 'lastName', 'email']);

        res.json({
            msg: 'Nota clínica eliminada exitosamente',
            student: updatedStudent
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al eliminar nota clínica'
        });
    }
};

module.exports = {
    createStudent,
    getStudents,
    updateStudent,
    deleteStudent,
    searchStudents,
    addClinicalNote,
    updateClinicalNote,
    deleteClinicalNote,
    getStudentById
};
