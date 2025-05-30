const { Schema, model } = require('mongoose');

const suicideAssessmentSchema = Schema({
    // Campos base
    student: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    psychologist: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    // Ideación Suicida
    deathWish: {
        present: {
            type: Boolean,
            required: true
        },
        description: String
    },
    nonSpecificActiveSuicidalThoughts: {
        present: {
            type: Boolean,
            required: true
        },
        description: String
    },
    activeSuicidalIdeationWithMethods: {
        present: {
            type: Boolean,
            required: function() {
                return this.nonSpecificActiveSuicidalThoughts.present === true;
            },
            default: false
        },
        description: String
    },
    activeSuicidalIdeationWithIntent: {
        present: {
            type: Boolean,
            required: function() {
                return this.nonSpecificActiveSuicidalThoughts.present === true;
            },
            default: false
        },
        description: String
    },
    activeSuicidalIdeationWithPlan: {
        present: {
            type: Boolean,
            required: function() {
                return this.nonSpecificActiveSuicidalThoughts.present === true;
            },
            default: false
        },
        description: {
            type: String,
            default: ''
        },
        frequency: {
            type: Number,
            default: 0
        }
    },
    // Sección de Intensidad de la Ideación
    ideationIntensity: {
        mostSeriousIdeationType: {
            type: Number,
            min: 1,
            max: 5,
            required: function() {
                return this.deathWish.present === true || this.nonSpecificActiveSuicidalThoughts.present === true;
            }
        },
        mostSeriousIdeationDescription: {
            type: String,
            required: function() {
                return this.deathWish.present === true || this.nonSpecificActiveSuicidalThoughts.present === true;
            }
        },
        frequency: {
            type: Number,
            enum: [0, 1, 2, 3, 4], // 0: No sabe/No corresponde, 1: Solo una vez, 2: Unas pocas veces, 3: Muchas, 4: Todo el tiempo
            required: function() {
                return this.deathWish.present === true || this.nonSpecificActiveSuicidalThoughts.present === true;
            }
        }
    },
    riskLevel: {
        type: String,
        enum: ['BAJO', 'MODERADO', 'ALTO', 'MUY_ALTO'],
        required: true
    },
    observations: String,

    // Comportamiento Suicida
    actualAttempt: {
        present: {
            type: Boolean,
            required: function() {
                // Solo requerir si las preguntas 1 y 2 son negativas
                return this.deathWish.present === false && this.nonSpecificActiveSuicidalThoughts.present === false;
            }
        },
        description: String,
        totalAttempts: {
            type: Number,
            default: 0
        }
    },
    nonSuicidalSelfInjury: {
        present: {
            type: Boolean,
            required: function() {
                return this.deathWish.present === false && this.nonSpecificActiveSuicidalThoughts.present === false;
            }
        },
        description: String
    },
    unknownIntentSelfInjury: {
        present: {
            type: Boolean,
            required: function() {
                return this.deathWish.present === false && this.nonSpecificActiveSuicidalThoughts.present === false;
            }
        },
        description: String
    },
    interruptedAttempt: {
        present: {
            type: Boolean,
            required: function() {
                return this.deathWish.present === false && this.nonSpecificActiveSuicidalThoughts.present === false;
            }
        },
        description: String,
        totalAttempts: {
            type: Number,
            default: 0
        }
    },
    abortedAttempt: {
        present: {
            type: Boolean,
            required: function() {
                return this.deathWish.present === false && this.nonSpecificActiveSuicidalThoughts.present === false;
            }
        },
        description: String,
        totalAttempts: {
            type: Number,
            default: 0
        }
    },
    preparatoryActs: {
        present: {
            type: Boolean,
            required: function() {
                return this.deathWish.present === false && this.nonSpecificActiveSuicidalThoughts.present === false;
            }
        },
        description: String
    },
    completedSuicide: {
        type: Boolean,
        default: false
    },
    mostLethalAttemptDate: Date,
    lethalityDegree: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    potentialLethality: {
        type: Number,
        min: 0,
        max: 2
    }
});

// Método para validar si debe mostrar preguntas adicionales de ideación
suicideAssessmentSchema.methods.shouldShowAdditionalIdeation = function() {
    return this.nonSpecificActiveSuicidalThoughts.present === true;
};

// Método para validar si debe continuar con la evaluación de comportamiento
suicideAssessmentSchema.methods.shouldContinueAssessment = function() {
    // Solo continuar si ambas preguntas son negativas
    return this.deathWish.present === false && this.nonSpecificActiveSuicidalThoughts.present === false;
};

// Método para calcular automáticamente el nivel de riesgo
suicideAssessmentSchema.methods.calculateRiskLevel = function() {
    let score = 0;
    
    // Ideación Suicida
    if (this.deathWish.present) score += 1;
    if (this.nonSpecificActiveSuicidalThoughts.present) score += 2;
    if (this.activeSuicidalIdeationWithMethods.present) score += 3;
    if (this.activeSuicidalIdeationWithIntent.present) score += 4;
    if (this.activeSuicidalIdeationWithPlan.present) score += 5;

    // Comportamiento Suicida
    if (this.actualAttempt.present) score += 10;
    if (this.interruptedAttempt.present) score += 8;
    if (this.abortedAttempt.present) score += 6;
    if (this.preparatoryActs.present) score += 4;

    // Ajuste por letalidad
    if (this.lethalityDegree >= 3) score += 5;
    if (this.potentialLethality === 2) score += 3;

    if (score === 0) return 'BAJO';
    if (score <= 5) return 'MODERADO';
    if (score <= 15) return 'ALTO';
    return 'MUY_ALTO';
};

module.exports = model('SuicideAssessment', suicideAssessmentSchema);
