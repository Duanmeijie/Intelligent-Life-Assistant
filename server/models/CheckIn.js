const pool = require('../config/db');

const CheckIn = {
  async findByUserId(userId, filters = {}) {
    let sql = `SELECT c.*, h.name AS habit_name, h.color AS habit_color
               FROM checkins c
               LEFT JOIN habits h ON c.habit_id = h.id
               WHERE c.user_id = ?`;
    const values = [userId];

    if (filters.habitId) {
      sql += ' AND c.habit_id = ?';
      values.push(filters.habitId);
    }

    if (filters.startDate) {
      sql += ' AND c.checkin_date >= ?';
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ' AND c.checkin_date <= ?';
      values.push(filters.endDate);
    }

    sql += ' ORDER BY c.checkin_date DESC, c.created_at DESC';

    return { sql, values };
  },

  async countByUserId(userId, filters = {}) {
    let sql = 'SELECT COUNT(*) AS total FROM checkins WHERE user_id = ?';
    const values = [userId];

    if (filters.habitId) {
      sql += ' AND habit_id = ?';
      values.push(filters.habitId);
    }

    if (filters.startDate) {
      sql += ' AND checkin_date >= ?';
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ' AND checkin_date <= ?';
      values.push(filters.endDate);
    }

    const [rows] = await pool.query(sql, values);
    return rows[0].total;
  },

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO checkins (user_id, habit_id, checkin_date, note) VALUES (?, ?, ?, ?)',
      [data.user_id, data.habit_id, data.checkin_date, data.note]
    );
    return result.insertId;
  },

  async delete(id, userId) {
    const [result] = await pool.query(
      'DELETE FROM checkins WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  async findByHabitAndDate(habitId, userId, checkinDate) {
    const [rows] = await pool.query(
      'SELECT * FROM checkins WHERE habit_id = ? AND user_id = ? AND checkin_date = ?',
      [habitId, userId, checkinDate]
    );
    return rows[0] || null;
  },

  async getStats(userId, days = 30) {
    const { startDate, endDate } = getDateRange(days);

    const [rows] = await pool.query(
      `SELECT
         c.habit_id,
         h.name AS habit_name,
         h.category,
         h.color,
         COUNT(DISTINCT c.checkin_date) AS total_checkins,
         COUNT(DISTINCT DATE(c.checkin_date)) AS total_days
       FROM checkins c
       LEFT JOIN habits h ON c.habit_id = h.id
       WHERE c.user_id = ? AND c.checkin_date >= ? AND c.checkin_date <= ?
       GROUP BY c.habit_id, h.name, h.category, h.color`,
      [userId, startDate, endDate]
    );

    return rows;
  },

  async getStreakData(userId, habitId) {
    const [rows] = await pool.query(
      `SELECT DISTINCT checkin_date
       FROM checkins
       WHERE user_id = ? AND habit_id = ?
       ORDER BY checkin_date DESC`,
      [userId, habitId]
    );

    const dates = rows.map(r => r.checkin_date);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const lastDate = new Date(dates[0]);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      currentStreak = 0;
    } else {
      for (let i = 0; i < dates.length; i++) {
        const currentDate = new Date(dates[i]);
        currentDate.setHours(0, 0, 0, 0);

        if (i === 0) {
          tempStreak = 1;
        } else {
          const prevDate = new Date(dates[i - 1]);
          prevDate.setHours(0, 0, 0, 0);
          const diff = Math.floor((prevDate - currentDate) / (1000 * 60 * 60 * 24));

          if (diff === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }

        longestStreak = Math.max(longestStreak, tempStreak);
        if (i === 0 && diffDays <= 1) {
          currentStreak = tempStreak;
        } else if (diffDays <= 1 && i > 0) {
          const nextDate = new Date(dates[i - 1]);
          nextDate.setHours(0, 0, 0, 0);
          const diff = Math.floor((nextDate - currentDate) / (1000 * 60 * 60 * 24));
          if (diff === 1) {
            currentStreak = tempStreak;
          }
        }
      }
    }

    return { currentStreak, longestStreak };
  }
};

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

module.exports = CheckIn;
