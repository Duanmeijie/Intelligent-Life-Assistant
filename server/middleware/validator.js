const { body, query, validationResult } = require('express-validator');

const registerRules = [
  body('username')
    .notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 }).withMessage('用户名长度必须在3-50个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .notEmpty().withMessage('邮箱不能为空')
    .isEmail().withMessage('邮箱格式不正确')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 6, max: 100 }).withMessage('密码长度必须在6-100个字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('密码必须包含大小写字母和数字')
];

const loginRules = [
  body('username')
    .notEmpty().withMessage('用户名不能为空'),
  body('password')
    .notEmpty().withMessage('密码不能为空')
];

const createScheduleRules = [
  body('title')
    .notEmpty().withMessage('日程标题不能为空')
    .isLength({ max: 100 }).withMessage('日程标题不能超过100个字符'),
  body('start_time')
    .notEmpty().withMessage('开始时间不能为空')
    .isISO8601().withMessage('开始时间格式不正确'),
  body('end_time')
    .notEmpty().withMessage('结束时间不能为空')
    .isISO8601().withMessage('结束时间格式不正确')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_time)) {
        throw new Error('结束时间必须大于开始时间');
      }
      return true;
    }),
  body('category')
    .optional()
    .isIn(['work', 'study', 'life', 'sports', 'other']).withMessage('日程分类无效'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('日程状态无效')
];

const updateScheduleRules = [
  body('title')
    .optional()
    .isLength({ max: 100 }).withMessage('日程标题不能超过100个字符'),
  body('start_time')
    .optional()
    .isISO8601().withMessage('开始时间格式不正确'),
  body('end_time')
    .optional()
    .isISO8601().withMessage('结束时间格式不正确'),
  body('category')
    .optional()
    .isIn(['work', 'study', 'life', 'sports', 'other']).withMessage('日程分类无效'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('日程状态无效')
];

const createHabitRules = [
  body('name')
    .notEmpty().withMessage('习惯名称不能为空')
    .isLength({ max: 100 }).withMessage('习惯名称不能超过100个字符'),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'custom']).withMessage('习惯频率无效'),
  body('color')
    .optional()
    .matches(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/).withMessage('颜色格式无效，请使用十六进制颜色码'),
  body('reminder_time')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).withMessage('提醒时间格式无效，请使用HH:mm:ss格式')
];

const checkinRules = [
  body('habit_id')
    .notEmpty().withMessage('习惯ID不能为空')
    .isInt({ min: 1 }).withMessage('习惯ID必须为正整数'),
  body('checkin_date')
    .notEmpty().withMessage('打卡日期不能为空')
    .isISO8601().withMessage('打卡日期格式不正确'),
  body('note')
    .optional()
    .isLength({ max: 255 }).withMessage('备注不能超过255个字符')
];

const createPostRules = [
  body('content')
    .notEmpty().withMessage('动态内容不能为空')
    .isLength({ min: 1, max: 10000 }).withMessage('动态内容长度必须在1-10000个字符之间'),
  body('images')
    .optional()
    .isArray({ max: 9 }).withMessage('图片最多上传9张')
];

const createCommentRules = [
  body('post_id')
    .notEmpty().withMessage('动态ID不能为空')
    .isInt({ min: 1 }).withMessage('动态ID必须为正整数'),
  body('content')
    .notEmpty().withMessage('评论内容不能为空')
    .isLength({ min: 1, max: 2000 }).withMessage('评论内容长度必须在1-2000个字符之间'),
  body('parent_id')
    .optional({ values: 'null' })
    .isInt({ min: 1 }).withMessage('父评论ID必须为正整数')
];

const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('页码必须为正整数'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('每页条数必须在1-100之间')
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    return res.status(422).json({
      code: 422,
      message: '参数校验失败',
      errors: errorMessages
    });
  }
  next();
};

module.exports = {
  validate,
  registerRules,
  loginRules,
  createScheduleRules,
  updateScheduleRules,
  createHabitRules,
  checkinRules,
  createPostRules,
  createCommentRules,
  paginationRules
};
