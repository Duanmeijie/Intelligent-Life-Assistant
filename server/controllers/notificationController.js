const Notification = require('../models/Notification');
const { success, error, paginated } = require('../utils/response');

const notificationController = {
  async list(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;
      const unreadOnly = req.query.unread === 'true';

      const result = await Notification.findByUserId(req.user.id, {
        page,
        pageSize,
        unreadOnly
      });

      res.json(paginated(result.rows, result.total, page, pageSize));
    } catch (err) {
      next(err);
    }
  },

  async unreadCount(req, res, next) {
    try {
      const count = await Notification.countUnread(req.user.id);
      res.json(success({ count }));
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await Notification.markAsRead(id, req.user.id);
      if (!updated) {
        return res.status(404).json(error('通知不存在', 404));
      }
      res.json(success(null, '已标记为已读'));
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const count = await Notification.markAllAsRead(req.user.id);
      res.json(success({ count }, `已标记 ${count} 条通知为已读`));
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await Notification.delete(id, req.user.id);
      if (!deleted) {
        return res.status(404).json(error('通知不存在', 404));
      }
      res.json(success(null, '通知已删除'));
    } catch (err) {
      next(err);
    }
  }
};

module.exports = notificationController;
