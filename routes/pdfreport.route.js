// routes/student.routes.js
const express = require('express');
const router = express.Router();
const { generateStudentReportPDF } = require('../controllers/reportstudent.controller');

router.get('/student/:id', generateStudentReportPDF);

module.exports = router;