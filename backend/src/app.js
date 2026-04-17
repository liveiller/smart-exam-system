require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// 导入路由
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const reviewRoutes = require('./routes/review');
const notebookRoutes = require('./routes/notebook');
const analysisRoutes = require('./routes/analysis');
const databaseRoutes = require('./routes/database');

// 导入中间件
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 安全中间件 - 禁用可能干扰 CORS 的功能
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  hsts: false,
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));

// CORS 配置 - 在 helmet 之后，确保响应头不被覆盖
app.use(cors({
  origin: (origin, callback) => {
    // 允许所有本地开发端口
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003',
      'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002', 'http://127.0.0.1:3003'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 压缩中间件
app.use(compression());

// 日志中间件
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// 解析 JSON 和 URL 编码的请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/notebook', notebookRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/database', databaseRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在'
  });
});

// 错误处理中间件
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;
