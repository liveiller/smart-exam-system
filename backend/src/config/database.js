const mysql = require('mysql2/promise');
require('dotenv').config();

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_exam',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 测试数据库连接
pool.getConnection()
  .then(connection => {
    console.log('✅ 数据库连接成功');
    connection.release();
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:');
    console.error('   请检查以下项:');
    console.error('   1. MySQL 服务是否运行: systemctl status mysqld');
    console.error('   2. 数据库是否存在: CREATE DATABASE smart_exam');
    console.error('   3. 用户是否存在: CREATE USER smart_exam_user@localhost');
    console.error('   4. 密码是否正确: .env 文件中的 DB_PASSWORD');
    console.error('');
    console.error('   常见解决方案:');
    console.error('   sudo mysql -e "CREATE DATABASE smart_exam;"');
    console.error('   sudo mysql -e "CREATE USER smart_exam_user@localhost IDENTIFIED BY \'20050123aA@\';"');
    console.error('   sudo mysql -e "GRANT ALL PRIVILEGES ON smart_exam.* TO smart_exam_user@localhost;"');
  });

module.exports = pool;
