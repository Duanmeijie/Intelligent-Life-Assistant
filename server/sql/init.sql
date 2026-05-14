-- 智能生活助手 数据库初始化脚本
-- Intelligent Life Assistant Database Initialization Script

CREATE DATABASE IF NOT EXISTS intelligent_life_assistant
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE intelligent_life_assistant;

-- ============================================================
-- 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
  password VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
  nickname VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  avatar VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  bio VARCHAR(255) DEFAULT NULL COMMENT '个人简介',
  status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================================
-- 日程表
-- ============================================================
CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  title VARCHAR(100) NOT NULL COMMENT '日程标题',
  description TEXT DEFAULT NULL COMMENT '日程描述',
  category ENUM('work', 'study', 'life', 'sports', 'other') DEFAULT 'other' COMMENT '分类',
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
  start_time DATETIME NOT NULL COMMENT '开始时间',
  end_time DATETIME NOT NULL COMMENT '结束时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_start_time (start_time),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='日程表';

-- ============================================================
-- 习惯表
-- ============================================================
CREATE TABLE IF NOT EXISTS habits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  name VARCHAR(100) NOT NULL COMMENT '习惯名称',
  description TEXT DEFAULT NULL COMMENT '习惯描述',
  frequency ENUM('daily', 'weekly', 'monthly', 'custom') DEFAULT 'daily' COMMENT '频率',
  category VARCHAR(50) DEFAULT NULL COMMENT '习惯分类',
  color VARCHAR(7) DEFAULT '#409EFF' COMMENT '颜色标识',
  reminder_time TIME DEFAULT NULL COMMENT '提醒时间',
  is_active TINYINT DEFAULT 1 COMMENT '是否活跃：1-活跃，0-暂停',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='习惯表';

