const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const createGoalValidation = [
  body('title')
    .notEmpty().withMessage('目标标题不能为空')
    .isLength({ max: 100 }).withMessage('目标标题长度不能超过100个字符'),
  body('targetValue')
    .notEmpty().withMessage('目标值不能为空')
    .isInt({ min: 1 }).withMessage('目标值必须为正整数'),
  body('startDate')
    .notEmpty().withMessage('开始日期不能为空')
    .isISO8601().withMessage('开始日期格式不正确'),
  body('endDate')
    .notEmpty().withMessage('截止日期不能为空')
    .isISO8601().withMessage('截止日期格式不正确'),
  body('category')
    .optional()
    .isIn(['health', 'study', 'work', 'life', 'sports', 'finance', 'other']).withMessage('目标分类值无效'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('目标描述长度不能超过500个字符'),
  body('currentValue')
    .optional()
    .isInt({ min: 0 }).withMessage('当前进度必须为非负整数'),
  body('unit')
    .optional()
    .isLength({ max: 20 }).withMessage('单位长度不能超过20个字符')
];

const updateGoalValidation = [
  body('title')
    .optional()
    .notEmpty().withMessage('目标标题不能为空')
    .isLength({ max: 100 }).withMessage('目标标题长度不能超过100个字符'),
  body('targetValue')
    .optional()
    .isInt({ min: 1 }).withMessage('目标值必须为正整数'),
  body('startDate')
    .optional()
    .isISO8601().withMessage('开始日期格式不正确'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('截止日期格式不正确'),
  body('category')
    .optional()
    .isIn(['health', 'study', 'work', 'life', 'sports', 'finance', 'other']).withMessage('目标分类值无效'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('目标描述长度不能超过500个字符'),
  body('currentValue')
    .optional()
    .isInt({ min: 0 }).withMessage('当前进度必须为非负整数'),
  body('unit')
    .optional()
    .isLength({ max: 20 }).withMessage('单位长度不能超过20个字符'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'abandoned']).withMessage('目标状态值无效')
];

router.get('/', auth, goalController.list);
router.post('/', auth, createGoalValidation, validate, goalController.create);
router.put('/:id', auth, updateGoalValidation, validate, goalController.update);
router.delete('/:id', auth, goalController.delete);

module.exports = router;
