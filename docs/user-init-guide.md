# 用户数据初始化指南

## 功能说明

1. **用户数据初始化**：将所有用户的做题记录（练习记录、复习记录、错题本、连续复习记录）初始化为默认值
2. **注册功能**：添加了完整的用户注册功能，每个用户的数据完全独立

## 数据库脚本

### 1. 检查用户数据状态

```bash
# 在 MySQL 命令行中执行
mysql -u root -p smart_exam < backend/database/check_user_data.sql
```

这将显示所有用户及其当前的数据状态。

### 2. 初始化用户数据为0

```bash
# 在 MySQL 命令行中执行
mysql -u root -p smart_exam < backend/database/init_user_data.sql
```

这将把：
- 所有练习记录的数量、正确数、准确率、耗时重置为0
- 所有复习记录的正确数、复习次数重置为0
- 所有错题本的项目重置为默认状态
- 所有连续复习记录的天数重置为1

### 3. 完整初始化（可选）

如果需要重置整个系统（包括用户数据）：

```bash
# 1. 删除所有用户数据（会级联删除用户相关的所有数据）
mysql -u root -p smart_exam -e "DELETE FROM users;"

# 2. 重新导入初始数据（仅学科、章节、知识点、题目，不包含用户）
mysql -u root -p smart_exam < backend/database/init.sql

# 3. 初始化用户数据为0（针对现有用户）
mysql -u root -p smart_exam < backend/database/init_user_data.sql
```

## 注册功能说明

### 前端页面

- **注册页面**：`frontend/src/views/register/index.vue`
- **路由**：`/register`

### 注册流程

1. 用户访问 `/register` 页面
2. 输入用户名（3-20字符，只能包含字母、数字、下划线）
3. 输入昵称（可选）
4. 输入密码（6-20字符）
5. 确认密码
6. 提交注册后自动跳转到登录页

### 注册限制

- 用户名必须唯一
- 用户名长度 3-20 个字符
- 密码长度 6-20 个字符
- 两次输入密码必须一致

### 用户隔离机制

所有用户数据表都通过 `user_id` 外键关联到 `users` 表，确保：

- **练习记录**：每个用户只看到自己的练习记录
- **复习记录**：每个用户只看到自己的复习任务
- **错题本**：每个用户的错题本完全独立
- **连续复习记录**：每个用户的连续天数独立统计

## API 接口

### 注册接口

```
POST /api/auth/register

Request Body:
{
  "username": "test_user",
  "nickname": "测试用户",
  "password": "password123"
}

Response:
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "test_user",
      "nickname": "测试用户",
      ...
    },
    "token": "jwt_token_here"
  }
}
```

## 安全特性

1. **密码加密**：使用 bcrypt 加密存储
2. **JWT 认证**：登录后获取 Token
3. **输入验证**：前端和后端双重验证
4. **数据隔离**：所有操作通过 user_id 隔离

## 使用示例

```bash
# 1. 启动后端服务
cd backend
npm install
npm run dev

# 2. 启动前端服务（新终端）
cd frontend
npm install
npm run dev

# 3. 访问系统
# 注册页面：http://localhost:3000/register
# 登录页面：http://localhost:3000/login
```

## 注意事项

1. 执行初始化脚本前请先备份数据库
2. 用户数据初始化会保留所有用户账号
3. 每个用户的数据完全独立，互不影响
4. 注册后默认学习目标：每日50题，每周学习6天
