import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const sql = readFileSync(resolve('server/sql/migration_new_tables.sql'), 'utf-8');
const statements = sql.split(';').filter(s => s.trim().length > 0);

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'intelligent_life_assistant',
  multipleStatements: true
});

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.query(sql);
    console.log('✅ 数据库迁移成功！');
  } catch (err) {
    console.error('❌ 迁移失败:', err.message);
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
