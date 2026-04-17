const pool = require('../config/database');

// 获取整体统计数据
exports.getOverallStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subjectId } = req.query;

    let knowledgeFilter = '';
    const params = [userId];

    if (subjectId) {
      knowledgeFilter = `
        AND knowledge_id IN (
          SELECT id FROM knowledge_points
          WHERE chapter_id IN (SELECT id FROM chapters WHERE subject_id = ?)
        )
      `;
      params.push(subjectId);
    }

    // 练习记录统计
    const [practiceStats] = await pool.execute(`
      SELECT
        COUNT(*) as total_practices,
        SUM(question_count) as total_questions,
        SUM(correct_count) as total_correct
      FROM practice_records
      WHERE user_id = ? ${knowledgeFilter}
    `, params);

    const stats = practiceStats[0];
    const masteryRate = stats.total_questions > 0
      ? ((stats.total_correct / stats.total_questions) * 100).toFixed(2)
      : 0;

    // 错题本统计
    const [notebookStats] = await pool.execute(`
      SELECT
        COUNT(*) as total_wrong,
        SUM(CASE WHEN mastered = 1 THEN 1 ELSE 0 END) as mastered_wrong
      FROM notebook
      WHERE user_id = ? ${knowledgeFilter}
    `, params);

    // 复习记录统计
    const [reviewStats] = await pool.execute(`
      SELECT
        COUNT(*) as total_reviews,
        AVG(memory_level) as avg_memory
      FROM review_records
      WHERE user_id = ? ${knowledgeFilter}
    `, params);

    res.status(200).json({
      code: 200,
      data: {
        masteryRate: parseFloat(masteryRate),
        totalQuestions: stats.total_questions || 0,
        correctQuestions: stats.total_correct || 0,
        wrongQuestions: (stats.total_questions || 0) - (stats.total_correct || 0),
        totalWrong: notebookStats[0].total_wrong || 0,
        masteredWrong: notebookStats[0].mastered_wrong || 0,
        totalReviews: reviewStats[0].total_reviews || 0,
        avgMemory: Math.round(reviewStats[0].avg_memory || 0)
      }
    });
  } catch (error) {
    console.error('获取整体统计错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取整体统计失败'
    });
  }
};

// 获取知识点掌握情况
exports.getKnowledgeMastery = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subjectId } = req.query;

    let query = `
      SELECT
        kp.id,
        kp.name,
        c.name as chapter_name,
        s.name as subject_name,
        COUNT(DISTINCT q.id) as total_questions,
        COUNT(DISTINCT CASE WHEN pr.knowledge_id = kp.id THEN q.id END) as answered_questions
      FROM knowledge_points kp
      LEFT JOIN chapters c ON kp.chapter_id = c.id
      LEFT JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN questions q ON q.knowledge_id = kp.id AND q.status = 1
      LEFT JOIN practice_records pr ON pr.user_id = ? AND pr.knowledge_id = kp.id
      WHERE kp.status = 1
    `;
    const params = [userId];

    if (subjectId) {
      query += ' AND s.id = ?';
      params.push(subjectId);
    }

    query += ' GROUP BY kp.id ORDER BY kp.sort_order';

    const [knowledgePoints] = await pool.execute(query, params);

    // 计算每个知识点的正确率和掌握度
    const results = [];
    for (const kp of knowledgePoints) {
      const [practiceData] = await pool.execute(
        `SELECT
           SUM(question_count) as total_questions,
           SUM(correct_count) as correct_count,
           COUNT(*) as practice_times
         FROM practice_records
         WHERE user_id = ? AND knowledge_id = ?`,
        [userId, kp.id]
      );

      const [wrongData] = await pool.execute(
        `SELECT
           COUNT(*) as wrong_count,
           SUM(CASE WHEN mastered = 1 THEN 1 ELSE 0 END) as mastered_count
         FROM notebook
         WHERE user_id = ? AND knowledge_id = ?`,
        [userId, kp.id]
      );

      const practice = practiceData[0] || { total_questions: 0, correct_count: 0, practice_times: 0 };
      const wrong = wrongData[0] || { wrong_count: 0, mastered_count: 0 };

      const correctRate = practice.total_questions > 0
        ? (practice.correct_count / practice.total_questions * 100).toFixed(2)
        : 0;

      const masteryRate = wrong.wrong_count > 0
        ? (wrong.mastered_count / wrong.wrong_count * 100).toFixed(2)
        : 0;

      // 综合掌握度，初始为 0
      let mastery = 0;
      if (practice.total_questions > 0) {
        // 如果有错题记录，加入掌握度加权
        if (wrong.wrong_count > 0) {
          mastery = parseFloat(correctRate) * 0.7 + parseFloat(masteryRate) * 0.3;
        } else {
          // 没有错题记录，完全基于正确率
          mastery = parseFloat(correctRate);
        }
      } else if (wrong.wrong_count > 0) {
        mastery = parseFloat(masteryRate);
      }

      results.push({
        ...kp,
        answeredQuestions: practice.total_questions || 0,
        correctRate: parseFloat(correctRate),
        mastery: Math.round(mastery),
        masteryLevel: getMasteryLevel(Math.round(mastery))
      });
    }

    res.status(200).json({
      code: 200,
      data: results
    });
  } catch (error) {
    console.error('获取知识点掌握情况错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取知识点掌握情况失败'
    });
  }
};

