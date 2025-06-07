#!/bin/zsh

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 清屏并显示标题
clear
echo "${BLUE}========================================"
echo "    环亚物流内部货物管理系统"
echo "========================================${NC}"
echo

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "当前目录: $(pwd)"
echo

# 检查 Node.js 是否安装
echo "正在检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "${RED}[错误] 未检测到 Node.js，请先安装 Node.js${NC}"
    echo "下载地址: https://nodejs.org"
    read -p "按回车键退出..."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "${GREEN}[✓] Node.js 已安装: $NODE_VERSION${NC}"
echo

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo "${RED}[错误] 未找到 package.json 文件${NC}"
    echo "请确保在项目根目录下运行此脚本"
    read -p "按回车键退出..."
    exit 1
fi

echo "${GREEN}[✓] 项目目录检查通过${NC}"
echo

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "${YELLOW}[提示] 未找到 node_modules 目录，正在安装依赖...${NC}"
    echo
    npm install
    if [ $? -ne 0 ]; then
        echo "${RED}[错误] 依赖安装失败${NC}"
        read -p "按回车键退出..."
        exit 1
    fi
    echo "${GREEN}[✓] 依赖安装完成${NC}"
    echo
fi

echo "${GREEN}[✓] 依赖检查通过${NC}"
echo

# 检查端口占用
echo "正在检查端口占用情况..."
if lsof -i :3001 &> /dev/null; then
    echo "${YELLOW}[警告] 端口 3001 已被占用，可能影响后端服务${NC}"
fi

if lsof -i :5173 &> /dev/null; then
    echo "${YELLOW}[警告] 端口 5173 已被占用，可能影响前端服务${NC}"
fi

echo
echo "正在启动开发服务器..."
echo
echo "${BLUE}[提示] 前端服务: http://localhost:5173${NC}"
echo "${BLUE}[提示] 后端服务: http://localhost:3001${NC}"
echo "${BLUE}[提示] 按 Ctrl+C 停止服务器${NC}"
echo
echo "${BLUE}========================================${NC}"
echo

# 启动开发服务器
npm run dev

if [ $? -ne 0 ]; then
    echo
    echo "${RED}[错误] 服务器启动失败${NC}"
    echo
    echo "可能的解决方案:"
    echo "1. 检查端口是否被占用"
    echo "2. 重新安装依赖: npm install"
    echo "3. 清除缓存: npm run build"
    echo
    read -p "按回车键退出..."
    exit 1
fi

echo
echo "服务器已停止"
read -p "按回车键退出..."