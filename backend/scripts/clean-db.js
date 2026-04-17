const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_exam'
});

async function cleanAllData() {
  try {
    console.log('开始清空数据库...\n');

    // 清空练习记录
    console.log('1. 清空练习记录表...')
    const [practiceResult] = await pool.execute('DELETE FROM practice_records WHERE user_id IS NOT NULL');
    console.log(`   ✅ 已清空 practice_records: ${practiceResult.affectedRows} 条记录`);

    // 清空错题本
    console.log('\n2. 清空错题本表...')
    const [notebookResult] = await pool.execute('DELETE FROM notebook WHERE user_id IS NOT NULL');
    console.log(`   ✅ 已清空 notebook: ${notebookResult.affectedRows} 条记录`);

    // 清空复习记录
    console.log('\n3. 清空复习记录表...')
    const [reviewResult] = await pool.execute('DELETE FROM review_records WHERE user_id IS NOT NULL');
    console.log(`   ✅ 已清空 review_records: ${reviewResult.affectedRows} 条记录`);

    // 清空连续复习记录
    console.log('\n4. 清空连续复习记录表...')
    const [continuousResult] = await pool.execute('DELETE FROM review_continuous WHERE user_id IS NOT NULL');
    console.log(`   ✅ 已清空 review_continuous: ${continuousResult.affectedRows} 条记录`);

    // 重置复习记录的初始化记录
    console.log('\n5. 重置复习记录初始化...')
    await pool.execute('UPDATE review_records SET correct_count = 0, total_review_count = 0, memory_level = 50, status = 0 WHERE user_id IS NOT NULL');
    console.log('   ✅ 复习记录状态已重置');

    // 显示剩余用户
    const [users] = await pool.execute('SELECT id, username, nickname FROM users ORDER BY id');
    console.log(`\n=== 剩余用户 ===`);
    console.log(users.length > 0 ? users.map(u => `${u.id}. ${u.username} (${u.nickname})`).join('\n') : '没有用户');

    console.log('\n✅ 数据库数据已全部清空！');

    await pool.end();

  } catch (error) {
    console.error('❌ 清空数据失败:', error.message);
    await pool.end();
    process.exit(1);
  }
}

cleanAllData();
