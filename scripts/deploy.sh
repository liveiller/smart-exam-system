#!/bin/bash

# 考研智能刷题系统 - 本地部署脚本
# 支持 macOS 和 Linux (WSL2)

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
print_info() {
    printf "%b[INFO]%b %s\n" "${BLUE}" "${NC}" "$1"
}

print_success() {
    printf "%b[SUCCESS]%b %s\n" "${GREEN}" "${NC}" "$1"
}

print_warning() {
    printf "%b[WARNING]%b %s\n" "${YELLOW}" "${NC}" "$1"
}

print_error() {
    printf "%b[ERROR]%b %s\n" "${RED}" "${NC}" "$1"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 检查系统
check_system() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        SYSTEM="macOS"
        print_info "检测到系统: macOS"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        SYSTEM="Linux"
        print_info "检测到系统: Linux"
    else
        print_error "不支持的系统: $OSTYPE"
        exit 1
    fi
}

# 检查依赖
check_dependencies() {
    print_info "检查运行环境..."

    check_command "node"
    check_command "npm"
    check_command "mysql"

    # 检查 Node.js 版本
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js 版本过低，需要 >= 16.0.0，当前版本: $(node -v)"
        exit 1
    fi

    print_success "依赖检查通过"
}

# 创建数据库
create_database() {
    print_info "准备创建数据库..."

    # 读取数据库密码
    echo -n "请输入 MySQL root 密码: "
    read -s DB_PASSWORD
    echo

    # 创建数据库
    mysql -u root -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS smart_exam DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

    if [ $? -eq 0 ]; then
        print_success "数据库创建成功"
    else
        print_error "数据库创建失败，请检查密码是否正确"
        exit 1
    fi
}

# 安装后端依赖
install_backend() {
    print_info "安装后端依赖..."

    cd backend

    # 检查是否存在 package-lock.json
    if [ ! -f "package-lock.json" ]; then
        print_warning "正在生成 package-lock.json..."
        npm install
    else
        npm install
    fi

    # 检查 .env 文件
    if [ ! -f ".env" ]; then
        cp .env.example .env
        print_info "已创建 .env 文件，请根据需要修改配置"
    fi

    cd ..
    print_success "后端依赖安装完成"
}

# 安装前端依赖
install_frontend() {
    print_info "安装前端依赖..."

    cd frontend

    # 检查是否存在 package-lock.json
    if [ ! -f "package-lock.json" ]; then
        print_warning "正在生成 package-lock.json..."
        npm install
    else
        npm install
    fi

    # 检查环境变量文件
    if [ ! -f ".env.local" ]; then
        echo "VITE_API_BASE_URL=http://localhost:3001/api" > .env.local
        print_info "已创建 .env.local 文件"
    fi

    cd ..
    print_success "前端依赖安装完成"
}

# 启动服务
start_services() {
    print_info "准备启动服务..."

    # 在新终端窗口中启动后端
    if [[ "$SYSTEM" == "macOS" ]]; then
        # macOS
        osascript <<EOF
        tell application "Terminal"
            do script "cd $(pwd)/backend && npm run dev"
        end tell
EOF
    else
        # Linux (使用 x-terminal-emulator 或 gnome-terminal)
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal -- bash -c "cd backend && npm run dev; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -e "cd backend && npm run dev" &
        else
            print_warning "无法自动打开新终端，请手动在另一个终端运行: cd backend && npm run dev"
        fi
    fi

    print_success "后端服务正在启动..."
    print_info "后端地址: http://localhost:3001"
    print_info "API 文档: http://localhost:3001/api-docs"

    # 等待后端启动
    sleep 5

    # 在新终端窗口中启动前端
    if [[ "$SYSTEM" == "macOS" ]]; then
        osascript <<EOF
        tell application "Terminal"
            do script "cd $(pwd)/frontend && npm run dev"
        end tell
EOF
    else
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal -- bash -c "cd frontend && npm run dev; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -e "cd frontend && npm run dev" &
        else
            print_warning "无法自动打开新终端，请手动在另一个终端运行: cd frontend && npm run dev"
        fi
    fi

    print_success "前端服务正在启动..."
    print_info "前端地址: http://localhost:3000"

    echo
    print_success "🎉 所有服务启动完成！"
    echo
    print_info "请在浏览器中打开 http://localhost:3000 访问系统"
    echo
    print_warning "提示："
    print_warning "1. 确保 MySQL 服务正在运行"
    print_warning "2. 如需停止服务，请在终端按 Ctrl+C"
    print_warning "3. 数据库信息已在 backend/.env 中配置"
}

# 主函数
main() {
    echo "======================================"
    echo "    考研智能刷题系统 - 本地部署脚本"
    echo "======================================"
    echo

    check_system
    check_dependencies
    create_database
    install_backend
    install_frontend
    start_services
}

# 运行主函数
main