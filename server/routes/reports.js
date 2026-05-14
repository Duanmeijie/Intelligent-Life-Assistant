const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const createDailySummaryValidation = [
  body('summaryDate')
    .notEmpty().withMessage('总结日期不能为空')
    .isISO8601().withMessage('总结日期格式不正确'),
  body('moodRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('心情评分必须在1-5之间'),
  body('journal')
    .optional()
    .isLength({ max: 5000 }).withMessage('日记内容长度不能超过5000个字符'),
  body('sleepHours')
    .optional()
    .isFloat({ min: 0, max: 24 }).withMessage('睡眠时长格式不正确'),
  body('waterIntake')
    .optional()
    .isInt({ min: 0 }).withMessage('饮水量格式不正确'),
  body('exerciseMinutes')
    .optional()
    .isInt({ min: 0 }).withMessage('运动时长格式不正确'),
  body('productivityScore')
    .optional()
    .isInt({ min: 0, max: 10 }).withMessage('生产力评分必须在0-10之间')
];

router.get('/', auth, reportController.getWeeklyReports);
router.get('/latest', auth, reportController.getLatestReport);
router.get('/daily', auth, reportController.getDailySummaries);
router.post('/daily', auth, createDailySummaryValidation, validate, reportController.createDailySummary);

module.exports = router;
