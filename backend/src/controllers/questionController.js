const pool = require('../config/database');

// 获取学科列表
exports.getSubjects = async (req, res) => {
  try {
    const [subjects] = await pool.execute(
      'SELECT id, name, code, icon, description FROM subjects WHERE status = 1 ORDER BY sort_order'
    );

    res.status(200).json({
      code: 200,
      data: subjects
    });
  } catch (error) {
    console.error('获取学科列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取学科列表失败'
    });
  }
};

// 获取章节列表
exports.getChapters = async (req, res) => {
  try {
    const { subjectId } = req.query;

    let query = 'SELECT id, name, description, sort_order FROM chapters WHERE status = 1';
    const params = [];

    if (subjectId) {
      query += ' AND subject_id = ?';
      params.push(subjectId);
    }

    query += ' ORDER BY sort_order';

    const [chapters] = await pool.execute(query, params);

    res.status(200).json({
      code: 200,
      data: chapters
    });
  } catch (error) {
    console.error('获取章节列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取章节列表失败'
    });
  }
};

// 获取知识点列表
exports.getKnowledgePoints = async (req, res) => {
  try {
    const { subjectId, chapterId } = req.query;

    let query = `
      SELECT kp.id, kp.name, kp.description, kp.sort_order,
             c.name as chapter_name, s.name as subject_name
      FROM knowledge_points kp
      LEFT JOIN chapters c ON kp.chapter_id = c.id
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE kp.status = 1
    `;
    const params = [];

    if (chapterId) {
      query += ' AND kp.chapter_id = ?';
      params.push(chapterId);
    } else if (subjectId) {
      query += ' AND c.subject_id = ?';
      params.push(subjectId);
    }

    query += ' ORDER BY kp.sort_order';

    const [reviewKnowledgePoints] = await pool.execute(query, params);

    res.status(200).json({
      code: 200,
      data: reviewKnowledgePoints
    });
  } catch (error) {
    console.error('获取知识点列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取知识点列表失败'
    });
  }
};

// 获取题目详情
exports.getQuestionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [questions] = await pool.execute(
      `SELECT q.id, q.knowledge_id, q.type, q.difficulty, q.content, q.options, q.answer, q.analysis,
              kp.name as knowledge_name, s.name as subject_name
       FROM questions q
       LEFT JOIN knowledge_points kp ON q.knowledge_id = kp.id
       LEFT JOIN subjects s ON kp.chapter_id IN (SELECT id FROM chapters WHERE subject_id = s.id)
       WHERE q.id = ? AND q.status = 1`,
      [id]
    );

    if (questions.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '题目不存在'
      });
    }

    // 解析 JSON 格式的选项（MySQL2已自动解析，如果是字符串才需要手动解析）
    const question = questions[0];
    if (typeof question.options === 'string') {
      question.options = JSON.parse(question.options);
    }

    // 不增加查看次数（禁用题目级计数器）
    // await pool.execute(
    //   'UPDATE questions SET view_count = view_count + 1 WHERE id = ?',
    //   [id]
    // );

    res.status(200).json({
      code: 200,
      data: question
    });
  } catch (error) {
    console.error('获取题目详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取题目详情失败'
    });
  }
};

// 获取练习题目
exports.getPracticeQuestions = async (req, res) => {
  try {
    // 将所有查询参数转换为整数，防止预处理语句参数类型错误
    const knowledgeId = req.query.knowledgeId ? parseInt(req.query.knowledgeId) : null;
    const count = parseInt(req.query.count) || 10;
    const difficulty = parseInt(req.query.difficulty) || 0;

    let query = `
      SELECT id, knowledge_id, type, difficulty, content, options, answer, analysis
      FROM questions
      WHERE status = 1
    `;
    const params = [];

    if (knowledgeId) {
      query += ' AND knowledge_id = ?';
      params.push(knowledgeId);
    }

    if (difficulty > 0) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    // 先查询该知识点下有多少道题
    const [countQuery] = await pool.query(
      `SELECT COUNT(*) as total FROM questions WHERE status = 1 ${knowledgeId ? 'AND knowledge_id = ?' : ''} ${difficulty > 0 ? 'AND difficulty = ?' : ''}`,
      knowledgeId ? (difficulty > 0 ? [knowledgeId, difficulty] : [knowledgeId]) : (difficulty > 0 ? [difficulty] : [])
    );
    const availableCount = countQuery[0].total;

    // 如果可用题目数少于请求数量，使用实际可用数量
    const actualCount = Math.min(count, availableCount);

    query += ' ORDER BY RAND() LIMIT ?';
    params.push(actualCount);

    const [questions] = await pool.query(query, params);

    // 处理 JSON 格式的选项
    // MySQL 自动将 JSON 类型转换为对象，所以需要检查是否已经是对象
    questions.forEach(q => {
      if (q.options) {
        if (typeof q.options === 'string') {
          try {
            q.options = JSON.parse(q.options);
          } catch (e) {
            // 如果解析失败，保持原样
            console.warn(`Failed to parse options for question ${q.id}:`, e.message);
          }
        }
        // 如果已经是对象，直接使用
      }
    });

    // 如果返回的题目数少于请求的数量，添加提示信息
    const message = availableCount < count
      ? `该知识点下只有 ${availableCount} 道题，已全部返回`
      : null;

    res.status(200).json({
      code: 200,
      data: questions,
      message: message
    });
  } catch (error) {
    console.error('获取练习题目错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取练习题目失败'
    });
  }
};

