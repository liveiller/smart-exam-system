const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/databaseController');
const { auth, optionalAuth } = require('../middleware/auth');

// 清空所有用户数据（需要登录）
router.post('/reset', auth, databaseController.resetAllUserData);

// 获取用户数据统计（需要登录）
router.get('/stats', auth, databaseController.getUserDataStats);

module.exports = router;
