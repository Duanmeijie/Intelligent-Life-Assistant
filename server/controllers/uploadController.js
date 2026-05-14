const pool = require('../config/db');
const { success, error } = require('../utils/response');
const fs = require('fs');
const path = require('path');

const uploadController = {
  async uploadSingle(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json(error('请选择要上传的文件', 400));
      }

      const fileUrl = `/uploads/${req.file.filename}`;

      await pool.query(
        'INSERT INTO uploads (user_id, filename, stored_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, req.file.originalname, req.file.filename, fileUrl, req.file.size, req.file.mimetype]
      );

      res.json(success({
        url: fileUrl,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }, '上传成功'));
    } catch (err) {
      next(err);
    }
  },

  async uploadMultiple(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json(error('请选择要上传的文件', 400));
      }

      const urls = [];
      for (const file of req.files) {
        const fileUrl = `/uploads/${file.filename}`;
        urls.push(fileUrl);
        await pool.query(
          'INSERT INTO uploads (user_id, filename, stored_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
          [req.user.id, file.originalname, file.filename, fileUrl, file.size, file.mimetype]
        );
      }

      res.json(success({ urls }, '上传成功'));
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { filename } = req.params;
      const [rows] = await pool.query(
        'SELECT * FROM uploads WHERE stored_name = ? AND user_id = ?',
        [filename, req.user.id]
      );

      if (rows.length === 0) {
        return res.status(404).json(error('文件不存在', 404));
      }

      const filePath = path.join(__dirname, '..', 'uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await pool.query('DELETE FROM uploads WHERE stored_name = ? AND user_id = ?', [filename, req.user.id]);

      res.json(success(null, '文件已删除'));
    } catch (err) {
      next(err);
    }
  }
};

module.exports = uploadController;
