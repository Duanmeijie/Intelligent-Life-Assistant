const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'intelligent_life_assistant',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4'
});

pool.getConnection()
  .then(connection => {
    console.log('[数据库] MySQL 连接池已成功创建');
    console.log(`[数据库] 主机: ${process.env.DB_HOST || 'localhost'}:${parseInt(process.env.DB_PORT, 10) || 3306}`);
    console.log(`[数据库] 数据库: ${process.env.DB_NAME || 'intelligent_life_assistant'}`);
    connection.release();
  })
  .catch(err => {
    console.error('[数据库] MySQL 连接失败:', err.message);
  });

module.exports = pool;