-- ============================================================
-- 打卡记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  habit_id INT NOT NULL COMMENT '习惯ID',
  checkin_date DATE NOT NULL COMMENT '打卡日期',
  note VARCHAR(255) DEFAULT NULL COMMENT '打卡备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uk_habit_date (habit_id, checkin_date),
  INDEX idx_user_id (user_id),
  INDEX idx_habit_id (habit_id),
  INDEX idx_checkin_date (checkin_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打卡记录表';

-- ============================================================
-- 社交动态表
-- ============================================================
CREATE TABLE IF NOT EXISTS social_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '发布用户ID',
  content TEXT NOT NULL COMMENT '动态内容',
  images JSON DEFAULT NULL COMMENT '图片列表（JSON数组）',
  likes_count INT DEFAULT 0 COMMENT '点赞数',
  comments_count INT DEFAULT 0 COMMENT '评论数',
  status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-隐藏',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='社交动态表';

-- ============================================================
-- 评论表
-- ============================================================
CREATE TABLE IF NOT EXISTS social_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL COMMENT '动态ID',
  user_id INT NOT NULL COMMENT '评论用户ID',
  parent_id INT DEFAULT NULL COMMENT '父评论ID（用于回复）',
  content TEXT NOT NULL COMMENT '评论内容',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES social_comments(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id),
  INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- ============================================================
-- 点赞表
-- ============================================================
CREATE TABLE IF NOT EXISTS social_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  post_id INT NOT NULL COMMENT '动态ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_user_post (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_post_id (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞表';

-- ============================================================
-- 通知表
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '接收用户ID',
  type VARCHAR(50) NOT NULL COMMENT '通知类型：like/comment/system/achievement/reminder',
  title VARCHAR(200) NOT NULL COMMENT '通知标题',
  content TEXT DEFAULT NULL COMMENT '通知内容',
  related_id INT DEFAULT NULL COMMENT '关联对象ID',
  related_type VARCHAR(50) DEFAULT NULL COMMENT '关联对象类型',
  is_read TINYINT DEFAULT 0 COMMENT '是否已读：1-已读，0-未读',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- ============================================================
-- 密码重置表
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL COMMENT '邮箱地址',
  token VARCHAR(100) NOT NULL UNIQUE COMMENT '重置令牌',
  expires_at DATETIME NOT NULL COMMENT '过期时间',
  used TINYINT DEFAULT 0 COMMENT '是否已使用：1-已使用，0-未使用',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_email (email),
  INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='密码重置表';

-- ============================================================
-- 成就定义表
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE COMMENT '成就代码',
  name VARCHAR(100) NOT NULL COMMENT '成就名称',
  description VARCHAR(255) DEFAULT NULL COMMENT '成就描述',
  icon VARCHAR(50) DEFAULT NULL COMMENT '图标标识',
  category VARCHAR(50) DEFAULT NULL COMMENT '成就分类',
  threshold INT DEFAULT 0 COMMENT '达成阈值',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成就定义表';

-- ============================================================
-- 用户成就关联表
-- ============================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  achievement_id INT NOT NULL COMMENT '成就ID',
  achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '达成时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uk_user_achievement (user_id, achievement_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户成就表';

-- ============================================================
-- 用户设置表
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE COMMENT '用户ID',
  theme VARCHAR(20) DEFAULT 'light' COMMENT '主题：light/dark',
  language VARCHAR(10) DEFAULT 'zh-CN' COMMENT '语言偏好',
  notification_enabled TINYINT DEFAULT 1 COMMENT '通知开关',
  email_notification TINYINT DEFAULT 1 COMMENT '邮件通知开关',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- ============================================================
-- 文件上传记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '上传用户ID',
  filename VARCHAR(255) NOT NULL COMMENT '原始文件名',
  stored_name VARCHAR(255) NOT NULL COMMENT '存储文件名',
  file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
  file_size INT DEFAULT 0 COMMENT '文件大小（字节）',
  mime_type VARCHAR(100) DEFAULT NULL COMMENT 'MIME类型',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件上传记录表';

-- ============================================================
-- 周报表
-- ============================================================
CREATE TABLE IF NOT EXISTS weekly_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  week_start DATE NOT NULL COMMENT '周开始日期',
  week_end DATE NOT NULL COMMENT '周结束日期',
  total_checkins INT DEFAULT 0 COMMENT '总打卡次数',
  total_habits INT DEFAULT 0 COMMENT '活跃习惯数',
  completion_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '完成率（百分比）',
  avg_mood DECIMAL(3,1) DEFAULT NULL COMMENT '平均心情评分',
  summary TEXT DEFAULT NULL COMMENT '周报总结',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_week_start (week_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='周报表';

-- ============================================================
-- 每日总结表
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_summaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  summary_date DATE NOT NULL COMMENT '总结日期',
  mood_rating INT DEFAULT NULL COMMENT '心情评分（1-5）',
  journal TEXT DEFAULT NULL COMMENT '日记内容',
  sleep_hours DECIMAL(3,1) DEFAULT NULL COMMENT '睡眠时长',
  water_intake INT DEFAULT NULL COMMENT '饮水量（毫升）',
  exercise_minutes INT DEFAULT NULL COMMENT '运动时长（分钟）',
  productivity_score INT DEFAULT NULL COMMENT '生产力评分',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uk_user_date (user_id, summary_date),
  INDEX idx_user_id (user_id),
  INDEX idx_summary_date (summary_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日总结表';

-- ============================================================
-- 用户目标表
-- ============================================================
CREATE TABLE IF NOT EXISTS user_goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  title VARCHAR(100) NOT NULL COMMENT '目标标题',
  description TEXT DEFAULT NULL COMMENT '目标描述',
  target_value INT NOT NULL COMMENT '目标值',
  current_value INT DEFAULT 0 COMMENT '当前进度',
  unit VARCHAR(20) DEFAULT NULL COMMENT '单位（如：次/天/本/公斤）',
  start_date DATE NOT NULL COMMENT '开始日期',
  end_date DATE NOT NULL COMMENT '截止日期',
  category ENUM('health', 'study', 'work', 'life', 'sports', 'finance', 'other') DEFAULT 'other' COMMENT '分类',
  status ENUM('active', 'completed', 'abandoned') DEFAULT 'active' COMMENT '状态',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_category (category),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户目标表';

-- ============================================================
-- 插入测试数据
-- ============================================================

-- 测试用户密码为 Test123456 (bcrypt hash)
INSERT INTO users (username, email, password, nickname, bio) VALUES
('testuser', 'test@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'TestUser', '探索生活，记录成长'),
('admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', '系统管理员'),
('user2', 'user2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '活力小张', '爱运动，爱生活，每天进步一点点'),
('user3', 'user3@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '学霸小李', '终身学习者，用知识改变世界'),
('user4', 'user4@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '文艺小王', '咖啡、书籍和代码，构成了我的世界');

-- 插入用户设置
INSERT INTO user_settings (user_id, theme, language) VALUES
(1, 'light', 'zh-CN'),
(2, 'dark', 'zh-CN'),
(3, 'light', 'zh-CN'),
(4, 'dark', 'zh-CN'),
(5, 'light', 'zh-CN');

-- 插入成就定义
INSERT INTO achievements (code, name, description, icon, category, threshold) VALUES
('first_checkin', '初次打卡', '完成第一次习惯打卡', 'medal', 'checkin', 1),
('streak_7', '连续7天', '连续打卡7天', 'fire', 'streak', 7),
('streak_30', '月度达人', '连续打卡30天', 'trophy', 'streak', 30),
('streak_100', '百日先锋', '连续打卡100天', 'crown', 'streak', 100),
('habits_3', '习惯养成者', '同时活跃3个习惯', 'star', 'habit', 3),
('habits_10', '自律大师', '创建10个习惯', 'diamond', 'habit', 10),
('checkins_100', '打卡百次', '累计打卡100次', 'certificate', 'checkin', 100),
('posts_10', '社区活跃', '发布10条动态', 'chat', 'social', 10),
('posts_50', '社区达人', '发布50条动态', 'microphone', 'social', 50),
('early_bird', '早起达人', '连续7天在早上7点前完成打卡', 'sunrise', 'streak', 7),
('journal_keeper', '日记坚持者', '连续30天记录每日总结', 'book', 'streak', 30),
('sports_master', '运动健将', '累计运动打卡达到50次', 'running', 'checkin', 50),
('study_mode', '学霸模式', '累计学习打卡达到100次', 'graduation-cap', 'checkin', 100),
('perfect_week', '完美一周', '一周内完成所有计划习惯，完成率100%', 'award', 'streak', 7);

-- 插入示例习惯 - testuser (user_id=1)
INSERT INTO habits (user_id, name, description, frequency, category, color, is_active, reminder_time) VALUES
(1, '晨跑', '每天早上跑步30分钟', 'daily', '运动', '#67C23A', 1, '06:30:00'),
(1, '阅读', '每天阅读30分钟', 'daily', '学习', '#409EFF', 1, '21:00:00'),
(1, '冥想', '每天冥想10分钟', 'daily', '生活', '#E6A23C', 1, '07:30:00'),
(1, '写日记', '每天记录生活感悟', 'daily', '生活', '#F56C6C', 1, '22:00:00'),
(1, '学习英语', '每天学习英语1小时', 'daily', '学习', '#909399', 1, '08:00:00'),
(1, '力量训练', '每周3次力量训练', 'weekly', '运动', '#9B59B6', 1, NULL),
(1, '多喝水', '每天喝足8杯水', 'daily', '健康', '#3498DB', 1, NULL);

-- 插入示例习惯 - user2 (user_id=3)
INSERT INTO habits (user_id, name, description, frequency, category, color, is_active, reminder_time) VALUES
(3, '晨间瑜伽', '早起做15分钟瑜伽', 'daily', '运动', '#E91E63', 1, '06:00:00'),
(3, '背单词', '每天背30个英语单词', 'daily', '学习', '#2196F3', 1, '08:00:00'),
(3, '晚间散步', '晚饭后散步40分钟', 'daily', '健康', '#4CAF50', 1, '19:00:00'),
(3, '记账', '每天记录收支情况', 'daily', '生活', '#FF9800', 1, '22:00:00');

-- 插入示例习惯 - user3 (user_id=4)
INSERT INTO habits (user_id, name, description, frequency, category, color, is_active, reminder_time) VALUES
(4, '编程练习', '每天刷一道LeetCode', 'daily', '学习', '#00BCD4', 1, '09:00:00'),
(4, '阅读论文', '每周阅读一篇技术论文', 'weekly', '学习', '#3F51B5', 1, NULL),
(4, '跑步5公里', '每天跑步5公里', 'daily', '运动', '#8BC34A', 1, '06:30:00'),
(4, '早睡早起', '每天23:00前睡觉，6:00起床', 'daily', '健康', '#009688', 1, NULL),
(4, '写作', '每天写作500字', 'daily', '学习', '#FF5722', 1, '20:00:00');

-- 插入示例习惯 - user4 (user_id=5)
INSERT INTO habits (user_id, name, description, frequency, category, color, is_active, reminder_time) VALUES
(5, '画画', '每天练习素描30分钟', 'daily', '生活', '#9C27B0', 1, '16:00:00'),
(5, '弹吉他', '每天练习吉他1小时', 'daily', '生活', '#795548', 1, '18:00:00'),
(5, '读书笔记', '每天写读书笔记', 'daily', '学习', '#607D8B', 1, '21:00:00');

-- 插入示例日程
INSERT INTO schedules (user_id, title, description, category, status, start_time, end_time) VALUES
(1, '团队周会', '讨论本周项目进度', 'work', 'pending', CONCAT(CURDATE(), ' 09:00:00'), CONCAT(CURDATE(), ' 10:00:00')),
(1, '英语课程', '在线英语学习', 'study', 'pending', CONCAT(CURDATE(), ' 14:00:00'), CONCAT(CURDATE(), ' 15:30:00')),
(1, '健身训练', '力量训练1小时', 'sports', 'pending', CONCAT(CURDATE(), ' 18:00:00'), CONCAT(CURDATE(), ' 19:00:00')),
(1, '读书会', '与朋友分享读书心得', 'life', 'completed', CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 20:00:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 21:30:00')),
(3, '瑜伽课', '社区瑜伽课程', 'sports', 'pending', CONCAT(CURDATE(), ' 07:00:00'), CONCAT(CURDATE(), ' 08:00:00')),
(4, '代码评审', '团队代码评审会议', 'work', 'pending', CONCAT(CURDATE(), ' 10:00:00'), CONCAT(CURDATE(), ' 11:30:00'));

-- 插入打卡记录 - testuser 过去7天
INSERT INTO checkins (user_id, habit_id, checkin_date, note) VALUES
(1, 1, DATE_SUB(CURDATE(), INTERVAL 6 DAY), '感觉不错'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '坚持就是胜利'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '今天状态很好'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '加油'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '继续努力'),
(1, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '习惯逐渐养成'),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 6 DAY), '读完了《三体》第一册'),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '继续三体系列'),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '读了一本好书'),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '受益匪浅'),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '继续保持阅读'),
(1, 3, DATE_SUB(CURDATE(), INTERVAL 6 DAY), '冥想让心情平静'),
(1, 3, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '专注力提升明显'),
(1, 3, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '今天冥想状态特别好'),
(1, 3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '继续坚持冥想'),
(1, 3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '冥想已成为习惯'),
(1, 4, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '今天遇到了一件有趣的事'),
(1, 4, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '记录生活中的小确幸'),
(1, 4, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '反思了最近的状态'),
(1, 4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '写下了一天的收获'),
(1, 5, DATE_SUB(CURDATE(), INTERVAL 6 DAY), '背诵了30个新单词'),
(1, 5, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '听力练习30分钟'),
(1, 5, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '口语练习感觉进步了'),
(1, 5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '英语阅读打卡');

-- 插入打卡记录 - user2 过去7天
INSERT INTO checkins (user_id, habit_id, checkin_date, note) VALUES
(3, 8, DATE_SUB(CURDATE(), INTERVAL 6 DAY), '瑜伽让身体舒展'),
(3, 8, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '清晨的阳光和瑜伽最配'),
(3, 8, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '柔韧性越来越好了'),
(3, 8, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '坚持瑜伽打卡'),
(3, 8, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '今天尝试了新体式'),
(3, 8, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '瑜伽第15天'),
(3, 9, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '今日单词：30个'),
(3, 9, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '复习了昨天的单词'),
(3, 9, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '坚持背单词');

-- 插入打卡记录 - user3 过去7天
INSERT INTO checkins (user_id, habit_id, checkin_date, note) VALUES
(4, 12, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'LeetCode每日一题完成'),
(4, 12, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '今天攻克了一道动态规划'),
(4, 12, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '算法能力稳步提升'),
(4, 12, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '今日题目难度中等'),
(4, 12, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '双指针题目秒杀'),
(4, 14, DATE_SUB(CURDATE(), INTERVAL 6 DAY), '5公里用时25分钟'),
(4, 14, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '配速提升了'),
(4, 14, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '今天跑了6公里');

-- 插入打卡记录 - user4 过去7天
INSERT INTO checkins (user_id, habit_id, checkin_date, note) VALUES
(5, 17, DATE_SUB(CURDATE(), INTERVAL 6 DAY), '今天画了一幅风景素描'),
(5, 17, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '人物素描练习'),
(5, 17, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '静物写生完成'),
(5, 18, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '学会了新的和弦'),
(5, 18, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '弹奏完整曲目'),
(5, 19, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '《活着》读书笔记'),
(5, 19, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '读后感写完了');

-- 插入周报 - testuser 过去两周
INSERT INTO weekly_reports (user_id, week_start, week_end, total_checkins, total_habits, completion_rate, avg_mood, summary) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 13 DAY), DATE_SUB(CURDATE(), INTERVAL 7 DAY), 28, 7, 85.71, 4.2, '本周整体表现不错，晨跑和冥想坚持得最好，阅读方面略有懈怠。英语学习进度正常，单词量稳步增加。下周计划增加力量训练的频率，争取所有习惯都能100%完成。'),
(1, DATE_SUB(CURDATE(), INTERVAL 6 DAY), CURDATE(), 24, 7, 78.57, 4.0, '本周完成率略有下降，主要是写日记有两天没坚持。不过晨跑和冥想依然保持得很好。下周需要重点提升日记和英语学习的完成率，目标达到85%以上。');

