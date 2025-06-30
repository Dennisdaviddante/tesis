const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ruta de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/users';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + file.fieldname + ext;
        cb(null, uniqueSuffix);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExt = ['.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.includes(ext)) {
        return cb(new Error('Solo se permiten imágenes JPG o JPEG'));
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter
});

module.exports = upload;
