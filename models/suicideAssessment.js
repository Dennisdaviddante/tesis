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
        frequency: { // Esta es la frecuencia que usaremos para ajustar el riesgo
            type: Number,
            enum: [0, 1, 2, 3, 4], // 0: No sabe/No corresponde, 1: Solo una vez, 2: Unas pocas veces, 3: Muchas, 4: Todo el tiempo
            required: function() {
                return this.deathWish.present === true || this.nonSpecificActiveSuicidalThoughts.present === true;
            }
        }
    },
    riskLevel: {
        type: String,
        enum: ['BAJO', 'MODERADO-BAJO', 'MODERADO', 'ALTO', 'MUY_ALTO', 'EXTREMO'], // Agregamos 'EXTREMO'
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
    },
    finalRemarks: {
        type: String,
        default: ''
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
    const ideationType = this.ideationIntensity.mostSeriousIdeationType;
    const frequency = this.ideationIntensity.frequency;

    if (!ideationType) {
        return 'BAJO'; 
    }

    let baseRisk;
    switch (ideationType) {
        case 1:
            baseRisk = 'BAJO';
            break;
        case 2:
            baseRisk = 'MODERADO-BAJO';
            break;
        case 3:
            baseRisk = 'MODERADO';
            break;
        case 4:
            baseRisk = 'ALTO';
            break;
        case 5:
            baseRisk = 'MUY_ALTO';
            break;
        default:
            baseRisk = 'BAJO'; 
            break;
    }

   
    if (frequency >= 3 && frequency <= 4) { 
        switch (baseRisk) {
            case 'BAJO':
                return 'MODERADO-BAJO';
            case 'MODERADO-BAJO':
                return 'MODERADO';
            case 'MODERADO':
                return 'ALTO';
            case 'ALTO':
                return 'MUY_ALTO';
            case 'MUY_ALTO': 
                return 'MUY_ALTO/EXTREMO';
            default:
                return baseRisk; 
        }
    } else { 
        return baseRisk;
    }
};

module.exports = model('SuicideAssessment', suicideAssessmentSchema);