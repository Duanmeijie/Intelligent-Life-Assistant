const dayjs = require('dayjs');
const CheckIn = require('../models/CheckIn');
const { success, error, paginated } = require('../utils/response');
const { getPagination } = require('../utils/helpers');

const checkinController = {
  async create(req, res, next) {
    try {
      const { habitId, note, checkinDate } = req.body;
      const checkin_date = checkinDate || dayjs().format('YYYY-MM-DD');

      const existing = await CheckIn.findByHabitAndDate(habitId, req.user.id, checkin_date);
      if (existing) {
        return res.status(409).json(error('今日已打卡，请勿重复打卡', 409));
      }

      const checkinId = await CheckIn.create({
        user_id: req.user.id,
        habit_id: habitId,
        checkin_date,
        note: note || null
      });

      const [rows] = await require('../config/db').query(
        `SELECT c.*, h.name AS habit_name, h.color AS habit_color
         FROM checkins c
         LEFT JOIN habits h ON c.habit_id = h.id
         WHERE c.id = ?`,
        [checkinId]
      );

      res.status(201).json(success(rows[0], '打卡成功', 201));
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const { habitId, startDate, endDate } = req.query;
      const { page, pageSize, offset } = getPagination(req.query);

      const filters = { habitId, startDate, endDate };

      const { sql, values } = await CheckIn.findByUserId(req.user.id, filters);
      const total = await CheckIn.countByUserId(req.user.id, filters);

      const [rows] = await require('../config/db').query(
        sql + ' LIMIT ? OFFSET ?',
        [...values, pageSize, offset]
      );

      res.json(paginated(rows, total, page, pageSize));
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const { habitId } = req.query;

      let stats = await CheckIn.getStats(req.user.id, days);

      if (habitId) {
        stats = stats.filter(s => s.habit_id === parseInt(habitId, 10));
      }

      const result = [];
      for (const stat of stats) {
        const totalDays = Math.min(days, stat.total_days);
        const completionRate = totalDays > 0
          ? Math.round((stat.total_checkins / days) * 100)
          : 0;

        let currentStreak = 0;
        let longestStreak = 0;

        if (habitId) {
          const streakData = await CheckIn.getStreakData(req.user.id, stat.habit_id);
          currentStreak = streakData.currentStreak;
          longestStreak = streakData.longestStreak;
        }

        result.push({
          habitId: stat.habit_id,
          habitName: stat.habit_name,
          category: stat.category,
          color: stat.color,
          totalCheckins: stat.total_checkins,
          totalDays: stat.total_days,
          completionRate,
          currentStreak,
          longestStreak
        });
      }

      res.json(success({
        days,
        habits: result,
        totalHabits: result.length
      }));
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const [rows] = await require('../config/db').query(
        'SELECT * FROM checkins WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json(error('打卡记录不存在', 404));
      }

      if (rows[0].user_id !== req.user.id) {
        return res.status(403).json(error('无权删除此打卡记录', 403));
      }

      await CheckIn.delete(id, req.user.id);
      res.json(success(null, '打卡记录已删除'));
    } catch (err) {
      next(err);
    }
  }
};

module.exports = checkinController;
