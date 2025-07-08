const SuicideAssessment = require('../models/suicideAssessment');
const PDFDocument = require('pdfkit');

// Función auxiliar para formatear respuestas booleanas a 'Sí' o 'No'
const formatBoolean = (value) => (value ? 'Sí' : 'No');

// Función auxiliar para obtener la descripción o un valor predeterminado si no está presente
const getDescription = (obj) => {
    if (obj && obj.present !== undefined) {
        return obj.present ? (obj.description || 'Sí (sin descripción detallada)') : 'No';
    }
    return 'N/A';
};

// Función auxiliar para obtener el texto descriptivo para la frecuencia de la ideación
const getFrequencyText = (value) => {
    switch (value) {
        case 0: return 'No sabe/No corresponde';
        case 1: return 'Solo una vez';
        case 2: return 'Unas pocas veces';
        case 3: return 'Muchas';
        case 4: return 'Todo el tiempo';
        default: return 'N/A';
    }
};

const generateAssessmentReportPDF = async (req, res) => {
    try {
        const assessmentId = req.params.id;

        // Buscar la evaluación y poblar los datos del estudiante y el psicólogo
        const assessment = await SuicideAssessment.findById(assessmentId)
            .populate('student', 'firstName lastName email') // Popula la información del estudiante
            .populate('psychologist', 'firstName lastName email'); // Popula la información del psicólogo

        if (!assessment) {
            return res.status(404).json({ msg: 'Evaluación de riesgo suicida no encontrada' });
        }

        // Configuración del documento PDF
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: `Reporte de Evaluación Suicida - ${assessment.student.firstName} ${assessment.student.lastName}`,
            }
        });

        // Configurar las cabeceras de la respuesta HTTP para el PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="evaluacion_suicida_${assessment.student.firstName}_${assessment.student.lastName}_${new Date(assessment.date).toLocaleDateString()}.pdf"`);
        doc.pipe(res);

        // --- Estilos del PDF (similar a tu reporte de estudiante) ---
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#fdf6e3'); // Fondo crema suave
        doc.fillColor('black');
        doc.font('Times-Roman'); // Fuente general

        // Título principal estilizado
        doc.fillColor('#2c3e50') // Azul oscuro
            .fontSize(26)
            .font('Helvetica-Bold')
            .text('Detalles de Evaluación de Riesgo Suicida', { align: 'center' })
            .moveDown(1.5);

        // --- Información General de la Evaluación ---
        doc.fontSize(13).font('Times-Roman').fillColor('black');
        doc.text(`Estudiante: ${assessment.student.firstName} ${assessment.student.lastName}`, { indent: 20 });
        doc.text(`Correo Estudiante: ${assessment.student.email}`, { indent: 20 });
        doc.text(`Psicólogo: ${assessment.psychologist?.firstName ?? 'N/A'} ${assessment.psychologist?.lastName ?? ''}`, { indent: 20 });
        doc.text(`Correo Psicólogo: ${assessment.psychologist?.email ?? 'N/A'}`, { indent: 20 });
        doc.text(`Fecha de Evaluación: ${new Date(assessment.date).toLocaleDateString('es-ES')}`, { indent: 20 });
        doc.text(`Nivel de Riesgo Calculado: ${assessment.riskLevel}`, { indent: 20 });
        doc.text(`Observaciones Generales de la Evaluación: ${assessment.observations || 'Ninguna'}`, { indent: 20 });
        doc.moveDown(1);

        // --- Sección 1: Ideación Suicida ---
        doc.addPage(); // Nueva página para esta sección si es larga, o quítalo si prefieres que fluya
        doc.moveDown(1)
            .font('Helvetica-Bold')
            .fontSize(18)
            .fillColor('#2c3e50')
            .text('1. Ideación Suicida', { align: 'left', indent: 20 })
            .moveDown(0.5);

        doc.font('Times-Roman').fontSize(12).fillColor('black');

        // Deseo de Muerte
        doc.text(`- Deseo de Muerte: ${getDescription(assessment.deathWish || 'No aplic')}`, { indent: 30 });
        if (assessment.deathWish.present && assessment.deathWish.description) {
            doc.text(`  Descripción: ${assessment.deathWish.description || 'sin Descripcion'}`, { indent: 40 });
        }
        doc.moveDown(0.2);

        // Pensamientos Suicidas Activos No Específicos
        doc.text(`- Pensamientos Suicidas Activos No Específicos: ${getDescription(assessment.nonSpecificActiveSuicidalThoughts)}`, { indent: 30 });
        if (assessment.nonSpecificActiveSuicidalThoughts.present && assessment.nonSpecificActiveSuicidalThoughts.description) {
            doc.text(`  Descripción: ${assessment.nonSpecificActiveSuicidalThoughts.description}`, { indent: 40 });
        }
        doc.moveDown(0.2);

        // Campos condicionales de Ideación (solo si nonSpecificActiveSuicidalThoughts.present es true)
        if (assessment.nonSpecificActiveSuicidalThoughts.present) {
            // Ideación Suicida Activa con Métodos
            doc.text(`- Ideación Suicida Activa con Métodos: ${getDescription(assessment.activeSuicidalIdeationWithMethods)}`, { indent: 30 });
            if (assessment.activeSuicidalIdeationWithMethods.present && assessment.activeSuicidalIdeationWithMethods.description) {
                doc.text(`  Descripción: ${assessment.activeSuicidalIdeationWithMethods.description}`, { indent: 40 });
            }
            doc.moveDown(0.2);

            // Ideación Suicida Activa con Intención
            doc.text(`- Ideación Suicida Activa con Intención: ${getDescription(assessment.activeSuicidalIdeationWithIntent)}`, { indent: 30 });
            if (assessment.activeSuicidalIdeationWithIntent.present && assessment.activeSuicidalIdeationWithIntent.description) {
                doc.text(`  Descripción: ${assessment.activeSuicidalIdeationWithIntent.description}`, { indent: 40 });
            }
            doc.moveDown(0.2);

            // Ideación Suicida Activa con Plan
            doc.text(`- Ideación Suicida Activa con Plan: ${getDescription(assessment.activeSuicidalIdeationWithPlan)}`, { indent: 30 });
            if (assessment.activeSuicidalIdeationWithPlan.present) {
                if (assessment.activeSuicidalIdeationWithPlan.description) {
                    doc.text(`  Descripción del Plan: ${assessment.activeSuicidalIdeationWithPlan.description}`, { indent: 40 });
                }
                doc.text(`  Frecuencia del Plan: ${assessment.activeSuicidalIdeationWithPlan.frequency || '0'}`, { indent: 40 });
            }
            doc.moveDown(0.2);

            // Intensidad de la Ideación
            doc.moveDown(0.5)
                .font('Helvetica-Bold')
                .fontSize(14)
                .text('Intensidad de la Ideación:', { indent: 30 })
                .font('Times-Roman')
                .fontSize(12);

            doc.text(`  Tipo de Ideación más Grave: ${assessment.ideationIntensity.mostSeriousIdeationType || 'N/A'}`, { indent: 40 });
            doc.text(`  Descripción de Ideación más Grave: ${assessment.ideationIntensity.mostSeriousIdeationDescription || 'N/A'}`, { indent: 40 });
            doc.text(`  Frecuencia de la Ideación: ${getFrequencyText(assessment.ideationIntensity.frequency)}`, { indent: 40 });
        } else {
            doc.font('Times-Italic').text('No se aplicaron preguntas de ideación detallada ya que las preguntas base fueron negativas.', { indent: 30 });
        }
        doc.moveDown(1.5);

        // --- Sección 2: Comportamiento Suicida ---
        doc.addPage(); // Nueva página para esta sección
        doc.font('Helvetica-Bold')
            .fontSize(18)
            .fillColor('#2c3e50')
            .text('2. Comportamiento Suicida', { align: 'left', indent: 20 })
            .moveDown(0.5);

        doc.font('Times-Roman').fontSize(12).fillColor('black');

        // Determinar si la sección de comportamiento debe mostrarse según tu lógica del esquema
        const shouldShowBehaviorAssessment = assessment.deathWish.present === false && assessment.nonSpecificActiveSuicidalThoughts.present === false;

        if (shouldShowBehaviorAssessment) {
            // Intento de Suicidio Actual
            doc.text(`- Intento de Suicidio Actual: ${getDescription(assessment.actualAttempt)}`, { indent: 30 });
            if (assessment.actualAttempt.present) {
                if (assessment.actualAttempt.description) {
                    doc.text(`  Descripción: ${assessment.actualAttempt.description}`, { indent: 40 });
                }
                doc.text(`  Total de Intentos: ${assessment.actualAttempt.totalAttempts || '0'}`, { indent: 40 });
            }
            doc.moveDown(0.2);

            // Autolesión No Suicida
            doc.text(`- Autolesión No Suicida: ${getDescription(assessment.nonSuicidalSelfInjury)}`, { indent: 30 });
            if (assessment.nonSuicidalSelfInjury.present && assessment.nonSuicidalSelfInjury.description) {
                doc.text(`  Descripción: ${assessment.nonSuicidalSelfInjury.description}`, { indent: 40 });
            }
            doc.moveDown(0.2);

            // Autolesión con Intención Desconocida
            doc.text(`- Autolesión con Intención Desconocida: ${getDescription(assessment.unknownIntentSelfInjury)}`, { indent: 30 });
            if (assessment.unknownIntentSelfInjury.present && assessment.unknownIntentSelfInjury.description) {
                doc.text(`  Descripción: ${assessment.unknownIntentSelfInjury.description}`, { indent: 40 });
            }
            doc.moveDown(0.2);

            // Intento Interrumpido
            doc.text(`- Intento Interrumpido: ${getDescription(assessment.interruptedAttempt)}`, { indent: 30 });
            if (assessment.interruptedAttempt.present) {
                if (assessment.interruptedAttempt.description) {
                    doc.text(`  Descripción: ${assessment.interruptedAttempt.description}`, { indent: 40 });
                }
                doc.text(`  Total de Intentos Interrumpidos: ${assessment.interruptedAttempt.totalAttempts || '0'}`, { indent: 40 });
            }
            doc.moveDown(0.2);

            // Intento Abortado
            doc.text(`- Intento Abortado: ${getDescription(assessment.abortedAttempt)}`, { indent: 30 });
            if (assessment.abortedAttempt.present) {
                if (assessment.abortedAttempt.description) {
                    doc.text(`  Descripción: ${assessment.abortedAttempt.description}`, { indent: 40 });
                }
                doc.text(`  Total de Intentos Abortados: ${assessment.abortedAttempt.totalAttempts || '0'}`, { indent: 40 });
            }
            doc.moveDown(0.2);

            // Actos Preparatorios
            doc.text(`- Actos Preparatorios: ${getDescription(assessment.preparatoryActs)}`, { indent: 30 });
            if (assessment.preparatoryActs.present && assessment.preparatoryActs.description) {
                doc.text(`  Descripción: ${assessment.preparatoryActs.description}`, { indent: 40 });
            }
            doc.moveDown(0.2);

            // Suicidio Completado
            doc.text(`- Suicidio Completado: ${formatBoolean(assessment.completedSuicide)}`, { indent: 30 });
            doc.moveDown(0.2);

            // Fecha del Intento más Letal
            doc.text(`- Fecha del Intento más Letal: ${assessment.mostLethalAttemptDate ? new Date(assessment.mostLethalAttemptDate).toLocaleDateString('es-ES') : 'N/A'}`, { indent: 30 });
            doc.moveDown(0.2);

            // Grado de Letalidad
            doc.text(`- Grado de Letalidad: ${assessment.lethalityDegree || 'N/A'} (Escala 0-5)`, { indent: 30 });
            doc.moveDown(0.2);

            // Letalidad Potencial
            doc.text(`- Letalidad Potencial: ${assessment.potentialLethality || 'N/A'} (Escala 0-2)`, { indent: 30 });
            doc.moveDown(0.2);

        } else {
            doc.font('Times-Italic').text('No se aplicaron preguntas de comportamiento suicida ya que la ideación suicida activa o el deseo de muerte fueron positivos.', { indent: 30 });
        }

        // --- Observaciones Finales ---
        doc.moveDown(1.5)
            .font('Helvetica-Bold')
            .fontSize(18)
            .fillColor('#2c3e50')
            .text('Observaciones Finales de la Evaluación', { align: 'left', indent: 20 })
            .moveDown(0.5);
        doc.font('Times-Roman').fontSize(12).fillColor('black');
        doc.text(assessment.finalRemarks || 'No hay observaciones finales.', { indent: 30 });

        doc.end();

    } catch (error) {
        console.error('Error al generar el PDF de la evaluación:', error);
        res.status(500).send('Error al generar el PDF de la evaluación');
    }
};

module.exports = {
    generateAssessmentReportPDF,
};