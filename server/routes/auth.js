const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const registerValidation = [
  body('username')
    .notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 3, max: 20 }).withMessage('用户名长度需在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .notEmpty().withMessage('邮箱不能为空')
    .isEmail().withMessage('邮箱格式不正确'),
  body('password')
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 8, max: 20 }).withMessage('密码长度需在8-20个字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('密码需包含大小写字母和数字')
];

const loginValidation = [
  body('username')
    .notEmpty().withMessage('用户名不能为空'),
  body('password')
    .notEmpty().withMessage('密码不能为空')
];

const updateProfileValidation = [
  body('nickname')
    .optional()
    .isLength({ max: 50 }).withMessage('昵称长度不能超过50个字符'),
  body('bio')
    .optional()
    .isLength({ max: 255 }).withMessage('个性签名长度不能超过255个字符'),
  body('avatar')
    .optional()
    .isString().withMessage('头像格式不正确')
];

const changePasswordValidation = [
  body('oldPassword')
    .notEmpty().withMessage('原密码不能为空'),
  body('newPassword')
    .notEmpty().withMessage('新密码不能为空')
    .isLength({ min: 8, max: 20 }).withMessage('新密码长度需在8-20个字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('新密码需包含大小写字母和数字')
];

router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, updateProfileValidation, validate, authController.updateProfile);
router.put('/password', auth, changePasswordValidation, validate, authController.changePassword);

module.exports = router;
