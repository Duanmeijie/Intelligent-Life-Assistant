const db = require('../config/db');

class Goal {
  static async findByUserId(userId, params = {}) {
    const { category, status, page, pageSize, offset } = params;

    let sql = 'SELECT * FROM user_goals WHERE user_id = ?';
    const values = [userId];

    if (category) {
      sql += ' AND category = ?';
      values.push(category);
    }

    if (status) {
      sql += ' AND status = ?';
      values.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    if (page && pageSize) {
      const [rows] = await db.query(
        sql + ' LIMIT ? OFFSET ?',
        [...values, pageSize, offset]
      );

      let countSql = 'SELECT COUNT(*) as total FROM user_goals WHERE user_id = ?';
      const countValues = [userId];
      if (category) {
        countSql += ' AND category = ?';
        countValues.push(category);
      }
      if (status) {
        countSql += ' AND status = ?';
        countValues.push(status);
      }

      const [[{ total }]] = await db.query(countSql, countValues);

      return { rows, total };
    }

    const [rows] = await db.query(sql, values);
    return rows;
  }

  static async findById(id, userId) {
    const [rows] = await db.query(
      'SELECT * FROM user_goals WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const [result] = await db.query(
      'INSERT INTO user_goals (user_id, title, description, target_value, current_value, unit, start_date, end_date, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.user_id, data.title, data.description, data.target_value, data.current_value || 0, data.unit, data.start_date, data.end_date, data.category || 'other', data.status || 'active']
    );
    return result.insertId;
  }

  static async update(id, userId, data) {
    const setClauses = [];
    const values = [];

    const allowedFields = ['title', 'description', 'target_value', 'current_value', 'unit', 'start_date', 'end_date', 'category', 'status'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (setClauses.length === 0) {
      return false;
    }

    values.push(id, userId);
    const [result] = await db.query(
      `UPDATE user_goals SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  static async delete(id, userId) {
    const [result] = await db.query(
      'DELETE FROM user_goals WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Goal;
