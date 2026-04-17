const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

// 生成 JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 用户注册
exports.register = async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { username, password, nickname } = req.body;

    // 检查用户名是否已存在
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await pool.execute(
      `INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)`,
      [username, hashedPassword, nickname || username]
    );

    const userId = result.insertId;

    // 初始化用户的做题数据为0
    try {
      // 先删除该用户的所有旧数据
      await pool.execute('DELETE FROM notebook WHERE user_id = ?', [userId]);
      await pool.execute('DELETE FROM review_continuous WHERE user_id = ?', [userId]);
      await pool.execute('DELETE FROM review_records WHERE user_id = ?', [userId]);

      // 插入初始化记录
      await pool.execute(
        `INSERT INTO review_continuous (user_id, continuous_days, last_review_date) VALUES (?, 1, CURRENT_DATE)`,
        [userId]
      );

      // 插入空的练习记录
      await pool.execute(
        `INSERT INTO practice_records (user_id, practice_date) VALUES (?, CURRENT_DATE)`,
        [userId]
      );

      // 插入空的复习记录占位
      await pool.execute(
        `INSERT INTO review_records (user_id, question_id, review_stage, correct_count, total_review_count, memory_level, status) VALUES (?, 0, 1, 0, 0, 50, 0)`,
        [userId]
      );
    } catch (initError) {
      console.error('初始化用户数据失败:', initError);
      // 不影响注册流程，只记录错误
    }

    // 获取用户信息
    const [users] = await pool.execute(
      'SELECT id, username, nickname, avatar, email, phone, exam_target, daily_goal, weekly_days FROM users WHERE id = ?',
      [userId]
    );

    const user = users[0];

    res.status(200).json({
      code: 200,
      message: '注册成功',
      data: {
        user,
        token: generateToken(userId)
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      code: 500,
      message: '注册失败'
    });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    console.log('登录请求 body:', req.body);

    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('验证错误:', errors.array());
      return res.status(400).json({
        code: 400,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;
    console.log('提取的 username:', username, 'password length:', password?.length);

    // 查找用户
    const [users] = await pool.execute(
      'SELECT id, username, password, nickname, avatar, email, phone, exam_target, daily_goal, weekly_days, status FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '用户名或密码错误'
      });
    }

    const user = users[0];

    // 检查用户状态
    if (user.status === 0) {
      return res.status(403).json({
        code: 403,
        message: '账号已被禁用'
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        code: 400,
        message: '用户名或密码错误'
      });
    }

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      code: 200,
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token: generateToken(user.id)
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '登录失败'
    });
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, nickname, avatar, email, phone, exam_target, daily_goal, weekly_days, create_time FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    res.status(200).json({
      code: 200,
      data: users[0]
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败'
    });
  }
};

// 更新用户信息
exports.updateProfile = async (req, res) => {
  try {
    const { nickname, avatar, phone, exam_target, daily_goal, weekly_days } = req.body;

    const [result] = await pool.execute(
      `UPDATE users SET
        nickname = COALESCE(?, nickname),
        avatar = COALESCE(?, avatar),
        phone = COALESCE(?, phone),
        exam_target = COALESCE(?, exam_target),
        daily_goal = COALESCE(?, daily_goal),
        weekly_days = COALESCE(?, weekly_days)
       WHERE id = ?`,
      [nickname, avatar, phone, exam_target, daily_goal, weekly_days, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    res.status(200).json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新用户信息失败'
    });
  }
};

// 修改密码
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // 获取用户当前密码
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, users[0].password);

    if (!isPasswordValid) {
      return res.status(400).json({
        code: 400,
        message: '原密码错误'
      });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.userId]
    );

    res.status(200).json({
      code: 200,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      code: 500,
      message: '修改密码失败'
    });
  }
};

// 注册验证规则
exports.registerValidation = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('password')
    .isLength({ min: 6, max: 20 })
    .withMessage('密码长度必须在6-20个字符之间'),
  body('nickname')
    .optional()
    .isLength({ max: 20 })
    .withMessage('昵称长度不能超过20个字符')
];

// 登录验证规则
exports.loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
];

// 修改密码验证规则
exports.changePasswordValidation = [
  body('oldPassword')
    .notEmpty()
    .withMessage('原密码不能为空'),
  body('newPassword')
    .isLength({ min: 6, max: 20 })
    .withMessage('新密码长度必须在6-20个字符之间')
];
