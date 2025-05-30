const { Schema, model } = require('mongoose');

const StudentSchema = Schema({
    // Datos personales
    firstName: {
        type: String,
        required: [true, 'El nombre es obligatorio']
    },
    lastName: {
        type: String,
        required: [true, 'El apellido es obligatorio']
    },
    age: {
        type: Number,
        required: [true, 'La edad es obligatoria']
    },
    phone: {
        type: String,
        required: [true, 'El teléfono es obligatorio']
    },
    email: {
        type: String,
        required: [true, 'El correo es obligatorio'],
        unique: true
    },
    city: {
        type: String,
        required: [true, 'La ciudad es obligatoria']
    },
    gender: {
        type: String,
        enum: ['MASCULINO', 'FEMENINO', 'OTRO'],
        required: [true, 'El género es obligatorio']
    },

    // Datos académicos
    career: {
        type: String,
        required: [true, 'La carrera es obligatoria']
    },
    level: {
        type: String,
        required: [true, 'El nivel académico es obligatorio']
    },

    // Datos socioeconómicos
    employmentStatus: {
        type: String,
        enum: ['EMPLEADO', 'DESEMPLEADO', 'ESTUDIANTE_TIEMPO_COMPLETO'],
        required: [true, 'La situación laboral es obligatoria']
    },
    income: {
        type: Number,
        required: [true, 'Los ingresos son obligatorios']
    },

    // Autenticación
    email: {
        type: String,
        required: [true, 'El correo es obligatorio'],
        unique: true
    },
    assignedPsychologist: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Notas clínicas
    clinicalNotes: [{
        note: {
            type: String,
            required: [true, 'La nota es obligatoria']
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    }],

    // Control
    status: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Método para limpiar la respuesta JSON
StudentSchema.methods.toJSON = function() {
    const { __v, status, ...student } = this.toObject();
    return student;
}

module.exports = model('Student', StudentSchema);
