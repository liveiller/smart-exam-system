# 考研智能刷题系统 - 部署文档

本文档提供考研智能刷题系统的详细部署指南。

## 目录

- [系统要求](#系统要求)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [数据库配置](#数据库配置)
- [常见问题](#常见问题)
- [维护指南](#维护指南)

## 系统要求

### 硬件要求
- CPU: 2核及以上
- 内存: 4GB 及以上
- 磁盘: 20GB 及以上

### 软件要求
- Node.js: 16.x 或更高版本
- MySQL: 8.0 或更高版本
- Nginx: 1.18 或更高版本（生产环境）
- PM2: 4.5 或更高版本（生产环境进程管理）

## 开发环境部署

### 1. 克隆项目

```bash
git clone https://github.com/liveiller/smart-exam-system.git
cd smart-exam-system
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 数据库配置

#### 创建数据库

```bash
mysql -u root -p
```

```sql
CREATE DATABASE smart_exam DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### 导入数据

```bash
cd backend
mysql -u root -p smart_exam < database/init.sql
mysql -u root -p smart_exam < database/questions.sql
```

### 4. 配置环境变量

```bash
cd backend
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

### 5. 启动服务

#### 启动后端

```bash
cd backend
npm run dev
```

后端服务将在 `http://localhost:3001` 启动。

#### 启动前端

```bash
cd frontend
npm run dev
```

前端服务将在 `http://localhost:3000` 启动。

### 6. 访问系统

在浏览器中打开：`http://localhost:3000`

## 生产环境部署

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 MySQL
sudo apt install -y mysql-server

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2
sudo npm install -g pm2
```

### 2. 配置 MySQL

```bash
sudo mysql_secure_installation
```

创建数据库和用户：

```bash
sudo mysql -u root -p
```

```sql
CREATE USER 'smart_exam'@'localhost' IDENTIFIED BY 'your_secure_password';
CREATE DATABASE smart_exam DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON smart_exam.* TO 'smart_exam'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. 部署后端

```bash
# 上传代码到服务器
scp -r smart-exam-system user@your-server:/var/www/

# SSH 登录服务器
ssh user@your-server

# 进入项目目录
cd /var/www/smart-exam-system/backend

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
nano .env
```

编辑 `.env` 文件：

```env
PORT=3001
NODE_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_exam
DB_USER=smart_exam
DB_PASSWORD=your_secure_password

JWT_SECRET=your_production_jwt_secret_key_here_very_secure
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://your-domain.com
```

导入数据库：

```bash
mysql -u smart_exam -p smart_exam < database/init.sql
mysql -u smart_exam -p smart_exam < database/questions.sql
```

使用 PM2 启动后端：

```bash
pm2 start src/app.js --name smart-exam-backend
pm2 save
pm2 startup
```

### 4. 部署前端

```bash
cd /var/www/smart-exam-system/frontend

# 安装依赖
npm install

# 修改 API 地址
# 在 src/utils/request.js 中将 baseURL 改为生产环境地址
nano src/utils/request.js
```

修改 `baseURL`:

```javascript
const baseURL = process.env.NODE_ENV === 'production'
  ? 'https://your-domain.com/api'
  : 'http://localhost:3001/api'
```

构建前端：

```bash
npm run build
```

配置 Nginx：

```bash
sudo nano /etc/nginx/sites-available/smart-exam
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/smart-exam-system/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
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

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/smart-exam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. 配置 SSL（推荐）

使用 Let's Encrypt 免费证书：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 数据库配置

### 性能优化

在 MySQL 配置文件中添加以下内容：

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
query_cache_size = 64M
query_cache_type = 1
```

重启 MySQL：

```bash
sudo systemctl restart mysql
```

### 定期备份

创建备份脚本：

```bash
sudo nano /usr/local/bin/backup-mysql.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mysql"
mkdir -p $BACKUP_DIR

mysqldump -u smart_exam -p'your_password' smart_exam | gzip > $BACKUP_DIR/smart_exam_$DATE.sql.gz

# 删除30天前的备份
find $BACKUP_DIR -name "smart_exam_*.sql.gz" -mtime +30 -delete
```

设置定时任务：

```bash
sudo chmod +x /usr/local/bin/backup-mysql.sh
crontab -e
```

添加以下内容（每天凌晨2点备份）：

```
0 2 * * * /usr/local/bin/backup-mysql.sh
```

## 常见问题

### 1. 数据库连接失败

**问题**: 后端启动时显示"数据库连接失败"

**解决方案**:
- 检查 MySQL 是否运行: `sudo systemctl status mysql`
- 检查数据库用户名密码是否正确
- 检查防火墙设置: `sudo ufw allow 3306`

### 2. 前端无法访问后端 API

**问题**: 前端调用 API 时出现跨域错误

**解决方案**:
- 检查后端 CORS 配置
- 确保 Nginx 代理配置正确
- 检查防火墙设置

### 3. 内存不足

**问题**: 服务器内存使用率过高

**解决方案**:
- 增加 Swap 空间
- 优化 MySQL 配置
- 增加 PM2 实例限制: `pm2 restart smart-exam-backend --max-memory-restart 500M`

### 4. 页面刷新 404

**问题**: 前端页面刷新后显示 404

**解决方案**:
- 检查 Nginx 配置中的 `try_files` 指令
- 确保配置正确处理 Vue Router 的历史模式

## 维护指南

### 日志管理

#### PM2 日志

```bash
# 查看日志
pm2 logs smart-exam-backend

# 清空日志
pm2 flush

# 日志轮转配置
pm2 install pm2-logrotate
```

#### Nginx 日志

```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 监控

#### 系统资源监控

```bash
# CPU 使用率
htop

# 内存使用
free -h

# 磁盘使用
df -h
```

#### 应用监控

使用 PM2 监控：

```bash
# 查看应用状态
pm2 status

# 查看详细信息
pm2 show smart-exam-backend

# 重启应用
pm2 restart smart-exam-backend
```

### 更新部署

```bash
# 1. 备份数据库
/usr/local/bin/backup-mysql.sh

# 2. 拉取最新代码
cd /var/www/smart-exam-system
git pull

# 3. 更新后端依赖
cd backend
npm install --production

# 4. 重启后端
pm2 restart smart-exam-backend

# 5. 更新前端
cd ../frontend
npm install
npm run build

# 6. 重启 Nginx
sudo systemctl reload nginx
```

### 性能优化

#### 后端优化

1. 启用 Gzip 压缩
2. 配置连接池
3. 使用缓存（Redis）
4. 优化数据库查询

#### 前端优化

1. 启用代码分割
2. 优化图片资源
3. 使用 CDN 加速
4. 启用浏览器缓存

## 安全建议

1. 定期更新系统和依赖包
2. 使用强密码和 JWT 密钥
3. 配置防火墙规则
4. 启用 HTTPS
5. 定期备份数据
6. 限制数据库访问权限
7. 配置速率限制
8. 启用日志审计

## 联系支持

如有问题，请通过以下方式联系：

- GitHub Issues: [项目 Issues](https://github.com/liveiller/smart-exam-system/issues)
- Email: your.email@example.com
