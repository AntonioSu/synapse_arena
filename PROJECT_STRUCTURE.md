# 📁 项目文件结构

```
synapse_arena/
├── packages/
│   ├── backend/                    # 后端服务
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── index.ts        # 配置管理
│   │   │   ├── db/
│   │   │   │   ├── client.ts       # 数据库客户端
│   │   │   │   ├── migrate.ts      # 迁移脚本
│   │   │   │   ├── seed.ts         # 数据导入
│   │   │   │   └── schema.sql      # 数据库Schema
│   │   │   ├── data/
│   │   │   │   └── npcs.ts         # 20个NPC人设库
│   │   │   ├── services/
│   │   │   │   ├── zhihu-auth.ts         # 知乎API鉴权
│   │   │   │   ├── zhihu-api.ts          # 知乎API封装
│   │   │   │   ├── openai-service.ts     # OpenAI服务
│   │   │   │   ├── redis-client.ts       # Redis客户端
│   │   │   │   ├── topic-crawler.ts      # 话题爬虫
│   │   │   │   ├── cold-start.ts         # 80轮冷启动
│   │   │   │   └── butterfly-effect.ts   # 蝴蝶效应引擎
│   │   │   ├── routes/
│   │   │   │   ├── topics.ts       # 话题路由
│   │   │   │   ├── comments.ts     # 评论路由
│   │   │   │   └── auth.ts         # 认证路由
│   │   │   └── index.ts            # 服务入口
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/                   # 前端应用
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx      # 根布局
│       │   │   ├── page.tsx        # 首页
│       │   │   ├── globals.css     # 全局样式
│       │   │   └── auth/
│       │   │       └── callback/
│       │   │           └── page.tsx    # OAuth回调
│       │   ├── components/
│       │   │   ├── TopicSwiper.tsx     # 话题轮播
│       │   │   ├── BattleField.tsx     # 战场主界面
│       │   │   ├── CommentBubble.tsx   # 评论气泡
│       │   │   ├── CommentInput.tsx    # 发言输入
│       │   │   ├── BattleProgress.tsx  # 战况进度条
│       │   │   ├── LoginButton.tsx     # 登录按钮
│       │   │   └── SystemStats.tsx     # 系统状态
│       │   ├── lib/
│       │   │   ├── api.ts          # API封装
│       │   │   ├── socket.ts       # WebSocket客户端
│       │   │   └── config.ts       # 前端配置
│       │   └── store/
│       │       └── useStore.ts     # Zustand状态管理
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       └── postcss.config.js
│
├── .env.example                    # 环境变量示例
├── .gitignore
├── package.json                    # 根package.json
├── README.md                       # 完整文档
├── QUICKSTART.md                   # 快速启动指南
├── DEPLOYMENT.md                   # 部署文档
├── PRD.md                          # 产品需求文档
└── zhihu_api.md                    # 知乎API文档
```

## 📊 关键指标

- **总文件数**: 40+
- **代码行数**: ~5000+ lines
- **NPC人设**: 20个
- **API端点**: 10+
- **前端组件**: 8个核心组件

## 🎯 核心功能实现状态

✅ 知乎API集成（热榜抓取、发布、评论）  
✅ 20个极端NPC人设库  
✅ AI话题筛选引擎  
✅ 80轮冷启动对战系统  
✅ 蝴蝶效应10轮响应机制  
✅ AI裁决 + 人类投票双模式  
✅ SecondMe OAuth集成（软记忆）  
✅ WebSocket实时推送  
✅ 赛博朋克UI风格  
✅ 分身代打功能  

## 🔧 技术特性

- **类型安全**: 全TypeScript
- **实时通信**: Socket.io
- **任务队列**: BullMQ
- **缓存**: Redis
- **数据库**: PostgreSQL
- **AI驱动**: OpenAI GPT-4
- **响应式**: Next.js 14 + React 18
- **样式**: TailwindCSS
- **状态管理**: Zustand