-- 插入每日总结 - testuser 过去7天
INSERT INTO daily_summaries (user_id, summary_date, mood_rating, journal, sleep_hours, water_intake, exercise_minutes, productivity_score) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 4, '今天是充实的一天。早上跑了3公里，上午完成了项目周报的编写，下午学习了英语语法。晚上读了一会《三体》，科幻小说真的能打开思维。', 7.5, 1800, 30, 8),
(1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 3, '今天状态一般，下午有点犯困。不过还是坚持了冥想和日记。午餐吃了很棒的沙拉，感觉健康饮食对精神状态的提升很明显。', 6.0, 1500, 0, 6),
(1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 5, '超级棒的一天！工作效率特别高，完成了一个拖了很久的功能模块。晚上的读书时光也特别享受，三体的故事越来越精彩了。运动也坚持得很好。', 8.0, 2000, 45, 9),
(1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 4, '今天和朋友聚餐，心情很好。虽然是休息日，但还是坚持了晨跑和冥想。下午学习了英语口语，感觉发音有进步。', 7.0, 1600, 30, 7),
(1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 2, '今天状态不太好，可能是昨晚没睡好。漏掉了写日记，只完成了晨跑和冥想。需要调整作息，保证充足的睡眠。', 5.0, 1200, 30, 4),
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 4, '状态回弹！睡眠改善后整个人都不一样了。今天完成了所有习惯打卡，还额外做了一组力量训练。英语学习也很有收获，背了30个新单词。', 7.5, 1800, 60, 8),
(1, CURDATE(), 5, '今天是高效的一天！早上6:30起床晨跑，上午处理了积累的邮件和工作任务。下午学习了2小时英语，晚上读完了三体的第二册。感觉最近的学习状态越来越好了。', 8.0, 2000, 30, 9);

