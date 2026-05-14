const UserAchievement = require('../models/UserAchievement');
const Notification = require('../models/Notification');
const { success, error } = require('../utils/response');
const pool = require('../config/db');

const achievementController = {
  async list(req, res, next) {
    try {
      const achievements = await UserAchievement.getAchievements();
      const userAchievements = await UserAchievement.findByUserId(req.user.id);
      const userAchievementIds = new Set(userAchievements.map((ua) => ua.achievement_id));

      const result = achievements.map((a) => ({
        ...a,
        achieved: userAchievementIds.has(a.id),
        achievedAt: userAchievements.find((ua) => ua.achievement_id === a.id)?.achieved_at || null
      }));

      res.json(success(result));
    } catch (err) {
      next(err);
    }
  },

  async userAchievements(req, res, next) {
    try {
      const achievements = await UserAchievement.findByUserId(req.user.id);
      const count = await UserAchievement.countByUserId(req.user.id);
      res.json(success({ achievements, count }));
    } catch (err) {
      next(err);
    }
  },

  async checkAndAward(userId) {
    try {
      const userAchievements = await UserAchievement.findByUserId(userId);
      const allAchievements = await UserAchievement.getAchievements();
      const achievedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
      const newlyAwarded = [];

      for (const achievement of allAchievements) {
        if (achievedIds.has(achievement.id)) continue;

        let qualifies = false;
        switch (achievement.code) {
          case 'first_checkin': {
            const [[{ count }]] = await pool.query(
              'SELECT COUNT(*) as count FROM checkins WHERE user_id = ?',
              [userId]
            );
            qualifies = count >= achievement.threshold;
            break;
          }
          case 'streak_7':
          case 'streak_30':
          case 'streak_100': {
            qualifies = await checkStreak(userId, achievement.threshold);
            break;
          }
          case 'habits_3':
          case 'habits_10': {
            const [[{ count }]] = await pool.query(
              'SELECT COUNT(*) as count FROM habits WHERE user_id = ? AND is_active = 1',
              [userId]
            );
            qualifies = count >= achievement.threshold;
            break;
          }
          case 'checkins_100': {
            const [[{ count }]] = await pool.query(
              'SELECT COUNT(*) as count FROM checkins WHERE user_id = ?',
              [userId]
            );
            qualifies = count >= achievement.threshold;
            break;
          }
          case 'posts_10':
          case 'posts_50': {
            const [[{ count }]] = await pool.query(
              'SELECT COUNT(*) as count FROM social_posts WHERE user_id = ?',
              [userId]
            );
            qualifies = count >= achievement.threshold;
            break;
          }
        }

        if (qualifies) {
          const result = await UserAchievement.award(userId, achievement.id);
          if (result) {
            newlyAwarded.push(result);

            await Notification.create({
              user_id: userId,
              type: 'achievement',
              title: '🎉 成就解锁！',
              content: `恭喜获得「${achievement.name}」成就！${achievement.description}`,
              related_id: achievement.id,
              related_type: 'achievement'
            });
          }
        }
      }

      return newlyAwarded;
    } catch (err) {
      console.error('成就检查失败:', err);
      return [];
    }
  }
};

async function checkStreak(userId, threshold) {
  const [rows] = await pool.query(
    `SELECT DISTINCT checkin_date FROM checkins WHERE user_id = ? ORDER BY checkin_date DESC LIMIT ?`,
    [userId, threshold + 7]
  );

  if (rows.length < threshold) return false;

  const dates = rows.map((r) => {
    const d = new Date(r.checkin_date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let startDate = dates[0];
  if (startDate !== todayStr && startDate !== yesterdayStr) return false;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (prev - curr) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      streak++;
      if (streak >= threshold) return true;
    } else {
      break;
    }
  }

  return streak >= threshold;
}

module.exports = achievementController;
