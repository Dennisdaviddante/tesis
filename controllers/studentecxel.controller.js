const { response, request } = require('express');
const XLSX = require('xlsx');
const Student = require('../models/student');
const fs = require('fs');
const path = require('path');

const importStudents = async (req = request, res = response) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'Archivo no subido' });

    const filePath = path.join(__dirname, '..', req.file.path);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Verifica que el usuario autenticado exista
    const psicologoId = req.user?._id;
    if (!psicologoId) {
      return res.status(401).json({ msg: 'Usuario no autenticado correctamente' });
    }

    // Mapear datos del Excel al modelo
    const estudiantes = data.map((item) => ({
      firstName: item.firstName,
      lastName: item.lastName,
      age: item.age,
      phone: item.phone,
      email: item.email,
      city: item.city,
      gender: item.gender,
      career: item.career,
      level: item.level,
      employmentStatus: item.employmentStatus,
      income: item.income,
      assignedPsychologist: psicologoId // ← clave
    }));

    // Insertar en MongoDB
    await Student.insertMany(estudiantes);

    // Eliminar archivo temporal
    fs.unlinkSync(filePath);

    res.status(200).json({ msg: 'Estudiantes importados correctamente' });
  } catch (error) {
    console.error('Error al importar estudiantes:', error);
    res.status(500).json({ msg: 'Error al importar estudiantes', error });
  }
};

module.exports = {
  importStudents
};
