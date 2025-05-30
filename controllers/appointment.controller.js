const { response, request } = require('express');
const Appointment = require('../models/appointment');
const Student = require('../models/student');

/**
 * Crear una nueva cita
 * Solo puede ser creada por el psicólogo asignado al estudiante
 */
const createAppointment = async (req = request, res = response) => {
    const { studentId, date, reason, notes } = req.body;

    try {
        // 1. Verificar que el estudiante existe y pertenece al psicólogo
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                msg: 'Estudiante no encontrado'
            });
        }

        // 2. Verificar que el psicólogo sea el asignado al estudiante
        if (student.assignedPsychologist.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                msg: 'No tienes permisos para crear citas para este estudiante'
            });
        }

        // 3. Verificar que la fecha no esté en el pasado
        const appointmentDate = new Date(date);
        if (appointmentDate < new Date()) {
            return res.status(400).json({
                msg: 'La fecha de la cita no puede estar en el pasado'
            });
        }

        // 4. Verificar que el psicólogo no tenga otra cita en ese horario
        const existingAppointment = await Appointment.findOne({
            psychologist: req.user._id,
            date: appointmentDate,
            status: 'PENDIENTE',
            active: true
        });

        if (existingAppointment) {
            return res.status(400).json({
                msg: 'Ya tienes una cita programada para esta fecha y hora'
            });
        }

        // 5. Crear la cita
        const appointment = new Appointment({
            student: studentId,
            psychologist: req.user._id,
            date: appointmentDate,
            reason,
            notes
        });

        await appointment.save();

        // 6. Retornar la cita creada con los datos poblados
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('student', ['firstName', 'lastName', 'email'])
            .populate('psychologist', ['firstName', 'lastName', 'email']);

        res.status(201).json({
            msg: 'Cita creada exitosamente',
            appointment: populatedAppointment
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al crear la cita'
        });
    }
};

/**
 * Obtener citas
 * Los psicólogos solo ven sus citas
 */
const getAppointments = async (req = request, res = response) => {
    try {
        const { status, studentId } = req.query;
        
        // Construir query base
        let query = { active: true };
        
        // Si se especifica un estudiante, filtrar por ese estudiante
        if (studentId) {
            query.student = studentId;
        }
        
        // Si es psicólogo, solo ver sus citas
        if (req.user.role === 'PSYCHOLOGIST') {
            query.psychologist = req.user._id;
        }

        // Filtrar por status si se especifica
        if (status && ['PENDIENTE', 'COMPLETADA', 'CANCELADA'].includes(status)) {
            query.status = status;
        }

        const appointments = await Appointment.find(query)
            .populate('student', ['firstName', 'lastName', 'email'])
            .sort({ date: -1 }) // Ordenar por fecha, más recientes primero
            .populate('psychologist', ['firstName', 'lastName', 'email'])
            .sort({ date: 1 }); // Ordenar por fecha ascendente

        res.json({
            total: appointments.length,
            appointments
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al obtener las citas'
        });
    }
};

/**
 * Actualizar una cita
 * Solo el psicólogo que la creó puede actualizarla
 */
const updateAppointment = async (req = request, res = response) => {
    const { id } = req.params;
    const { date, reason, notes, status } = req.body;

    try {
        // 1. Verificar que la cita existe
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({
                msg: 'Cita no encontrada'
            });
        }

        // 2. Verificar que el psicólogo sea el dueño de la cita
        if (appointment.psychologist.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                msg: 'No tienes permisos para actualizar esta cita'
            });
        }

        // 3. Si se actualiza la fecha, verificar que no esté en el pasado
        if (date) {
            const appointmentDate = new Date(date);
            if (appointmentDate < new Date()) {
                return res.status(400).json({
                    msg: 'La fecha de la cita no puede estar en el pasado'
                });
            }

            // Verificar que no haya otra cita en ese horario
            const existingAppointment = await Appointment.findOne({
                _id: { $ne: id }, // Excluir la cita actual
                psychologist: req.user._id,
                date: appointmentDate,
                status: 'PENDIENTE',
                active: true
            });

            if (existingAppointment) {
                return res.status(400).json({
                    msg: 'Ya tienes una cita programada para esta fecha y hora'
                });
            }
        }

        // 4. Actualizar la cita
        const updatedAppointment = await Appointment.findByIdAndUpdate(id, 
            { date, reason, notes, status }, 
            { new: true }
        )
        .populate('student', ['firstName', 'lastName', 'email'])
        .populate('psychologist', ['firstName', 'lastName', 'email']);

        res.json({
            msg: 'Cita actualizada exitosamente',
            appointment: updatedAppointment
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al actualizar la cita'
        });
    }
};

/**
 * Cancelar una cita (soft delete)
 * Solo el psicólogo que la creó puede cancelarla
 */
const cancelAppointment = async (req = request, res = response) => {
    const { id } = req.params;

    try {
        // 1. Verificar que la cita existe
        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({
                msg: 'Cita no encontrada'
            });
        }

        // 2. Verificar que el psicólogo sea el dueño de la cita
        if (appointment.psychologist.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                msg: 'No tienes permisos para cancelar esta cita'
            });
        }

        // 3. Cancelar la cita (soft delete)
        const canceledAppointment = await Appointment.findByIdAndUpdate(id, 
            { 
                active: false,
                status: 'CANCELADA'
            }, 
            { new: true }
        )
        .populate('student', ['firstName', 'lastName', 'email'])
        .populate('psychologist', ['firstName', 'lastName', 'email']);

        res.json({
            msg: 'Cita cancelada exitosamente',
            appointment: canceledAppointment
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al cancelar la cita'
        });
    }
};

module.exports = {
    createAppointment,
    getAppointments,
    updateAppointment,
    cancelAppointment
};
