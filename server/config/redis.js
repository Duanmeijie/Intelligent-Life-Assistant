const redis = require('redis');
require('dotenv').config();

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB, 10) || 0
});

redisClient.on('connect', () => {
  console.log('[Redis] 正在连接 Redis 服务器...');
});

redisClient.on('ready', () => {
  console.log('[Redis] Redis 连接就绪');
});

redisClient.on('error', (err) => {
  console.error('[Redis] 连接错误:', err.message);
});

redisClient.on('end', () => {
  console.log('[Redis] Redis 连接已关闭');
});

redisClient.connect().catch(err => {
  console.error('[Redis] 连接失败:', err.message);
});

module.exports = redisClient;
