# 环亚物流内部货物管理系统

基于 Vite + React + TypeScript + TailwindCSS 构建的现代化物流管理平台，支持跨平台本地运行。

## 🚀 快速启动

### 方法一：一键启动（推荐）

#### Windows 用户
1. 双击 `start.bat` 文件
2. 脚本会自动检查环境并启动服务
3. 浏览器访问 http://localhost:5173

#### macOS/Linux 用户
1. 双击 `start.command` 文件（或在终端中运行）
2. 如果提示权限问题，运行：`chmod +x start.command`
3. 浏览器访问 http://localhost:5173

### 方法二：手动启动

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（同时启动前端和后端）
npm run dev

# 或者分别启动
npm run dev:frontend  # 前端服务 (端口 5173)
npm run dev:backend   # 后端服务 (端口 3001)
```

## 📋 系统要求

- **Node.js**: 16.0+ (推荐 LTS 版本)
- **npm**: 7.0+
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+

验证安装：
```bash
node --version
npm --version
```

## 🔧 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   netstat -ano | findstr :5173  # Windows
   lsof -i :5173                 # macOS/Linux
   
   # 杀死占用进程
   taskkill /PID <PID> /F        # Windows
   kill -9 <PID>                 # macOS/Linux
   ```

2. **依赖安装失败**
   ```bash
   # 清除缓存重新安装
   npm run clean
   
   # 或手动清理
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **权限问题（macOS/Linux）**
   ```bash
   chmod +x start.command
   ```

4. **数据库问题**
   - 数据库文件位置：`server/database.sqlite`
   - 如果数据库损坏，删除该文件重新启动即可自动重建

### 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产版本
npm run lint         # 代码检查
npm run check        # 完整检查（lint + build）
```

## 🏗️ 项目结构

```
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   ├── pages/             # 页面组件
│   ├── context/           # React Context
│   ├── services/          # API 服务
│   ├── types/             # TypeScript 类型定义
│   └── App.tsx            # 主应用组件
├── server/                # 后端源码
│   ├── index.js           # Express 服务器
│   └── database.sqlite    # SQLite 数据库
├── public/                # 静态资源
├── start.bat              # Windows 启动脚本
├── start.command          # macOS/Linux 启动脚本
└── package.json           # 项目配置
```

## 🔐 默认账户

**管理员账户：**
- 用户名：`admin`
- 密码：`123`

## 🌟 主要功能

- ✅ 货物信息录入与管理
- ✅ 智能装车算法
- ✅ 仓库库存管理
- ✅ 客户分级管理
- ✅ 用户权限控制
- ✅ 数据导出功能
- ✅ 响应式设计

## 🛠️ 技术栈

- **前端**: React 18 + TypeScript + TailwindCSS
- **后端**: Node.js + Express + SQLite
- **构建工具**: Vite
- **开发工具**: ESLint + Prettier
- **图标**: Lucide React

## 📞 技术支持

如遇问题，请联系：
- 邮箱：1914666787@qq.com
- 项目地址：[GitHub Repository]

## 📄 许可证

© 2025 环亚物流有限公司 - 内部使用