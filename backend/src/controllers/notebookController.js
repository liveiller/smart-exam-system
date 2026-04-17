const pool = require('../config/database');

// 获取错题本列表
exports.getNotebook = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { folderId, mastered, search } = req.query;

    let query = `
      SELECT n.id, n.question_id, n.knowledge_id, n.folder_id, n.wrong_count,
             n.last_wrong_time, n.mastered, n.notes, n.tags,
             q.type, q.difficulty, q.content, q.answer, q.analysis,
             kp.name as knowledge_name, s.name as subject_name
      FROM notebook n
      INNER JOIN questions q ON n.question_id = q.id
      LEFT JOIN knowledge_points kp ON n.knowledge_id = kp.id
      LEFT JOIN chapters c ON kp.chapter_id = c.id
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE n.user_id = ?
    `;
    const params = [userId];

    if (folderId) {
      query += ' AND n.folder_id = ?';
      params.push(folderId);
    }

    if (mastered !== undefined) {
      query += ' AND n.mastered = ?';
      params.push(mastered === 'true' ? 1 : 0);
    }

    if (search) {
      query += ' AND (q.content LIKE ? OR kp.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY n.last_wrong_time DESC';

    const [questions] = await pool.execute(query, params);

    // 解析 tags 并转换字段名为驼峰命名
    questions.forEach(q => {
      if (q.tags) {
        try {
          q.tags = JSON.parse(q.tags);
        } catch (e) {
          q.tags = [];
        }
      } else {
        q.tags = [];
      }

      // 转换字段名为驼峰命名
      q.questionId = q.question_id;
      q.knowledgeId = q.knowledge_id;
      q.folderId = q.folder_id;
      q.wrongCount = q.wrong_count;
      q.lastWrongTime = q.last_wrong_time;
      q.knowledgeName = q.knowledge_name;
      q.subjectName = q.subject_name;
    });

    res.status(200).json({
      code: 200,
      data: questions
    });
  } catch (error) {
    console.error('获取错题本错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取错题本失败'
    });
  }
};

// 获取文件夹列表
exports.getFolders = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [folders] = await pool.execute(
      `SELECT id, name, parent_id, icon, sort_order,
              (SELECT COUNT(*) FROM notebook WHERE folder_id = nf.id) as question_count
       FROM notebook_folders nf
       WHERE user_id = ?
       ORDER BY sort_order, id`,
      [userId]
    );

    // 转换字段名为驼峰命名
    folders.forEach(f => {
      f.parentId = f.parent_id;
      f.sortOrder = f.sort_order;
      f.questionCount = f.question_count;
    });

    res.status(200).json({
      code: 200,
      data: folders
    });
  } catch (error) {
    console.error('获取文件夹列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取文件夹列表失败'
    });
  }
};

// 添加错题
exports.addToNotebook = async (req, res) => {
  try {
    const { questionId, knowledgeId } = req.body;
    const userId = req.user.userId;

    console.log('添加错题请求:', { userId, questionId, knowledgeId });

    // 检查是否已存在
    const [existing] = await pool.execute(
      'SELECT id, wrong_count FROM notebook WHERE user_id = ? AND question_id = ?',
      [userId, questionId]
    );

    if (existing.length > 0) {
      // 已存在，增加错误次数
      await pool.execute(
        'UPDATE notebook SET wrong_count = wrong_count + 1, last_wrong_time = NOW() WHERE id = ?',
        [existing[0].id]
      );

      return res.status(200).json({
        code: 200,
        message: '错题已更新',
        data: { id: existing[0].id, wrongCount: existing[0].wrong_count + 1 }
      });
    }

    // 新增错题
    const [result] = await pool.execute(
      `INSERT INTO notebook (user_id, question_id, knowledge_id, folder_id, wrong_count, last_wrong_time, mastered)
       VALUES (?, ?, ?, ?, 1, NOW(), 0)`,
      [userId, questionId, knowledgeId, 1]
    );

    res.status(200).json({
      code: 200,
      message: '添加成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('添加错题错误:', error);
    res.status(500).json({
      code: 500,
      message: '添加错题失败'
    });
  }
};

// 创建文件夹
exports.createFolder = async (req, res) => {
  try {
    const { name, parentId = null } = req.body;
    const userId = req.user.userId;

    const [result] = await pool.execute(
      'INSERT INTO notebook_folders (user_id, parent_id, name, icon, sort_order) VALUES (?, ?, ?, ?, 0)',
      [userId, parentId, name, 'folder']
    );

    res.status(200).json({
      code: 200,
      message: '文件夹创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建文件夹错误:', error);
    res.status(500).json({
      code: 500,
      message: '创建文件夹失败'
    });
  }
};

// 删除文件夹
exports.deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 检查是否为默认文件夹
    const [folder] = await pool.execute(
      'SELECT id FROM notebook_folders WHERE user_id = ? AND id = ?',
      [userId, id]
    );

    if (folder.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '文件夹不存在'
      });
    }

    // 将该文件夹下的错题移到默认文件夹
    await pool.execute(
      'UPDATE notebook SET folder_id = 1 WHERE folder_id = ?',
      [id]
    );

    // 删除子文件夹的错题
    const [subfolders] = await pool.execute(
      'SELECT id FROM notebook_folders WHERE parent_id = ?',
      [id]
    );

    for (const subfolder of subfolders) {
      await pool.execute(
        'UPDATE notebook SET folder_id = 1 WHERE folder_id = ?',
        [subfolder.id]
      );
    }

    // 删除文件夹
    await pool.execute(
      'DELETE FROM notebook_folders WHERE id = ? OR parent_id = ?',
      [id, id]
    );

    res.status(200).json({
      code: 200,
      message: '文件夹删除成功'
    });
  } catch (error) {
    console.error('删除文件夹错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除文件夹失败'
    });
  }
};

