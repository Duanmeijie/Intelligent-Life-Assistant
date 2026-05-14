const Schedule = require('../models/Schedule');
const { success, error, paginated } = require('../utils/response');
const { getPagination } = require('../utils/helpers');

const scheduleController = {
  async list(req, res, next) {
    try {
      const { startDate, endDate, category, status } = req.query;
      const { page, pageSize, offset } = getPagination(req.query);

      const filters = { startDate, endDate, category, status };

      const { sql, values } = await Schedule.findByUserId(req.user.id, filters);
      const total = await Schedule.countByUserId(req.user.id, filters);

      const [rows] = await require('../config/db').query(
        sql + ' LIMIT ? OFFSET ?',
        [...values, pageSize, offset]
      );

      res.json(paginated(rows, total, page, pageSize));
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { title, description, category, startTime, endTime } = req.body;

      const scheduleId = await Schedule.create({
        user_id: req.user.id,
        title,
        description: description || null,
        category: category || 'other',
        start_time: startTime,
        end_time: endTime
      });

      const [rows] = await require('../config/db').query(
        'SELECT * FROM schedules WHERE id = ?',
        [scheduleId]
      );

      res.status(201).json(success(rows[0], '日程创建成功', 201));
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, category, startTime, endTime } = req.body;

      const schedule = await Schedule.findById(id);
      if (!schedule) {
        return res.status(404).json(error('日程不存在', 404));
      }

      if (schedule.user_id !== req.user.id) {
        return res.status(403).json(error('无权修改此日程', 403));
      }

      await Schedule.update(id, req.user.id, {
        title,
        description: description || null,
        category: category || 'other',
        start_time: startTime,
        end_time: endTime
      });

      const [rows] = await require('../config/db').query(
        'SELECT * FROM schedules WHERE id = ?',
        [id]
      );

      res.json(success(rows[0], '日程更新成功'));
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const schedule = await Schedule.findById(id);
      if (!schedule) {
        return res.status(404).json(error('日程不存在', 404));
      }

      if (schedule.user_id !== req.user.id) {
        return res.status(403).json(error('无权删除此日程', 403));
      }

      await Schedule.delete(id, req.user.id);
      res.json(success(null, '日程删除成功'));
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status: newStatus } = req.body;

      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        return res.status(400).json(error('无效的状态值', 400));
      }

      const schedule = await Schedule.findById(id);
      if (!schedule) {
        return res.status(404).json(error('日程不存在', 404));
      }

      if (schedule.user_id !== req.user.id) {
        return res.status(403).json(error('无权修改此日程', 403));
      }

      await Schedule.updateStatus(id, req.user.id, newStatus);

      const [rows] = await require('../config/db').query(
        'SELECT * FROM schedules WHERE id = ?',
        [id]
      );

      res.json(success(rows[0], '状态更新成功'));
    } catch (err) {
      next(err);
    }
  }
};

module.exports = scheduleController;
