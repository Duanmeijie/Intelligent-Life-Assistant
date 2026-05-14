const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const createScheduleValidation = [
  body('title')
    .notEmpty().withMessage('标题不能为空')
    .isLength({ max: 100 }).withMessage('标题长度不能超过100个字符'),
  body('startTime')
    .notEmpty().withMessage('开始时间不能为空')
    .isISO8601().withMessage('开始时间格式不正确'),
  body('endTime')
    .notEmpty().withMessage('结束时间不能为空')
    .isISO8601().withMessage('结束时间格式不正确'),
  body('category')
    .optional()
    .isIn(['work', 'study', 'life', 'sports', 'other']).withMessage('分类值无效'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('描述长度不能超过500个字符')
];

const updateScheduleValidation = [
  body('title')
    .notEmpty().withMessage('标题不能为空')
    .isLength({ max: 100 }).withMessage('标题长度不能超过100个字符'),
  body('startTime')
    .notEmpty().withMessage('开始时间不能为空')
    .isISO8601().withMessage('开始时间格式不正确'),
  body('endTime')
    .notEmpty().withMessage('结束时间不能为空')
    .isISO8601().withMessage('结束时间格式不正确'),
  body('category')
    .optional()
    .isIn(['work', 'study', 'life', 'sports', 'other']).withMessage('分类值无效'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('描述长度不能超过500个字符')
];

const updateStatusValidation = [
  body('status')
    .notEmpty().withMessage('状态不能为空')
    .isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('状态值无效')
];

router.get('/', auth, scheduleController.list);
router.post('/', auth, createScheduleValidation, validate, scheduleController.create);
router.put('/:id', auth, updateScheduleValidation, validate, scheduleController.update);
router.delete('/:id', auth, scheduleController.delete);
router.put('/:id/status', auth, updateStatusValidation, validate, scheduleController.updateStatus);

module.exports = router;