// 获取薄弱知识点
exports.getWeakKnowledge = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subjectId, limit = 5 } = req.query;

    let query = `
      SELECT
        kp.id,
        kp.name,
        c.name as chapter_name,
        s.name as subject_name,
        COUNT(DISTINCT q.id) as total_questions
      FROM knowledge_points kp
      LEFT JOIN chapters c ON kp.chapter_id = c.id
      LEFT JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN questions q ON q.knowledge_id = kp.id AND q.status = 1
      WHERE kp.status = 1
    `;
    const params = [];

    if (subjectId) {
      query += ' AND s.id = ?';
      params.push(subjectId);
    }

    query += ' GROUP BY kp.id';

    const [knowledgePoints] = await pool.execute(query, params);

    // 计算掌握度并排序
    const results = [];
    for (const kp of knowledgePoints) {
      const mastery = await calculateKnowledgeMastery(userId, kp.id);
      results.push({
        ...kp,
        mastery,
        weakScore: 100 - mastery
      });
    }

    results.sort((a, b) => a.mastery - b.mastery);

    res.status(200).json({
      code: 200,
      data: results.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('获取薄弱知识点错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取薄弱知识点失败'
    });
  }
};

// 获取知识图谱树
exports.getKnowledgeTree = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subjectId } = req.query;

    let query = `
      SELECT c.id as chapter_id, c.name as chapter_name,
             kp.id as knowledge_id, kp.name as knowledge_name
      FROM knowledge_points kp
      INNER JOIN chapters c ON kp.chapter_id = c.id
      WHERE kp.status = 1
    `;
    const params = [];

    if (subjectId) {
      query += ' AND c.subject_id = ?';
      params.push(subjectId);
    }

    query += ' ORDER BY c.sort_order, kp.sort_order';

    const [data] = await pool.execute(query, params);

    // 构建树形结构
    const tree = [];
    const chapterMap = new Map();

    // 按章节分组
    for (const item of data) {
      if (!chapterMap.has(item.chapter_id)) {
        chapterMap.set(item.chapter_id, {
          id: item.chapter_id,
          name: item.chapter_name,
          level: 1,
          children: []
        });
      }
    }

    // 添加知识点
    for (const item of data) {
      const chapter = chapterMap.get(item.chapter_id);

      // 获取该知识点的题目统计
      const [questionStats] = await pool.execute(
        `SELECT
           COUNT(DISTINCT q.id) as total_questions,
           COUNT(DISTINCT CASE WHEN pr.user_id = ? THEN q.id ELSE NULL END) as answered_questions,
           COUNT(DISTINCT CASE WHEN pr.user_id = ? AND pr.correct_count > 0 THEN q.id ELSE NULL END) as correct_questions
         FROM questions q
         LEFT JOIN practice_records pr ON pr.knowledge_id = ? AND pr.user_id = ?
         WHERE q.knowledge_id = ?`,
        [userId, userId, item.knowledge_id, userId, item.knowledge_id]
      );

      const stats = questionStats[0] || { total_questions: 0, answered_questions: 0, correct_questions: 0 };
      const totalQuestions = parseInt(stats.total_questions) || 0;
      const answeredQuestions = parseInt(stats.answered_questions) || 0;
      const correctQuestions = parseInt(stats.correct_questions) || 0;
      const mastery = await calculateKnowledgeMastery(userId, item.knowledge_id);
      const correctRate = totalQuestions > 0
        ? parseFloat((correctQuestions / totalQuestions * 100).toFixed(2))
        : 0;

      chapter.children.push({
        id: item.knowledge_id,
        name: item.knowledge_name,
        level: 2,
        totalQuestions: totalQuestions,
        answeredQuestions: answeredQuestions,
        correctRate: correctRate,
        mastery,
        masteryLevel: getMasteryLevel(mastery)
      });
    }

    // 计算章节统计
    for (const chapter of chapterMap.values()) {
      if (chapter.children.length > 0) {
        // 计算平均掌握度
        const avgMastery = chapter.children.reduce((sum, child) => sum + child.mastery, 0) / chapter.children.length;
        chapter.mastery = Math.round(avgMastery);
        chapter.masteryLevel = getMasteryLevel(Math.round(avgMastery));

        // 累加题目统计
        const totalQuestions = chapter.children.reduce((sum, child) => sum + (child.totalQuestions || 0), 0);
        const answeredQuestions = chapter.children.reduce((sum, child) => sum + (child.answeredQuestions || 0), 0);
        const totalCorrect = chapter.children.reduce((sum, child) => sum + (child.correctRate * child.totalQuestions / 100), 0);
        const correctRate = totalQuestions > 0
          ? parseFloat((totalCorrect / totalQuestions * 100).toFixed(2))
          : 0;

        chapter.totalQuestions = totalQuestions;
        chapter.answeredQuestions = answeredQuestions;
        chapter.correctRate = correctRate;
      } else {
        chapter.mastery = 0;
        chapter.masteryLevel = 1;
        chapter.totalQuestions = 0;
        chapter.answeredQuestions = 0;
        chapter.correctRate = 0;
      }
    }

    res.status(200).json({
      code: 200,
      data: Array.from(chapterMap.values())
    });
  } catch (error) {
    console.error('获取知识图谱错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取知识图谱失败'
    });
  }
};

