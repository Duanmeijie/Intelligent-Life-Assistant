const pool = require('../config/db');
const { success, error } = require('../utils/response');

const aiController = {
  async recommendHabits(req, res, next) {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days, 10) || 30;

      const { startDate, endDate } = getDateRange(days);

      const [habits] = await pool.query(
        `SELECT h.id, h.name, h.category, h.color
         FROM habits h
         WHERE h.user_id = ? AND h.is_active = 1`,
        [userId]
      );

      if (habits.length === 0) {
        const [categories] = await pool.query(
          `SELECT DISTINCT category FROM habits WHERE is_active = 1`
        );

        const allCategories = ['work', 'study', 'life', 'sports', 'other'];
        const recommendations = allCategories
          .filter(c => c)
          .map(cat => ({
            name: getCategoryLabel(cat),
            category: cat,
            color: getCategoryColor(cat),
            reason: '养成良好习惯，提升生活质量',
            estimatedDifficulty: 'easy'
          }));

        return res.json(success({
          recommendations: recommendations.slice(0, 3),
          basedOn: '新用户推荐'
        }));
      }

      const [stats] = await pool.query(
        `SELECT
           h.id AS habit_id,
           h.name,
           h.category,
           h.color,
           COUNT(DISTINCT c.checkin_date) AS total_checkins,
           COUNT(DISTINCT DATE(c.checkin_date)) AS total_days
         FROM habits h
         LEFT JOIN checkins c ON h.id = c.habit_id AND c.user_id = ?
           AND c.checkin_date >= ? AND c.checkin_date <= ?
         WHERE h.user_id = ?
         GROUP BY h.id, h.name, h.category, h.color`,
        [userId, startDate, endDate, userId]
      );

      const lowCompletion = stats
        .filter(s => {
          const rate = (s.total_checkins / days) * 100;
          return rate < 50;
        })
        .sort((a, b) => (a.total_checkins / days) - (b.total_checkins / days));

      const categoryCompletion = {};
      stats.forEach(s => {
        if (!categoryCompletion[s.category]) {
          categoryCompletion[s.category] = { total: 0, completed: 0, habits: [] };
        }
        categoryCompletion[s.category].total++;
        categoryCompletion[s.category].completed += s.total_checkins;
        categoryCompletion[s.category].habits.push(s.name);
      });

      const weakCategories = Object.entries(categoryCompletion)
        .filter(([_, data]) => (data.completed / (data.total * days)) < 0.3)
        .map(([cat, data]) => ({ category: cat, ...data }));

      const recommendations = [];

      if (lowCompletion.length > 0) {
        const weak = lowCompletion[0];
        const similarHabits = getSimilarHabits(weak.category);
        similarHabits.forEach(h => {
          recommendations.push({
            name: h.name,
            category: weak.category,
            color: getCategoryColor(weak.category),
            reason: `您在「${getCategoryLabel(weak.category)}」分类的打卡完成率较低，建议增加相关习惯`,
            estimatedDifficulty: 'easy'
          });
        });
      }

      if (weakCategories.length > 0) {
        weakCategories.forEach(wc => {
          const existingNames = recommendations.map(r => r.name);
          const similar = getSimilarHabits(wc.category).filter(h => !existingNames.includes(h.name));
          similar.slice(0, 1).forEach(h => {
            recommendations.push({
              name: h.name,
              category: wc.category,
              color: getCategoryColor(wc.category),
              reason: `您在「${getCategoryLabel(wc.category)}」分类的整体完成率偏低，建议加强该领域`,
              estimatedDifficulty: 'medium'
            });
          });
        });
      }

      const [allCategories] = await pool.query(
        `SELECT DISTINCT category FROM habits WHERE user_id = ? AND is_active = 1`,
        [userId]
      );
      const userCategories = allCategories.map(r => r.category);
      const missingCategories = ['work', 'study', 'life', 'sports', 'other']
        .filter(c => !userCategories.includes(c));

      missingCategories.slice(0, 2).forEach(cat => {
        const existingNames = recommendations.map(r => r.name);
        const similar = getSimilarHabits(cat).filter(h => !existingNames.includes(h.name));
        similar.slice(0, 1).forEach(h => {
          recommendations.push({
            name: h.name,
            category: cat,
            color: getCategoryColor(cat),
            reason: `您还没有「${getCategoryLabel(cat)}」分类的习惯，尝试添加一个吧`,
            estimatedDifficulty: 'easy'
          });
        });
      });

      res.json(success({
        recommendations: recommendations.slice(0, 5),
        basedOn: `基于过去${days}天的打卡数据分析`
      }));
    } catch (err) {
      next(err);
    }
  },

  async analysis(req, res, next) {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days, 10) || 30;

      const { startDate, endDate } = getDateRange(days);

      const [habits] = await pool.query(
        `SELECT id, name, category, color
         FROM habits
         WHERE user_id = ? AND is_active = 1`,
        [userId]
      );

      const [checkinStats] = await pool.query(
        `SELECT
           h.id AS habit_id,
           h.name AS habit_name,
           h.category,
           h.color,
           COUNT(DISTINCT c.checkin_date) AS checkin_days
         FROM habits h
         LEFT JOIN checkins c ON h.id = c.habit_id AND c.user_id = ? AND c.checkin_date >= ? AND c.checkin_date <= ?
         WHERE h.user_id = ?
         GROUP BY h.id, h.name, h.category, h.color`,
        [userId, startDate, endDate, userId]
      );

      const [dailyCheckins] = await pool.query(
        `SELECT checkin_date, COUNT(DISTINCT habit_id) AS count
         FROM checkins
         WHERE user_id = ? AND checkin_date >= ? AND checkin_date <= ?
         GROUP BY checkin_date
         ORDER BY checkin_date ASC`,
        [userId, startDate, endDate]
      );

      const [scheduleStats] = await pool.query(
        `SELECT
           category,
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
         FROM schedules
         WHERE user_id = ? AND start_time >= ? AND end_time <= ?
         GROUP BY category`,
        [userId, startDate, endDate]
      );

      let weeklyCheckinsCount = 0;
      if (dailyCheckins.length > 0) {
        weeklyCheckinsCount = Math.round(dailyCheckins.reduce((sum, d) => sum + d.count, 0) / Math.max(dailyCheckins.length, 1) * 7);
      }

      const habitAnalysis = checkinStats.map(h => ({
        habitId: h.habit_id,
        habitName: h.habit_name,
        category: h.category,
        color: h.color,
        checkinDays: h.checkin_days,
        completionRate: Math.round((h.checkin_days / days) * 100),
        status: (h.checkin_days / days) >= 0.8 ? '优秀' :
                (h.checkin_days / days) >= 0.6 ? '良好' :
                (h.checkin_days / days) >= 0.4 ? '一般' : '需要加强'
      }));

      const totalCompletions = checkinStats.reduce((sum, h) => sum + h.checkin_days, 0);
      const maxPossible = habits.length * days;
      const overallRate = maxPossible > 0 ? Math.round((totalCompletions / maxPossible) * 100) : 0;

      const strongestCategory = [...checkinStats]
        .sort((a, b) => (b.checkin_days / days) - (a.checkin_days / days))[0];
      const weakestCategory = [...checkinStats]
        .sort((a, b) => (a.checkin_days / days) - (b.checkin_days / days))[0];

      const advice = [];
      if (overallRate < 50) {
        advice.push('整体完成率偏低，建议减少习惯数量，聚焦核心习惯');
      } else if (overallRate < 70) {
        advice.push('整体表现良好，继续保持！可以适当增加新习惯挑战自己');
      } else {
        advice.push('整体表现优秀！你已经养成了很好的习惯');
      }

      if (weakestCategory && (weakestCategory.checkin_days / days) < 0.4) {
        advice.push(`${getCategoryLabel(weakestCategory.category)}分类需要加强，尝试设置固定提醒`);
      }

      if (scheduleStats.length > 0) {
        const scheduleCompletion = scheduleStats.reduce((sum, s) => sum + parseInt(s.completed, 10), 0);
        const scheduleTotal = scheduleStats.reduce((sum, s) => sum + parseInt(s.total, 10), 0);
        const scheduleRate = scheduleTotal > 0 ? Math.round((scheduleCompletion / scheduleTotal) * 100) : 0;

        res.json(success({
          period: { days, startDate, endDate },
          overview: {
            totalHabits: habits.length,
            totalCheckins: totalCompletions,
            overallCompletionRate: overallRate,
            weeklyAverageCheckins: weeklyCheckinsCount,
            scheduleCompletionRate: scheduleRate
          },
          habitAnalysis,
          dailyTrend: dailyCheckins,
          scheduleStats,
          strongestCategory: strongestCategory ? {
            category: strongestCategory.category,
            label: getCategoryLabel(strongestCategory.category),
            rate: Math.round((strongestCategory.checkin_days / days) * 100)
          } : null,
          weakestCategory: weakestCategory ? {
            category: weakestCategory.category,
            label: getCategoryLabel(weakestCategory.category),
            rate: Math.round((weakestCategory.checkin_days / days) * 100)
          } : null,
          advice
        }));
      } else {
        res.json(success({
          period: { days, startDate, endDate },
          overview: {
            totalHabits: habits.length,
            totalCheckins: totalCompletions,
            overallCompletionRate: overallRate,
            weeklyAverageCheckins: weeklyCheckinsCount,
            scheduleCompletionRate: 0
          },
          habitAnalysis,
          dailyTrend: dailyCheckins,
          scheduleStats: [],
          strongestCategory: strongestCategory ? {
            category: strongestCategory.category,
            label: getCategoryLabel(strongestCategory.category),
            rate: Math.round((strongestCategory.checkin_days / days) * 100)
          } : null,
          weakestCategory: weakestCategory ? {
            category: weakestCategory.category,
            label: getCategoryLabel(weakestCategory.category),
            rate: Math.round((weakestCategory.checkin_days / days) * 100)
          } : null,
          advice
        }));
      }
    } catch (err) {
      next(err);
    }
  },

  async scheduleSuggest(req, res, next) {
    try {
      const userId = req.user.id;

      const [schedules] = await pool.query(
        `SELECT
           HOUR(start_time) AS start_hour,
           HOUR(end_time) AS end_hour,
           category,
           DAYOFWEEK(start_time) AS day_of_week,
           COUNT(*) AS frequency
         FROM schedules
         WHERE user_id = ? AND status != 'cancelled'
         GROUP BY start_hour, end_hour, category, day_of_week
         ORDER BY frequency DESC
         LIMIT 20`,
        [userId]
      );

      const [categoryDistribution] = await pool.query(
        `SELECT category, COUNT(*) AS count
         FROM schedules
         WHERE user_id = ? AND status != 'cancelled'
         GROUP BY category
         ORDER BY count DESC`,
        [userId]
      );

      const [peakHours] = await pool.query(
        `SELECT HOUR(start_time) AS hour, COUNT(*) AS count
         FROM schedules
         WHERE user_id = ?
         GROUP BY HOUR(start_time)
         ORDER BY count DESC`,
        [userId]
      );

      const timeSlots = [
        { period: '早晨', range: '06:00-09:00', hours: [6, 7, 8] },
        { period: '上午', range: '09:00-12:00', hours: [9, 10, 11] },
        { period: '中午', range: '12:00-14:00', hours: [12, 13] },
        { period: '下午', range: '14:00-18:00', hours: [14, 15, 16, 17] },
        { period: '晚上', range: '18:00-21:00', hours: [18, 19, 20] },
        { period: '夜间', range: '21:00-23:00', hours: [21, 22] }
      ];

      const peakHourSet = new Set(
        peakHours.slice(0, 3).map(p => p.hour)
      );

      const suggestions = [];

      for (const slot of timeSlots) {
        const hasActivity = slot.hours.some(h => peakHourSet.has(h));
        if (!hasActivity) {
          const suggestedCategory = getSuggestedCategory(slot.period, categoryDistribution);
          suggestions.push({
            period: slot.period,
            timeRange: slot.range,
            category: suggestedCategory,
            categoryLabel: getCategoryLabel(suggestedCategory),
            reason: `您在这个时间段通常没有安排，适合添加${getCategoryLabel(suggestedCategory)}类日程`
          });
        }
      }

      if (schedules.length > 0) {
        const patterns = schedules.slice(0, 5).map(s => {
          const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          return {
            startHour: s.start_hour,
            endHour: s.end_hour,
            category: s.category,
            categoryLabel: getCategoryLabel(s.category),
            dayOfWeek: dayNames[s.day_of_week - 1] || '未知',
            frequency: s.frequency
          };
        });

        const unallocatedCategories = ['work', 'study', 'life', 'sports', 'other']
          .filter(cat => !categoryDistribution.some(d => d.category === cat));

        unallocatedCategories.forEach(cat => {
          const bestSlot = getBestTimeSlot(cat);
          if (bestSlot) {
            suggestions.push({
              period: bestSlot.period,
              timeRange: bestSlot.range,
              category: cat,
              categoryLabel: getCategoryLabel(cat),
              reason: `您还没有安排「${getCategoryLabel(cat)}」类日程，建议在${bestSlot.period}添加`
            });
          }
        });

        return res.json(success({
          suggestions: suggestions.slice(0, 6),
          patterns,
          peakHours: peakHours.slice(0, 5),
          categoryDistribution
        }));
      }

      const defaultSuggestions = [
        { period: '早晨', timeRange: '07:00-08:00', category: 'sports', categoryLabel: '运动', reason: '早晨是锻炼的好时机，帮助开启精力充沛的一天' },
        { period: '上午', timeRange: '09:00-12:00', category: 'work', categoryLabel: '工作', reason: '上午注意力最集中，适合处理重要工作' },
        { period: '下午', timeRange: '14:00-17:00', category: 'study', categoryLabel: '学习', reason: '下午适合安排学习任务，提升专业技能' },
        { period: '晚上', timeRange: '19:00-21:00', category: 'life', categoryLabel: '生活', reason: '晚上适合休闲放松，安排生活类活动' }
      ];

      res.json(success({
        suggestions: defaultSuggestions,
        patterns: [],
        peakHours: [],
        categoryDistribution: []
      }));
    } catch (err) {
      next(err);
    }
  }
};

