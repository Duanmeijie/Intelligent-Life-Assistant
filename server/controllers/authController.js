const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');
const { success, error } = require('../utils/response');

const authController = {
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(409).json(error('用户名已被注册', 409));
      }

      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json(error('邮箱已被注册', 409));
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = await User.create({ username, email, password: hashedPassword });

      const token = jwt.sign(
        { id: userId, username },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );

      res.status(201).json(success({
        id: userId,
        username,
        email,
        token
      }, '注册成功', 201));
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json(error('用户名或密码不正确', 401));
      }

      if (user.status === 0) {
        return res.status(403).json(error('账号已被禁用', 403));
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json(error('用户名或密码不正确', 401));
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );

      res.json(success({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          bio: user.bio
        }
      }, '登录成功'));
    } catch (err) {
      next(err);
    }
  },

  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json(error('用户不存在', 404));
      }

      res.json(success(user));
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { nickname, bio, avatar } = req.body;

      const updated = await User.updateProfile(req.user.id, { nickname, bio, avatar });
      if (!updated) {
        return res.status(400).json(error('没有需要更新的信息', 400));
      }

      const user = await User.findById(req.user.id);
      res.json(success(user, '个人信息更新成功'));
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;

      const user = await User.findByUsername(req.user.username);
      if (!user) {
        return res.status(404).json(error('用户不存在', 404));
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json(error('原密码不正确', 400));
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.updatePassword(req.user.id, hashedPassword);

      res.json(success(null, '密码修改成功'));
    } catch (err) {
      next(err);
    }
  }
};

module.exports = authController;
