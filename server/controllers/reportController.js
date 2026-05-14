const WeeklyReport = require('../models/WeeklyReport');
const DailySummary = require('../models/DailySummary');
const { success, error, paginated } = require('../utils/response');
const { getPagination } = require('../utils/helpers');

const reportController = {
  async getWeeklyReports(req, res, next) {
    try {
      const { page, pageSize, offset } = getPagination(req.query);

      const result = await WeeklyReport.findByUserId(req.user.id, { page, pageSize, offset });

      if (page && pageSize) {
        res.json(paginated(result.rows, result.total, page, pageSize));
      } else {
        res.json(success(result));
      }
    } catch (err) {
      next(err);
    }
  },

  async getLatestReport(req, res, next) {
    try {
      const report = await WeeklyReport.findLatest(req.user.id);

      if (!report) {
        return res.status(404).json(error('暂无周报数据', 404));
      }

      res.json(success(report));
    } catch (err) {
      next(err);
    }
  },

  async getDailySummaries(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const { page, pageSize, offset } = getPagination(req.query);

      const result = await DailySummary.findByUserId(req.user.id, {
        startDate,
        endDate,
        page,
        pageSize,
        offset
      });

      if (page && pageSize) {
        res.json(paginated(result.rows, result.total, page, pageSize));
      } else {
        res.json(success(result));
      }
    } catch (err) {
      next(err);
    }
  },

  async createDailySummary(req, res, next) {
    try {
      const { summaryDate, moodRating, journal, sleepHours, waterIntake, exerciseMinutes, productivityScore } = req.body;

      const result = await DailySummary.createOrUpdate(req.user.id, summaryDate, {
        mood_rating: moodRating,
        journal: journal || null,
        sleep_hours: sleepHours || null,
        water_intake: waterIntake || null,
        exercise_minutes: exerciseMinutes || null,
        productivity_score: productivityScore || null
      });

      const summary = await DailySummary.findByDate(req.user.id, summaryDate);

      const statusCode = result.updated ? 200 : 201;
      const message = result.updated ? '每日总结更新成功' : '每日总结创建成功';
      res.status(statusCode).json(success(summary, message, statusCode));
    } catch (err) {
      next(err);
    }
  }
};

module.exports = reportController;
