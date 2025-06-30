const { response } = require('express');
const SuicideAssessment = require('../models/suicideAssessment');
const Student = require('../models/student');

// Constantes para niveles de riesgo
const RISK_LEVELS = {
    LOW: 'Bajo',
    MEDIUM: 'Medio',
    HIGH: 'Alto'
};

const updateFinalRemarks = async (req, res = response) => {
    const { id } = req.params;
    const { finalRemarks } = req.body;

    try {
        const assessment = await SuicideAssessment.findByIdAndUpdate(
            id,
            { finalRemarks },
            { new: true }
        )
        .populate('student')
        .populate('psychologist', 'firstName lastName');

        if (!assessment) {
            return res.status(404).json({
                ok: false,
                msg: 'Evaluación no encontrada'
            });
        }

        res.json({
            ok: true,
            assessment
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar observaciones'
        });
    }
};

const createAssessment = async (req, res = response) => {
    try {
        const { studentId, ...assessmentData } = req.body;

        // Verificar si el estudiante existe
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                ok: false,
                msg: 'Estudiante no encontrado'
            });
        }

        // Crear la evaluación
        const assessment = new SuicideAssessment({
            ...assessmentData,
            student: studentId,
            psychologist: req.uid // ID del psicólogo que realiza la evaluación
        });

        // Calcular el nivel de riesgo
        assessment.riskLevel = assessment.calculateRiskLevel();

        // Guardar en la base de datos
        await assessment.save();

        // Poblar los datos del estudiante y psicólogo
        await assessment.populate('student psychologist');

        res.json({
            ok: true,
            assessment
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error inesperado'
        });
    }
};

const getAssessments = async (req, res = response) => {
    try {
        const { studentId } = req.query;
        let query = {};

        // Si se proporciona un studentId, filtrar por ese estudiante
        if (studentId) {
            query.student = studentId;
        } else if (req.user.role === 'PSYCHOLOGIST') {
            // Si es psicólogo y no se especifica estudiante, obtener solo sus evaluaciones
            query.psychologist = req.user._id;
        }

        const assessments = await SuicideAssessment.find(query)
            .populate('student', 'firstName lastName')
            .populate('psychologist', 'firstName lastName')
            .sort({ date: -1 }); // Ordenar por fecha, más recientes primero

        res.json({
            ok: true,
            assessments
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error inesperado'
        });
    }
};

const getAssessmentById = async (req, res = response) => {
    const id = req.params.id;

    try {
        const assessment = await SuicideAssessment.findById(id)
            .populate('student')
            .populate('psychologist', 'name');

        if (!assessment) {
            return res.status(404).json({
                ok: false,
                msg: 'Evaluación no encontrada'
            });
        }

        res.json({
            ok: true,
            assessment
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error inesperado'
        });
    }
};

const getStatistics = async (req, res = response) => {
    try {
        // Obtener conteo por nivel de riesgo
        const riskLevels = await SuicideAssessment.aggregate([
            {
                $group: {
                    _id: '$riskLevel',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Obtener conteo por género
        const genderStats = await SuicideAssessment.aggregate([
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentData'
                }
            },
            { $unwind: '$studentData' },
            {
                $group: {
                    _id: '$studentData.gender',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        console.log('Estadísticas de género:', genderStats);

        // Verificar si hay evaluaciones sin género asignado
        const studentsWithoutGender = await SuicideAssessment.aggregate([
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentData'
                }
            },
            { $unwind: '$studentData' },
            {
                $match: {
                    'studentData.gender': { $exists: false }
                }
            }
        ]);

        if (studentsWithoutGender.length > 0) {
            console.log('Estudiantes sin género asignado:', studentsWithoutGender);
        }

        // Obtener conteo por carrera
        const careerStats = await SuicideAssessment.aggregate([
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentData'
                }
            },
            { $unwind: '$studentData' },
            {
                $group: {
                    _id: '$studentData.career',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        console.log('Estadísticas por carrera:', careerStats);

        // Obtener total de evaluaciones
        const total = await SuicideAssessment.countDocuments();

        return res.json({
            ok: true,
            statistics: {
                total,
                riskLevels,
                genderStats,
                careerStats
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado'
        });
    }
};


module.exports = {
    createAssessment,
    getAssessments,
    getAssessmentById,
    getStatistics,
    updateFinalRemarks 
};