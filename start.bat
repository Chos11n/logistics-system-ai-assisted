@echo off
chcp 65001 >nul
title 环亚物流管理系统
echo.
echo ========================================
echo    环亚物流内部货物管理系统
echo ========================================
echo.
echo 正在检查 Node.js...

:: 检查 Node.js 是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org
    pause
    exit /b 1
)

echo [✓] Node.js 已安装
echo.

:: 检查是否在项目目录
if not exist "package.json" (
    echo [错误] 未找到 package.json 文件
    echo 请确保在项目根目录下运行此脚本
    pause
    exit /b 1
)

echo [✓] 项目目录检查通过
echo.

:: 检查依赖是否安装
if not exist "node_modules" (
    echo [提示] 未找到 node_modules 目录，正在安装依赖...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [✓] 依赖安装完成
    echo.
)

echo [✓] 依赖检查通过
echo.

:: 检查端口是否被占用
echo 正在检查端口占用情况...
netstat -an | findstr ":3001" >nul
if %errorlevel% equ 0 (
    echo [警告] 端口 3001 已被占用，可能影响后端服务
)

netstat -an | findstr ":5173" >nul
if %errorlevel% equ 0 (
    echo [警告] 端口 5173 已被占用，可能影响前端服务
)

echo.
echo 正在启动开发服务器...
echo.
echo [提示] 前端服务: http://localhost:5173
echo [提示] 后端服务: http://localhost:3001
echo [提示] 按 Ctrl+C 停止服务器
echo.
echo ========================================
echo.

:: 启动开发服务器
npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [错误] 服务器启动失败
    echo.
    echo 可能的解决方案:
    echo 1. 检查端口是否被占用
    echo 2. 重新安装依赖: npm install
    echo 3. 清除缓存: npm run build
    echo.
    pause
    exit /b 1
)

echo.
echo 服务器已停止
pause