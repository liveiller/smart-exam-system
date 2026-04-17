const pool = require('../config/database');

// 获取今日复习任务
exports.getTodayTasks = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [tasks] = await pool.execute(`
      SELECT
        MIN(rr.id) as id,
        rr.knowledge_id,
        rr.review_stage,
        MAX(rr.correct_count) as correct_count,
        MAX(rr.total_review_count) as total_review_count,
        AVG(rr.memory_level) as memory_level,
        MIN(rr.next_review_time) as next_review_time,
        COUNT(DISTINCT rr.question_id) as question_count,
        kp.name as knowledge_name,
        s.name as subject_name
      FROM review_records rr
      LEFT JOIN knowledge_points kp ON rr.knowledge_id = kp.id
      LEFT JOIN chapters c ON kp.chapter_id = c.id
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE rr.user_id = ?
        AND rr.status = 0
        AND rr.memory_level < 80
      GROUP BY rr.knowledge_id, rr.review_stage, kp.name, s.name
      ORDER BY MIN(rr.next_review_time) ASC
    `, [userId]);

    // 将 AVG 返回的字符串转换为数字
    tasks.forEach(task => {
      task.correct_count = Math.round(task.correct_count);
      task.total_review_count = Math.round(task.total_review_count);
      task.memory_level = Math.round(task.memory_level);
      task.question_count = task.question_count || 0;
    });

    res.status(200).json({
      code: 200,
      data: tasks
    });
  } catch (error) {
    console.error('获取今日复习任务错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取今日复习任务失败'
    });
  }
};

// 获取复习题目
exports.getReviewQuestions = async (req, res) => {
  try {
    const { knowledgeId, count = 5 } = req.query;
    const userId = req.user.userId;

    let query = `
      SELECT DISTINCT q.id, q.knowledge_id, q.type, q.difficulty, q.content, q.options, q.answer, q.analysis,
             kp.name as knowledge_name
      FROM review_records rr
      INNER JOIN questions q ON rr.question_id = q.id
      LEFT JOIN knowledge_points kp ON q.knowledge_id = kp.id
      WHERE rr.user_id = ? AND rr.status = 0
    `;
    const params = [userId];

    if (knowledgeId) {
      query += ' AND rr.knowledge_id = ?';
      params.push(knowledgeId);
    }

    query += ' ORDER BY rr.next_review_time ASC LIMIT ?';
    params.push(parseInt(count));

    const [questions] = await pool.execute(query, params);

    // 解析 JSON 格式的选项（MySQL2已自动解析，如果是字符串才需要手动解析）
    questions.forEach(q => {
      if (typeof q.options === 'string') {
        try {
          q.options = JSON.parse(q.options);
        } catch (e) {
          console.warn(`Failed to parse options for question ${q.id}:`, e.message);
        }
      }
    });

    res.status(200).json({
      code: 200,
      data: questions
    });
  } catch (error) {
    console.error('获取复习题目错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取复习题目失败'
    });
  }
};

// 提交复习结果
exports.submitReview = async (req, res) => {
  try {
    const { results } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '结果数据无效'
      });
    }

    const updatePromises = results.map(async (result) => {
      const isCorrect = result.isCorrect;
      let nextStage, nextInterval;

      if (isCorrect) {
        // 答对：进入下一阶段
        const [record] = await pool.execute(
          'SELECT review_stage FROM review_records WHERE user_id = ? AND question_id = ?',
          [userId, result.questionId]
        );

        const currentStage = record[0]?.review_stage || 0;
        nextStage = Math.min(currentStage + 1, 8);

        // 根据阶段设置复习间隔（分钟）
        const intervals = [5, 30, 720, 1440, 2880, 5760, 10080, 20160];
        nextInterval = intervals[Math.min(nextStage - 1, intervals.length - 1)];
      } else {
        // 答错：重新开始
        nextStage = 1;
        nextInterval = 5;
      }

      // 计算记忆水平
      const updated = await pool.execute(`
        SELECT correct_count, total_review_count FROM review_records
        WHERE user_id = ? AND question_id = ?
      `, [userId, result.questionId]);

      let memoryLevel = 50;
      if (updated.length > 0) {
        const record = updated[0];
        const correctRate = record.total_review_count > 0 ? (record.correct_count / record.total_review_count) : 0;
        memoryLevel = Math.min(100, Math.round(correctRate * 100 * (1 + nextStage * 0.1)));
      }

      // 更新复习记录
      await pool.execute(`
        UPDATE review_records SET
          review_stage = ?,
          correct_count = correct_count + ?,
          total_review_count = total_review_count + 1,
          memory_level = ?,
          last_review_time = NOW(),
          next_review_time = DATE_ADD(NOW(), INTERVAL ? MINUTE),
          status = CASE WHEN ? >= 7 AND memory_level >= 80 THEN 2 ELSE status END
        WHERE user_id = ? AND question_id = ?
      `, [
        nextStage,
        isCorrect ? 1 : 0,
        memoryLevel,
        nextInterval,
        nextStage,
        userId,
        result.questionId
      ]);

      return { questionId: result.questionId, isCorrect };
    });

    await Promise.all(updatePromises);

    // 更新连续复习天数
    await updateContinuousDays(userId);

    res.status(200).json({
      code: 200,
      message: '复习结果提交成功'
    });
  } catch (error) {
    console.error('提交复习结果错误:', error);
    res.status(500).json({
      code: 500,
      message: '提交复习结果失败'
    });
  }
};