// 移动错题到文件夹
exports.moveQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { folderId } = req.body;
    const userId = req.user.userId;

    const [result] = await pool.execute(
      'UPDATE notebook SET folder_id = ? WHERE user_id = ? AND id = ?',
      [folderId, userId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '错题不存在'
      });
    }

    res.status(200).json({
      code: 200,
      message: '移动成功'
    });
  } catch (error) {
    console.error('移动错题错误:', error);
    res.status(500).json({
      code: 500,
      message: '移动错题失败'
    });
  }
};

// 保存笔记
exports.saveNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.userId;

    const [result] = await pool.execute(
      'UPDATE notebook SET notes = ? WHERE user_id = ? AND id = ?',
      [notes, userId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '错题不存在'
      });
    }

    res.status(200).json({
      code: 200,
      message: '笔记保存成功'
    });
  } catch (error) {
    console.error('保存笔记错误:', error);
    res.status(500).json({
      code: 500,
      message: '保存笔记失败'
    });
  }
};

// 标记掌握
exports.toggleMastered = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [result] = await pool.execute(
      'UPDATE notebook SET mastered = NOT mastered WHERE user_id = ? AND id = ?',
      [userId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '错题不存在'
      });
    }

    // 获取更新后的状态
    const [notebook] = await pool.execute(
      'SELECT mastered FROM notebook WHERE id = ?',
      [id]
    );

    res.status(200).json({
      code: 200,
      message: '状态更新成功',
      data: { mastered: notebook[0].mastered === 1 }
    });
  } catch (error) {
    console.error('标记掌握错误:', error);
    res.status(500).json({
      code: 500,
      message: '标记掌握失败'
    });
  }
};

// 删除错题
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [result] = await pool.execute(
      'DELETE FROM notebook WHERE user_id = ? AND id = ?',
      [userId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '错题不存在'
      });
    }

    res.status(200).json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除错题错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除错题失败'
    });
  }
};

// 获取错题本统计
exports.getNotebookStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [stats] = await pool.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN mastered = 1 THEN 1 ELSE 0 END) as mastered,
        SUM(CASE WHEN mastered = 0 THEN 1 ELSE 0 END) as unmastered,
        (SELECT COUNT(*) FROM notebook_folders WHERE user_id = ?) as folders
      FROM notebook
      WHERE user_id = ?
    `, [userId, userId]);

    // 今日新增
    const [todayStats] = await pool.execute(
      `SELECT COUNT(*) as count FROM notebook
       WHERE user_id = ? AND DATE(last_wrong_time) = CURDATE()`,
      [userId]
    );

    res.status(200).json({
      code: 200,
      data: {
        ...stats[0],
        todayWrong: todayStats[0].count
      }
    });
  } catch (error) {
    console.error('获取错题本统计错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取错题本统计失败'
    });
  }
};
