const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const checkinController = require('../controllers/checkinController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const createCheckinValidation = [
  body('habitId')
    .notEmpty().withMessage('习惯ID不能为空')
    .isInt({ min: 1 }).withMessage('习惯ID格式不正确'),
  body('note')
    .optional()
    .isLength({ max: 255 }).withMessage('备注长度不能超过255个字符'),
  body('checkinDate')
    .optional()
    .isISO8601().withMessage('日期格式不正确')
];

router.post('/', auth, createCheckinValidation, validate, checkinController.create);
router.get('/', auth, checkinController.list);
router.get('/stats', auth, checkinController.getStats);
router.delete('/:id', auth, checkinController.delete);

module.exports = router;
