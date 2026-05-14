const morgan = require('morgan');
const dayjs = require('dayjs');

const customFormat = (tokens, req, res) => {
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const status = tokens.status(req, res);
  const responseTime = tokens['response-time'](req, res);
  const contentLength = tokens.res(req, res, 'content-length');
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const statusIcon = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';

  return `[${timestamp}] ${statusIcon} ${method} ${url} ${status} ${responseTime}ms ${contentLength ? `- ${contentLength}b` : ''}`;
};

const loggerMiddleware = morgan(customFormat);

module.exports = loggerMiddleware;
