const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { auth, optionalAuth } = require('../middleware/auth');

// 获取学科列表
router.get('/subjects', optionalAuth, questionController.getSubjects);

// 获取章节列表
router.get('/chapters', optionalAuth, questionController.getChapters);

// 获取知识点列表
router.get('/knowledge', optionalAuth, questionController.getKnowledgePoints);

// 获取练习题目
router.get('/practice/questions', auth, questionController.getPracticeQuestions);

// 获取练习历史
router.get('/history', auth, questionController.getPracticeHistory);

// 获取题目统计
router.get('/stats', optionalAuth, questionController.getQuestionStats);

// 获取题目详情 - 必须放在最后，作为最通用的路由
router.get('/:id', optionalAuth, questionController.getQuestionDetail);

// 提交答案
router.post('/answer', auth, questionController.submitAnswer);

module.exports = router;