-- 插入用户目标 - testuser
INSERT INTO user_goals (user_id, title, description, target_value, current_value, unit, start_date, end_date, category, status) VALUES
(1, '每月跑步100公里', '坚持每天跑步，月跑量达到100公里', 100, 67, '公里', DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_ADD(CURDATE(), INTERVAL 16 DAY), 'sports', 'active'),
(1, '读完12本书', '今年读完12本好书并写读书笔记', 12, 5, '本', DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_ADD(CURDATE(), INTERVAL 305 DAY), 'study', 'active'),
(1, '体重降到65公斤', '通过运动和饮食控制，将体重降至65公斤', 65, 70, '公斤', DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 'health', 'active');

-- 插入用户目标 - user2
INSERT INTO user_goals (user_id, title, description, target_value, current_value, unit, start_date, end_date, category, status) VALUES
(3, '减脂5公斤', '通过瑜伽和饮食控制减脂5公斤', 5, 2, '公斤', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 40 DAY), 'health', 'active'),
(3, '学习1000个英语单词', '每天背30个单词，一个月掌握1000个', 1000, 450, '个', DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'study', 'active');

-- 插入用户目标 - user3
INSERT INTO user_goals (user_id, title, description, target_value, current_value, unit, start_date, end_date, category, status) VALUES
(4, '刷完200道LeetCode', '每天至少一道算法题，持续精进', 200, 87, '题', DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_ADD(CURDATE(), INTERVAL 120 DAY), 'study', 'active'),
(4, '完成半马训练', '为期3个月的半程马拉松训练计划', 21, 12, '公里', DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 'sports', 'active'),
(4, '学会React框架', '系统学习React并完成一个实战项目', 1, 1, '个', DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'study', 'completed');

