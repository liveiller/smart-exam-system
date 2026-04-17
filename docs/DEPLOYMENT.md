# 🚀 部署指南

## 👋 欢迎使用考研智能刷题系统！

本文档将指导您如何快速部署本系统到生产环境。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/liveiller/smart-exam-system)
[![Deploy to Koyeb](https://www.koyeb.com/deploy?repository_url=https://github.com/liveiller/smart-exam-system)](https://www.koyeb.com/deploy)
[![Deploy to Render](https://render.com/deploy?repo=https://github.com/liveiller/smart-exam-system)]

---

## 📋 目录

- [快速部署](#快速部署)
- [本地部署](#本地部署)
  - [环境要求](#环境要求)
  - [数据库配置](#数据库配置)
  - [后端部署](#后端部署)
  - [前端部署](#前端部署)
- [生产环境部署](#生产环境部署)
  - [Docker 部署](#docker-部署)
  - [PM2 部署](#pm2-部署)
  - [Nginx 反向代理](#nginx-反向代理)
- [平台一键部署](#平台一键部署)
  - [Vercel](#vercel)
  - [Railway](#railway)
  - [Render](#render)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)
- [技术支持](#技术支持)

---

## 🚀 快速部署

### 使用 Docker Compose（推荐）

```bash
# 克隆项目
git clone https://github.com/liveiller/smart-exam-system.git
cd smart-exam-system

# 启动所有服务
docker-compose up -d
```

访问 `http://localhost:80` 即可使用系统！

---

## 🏠 本地部署

### 环境要求

- **Node.js**: >= 16.0.0
- **MySQL**: >= 8.0.0
- **npm**: >= 8.0.0

### 数据库配置

```bash
# 1. 创建数据库
mysql -u root -p -e "CREATE DATABASE smart_exam DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 导入数据库结构
mysql -u root -p smart_exam < backend/database/init.sql

# 3. （可选）导入示例题库
mysql -u root -p smart_exam < backend/database/sample_questions.sql
```

### 后端部署

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改数据库连接信息等
nano .env

# 启动服务
npm run dev
```

### 前端部署

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 配置 API 地址（可选）
echo "VITE_API_BASE_URL=http://localhost:3001/api" > .env.local

# 启动服务
npm run dev
```

---

## ☁️ 生产环境部署

### Docker 部署

1. **创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  # MySQL 数据库
  mysql:
    image: mysql:8.0
    container_name: smart-exam-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: your_password
      MYSQL_DATABASE: smart_exam
      MYSQL_USER: exam_user
      MYSQL_PASSWORD: exam_pass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/database/init.sql:/docker-entrypoint-initdb.d/init.sql

  # 后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: smart-exam-backend
    restart: always
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: smart_exam
      DB_USER: exam_user
      DB_PASSWORD: exam_pass
      JWT_SECRET: your_super_secret_jwt_key
      CORS_ORIGIN: https://your-domain.com
    ports:
      - "3001:3001"
    depends_on:
      - mysql

  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: smart-exam-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

2. **创建 Dockerfile**

**backend/Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

**frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

3. **启动服务**
```bash
docker-compose up -d
```

### PM2 部署

1. **安装 PM2**
```bash
npm install -g pm2
```

2. **创建 ecosystem.config.js**
```javascript
module.exports = {
  apps: [
    {
      name: 'smart-exam-backend',
      script: 'src/app.js',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
}
```

3. **启动服务**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🚀 平台一键部署

### Vercel（前端）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/liveiller/smart-exam-system)

1. Fork 本项目到你的 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量：
   ```
   VITE_API_BASE_URL=https://your-backend-domain.com/api
   ```
4. 部署

**注意**: Vercel 只能部署前端，后端需要单独部署。

### Railway

[![Deploy on Railway](https://railway.app/button)](https://railway.app/template/smart-exam-system)

1. 连接 GitHub 仓库
2. Railway 会自动检测并部署前后端
3. 配置环境变量

### Render

[![Deploy on Render](https://render.com/deploy)](https://render.com/deploy?repo=https://github.com/liveiller/smart-exam-system)

1. 创建新 Web Service
2. 连接 GitHub 仓库
3. 配置运行时：
   - **Backend**: Node.js, `npm start`
   - **Frontend**: Static Site, `npm run build`
4. 配置环境变量

---

## ⚙️ 环境变量配置

### 后端环境变量 (.env)

```env
# 服务器配置
PORT=3001
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_exam
DB_USER=root
DB_PASSWORD=your_password

# JWT 配置
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# CORS 配置
CORS_ORIGIN=https://your-frontend-domain.com
```

### 前端环境变量 (.env.production)

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

---

## ❓ 常见问题

### Q: 如何修改默认端口？
A: 修改 `.env` 文件中的 `PORT` 配置，同时更新 Nginx 配置。

### Q: 数据库连接失败怎么办？
A: 检查以下几点：
1. MySQL 服务是否运行
2. 数据库用户名密码是否正确
3. 数据库主机地址是否正确
4. 防火墙是否开放了 3306 端口

### Q: 如何更新数据库结构？
A: 使用数据库迁移工具或在 `init.sql` 中添加新的 SQL 语句，然后重新导入。

### Q: 前端页面空白或 404？
A: 检查 Nginx 配置，确保 `try_files` 配置正确，支持前端路由。

### Q: 如何启用 HTTPS？
A: 可以使用 Let's Encrypt 免费证书，配置 Nginx 如下：
```nginx
listen 443 ssl;
ssl_certificate /path/to/cert.pem;
ssl_certificate_key /path/to/key.pem;

# 从 HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

---

## 📞 技术支持

- 📧 **Email**: your.email@example.com
- 💬 **GitHub Issues**: [提交问题](https://github.com/liveiller/smart-exam-system/issues)
- 💬 **QQ群**: 123456789
- 📖 **文档**: [查看完整文档](https://github.com/liveiller/smart-exam-system/docs)

---

## 🎯 Star History

如果这个项目对你有帮助，请给我们一个 Star ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=liveiller/smart-exam-system&type=Date)](https://star-history.com/#liveiller/smart-exam-system&Date)

---

<div align="center">

**Made with ❤️ by Smart Exam System Team**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/liveiller/smart-exam-system.svg)](https://github.com/liveiller/smart-exam-system/issues)
[![GitHub forks](https://img.shields.io/github/forks/liveiller/smart-exam-system.svg)](https://github.com/liveiller/smart-exam-system/network)
[![GitHub stars](https.shields.github.io/github/stars/liveiller/smart-exam-system.svg)](https://github.com/liveiller/smart-exam-system/stargazers)

</div>