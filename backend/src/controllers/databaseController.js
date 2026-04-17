const pool = require('../config/database');

// 清空所有用户数据
exports.resetAllUserData = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 清空所有用户数据
      await connection.execute('DELETE FROM notebook WHERE user_id IS NOT NULL');
      await connection.execute('DELETE FROM review_continuous WHERE user_id IS NOT NULL');
      await connection.execute('DELETE FROM review_records WHERE user_id IS NOT NULL');
      await connection.execute('DELETE FROM practice_records WHERE user_id IS NOT NULL');

      await connection.commit();

      res.status(200).json({
        code: 200,
        message: '数据已清空',
        success: true,
        deletedRecords: {
          notebook: 0,
          review_continuous: 0,
          review_records: 0,
          practice_records: 0
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('清空用户数据失败:', error);
    res.status(500).json({
      code: 500,
      message: '清空数据失败',
      success: false,
      error: error.message
    });
  }
};

// 获取用户数据统计
exports.getUserDataStats = async (req, res) => {
  try {
    const userId = req.user?.userId;

    // 如果没有用户ID，获取所有用户的统计
    const query = userId
      ? 'SELECT u.id, u.username, u.nickname, u.create_time FROM users u WHERE u.id = ?'
      : 'SELECT u.id, u.username, u.nickname, u.create_time FROM users u ORDER BY u.id DESC LIMIT 10';

    const params = userId ? [userId] : [];

    const [users] = await pool.execute(query, params);

    // 获取每个用户的统计数据
    const stats = await Promise.all(users.map(async (user) => {
      const [practiceStats] = await pool.execute(
        'SELECT COUNT(*) as count, SUM(question_count) as total_questions, SUM(correct_count) as total_correct FROM practice_records WHERE user_id = ?',
        [user.id]
      );

      const [reviewStats] = await pool.execute(
        'SELECT COUNT(*) as count, SUM(correct_count) as total_correct FROM review_records WHERE user_id = ?',
        [user.id]
      );

      const [notebookStats] = await pool.execute(
        'SELECT COUNT(*) as count FROM notebook WHERE user_id = ?',
        [user.id]
      );

      const [continuousStats] = await pool.execute(
        'SELECT continuous_days FROM review_continuous WHERE user_id = ?',
        [user.id]
      );

      return {
        user: user,
        stats: {
          practice_count: practiceStats[0].count || 0,
          practice_questions: practiceStats[0].total_questions || 0,
          practice_correct: practiceStats[0].total_correct || 0,
          review_count: reviewStats[0].count || 0,
          review_correct: reviewStats[0].total_correct || 0,
          notebook_count: notebookStats[0].count || 0,
          continuous_days: continuousStats[0]?.continuous_days || 0
        }
      };
    }));

    res.status(200).json({
      code: 200,
      data: stats
    });
  } catch (error) {
    console.error('获取用户数据统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取统计数据失败'
    });
  }
};
