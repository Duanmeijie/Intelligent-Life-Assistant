const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const habitController = require('../controllers/habitController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const createHabitValidation = [
  body('name')
    .notEmpty().withMessage('习惯名称不能为空')
    .isLength({ max: 100 }).withMessage('习惯名称长度不能超过100个字符'),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'custom']).withMessage('频率值无效'),
  body('category')
    .optional()
    .isString().withMessage('分类格式不正确'),
  body('color')
    .optional()
    .matches(/^#[0-9a-fA-F]{6}$/).withMessage('颜色格式不正确（需为16进制颜色码）'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('描述长度不能超过500个字符')
];

const updateHabitValidation = [
  body('name')
    .optional()
    .notEmpty().withMessage('习惯名称不能为空')
    .isLength({ max: 100 }).withMessage('习惯名称长度不能超过100个字符'),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'custom']).withMessage('频率值无效'),
  body('category')
    .optional()
    .isString().withMessage('分类格式不正确'),
  body('color')
    .optional()
    .matches(/^#[0-9a-fA-F]{6}$/).withMessage('颜色格式不正确（需为16进制颜色码）'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('描述长度不能超过500个字符'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('启用状态格式不正确')
];

router.get('/', auth, habitController.list);
router.post('/', auth, createHabitValidation, validate, habitController.create);
router.put('/:id', auth, updateHabitValidation, validate, habitController.update);
router.delete('/:id', auth, habitController.delete);

module.exports = router;
