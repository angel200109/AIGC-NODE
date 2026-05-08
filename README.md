# AIGC-NODE

基于 Koa.js 的 AI 智能助手后端服务，集成阿里云 Qwen 大模型，支持流式对话、函数调用（Function Calling）和断线重连机制。

## 功能特性

- 🤖 **大模型集成**：集成阿里云 DashScope Qwen 3.5 Plus 模型
- 🌊 **流式输出**：支持 Server-Sent Events (SSE) 流式响应
- 🔧 **函数调用**：实现完整的 Function Calling 机制，支持天气查询、火车票查询等工具
- 🔄 **断线重连**：基于会话状态保持的断点续传机制
- 📊 **会话管理**：内存缓存会话数据，支持多订阅者模式
- 🛒 **商品管理**：商品查询、详情展示等电商功能
- 📁 **文件上传**：支持图片上传功能

## 技术栈

- **框架**：Koa.js (ES Module)
- **数据库**：MongoDB + Mongoose
- **AI 模型**：阿里云 DashScope (Qwen 3.5 Plus)
- **第三方 API**：阿里云市场（天气查询、火车票查询）
- **日志**：log4js

## 目录结构

```
AIGC-NODE/
├── controller/           # 控制器
│   ├── chatController.js         # 聊天控制器（旧版）
│   ├── chatStreamController.js   # 流式聊天控制器（新版）
│   ├── goodsController.js        # 商品控制器
│   └── userController.js         # 用户控制器
├── routes/              # 路由定义
│   └── index.js
├── model/               # 数据模型
│   └── goods.js
├── config/              # 配置文件
│   ├── database.js      # 数据库配置
│   ├── default.js       # 默认配置（系统提示词）
│   ├── errorHandler.js  # 错误处理
│   ├── responseHandler.js # 响应处理
│   ├── tools.js         # Function Calling 工具定义
│   ├── uploadFile.js    # 文件上传配置
│   └── logger.js        # 日志配置
├── utils/               # 工具函数
│   ├── streamSessionManager.js  # 流式会话管理器
│   └── validate.js      # 数据验证
├── app.js               # 应用入口
├── package.json
└── .env                 # 环境变量配置
```

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- MongoDB >= 4.0
- npm 或 yarn

### 安装依赖

```bash
cd AIGC-NODE
npm install
```

### 环境配置

在项目根目录创建 `.env` 文件，配置以下环境变量：

```env
# 阿里云 DashScope API Key
API_KEY=your_dashscope_api_key_here

# 阿里云市场 AppCode（用于天气、火车票查询）
ALIYUN_MARKET_APPCODE=your_aliyun_market_appcode_here

# 服务端口（可选，默认：3001）
```

**获取 API Key**：
- DashScope API Key：[阿里云百炼平台](https://bailian.console.aliyun.com/)
- 阿里云市场 AppCode：[阿里云市场控制台](https://market.console.aliyun.com/)

### 启动服务

```bash
# 开发模式（使用 nodemon，支持热重载）
npm run dev

# 生产模式
node app.js
```

服务启动后访问：http://localhost:3001

