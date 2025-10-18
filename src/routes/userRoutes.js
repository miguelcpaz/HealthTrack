const express = require('express');
const router = express.Router();
const multer = require('multer');
const { registerUser, getFuncionariosByHospital, registerUsersFromExcel } = require('../controllers/userController');

// Configuração do multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel são permitidos'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// Rotas
router.post('/register', registerUser);
router.get('/funcionarios/:id', getFuncionariosByHospital);
router.post('/register-from-excel', upload.single('file'), registerUsersFromExcel);

module.exports = router;
