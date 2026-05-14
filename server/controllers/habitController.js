const Habit = require('../models/Habit');
const { success, error, paginated } = require('../utils/response');

const habitController = {
  async list(req, res, next) {
    try {
      const page = parseInt(req.query.page) || null;
      const pageSize = parseInt(req.query.pageSize) || null;

      if (page && pageSize) {
        const result = await Habit.findByUserId(req.user.id, { page, pageSize });
        res.json(paginated(result.rows, result.total, page, pageSize));
      } else {
        const habits = await Habit.findByUserId(req.user.id);
        res.json(success(habits));
      }
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { name, description, frequency, category, color, reminderTime } = req.body;

      const habitId = await Habit.create({
        user_id: req.user.id,
        name,
        description: description || null,
        frequency: frequency || 'daily',
        category: category || null,
        color: color || '#409EFF',
        reminder_time: reminderTime || null
      });

      const [rows] = await require('../config/db').query(
        'SELECT * FROM habits WHERE id = ?',
        [habitId]
      );

      res.status(201).json(success(rows[0], '习惯创建成功', 201));
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, frequency, category, color, reminderTime, isActive } = req.body;

      const habit = await Habit.findById(id);
      if (!habit) {
        return res.status(404).json(error('习惯不存在', 404));
      }

      if (habit.user_id !== req.user.id) {
        return res.status(403).json(error('无权修改此习惯', 403));
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (frequency !== undefined) updateData.frequency = frequency;
      if (category !== undefined) updateData.category = category;
      if (color !== undefined) updateData.color = color;
      if (reminderTime !== undefined) updateData.reminder_time = reminderTime;
      if (isActive !== undefined) updateData.is_active = isActive;

      const updated = await Habit.update(id, req.user.id, updateData);
      if (!updated) {
        return res.status(400).json(error('没有需要更新的信息', 400));
      }

      const [rows] = await require('../config/db').query(
        'SELECT * FROM habits WHERE id = ?',
        [id]
      );

      res.json(success(rows[0], '习惯更新成功'));
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const habit = await Habit.findById(id);
      if (!habit) {
        return res.status(404).json(error('习惯不存在', 404));
      }

      if (habit.user_id !== req.user.id) {
        return res.status(403).json(error('无权删除此习惯', 403));
      }

      await Habit.delete(id, req.user.id);
      res.json(success(null, '习惯删除成功'));
    } catch (err) {
      next(err);
    }
  }
};

module.exports = habitController;