// 获取复习统计
exports.getReviewStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];

    // 今日待复习数量
    const [todayTotal] = await pool.execute(
      `SELECT COUNT(DISTINCT knowledge_id) as count FROM review_records
       WHERE user_id = ? AND status = 0 AND memory_level < 80`,
      [userId]
    );

    // 今日已完成数量
    const [completed] = await pool.execute(
      `SELECT COUNT(*) as count FROM review_records
       WHERE user_id = ? AND last_review_time >= CURDATE()`,
      [userId]
    );

    // 连续复习天数
    const [continuous] = await pool.execute(
      'SELECT continuous_days FROM review_continuous WHERE user_id = ?',
      [userId]
    );

    // 平均记忆保持率
    const [avgMemory] = await pool.execute(
      'SELECT AVG(memory_level) as avg FROM review_records WHERE user_id = ?',
      [userId]
    );

    res.status(200).json({
      code: 200,
      data: {
        todayTotal: todayTotal[0].count,
        completed: completed[0].count,
        continuous: continuous[0]?.continuous_days || 1,
        retention: Math.round(avgMemory[0].avg || 75)
      }
    });
  } catch (error) {
    console.error('获取复习统计错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取复习统计失败'
    });
  }
};

// 获取艾宾浩斯曲线数据
exports.getEbbinghausCurve = async (req, res) => {
  try {
    // 自然遗忘曲线（经典数据）
    const naturalForgetting = [100, 58.2, 44.2, 35.8, 33.7, 27.8, 25.4, 21.1];
    const timePoints = ['学习后', '20分钟', '1小时', '9小时', '1天', '2天', '6天', '31天'];

    // 科学复习曲线（模拟数据）
    const withReview = [100, 90, 85, 80, 78, 75, 72, 68];

    res.status(200).json({
      code: 200,
      data: {
        timePoints,
        naturalForgetting,
        withReview
      }
    });
  } catch (error) {
    console.error('获取艾宾浩斯曲线错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取艾宾浩斯曲线失败'
    });
  }
};

// 更新连续复习天数
async function updateContinuousDays(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [existing] = await pool.execute(
      'SELECT * FROM review_continuous WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      // 第一次复习
      await pool.execute(
        'INSERT INTO review_continuous (user_id, continuous_days, last_review_date) VALUES (?, 1, CURDATE())',
        [userId]
      );
    } else {
      const lastDate = existing[0].last_review_date.toISOString().split('T')[0];
      const lastDateObj = new Date(lastDate);
      const todayObj = new Date(today);

      const diffDays = Math.floor((todayObj - lastDateObj) / (1000 * 60 * 60 * 24));

      let newDays;
      if (diffDays === 0) {
        newDays = existing[0].continuous_days; // 同一天，不变
      } else if (diffDays === 1) {
        newDays = existing[0].continuous_days + 1; // 连续，加1
      } else {
        newDays = 1; // 断了，重置为1
      }

      await pool.execute(
        'UPDATE review_continuous SET continuous_days = ?, last_review_date = CURDATE() WHERE user_id = ?',
        [newDays, userId]
      );
    }
  } catch (error) {
    console.error('更新连续复习天数错误:', error);
  }
}

exports.updateContinuousDays = updateContinuousDays;
