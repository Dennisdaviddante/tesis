// routes/student.routes.js
const express = require('express');
const router = express.Router();
const { generateAssessmentReportPDF } = require('../controllers/reportAssessmentPDF.controller');

router.get('/:id/report/pdfassessment' , generateAssessmentReportPDF); 

module.exports = router;