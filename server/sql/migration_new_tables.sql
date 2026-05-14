USE intelligent_life_assistant;

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
-- 种子数据 - 用户设置
-- ============================================================
INSERT IGNORE INTO user_settings (user_id, theme, language) VALUES
(1, 'light', 'zh-CN'),
(2, 'dark', 'zh-CN'),
(3, 'light', 'zh-CN'),
(4, 'dark', 'zh-CN'),
(5, 'light', 'zh-CN');

-- ============================================================
-- 种子数据 - 成就定义
-- ============================================================
INSERT IGNORE INTO achievements (code, name, description, icon, category, threshold) VALUES
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

-- ============================================================
-- 种子数据 - 周报
-- ============================================================
INSERT IGNORE INTO weekly_reports (user_id, week_start, week_end, total_checkins, total_habits, completion_rate, avg_mood, summary) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 13 DAY), DATE_SUB(CURDATE(), INTERVAL 7 DAY), 28, 7, 85.71, 4.2, '本周整体表现不错，晨跑和冥想坚持得最好，阅读方面略有懈怠。英语学习进度正常，单词量稳步增加。下周计划增加力量训练的频率，争取所有习惯都能100%完成。'),
(1, DATE_SUB(CURDATE(), INTERVAL 6 DAY), CURDATE(), 24, 7, 78.57, 4.0, '本周完成率略有下降，主要是写日记有两天没坚持。不过晨跑和冥想依然保持得很好。下周需要重点提升日记和英语学习的完成率，目标达到85%以上。');

-- ============================================================
-- 种子数据 - 每日总结
-- ============================================================
INSERT IGNORE INTO daily_summaries (user_id, summary_date, mood_rating, journal, sleep_hours, water_intake, exercise_minutes, productivity_score) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 4, '今天是充实的一天。早上跑了3公里，上午完成了项目周报的编写，下午学习了英语语法。晚上读了一会《三体》，科幻小说真的能打开思维。', 7.5, 1800, 30, 8),
(1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 3, '今天状态一般，下午有点犯困。不过还是坚持了冥想和日记。午餐吃了很棒的沙拉，感觉健康饮食对精神状态的提升很明显。', 6.0, 1500, 0, 6),
(1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 5, '超级棒的一天！工作效率特别高，完成了一个拖了很久的功能模块。晚上的读书时光也特别享受，三体的故事越来越精彩了。运动也坚持得很好。', 8.0, 2000, 45, 9),
(1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 4, '今天和朋友聚餐，心情很好。虽然是休息日，但还是坚持了晨跑和冥想。下午学习了英语口语，感觉发音有进步。', 7.0, 1600, 30, 7),
(1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 2, '今天状态不太好，可能是昨晚没睡好。漏掉了写日记，只完成了晨跑和冥想。需要调整作息，保证充足的睡眠。', 5.0, 1200, 30, 4),
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 4, '状态回弹！睡眠改善后整个人都不一样了。今天完成了所有习惯打卡，还额外做了一组力量训练。英语学习也很有收获，背了30个新单词。', 7.5, 1800, 60, 8),
(1, CURDATE(), 5, '今天是高效的一天！早上6:30起床晨跑，上午处理了积累的邮件和工作任务。下午学习了2小时英语，晚上读完了三体的第二册。感觉最近的学习状态越来越好了。', 8.0, 2000, 30, 9);

-- ============================================================
-- 种子数据 - 用户目标
-- ============================================================
INSERT IGNORE INTO user_goals (user_id, title, description, target_value, current_value, unit, start_date, end_date, category, status) VALUES
(1, '每月跑步100公里', '坚持每天跑步，月跑量达到100公里', 100, 67, '公里', DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_ADD(CURDATE(), INTERVAL 16 DAY), 'sports', 'active'),
(1, '读完12本书', '今年读完12本好书并写读书笔记', 12, 5, '本', DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_ADD(CURDATE(), INTERVAL 305 DAY), 'study', 'active'),
(1, '体重降到65公斤', '通过运动和饮食控制，将体重降至65公斤', 65, 70, '公斤', DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 'health', 'active'),
(3, '减脂5公斤', '通过瑜伽和饮食控制减脂5公斤', 5, 2, '公斤', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 40 DAY), 'health', 'active'),
(3, '学习1000个英语单词', '每天背30个单词，一个月掌握1000个', 1000, 450, '个', DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'study', 'active'),
(4, '刷完200道LeetCode', '每天至少一道算法题，持续精进', 200, 87, '题', DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_ADD(CURDATE(), INTERVAL 120 DAY), 'study', 'active'),
(4, '完成半马训练', '为期3个月的半程马拉松训练计划', 21, 12, '公里', DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 'sports', 'active'),
(4, '学会React框架', '系统学习React并完成一个实战项目', 1, 1, '个', DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'study', 'completed'),
(5, '完成100幅素描', '每天画画，积累100幅素描作品', 100, 34, '幅', DATE_SUB(CURDATE(), INTERVAL 40 DAY), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 'life', 'active'),
(5, '学会10首吉他曲', '熟练掌握10首完整的吉他弹唱曲目', 10, 4, '首', DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 90 DAY), 'life', 'active'),
(5, '每月读2本书', '保持阅读习惯，每月完成2本书', 2, 1, '本', DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_ADD(CURDATE(), INTERVAL 16 DAY), 'study', 'active'),
(5, '攒够旅行基金', '为年末的旅行攒够5000元', 5000, 1500, '元', DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 200 DAY), 'finance', 'active');