function getCategoryLabel(category) {
  const labels = {
    work: '工作',
    study: '学习',
    life: '生活',
    sports: '运动',
    other: '其他'
  };
  return labels[category] || '其他';
}

function getCategoryColor(category) {
  const colors = {
    work: '#409EFF',
    study: '#67C23A',
    life: '#E6A23C',
    sports: '#F56C6C',
    other: '#909399'
  };
  return colors[category] || '#409EFF';
}

function getSimilarHabits(category) {
  const habitSuggestions = {
    work: [
      { name: '每日工作计划', category: 'work' },
      { name: '工作总结复盘', category: 'work' },
      { name: '专业技能学习', category: 'work' }
    ],
    study: [
      { name: '每日阅读30分钟', category: 'study' },
      { name: '背英语单词', category: 'study' },
      { name: '学习笔记整理', category: 'study' }
    ],
    life: [
      { name: '早睡早起', category: 'life' },
      { name: '喝8杯水', category: 'life' },
      { name: '整理房间', category: 'life' }
    ],
    sports: [
      { name: '晨跑30分钟', category: 'sports' },
      { name: '瑜伽冥想', category: 'sports' },
      { name: '力量训练', category: 'sports' }
    ],
    other: [
      { name: '写日记', category: 'other' },
      { name: '冥想放松', category: 'other' },
      { name: '兴趣爱好培养', category: 'other' }
    ]
  };
  return habitSuggestions[category] || habitSuggestions.other;
}

function getSuggestedCategory(period, existingDistribution) {
  const periodCategoryMap = {
    '早晨': 'sports',
    '上午': 'work',
    '中午': 'life',
    '下午': 'study',
    '晚上': 'life',
    '夜间': 'other'
  };

  const suggested = periodCategoryMap[period] || 'other';
  const hasExisting = existingDistribution.some(d => d.category === suggested);
  if (hasExisting) {
    return suggested;
  }

  const existingCategories = existingDistribution.map(d => d.category);
  const allCategories = ['work', 'study', 'life', 'sports', 'other'];
  const missing = allCategories.filter(c => !existingCategories.includes(c));
  return missing.length > 0 ? missing[0] : suggested;
}

function getBestTimeSlot(category) {
  const slotMap = {
    work: { period: '上午', range: '09:00-12:00' },
    study: { period: '下午', range: '14:00-17:00' },
    life: { period: '晚上', range: '19:00-21:00' },
    sports: { period: '早晨', range: '07:00-08:00' },
    other: { period: '夜间', range: '21:00-22:00' }
  };
  return slotMap[category] || null;
}

function getDateRange(days) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return { startDate: formatDate(start), endDate: formatDate(end) };
}

module.exports = aiController;
