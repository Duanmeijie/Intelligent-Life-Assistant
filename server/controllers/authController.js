const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const UserSetting = require('../models/UserSetting');
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

      await UserSetting.upsert(userId, { theme: 'light', language: 'zh-CN' });

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
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json(error('该邮箱未注册', 404));
      }

      await PasswordReset.invalidateExisting(email);

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await PasswordReset.create(email, token, expiresAt);

      res.json(success({
        token,
        message: '密码重置令牌已生成，请使用令牌重置密码（有效期1小时）'
      }, '重置令牌已发送'));
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      const resetRecord = await PasswordReset.findByToken(token);
      if (!resetRecord) {
        return res.status(400).json(error('令牌无效或已过期', 400));
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.updatePasswordByEmail(resetRecord.email, hashedPassword);
      await PasswordReset.markAsUsed(token);

      res.json(success(null, '密码重置成功'));
    } catch (err) {
      next(err);
    }
  },

  async getSettings(req, res, next) {
    try {
      const settings = await UserSetting.findByUserId(req.user.id);
      res.json(success(settings || { theme: 'light', language: 'zh-CN' }));
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const { theme, language, notification_enabled, email_notification } = req.body;
      const data = {};
      if (theme !== undefined) data.theme = theme;
      if (language !== undefined) data.language = language;
      if (notification_enabled !== undefined) data.notification_enabled = notification_enabled;
      if (email_notification !== undefined) data.email_notification = email_notification;

      const settings = await UserSetting.upsert(req.user.id, data);
      res.json(success(settings, '设置更新成功'));
    } catch (err) {
      next(err);
    }
  }
};

module.exports = authController;