// 提交答案
exports.submitAnswer = async (req, res) => {
  try {
    const { answers, elapsed_time } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '答案数据无效'
      });
    }

    // 获取题目信息
    const questionIds = answers.map(a => a.questionId);
    const [questions] = await pool.execute(
      `SELECT id, knowledge_id, answer FROM questions WHERE id IN (${questionIds.map(() => '?').join(',')})`,
      questionIds
    );

    const questionMap = new Map(questions.map(q => [q.id, q]));

    // 统计结果
    let correctCount = 0;
    const results = [];
    const knowledgeStats = new Map();

    // 验证答案并更新统计
    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;

      const isCorrect = answer.userAnswer === question.answer;

      if (isCorrect) {
        correctCount++;
        // 不增加题目级计数器（禁用）
        // await pool.execute(
        //   'UPDATE questions SET correct_count = correct_count + 1 WHERE id = ?',
        //   [answer.questionId]
        // );
      } else {
        // 不增加题目级计数器（禁用）
        // await pool.execute(
        //   'UPDATE questions SET wrong_count = wrong_count + 1 WHERE id = ?',
        //   [answer.questionId]
        // );
      }

      // 收集知识点统计
      const knowledgeId = question.knowledge_id;
      if (!knowledgeStats.has(knowledgeId)) {
        knowledgeStats.set(knowledgeId, { total: 0, correct: 0 });
      }
      const stats = knowledgeStats.get(knowledgeId);
      stats.total++;
      if (isCorrect) stats.correct++;

      results.push({
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        correctAnswer: question.answer,
        isCorrect
      });
    }

    // 保存练习记录
    for (const [knowledgeId, stats] of knowledgeStats) {
      // 获取学科ID
      const [knowledgePoints] = await pool.execute(
        'SELECT chapter_id FROM knowledge_points WHERE id = ?',
        [knowledgeId]
      );

      if (knowledgePoints.length > 0) {
        const [chapters] = await pool.execute(
          'SELECT subject_id FROM chapters WHERE id = ?',
          [knowledgePoints[0].chapter_id]
        );

        const subjectId = chapters[0]?.subject_id;

        await pool.execute(
          `INSERT INTO practice_records (user_id, subject_id, knowledge_id, question_count, correct_count, accuracy, elapsed_time, practice_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`,
          [
            userId,
            subjectId,
            knowledgeId,
            stats.total,
            stats.correct,
            stats.total > 0 ? (stats.correct / stats.total * 100).toFixed(2) : 0,
            elapsed_time !== undefined ? elapsed_time : 0
          ]
        );
      }
    }

    // 为所有知识点创建/更新复习记录（基于艾宾浩斯遗忘曲线）
    const reviewKnowledgePoints = new Map();

    // 统计每个知识点的答题情况
    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question || !question.knowledge_id) continue;

      const isCorrect = answer.userAnswer === question.answer;
      const kpId = question.knowledge_id;

      if (!reviewKnowledgePoints.has(kpId)) {
        reviewKnowledgePoints.set(kpId, { correct: isCorrect ? 1 : 0, total: 1, questions: [question.id] });
      } else {
        const kp = reviewKnowledgePoints.get(kpId);
        kp.correct += isCorrect ? 1 : 0;
        kp.total += 1;
        kp.questions.push(question.id);
      }
    }

    // 按知识点创建/更新复习记录
    for (const [kpId, kp] of reviewKnowledgePoints) {
      const correctRate = kp.total > 0 ? (kp.correct / kp.total * 100) : 0;

      // 检查是否已存在复习记录
      const [existing] = await pool.execute(
        'SELECT id, review_stage, memory_level FROM review_records WHERE user_id = ? AND knowledge_id = ? AND status = 0',
        [userId, kpId]
      );

      if (existing.length === 0) {
        // 新知识点：创建复习记录
        const memoryLevel = Math.round(60 + correctRate * 0.3);
        const firstReviewInterval = correctRate >= 60 ? '30 MINUTE' : '5 MINUTE';
        const firstQuestionId = kp.questions[0];

        await pool.execute(
          `INSERT INTO review_records (user_id, question_id, knowledge_id, review_stage, correct_count, total_review_count, memory_level, last_review_time, next_review_time)
           VALUES (?, ?, ?, 0, ?, 1, ?, NOW(), DATE_ADD(NOW(), INTERVAL ${firstReviewInterval}))`,
          [userId, firstQuestionId, kpId, correctRate > 0 ? 1 : 0, memoryLevel]
        );
      } else {
        // 已存在：更新记忆水平和下次复习时间
        const record = existing[0];
        const currentMemoryLevel = record.memory_level;

        // 根据正确率调整记忆水平
        let newMemoryLevel;
        if (correctRate >= 80) {
          newMemoryLevel = Math.min(100, currentMemoryLevel + 5);
        } else if (correctRate >= 60) {
          newMemoryLevel = Math.max(0, currentMemoryLevel - 2);
        } else {
          newMemoryLevel = Math.max(0, currentMemoryLevel - 5);
        }

        const intervals = [
          '5 MINUTE', '30 MINUTE', '12 HOUR', '1 DAY', '2 DAY', '4 DAY', '7 DAY', '15 DAY'
        ];
        const nextInterval = intervals[Math.min(record.review_stage, intervals.length - 1)];

        await pool.execute(
          `UPDATE review_records
           SET review_stage = review_stage + 1,
               correct_count = correct_count + ?,
               total_review_count = total_review_count + 1,
               memory_level = ?,
               last_review_time = NOW(),
               next_review_time = DATE_ADD(NOW(), INTERVAL ${nextInterval})
           WHERE id = ?`,
          [correctRate > 0 ? 1 : 0, newMemoryLevel, record.id]
        );
      }
    }

    res.status(200).json({
      code: 200,
      message: '提交成功',
      data: {
        total: answers.length,
        correct: correctCount,
        accuracy: answers.length > 0 ? ((correctCount / answers.length) * 100).toFixed(2) : 0,
        results
      }
    });
  } catch (error) {
    console.error('提交答案错误:', error);
    res.status(500).json({
      code: 500,
      message: '提交答案失败'
    });
  }
};

