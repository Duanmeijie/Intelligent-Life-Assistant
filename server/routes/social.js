const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const socialController = require('../controllers/socialController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const createPostValidation = [
  body('content')
    .notEmpty().withMessage('动态内容不能为空')
    .isLength({ max: 2000 }).withMessage('动态内容长度不能超过2000个字符'),
  body('images')
    .optional()
    .isArray().withMessage('图片格式不正确')
];

const addCommentValidation = [
  body('content')
    .notEmpty().withMessage('评论内容不能为空')
    .isLength({ max: 500 }).withMessage('评论内容长度不能超过500个字符')
];

router.get('/', auth, socialController.list);
router.post('/', auth, createPostValidation, validate, socialController.create);
router.delete('/:id', auth, socialController.delete);
router.post('/:id/like', auth, socialController.toggleLike);
router.post('/:id/comment', auth, addCommentValidation, validate, socialController.addComment);
router.get('/:id/comments', auth, socialController.getComments);

module.exports = router;
