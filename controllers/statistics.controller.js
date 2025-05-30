const { response, request } = require('express');
const User = require('../models/user');
const Student = require('../models/student');
const SuicideAssessment = require('../models/suicideAssessment');

const getAdminStats = async (req = request, res = response) => {
    try {
        // Obtener estadísticas de usuarios
        const [systemUsers, totalPsychologists, totalStudents, totalAssessments] = await Promise.all([
            User.countDocuments({ status: true }),
            User.countDocuments({ status: true, role: 'PSYCHOLOGIST' }),
            Student.countDocuments({ status: true }),
            SuicideAssessment.countDocuments()
        ]);

        // El total de usuarios es la suma de usuarios del sistema (admin + psicólogos) más los estudiantes
        const totalUsers = systemUsers + totalStudents;

        res.json({
            ok: true,
            stats: {
                totalUsers,
                totalPsychologists,
                totalStudents,
                totalAssessments
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener estadísticas'
        });
    }
}

module.exports = {
    getAdminStats
};
