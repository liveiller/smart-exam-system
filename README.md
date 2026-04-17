# 考研智能刷题系统

一个基于 Vue 3 + Node.js + MySQL 开发的智能考研刷题平台，融合了艾宾浩斯记忆曲线和知识图谱分析技术，为考研学生提供科学、高效的刷题备考体验。

## ✨ 主要功能

### 🎯 核心功能

- **智能刷题系统**
  - 按学科、章节、知识点精准选题
  - 支持单选、多选、判断三种题型
  - 难度分级（简单/中等/困难）
  - 答题进度实时跟踪

- **科学复习系统**
  - 基于艾宾浩斯遗忘曲线的智能复习
  - 自动计算下次复习时间
  - 连续复习天数统计
  - 记忆保持率可视化

- **错题管理系统**
  - 错题自动收集
  - 文件夹分类管理
  - 笔记和标签功能
  - 掌握程度标记

- **靶向分析系统**
  - 知识点掌握度雷达图
  - 薄弱知识点识别
  - 知识图谱树形展示
  - 针对性练习推荐

- **学习仪表盘**
  - 学习统计数据
  - 每日复习任务
  - 学习进度可视化
  - 目标设定与追踪

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3 + Composition API
- **UI 组件**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **图表**: ECharts
- **构建工具**: Vite
- **HTTP 客户端**: Axios

### 后端
- **运行环境**: Node.js
- **Web 框架**: Express.js
- **数据库**: MySQL 8.0
- **认证**: JWT (jsonwebtoken)
- **密码加密**: Bcrypt
- **API 文档**: RESTful API

## 📋 系统要求

### 前端
- Node.js >= 16.0.0
- npm >= 8.0.0

### 后端
- Node.js >= 16.0.0
- MySQL >= 8.0.0

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/liveiller/smart-exam-system.git
cd smart-exam-system
```

### 2. 快速部署（推荐）

一键自动部署脚本，支持 Windows 和 macOS：

#### Windows
```bash
# 双击运行
scripts\deploy.bat
```

#### macOS/Linux
```bash
# 给脚本权限
chmod +x scripts/deploy.sh

# 运行脚本
./scripts/deploy.sh
```

脚本会自动：
- 检查运行环境
- 创建数据库
- 安装依赖
- 启动服务

### 3. 手动数据库配置

如果不使用自动脚本，可以手动配置：

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE smart_exam DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入表结构
mysql -u root -p smart_exam < backend/database/init.sql

# 导入题库数据（可选）
mysql -u root -p smart_exam < backend/database/questions.sql
```

### 3. 后端配置

进入后端目录：

```bash
cd backend
```

安装依赖：

```bash
npm install
```

配置环境变量：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_exam
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

启动后端服务：

```bash
npm run dev
```

后端服务将在 `http://localhost:3001` 启动。

### 4. 前端配置

进入前端目录：

```bash
cd frontend
```

安装依赖：

```bash
npm install
```

启动前端开发服务器：

```bash
npm run dev
```

前端服务将在 `http://localhost:3000` 启动。

### 5. 访问系统

在浏览器中打开：`http://localhost:3000`

使用任意用户名和密码进行登录（测试模式）。

## 📁 项目结构

```
smart-exam-system/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── api/            # API 接口
│   │   ├── assets/         # 静态资源
│   │   ├── components/     # 公共组件
│   │   ├── data/           # 静态数据
│   │   ├── layout/         # 布局组件
│   │   ├── router/         # 路由配置
│   │   ├── store/          # 状态管理
│   │   ├── utils/          # 工具函数
│   │   └── views/          # 页面组件
│   ├── public/             # 公共资源
│   └── package.json
├── backend/                 # 后端项目
│   ├── database/           # 数据库脚本
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由
│   │   └── app.js          # 应用入口
│   └── package.json
├── docs/                   # 文档
│   └── database-design.md  # 数据库设计文档
└── README.md              # 项目说明
```

## 🔧 API 接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/current` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新用户信息
- `PUT /api/auth/password` - 修改密码

### 题目接口
- `GET /api/questions/subjects` - 获取学科列表
- `GET /api/questions/chapters` - 获取章节列表
- `GET /api/questions/knowledge` - 获取知识点列表
- `GET /api/questions/practice/questions` - 获取练习题目
- `POST /api/questions/answer` - 提交答案

### 复习接口
- `GET /api/review/tasks` - 获取今日复习任务
- `GET /api/review/questions` - 获取复习题目
- `POST /api/review/submit` - 提交复习结果
- `GET /api/review/stats` - 获取复习统计

### 错题本接口
- `GET /api/notebook` - 获取错题本列表
- `POST /api/notebook` - 添加错题
- `GET /api/notebook/folders` - 获取文件夹列表
- `POST /api/notebook/folders` - 创建文件夹
- `DELETE /api/notebook/folders/:id` - 删除文件夹
- `PUT /api/notebook/:id/move` - 移动错题
- `PUT /api/notebook/:id/notes` - 保存笔记
- `PUT /api/notebook/:id/mastered` - 标记掌握
- `DELETE /api/notebook/:id` - 删除错题

### 分析接口
- `GET /api/analysis/stats` - 获取整体统计
- `GET /api/analysis/knowledge` - 获取知识点掌握情况
- `GET /api/analysis/weak` - 获取薄弱知识点
- `GET /api/analysis/tree` - 获取知识图谱
- `GET /api/analysis/radar` - 获取雷达图数据

详细 API 文档请参考 `backend/README.md`

## 📊 数据库设计

数据库采用 MySQL，主要包含以下表：

- `users` - 用户表
- `subjects` - 学科表
- `chapters` - 章节表
- `knowledge_points` - 知识点表
- `questions` - 题目表
- `practice_records` - 练习记录表
- `review_records` - 复习记录表
- `notebook` - 错题本表
- `notebook_folders` - 错题文件夹表
- `review_continuous` - 连续复习记录表

详细数据库设计请参考 `docs/database-design.md`

## 🎨 功能截图

### 学习仪表盘
显示学习统计数据、今日复习任务和快捷入口

### 智能刷题
支持按学科、章节、知识点选择题目，实时显示答题进度

### 智能复习
基于艾宾浩斯遗忘曲线的复习任务展示

### 错题本
错题分类管理，支持文件夹、笔记和标签

### 靶向分析
雷达图展示知识点掌握情况，识别薄弱环节

## 🔐 安全特性

- JWT 认证机制
- 密码 bcrypt 加密
- SQL 注入防护（prepared statements）
- XSS 防护
- CORS 配置
- Helmet 安全头部

## 🚢 部署

### 前端部署

```bash
cd frontend
npm run build
```

将 `dist` 目录部署到 Web 服务器。

### 后端部署

```bash
cd backend
npm run build  # 如果有构建步骤
npm start
```

建议使用 PM2 进行进程管理：

```bash
npm install -g pm2
pm2 start src/app.js --name smart-exam-backend
```

## 📝 开发指南

### 前端开发

```bash
cd frontend
npm run dev
```

### 后端开发

```bash
cd backend
npm run dev
```

### 代码规范

- 前端遵循 ESLint 规范
- 后端遵循 Airbnb JavaScript 风格指南
- 提交前请运行代码检查

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 LICENSE 文件


⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！