// 获取雷达图数据
exports.getRadarChart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subjectId } = req.query;

    const knowledgeData = await getKnowledgeMastery(userId, subjectId);

    // 取前6个知识点
    const indicators = knowledgeData.slice(0, 6).map(k => ({
      name: k.name,
      max: 100
    }));

    const values = knowledgeData.slice(0, 6).map(k => k.mastery);

    res.status(200).json({
      code: 200,
      data: {
        indicators,
        values,
        knowledgeData
      }
    });
  } catch (error) {
    console.error('获取雷达图数据错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取雷达图数据失败'
    });
  }
};

// 计算知识点掌握度
async function calculateKnowledgeMastery(userId, knowledgeId) {
  try {
    const [practiceData] = await pool.execute(
      `SELECT
         SUM(question_count) as total_questions,
         SUM(correct_count) as correct_count
       FROM practice_records
       WHERE user_id = ? AND knowledge_id = ?`,
      [userId, knowledgeId]
    );

    const [wrongData] = await pool.execute(
      `SELECT
         COUNT(*) as wrong_count,
         SUM(CASE WHEN mastered = 1 THEN 1 ELSE 0 END) as mastered_count
       FROM notebook
       WHERE user_id = ? AND knowledge_id = ?`,
      [userId, knowledgeId]
    );

    const practice = practiceData[0] || { total_questions: 0, correct_count: 0 };
    const wrong = wrongData[0] || { wrong_count: 0, mastered_count: 0 };

    // 初始掌握度为 0，完全基于正确率计算
    let mastery = 0;

    if (practice.total_questions > 0) {
      // 基于练习正确率计算（主要依据）
      const correctRate = (practice.correct_count / practice.total_questions) * 100;

      // 如果有错题记录，加入掌握度加权
      if (wrong.wrong_count > 0) {
        const masterRate = (wrong.mastered_count / wrong.wrong_count) * 100;
        // 正确率70% + 错题掌握率30%
        mastery = correctRate * 0.7 + masterRate * 0.3;
      } else {
        // 没有错题记录时，完全基于正确率
        mastery = correctRate;
      }
    } else if (wrong.wrong_count > 0) {
      // 没有练习记录但有错题，基于错题掌握度
      mastery = (wrong.mastered_count / wrong.wrong_count) * 100;
    }

    return Math.round(mastery);
  } catch (error) {
    console.error('计算知识点掌握度错误:', error);
    return 0;
  }
}

// 获取知识点掌握度（带参数）
async function getKnowledgeMastery(userId, subjectId) {
  try {
    let query = `
      SELECT
        kp.id,
        kp.name
      FROM knowledge_points kp
      LEFT JOIN chapters c ON kp.chapter_id = c.id
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE kp.status = 1
    `;
    const params = [];

    if (subjectId) {
      query += ' AND s.id = ?';
      params.push(subjectId);
    }

    query += ' ORDER BY kp.sort_order';

    const [knowledgePoints] = await pool.execute(query, params);

    const results = [];
    for (const kp of knowledgePoints) {
      const mastery = await calculateKnowledgeMastery(userId, kp.id);
      results.push({
        ...kp,
        mastery,
        masteryLevel: getMasteryLevel(mastery)
      });
    }

    return results;
  } catch (error) {
    console.error('获取知识点掌握度错误:', error);
    return [];
  }
}

// 获取掌握度等级
function getMasteryLevel(score) {
  if (score >= 85) return 5; // 优秀
  if (score >= 70) return 4; // 良好
  if (score >= 55) return 3; // 一般
  if (score >= 40) return 2; // 较差
  return 1; // 很差
}

exports.calculateKnowledgeMastery = calculateKnowledgeMastery;
