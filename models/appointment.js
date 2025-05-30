const { Schema, model } = require('mongoose');

const AppointmentSchema = Schema({
    student: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'El estudiante es obligatorio']
    },
    psychologist: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El psicólogo es obligatorio']
    },
    date: {
        type: Date,
        required: [true, 'La fecha y hora de la cita es obligatoria']
    },
    reason: {
        type: String,
        required: [true, 'El motivo de la cita es obligatorio']
    },
    status: {
        type: String,
        enum: ['PENDIENTE', 'COMPLETADA', 'CANCELADA'],
        default: 'PENDIENTE'
    },
    notes: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Método para limpiar la respuesta JSON
AppointmentSchema.methods.toJSON = function() {
    const { __v, ...appointment } = this.toObject();
    return appointment;
}

module.exports = model('Appointment', AppointmentSchema);
