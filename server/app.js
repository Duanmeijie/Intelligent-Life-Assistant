const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedules');
const habitRoutes = require('./routes/habits');
const checkinRoutes = require('./routes/checkins');
const socialRoutes = require('./routes/social');
const aiRoutes = require('./routes/ai');

const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: '服务运行正常', data: { uptime: process.uptime() } });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器已启动，端口: ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