-- 插入用户目标 - user4
INSERT INTO user_goals (user_id, title, description, target_value, current_value, unit, start_date, end_date, category, status) VALUES
(5, '完成100幅素描', '每天画画，积累100幅素描作品', 100, 34, '幅', DATE_SUB(CURDATE(), INTERVAL 40 DAY), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 'life', 'active'),
(5, '学会10首吉他曲', '熟练掌握10首完整的吉他弹唱曲目', 10, 4, '首', DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 90 DAY), 'life', 'active'),
(5, '每月读2本书', '保持阅读习惯，每月完成2本书', 2, 1, '本', DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_ADD(CURDATE(), INTERVAL 16 DAY), 'study', 'active'),
(5, '攒够旅行基金', '为年末的旅行攒够5000元', 5000, 1500, '元', DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 200 DAY), 'finance', 'active');

-- 插入示例社交动态
INSERT INTO social_posts (user_id, content, images, likes_count, comments_count) VALUES
(1, '今天完成了晨跑打卡，感觉精力充沛！坚持运动真的能改变生活状态，推荐大家都来试试！#健康生活 #晨跑', '["https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"]', 12, 4),
(1, '读完了《原子习惯》，书中说"每天进步1%，一年后你会进步37倍"，与大家共勉！', '["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600"]', 8, 3),
(1, '冥想第30天打卡！从一开始坐不住5分钟到现在可以轻松冥想15分钟，专注力真的提升了很多。强烈推荐给所有想提高效率的朋友！#冥想 #自我提升', NULL, 15, 5),
(1, '周末整理了一下本周的打卡数据，看到自己的坚持记录真的很满足。生活就是由这些小习惯构成的！📊✨', NULL, 6, 2),
(2, '欢迎来到智能生活助手社区！在这里记录你的成长，分享生活的美好。', NULL, 20, 5),
(3, '今天早起瑜伽打卡成功！清晨6点的阳光洒在瑜伽垫上，一切都很美好。身体的柔韧性一天天变好，坚持就是胜利！#瑜伽 #健康生活', '["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600"]', 9, 3),
(3, '坚持背单词15天了，发现自己的词汇量确实在增长。用碎片时间学习，积少成多！', NULL, 7, 2),
(4, '今天LeetCode刷了一道Hard题，虽然花了不少时间但最终还是解出来了。算法这条路没有捷径，唯有坚持！#编程 #算法', NULL, 11, 4),
(4, '完成了半马训练的第30天，现在可以轻松跑12公里了。从开始的3公里都气喘吁吁到现在，真的感受到了坚持的力量。', '["https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600"]', 14, 5),
(5, '今天画了一幅日出写生，用素描记录生活中的美好瞬间。艺术让生活更有温度。🎨', '["https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600"]', 10, 3),
(5, '吉他打卡第20天！终于可以完整弹唱《平凡之路》了，虽然和弦转换还不太流畅但已经很满足了。音乐真的是生活的调味剂。🎸', NULL, 8, 2);

