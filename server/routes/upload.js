const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { auth } = require('../middleware/auth');
const upload = require('../config/upload');

router.post('/single', auth, upload.single('file'), uploadController.uploadSingle);
router.post('/multiple', auth, upload.array('files', 9), uploadController.uploadMultiple);
router.delete('/:filename', auth, uploadController.delete);

module.exports = router;
