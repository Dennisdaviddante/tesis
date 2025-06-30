const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {  importStudents } = require('../controllers/studentecxel.controller');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Ruta para importar estudiantes
router.post('/', upload.single('file'), importStudents);

module.exports = router;