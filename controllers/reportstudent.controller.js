const Student = require('../models/student');
const SuicideAssessment = require('../models/suicideAssessment');
const PDFDocument = require('pdfkit');

const generateStudentReportPDF = async (req, res) => {
  try {
    const studentId = req.params.id;

    const student = await Student.findById(studentId)
      .populate('assignedPsychologist', 'firstName lastName email')
      .populate('clinicalNotes.createdBy', 'name email');

    if (!student) {
      return res.status(404).json({ msg: 'Estudiante no encontrado' });
    }

    // Obtener evaluaciones del estudiante
    const assessments = await SuicideAssessment.find({ student: studentId })
      .populate('psychologist', 'firstName lastName email')
      .sort({ date: -1 });

    // Configurar PDF
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Reporte del Estudiante ${student.firstName} ${student.lastName}`,
        }
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="reporte_estudiante_${studentId}.pdf"`);
    doc.pipe(res);

    // Información del estudiante

      
      // Fondo crema
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#fdf6e3'); // color crema suave
      
      // Volver a texto
      doc.fillColor('black');
      
      // Establecer fuente general y volver al punto inicial
      doc.font('Times-Roman'); // Puedes probar también 'Helvetica'
      
      // Título estilizado
      doc.fillColor('#2c3e50') // Azul oscuro
         .fontSize(26)
         .font('Helvetica-Bold')
         .text('Reporte del Estudiante', { align: 'center' })
         .moveDown(2);
      
      // Datos personales estilizados
      doc.fontSize(13).font('Times-Roman').fillColor('black');
      doc.text(`Nombre: ${student.firstName} ${student.lastName}`, { indent: 20 });
      doc.text(`Edad: ${student.age}`, { indent: 20 });
      doc.text(`Correo: ${student.email}`, { indent: 20 });
      doc.text(`Teléfono: ${student.phone}`, { indent: 20 });
      doc.text(`Ciudad: ${student.city}`, { indent: 20 });
      doc.text(`Carrera: ${student.career}`, { indent: 20 });
      doc.text(`Nivel: ${student.level}`, { indent: 20 });
      doc.text(`Género: ${student.gender}`, { indent: 20 });
      doc.text(`Ingresos: ${student.income}`, { indent: 20 });
      
      doc.text(
        `Psicólogo: ${student.assignedPsychologist?.firstName ?? 'N/A'} ${student.assignedPsychologist?.lastName ?? ''} (${student.assignedPsychologist?.email ?? 'N/A'})`,
        { indent: 20 }
      );
      

    // Notas clínicas
    doc.moveDown(2)
   .font('Helvetica-Bold')
   .fontSize(20)
   .fillColor('#2c3e50')
   .text('Notas Clínicas', { align: 'center' })
   .moveDown();

if (student.clinicalNotes.length > 0) {
  student.clinicalNotes.forEach(note => {
    doc.font('Times-Roman').fontSize(12).fillColor('black');
    doc.text(`- ${note.note}`, { indent: 20 });
    doc.text(`  Fecha: ${new Date(note.createdAt).toLocaleDateString()}`, { indent: 20 });
    doc.text(`  Creado por: ${note.createdBy?.name ?? 'Desconocido'}`, { indent: 20 });
    doc.moveDown();
  });
} else {
  doc.font('Times-Roman').fontSize(12).fillColor('black')
     .text('No hay notas clínicas registradas.', { indent: 20 });
}

// ===== Evaluaciones de Riesgo Suicida =====
doc.moveDown(2)
   .font('Helvetica-Bold')
   .fontSize(20)
   .fillColor('#2c3e50')
   .text('Evaluaciones de Riesgo Suicida', { align: 'center' })
   .moveDown();

if (assessments.length > 0) {
  assessments.forEach((assessment, index) => {
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#2c3e50')
       .text(`Evaluación #${index + 1}`, { underline: true, indent: 20 });
    
    doc.font('Times-Roman').fontSize(12).fillColor('black');
    doc.text(`Fecha: ${new Date(assessment.date).toLocaleDateString()}`, { indent: 20 });
    doc.text(`Psicólogo: ${assessment.psychologist?.firstName ?? 'N/A'} ${assessment.psychologist?.lastName ?? ''}`, { indent: 20 });
    doc.text(`Nivel de riesgo: ${assessment.riskLevel}`, { indent: 20 });
    doc.text(`Observaciones: ${assessment.observations || 'Ninguna'}`, { indent: 20 });
    doc.moveDown();
  });
} else {
  doc.font('Times-Roman').fontSize(12).fillColor('black')
     .text('No se han registrado evaluaciones de riesgo suicida para este estudiante.', { indent: 20 });
}

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al generar el PDF');
  }
};

module.exports = {
  generateStudentReportPDF,
};
