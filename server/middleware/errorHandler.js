const { validationResult } = require('express-validator');

const errorHandler = (err, req, res, next) => {
  console.error(`[错误] ${req.method} ${req.originalUrl}:`, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? '服务器内部错误，请稍后重试' : message,
    code: statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      code: 400,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `接口 ${req.method} ${req.originalUrl} 不存在`,
    code: 404
  });
};

module.exports = { errorHandler, handleValidationErrors, notFoundHandler };
