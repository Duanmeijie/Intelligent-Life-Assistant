const Goal = require('../models/Goal');
const { success, error, paginated } = require('../utils/response');
const { getPagination } = require('../utils/helpers');

const goalController = {
  async list(req, res, next) {
    try {
      const { category, status } = req.query;
      const { page, pageSize, offset } = getPagination(req.query);

      const result = await Goal.findByUserId(req.user.id, { category, status, page, pageSize, offset });

      if (page && pageSize) {
        res.json(paginated(result.rows, result.total, page, pageSize));
      } else {
        res.json(success(result));
      }
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { title, description, targetValue, currentValue, unit, startDate, endDate, category } = req.body;

      const goalId = await Goal.create({
        user_id: req.user.id,
        title,
        description: description || null,
        target_value: targetValue,
        current_value: currentValue || 0,
        unit: unit || null,
        start_date: startDate,
        end_date: endDate,
        category: category || 'other'
      });

      const goal = await Goal.findById(goalId, req.user.id);

      res.status(201).json(success(goal, '目标创建成功', 201));
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, targetValue, currentValue, unit, startDate, endDate, category, status } = req.body;

      const goal = await Goal.findById(id, req.user.id);
      if (!goal) {
        return res.status(404).json(error('目标不存在', 404));
      }

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (targetValue !== undefined) updateData.target_value = targetValue;
      if (currentValue !== undefined) updateData.current_value = currentValue;
      if (unit !== undefined) updateData.unit = unit;
      if (startDate !== undefined) updateData.start_date = startDate;
      if (endDate !== undefined) updateData.end_date = endDate;
      if (category !== undefined) updateData.category = category;
      if (status !== undefined) updateData.status = status;

      const updated = await Goal.update(id, req.user.id, updateData);
      if (!updated) {
        return res.status(400).json(error('没有需要更新的信息', 400));
      }

      const updatedGoal = await Goal.findById(id, req.user.id);

      res.json(success(updatedGoal, '目标更新成功'));
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const goal = await Goal.findById(id, req.user.id);
      if (!goal) {
        return res.status(404).json(error('目标不存在', 404));
      }

      await Goal.delete(id, req.user.id);
      res.json(success(null, '目标删除成功'));
    } catch (err) {
      next(err);
    }
  }
};

module.exports = goalController;