// 获取题目统计
exports.getQuestionStats = async (req, res) => {
  console.log('getQuestionStats called!');
  try {
    const [stats] = await pool.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN type = 1 THEN 1 ELSE 0 END) as single_choice,
        SUM(CASE WHEN type = 2 THEN 1 ELSE 0 END) as multiple_choice,
        SUM(CASE WHEN type = 3 THEN 1 ELSE 0 END) as true_false
      FROM questions WHERE status = 1
    `);

    console.log('getQuestionStats result:', stats[0]);
    res.status(200).json({
      code: 200,
      data: stats[0]
    });
  } catch (error) {
    console.error('获取题目统计错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取题目统计失败'
    });
  }
};

// 获取练习历史
exports.getPracticeHistory = async (req, res) => {
  console.log('=== getPracticeHistory CALLED ===');
  try {
    const userId = req.user.userId;
    const { limit = 5 } = req.query;
    console.log('userId:', userId, 'limit:', limit);

    const [history] = await pool.query(
      `SELECT
        s.name as subject_name,
        kp.name as knowledge_name,
        pr.knowledge_id,
        pr.question_count,
        pr.correct_count,
        ROUND(pr.correct_count / pr.question_count * 100, 2) as accuracy,
        pr.practice_date,
        pr.elapsed_time
       FROM practice_records pr
       LEFT JOIN knowledge_points kp ON pr.knowledge_id = kp.id
       LEFT JOIN chapters c ON kp.chapter_id = c.id
       LEFT JOIN subjects s ON c.subject_id = s.id
       WHERE pr.user_id = ?
       ORDER BY pr.practice_date DESC
       LIMIT ?`,
      [userId, parseInt(limit)]
    );

    res.status(200).json({
      code: 200,
      data: history
    });
  } catch (error) {
    console.error('获取练习历史错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取练习历史失败'
    });
  }
};
