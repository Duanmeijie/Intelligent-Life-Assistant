const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌',
      code: 401
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: '认证令牌格式错误',
      code: 401
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期，请重新登录',
        code: 401
      });
    }
    return res.status(401).json({
      success: false,
      message: '无效的认证令牌',
      code: 401
    });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.user = null;
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    req.user = null;
    return next();
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email
    };
  } catch (err) {
    req.user = null;
  }
  next();
};

module.exports = { auth, optionalAuth };