-- 插入评论（含层级回复）
INSERT INTO social_comments (post_id, user_id, parent_id, content) VALUES
(1, 2, NULL, '太棒了！继续保持！'),
(1, 2, NULL, '请问你一般几点起床跑步呢？'),
(1, 1, 2, '我一般是早上6:30起床，6:45左右出门跑步，大概7:15结束'),
(1, 3, NULL, '我也是晨跑党，一起加油！'),
(2, 1, NULL, '这本书确实很经典，推荐大家阅读！'),
(2, 3, NULL, '我正在读这本书，改变了我对习惯的认知'),
(2, 2, NULL, '好习惯真的能改变人生'),
(3, 4, NULL, '冥想真的有效吗？我试过几次总是静不下来'),
(3, 1, 8, '刚开始都是这样的，坚持一周就会有明显改善！建议从5分钟开始，慢慢增加时间'),
(3, 3, NULL, '深有同感！冥想让我的焦虑减轻了很多'),
(3, 5, NULL, '推荐大家试试Headspace这个APP，入门很不错'),
(3, 1, NULL, '谢谢大家的支持！一起变得更好 💪'),
(4, 3, NULL, '坚持记录是一个特别好的习惯！'),
(4, 5, NULL, '我也开始用App记录习惯了，可视化真的很有成就感'),
(5, 1, NULL, '一起加油！'),
(5, 4, NULL, '这个社区氛围真好'),
(5, 3, NULL, '欢迎欢迎 🎉'),
(6, 1, NULL, '瑜伽对身体真的很好，我也想试试'),
(6, 5, NULL, '清晨的阳光和瑜伽，画面太美了'),
(6, 3, 18, '是的！推荐从基础哈他瑜伽开始，每天早上15分钟就好'),
(7, 1, NULL, '坚持下去，量变引起质变'),
(7, 4, NULL, '同在学习中，共勉！'),
(8, 4, NULL, '刷算法的快乐只有程序员懂 😂'),
(8, 1, NULL, '太强了！Hard题我看了就头疼'),
(8, 3, NULL, '大佬带带我！'),
(9, 1, NULL, '半马训练太厉害了，我还在5公里挣扎'),
(9, 4, 26, '慢慢来，跑步最重要的是坚持而不是速度'),
(9, 3, NULL, '加油！期待你完赛的好消息'),
(9, 5, NULL, '运动达人，佩服！'),
(9, 2, NULL, '半马训练要注意科学配速，避免受伤哦'),
(10, 3, NULL, '画得真好！期待看到更多作品'),
(10, 1, NULL, '素描的明暗处理很到位，专业！'),
(10, 5, 32, '谢谢！还在学习中，一起进步'),
(11, 4, NULL, '我也在学吉他！我们一起加油'),
(11, 5, 34, '太好了！你学到什么阶段了？');

-- 插入点赞（跨用户互动）
INSERT INTO social_likes (user_id, post_id) VALUES
(1, 3), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11),
(2, 1), (2, 2), (2, 3), (2, 4), (2, 6), (2, 8), (2, 9),
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 8), (3, 9), (3, 10), (3, 11),
(4, 1), (4, 2), (4, 3), (4, 5), (4, 6), (4, 7), (4, 10), (4, 11),
(5, 1), (5, 3), (5, 4), (5, 6), (5, 8), (5, 9);
