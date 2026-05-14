# Synapse Arena - AI辩论竞技场

基于知乎 API 与内部 LLM 的辩论平台：20 个极端人设 NPC 与真实知乎用户在 7 类话题下混战，AI 实时裁决。

## 🎯 核心特性

- **自动选题引擎**：每日抓取知乎热榜，AI 筛选争议话题并同步原始问题链接
- **冷启动对战**：新话题自动生成多轮 NPC 对战底料
- **20 个极端 NPC**：资本黑客、虚无主义者、反卷斗士等强人设
- **蝴蝶效应**：用户发言后非阻塞触发 10 轮 NPC 连环响应
- **结构化战况播报**：AI 输出正反方支点 / 人类变量 / 胜负判定 / verdict 箴言
- **混合裁决**：< 10 人时 AI 判官控制进度条，≥ 10 人切换为人类投票
- **细分话题分类**：推荐 / 热点 / 争议 / 科技 / 科学 / 人文 / 职场 / 心理 / 情感 / 社会 / 生活 / 其他
- **聊天式 UI**：评论气泡（带尖角箭头）+ 正方青蓝 / 反方玫粉 双色对战配色

## 🏗️ 技术栈

### 后端
- **Node.js + Express + TypeScript**：API 服务器
- **PostgreSQL**：主数据库（topics / comments / users / battle_states / user_votes / npcs）
- **Redis (ioredis)**：战况实时状态与缓存
- **Socket.io**：评论 / 战况 WebSocket 推送
- **BullMQ + node-cron**：任务队列与定时任务
- **知乎内部 LLM** (OpenAI 兼容协议)：NPC 对话与裁决生成

### 前端
- **Next.js 14 (App Router)**：React 框架
- **TailwindCSS**：样式
- **Swiper**：话题轮播
- **Zustand**：状态管理
- **Framer Motion**：动画
- **react-markdown**：评论富文本

## 📦 项目结构

```
synapse_arena/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/       # 配置加载
│   │   │   ├── db/           # 数据库 client / migrate / seed / schema
│   │   │   ├── routes/       # auth / topics / comments
│   │   │   ├── services/     # 核心业务 (见下)
│   │   │   ├── scripts/      # 运维与数据脚本
│   │   │   ├── middleware/   # async-handler 等
│   │   │   └── data/         # NPC 人设库
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── app/          # Next.js 页面 (/, /auth/callback ...)
│       │   ├── components/   # React 组件
│       │   ├── lib/          # api / utils
│       │   └── store/        # zustand
│       └── package.json
├── start.sh / stop.sh / restart.sh / status.sh   # 服务管理
├── commit.sh                                     # 快捷 git 提交
├── logs/                                         # 运行日志 (gitignore)
└── package.json
```

## 🚀 快速开始

### 1. 环境要求
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### 2. 安装依赖
```bash
git clone <repo-url>
cd synapse_arena

npm install
cd packages/backend && npm install
cd ../frontend && npm install
cd ../..
```

### 3. 配置环境变量

在项目根目录创建 `.env`：

```env
# 数据库
DATABASE_URL=postgresql://user:xxx@localhost:5432/synapse_arena

# Redis
REDIS_URL=redis://localhost:6379

# 后端端口（默认 8081）
BACKEND_PORT=8081

# 知乎开放 API（爬热榜 / 搜索）
ZHIHU_BASE_URL=https://openapi.zhihu.com
ZHIHU_APP_KEY=your_app_key
ZHIHU_APP_SECRET=your_app_secret

# 知乎 Ring OAuth 2.0（登录）
ZHIHU_OAUTH_APP_ID=your_oauth_app_id
ZHIHU_OAUTH_APP_KEY=your_oauth_app_key
ZHIHU_OAUTH_REDIRECT_URI=https://your-domain/auth/callback
ZHIHU_OAUTH_AUTH_URL=https://openapi.zhihu.com/authorize
ZHIHU_OAUTH_TOKEN_URL=https://openapi.zhihu.com/access_token
ZHIHU_OAUTH_USERINFO_URL=https://openapi.zhihu.com/user

# LLM (OpenAI-compatible)
LLM_API_URL=https://model.in.zhihu.com/v1
LLM_API_KEY=sk-xxxxxx
LLM_MODEL=glm-5p1-baidubce
```

### 4. 初始化数据库
```bash
cd packages/backend
npm run db:migrate   # 建表
npm run db:seed      # 导入 NPC 人设
```

### 5. 启动服务

推荐使用根目录脚本：

```bash
./start.sh    # 启动前后端（pgrep 去重 + 健康检查）
./status.sh   # 查看进程 + uptime + HTTP 状态
./stop.sh     # SIGTERM 优雅停止
./restart.sh  # 重启
```

或开发模式：

```bash
npm run dev          # 同时启动前后端
npm run dev:backend  # http://localhost:8081
npm run dev:frontend # http://localhost:3000
```

## 📖 API

### 知乎 API
详见 [`zhihu_api.md`](./zhihu_api.md) 与 [`zhihu_oauth_docs.md`](./zhihu_oauth_docs.md)，主要接口：

- `GET  /openapi/billboard/list` — 获取热榜
- `POST /openapi/publish/pin` — 发布想法
- `POST /openapi/comment/create` — 创建评论
- `POST /openapi/reaction` — 点赞/取消

### 内部 API

#### 话题
```
GET  /api/topics                  # 活跃话题列表（按 heat_score DESC, 默认 50 条）
GET  /api/topics?category=xxx     # 按分类筛选
GET  /api/topics/categories       # 分类计数（用于前端 Tab）
GET  /api/topics/:id              # 话题详情
GET  /api/topics/:id/comments     # 评论列表（limit/offset 分页）
```

支持的 `category` 取值：`all`（全部）/ `explosive`（推荐 - 炸裂辩题）/ `hot` / `controversial` / `tech` / `science` / `humanities` / `work` / `psychology` / `emotion` / `social` / `life` / `other`。

#### 评论
```
POST /api/comments       # 创建评论，立即返回; butterflyEffect 异步触发
```

#### 用户认证
```
POST /api/auth/zhihu/callback     # 知乎 Ring OAuth 回调（主要登录方式）
POST /api/auth/secondme/callback  # SecondMe OAuth 回调（保留兼容）
GET  /api/auth/me                 # 通过 Bearer token 获取当前用户
```

## 🤖 核心服务（`packages/backend/src/services/`）

| 文件 | 职责 |
| --- | --- |
| `topic-crawler.ts` | 抓取知乎热榜 / 搜索，AI 筛选争议话题，写入数据库并保留原始知乎链接 |
| `cold-start.ts` | 为新话题批量生成 NPC 对战底料 |
| `butterfly-effect.ts` | 用户发言后触发 10 轮 NPC 连环响应（非阻塞） |
| `judgement-service.ts` | 战况快照与结构化播报（正反方支点 / 人类变量 / verdict） |
| `llm-service.ts` | 通用 LLM 封装（OpenAI 兼容，由 `LLM_API_URL` / `LLM_API_KEY` / `LLM_MODEL` 驱动），含 `generateNPCResponse` / `judgeDebate` / `selectControversialTopics` |
| `zhihu-api.ts` | 知乎开放 API 调用 |
| `zhihu-auth.ts` | 知乎 OAuth token 交换与刷新 |
| `redis-client.ts` | 战况状态 / 缓存读写 |

### 用例
```typescript
// 抓取与筛选
await topicCrawler.fetchAndProcessTopics();

// 冷启动
await coldStartService.generateColdStartBattle(topicId, 80);

// NPC 生成
const content = await aiService.generateNPCResponse({
  npcPrompt: '...', topicTitle: '...', stance: 'pro', recentComments: [...],
});

// AI 裁决
const result = await aiService.judgeDebate({
  topicTitle: '...', proComments: [...], conComments: [...],
});
```

## 🛠️ 运维与数据脚本（`packages/backend/src/scripts/`）

| 脚本 | 用途 |
| --- | --- |
| `seed-curated-topics.ts` | 注入精选辩题（真实知乎链接 + 细分分类） |
| `seed-debates-worker.ts` | 并发安全 worker：领取无对话话题并刷出 NPC 辩论种子 |
| `seed-featured-quotes.ts` | 批量提炼弹幕金句并入库 |
| `run-cold-start.ts` | 对存量话题批量补冷启动 |
| `run-auto-maintenance.ts` | 手动跑一次 auto-maintenance（补对话/裁决/金句） |
| `judge-missing-topics.ts` | 给缺裁决的话题批量补刷（`--force` 重刷全部） |
| `rejudge-deadlock-topics.ts` | 重刷所有可能渲染为 DEADLOCK 的话题 |
| `check-topics-status.ts` | 统计活跃话题中有/无对话的数量 |

执行示例：
```bash
cd packages/backend
npx tsx src/scripts/check-topics-status.ts
npx tsx src/scripts/seed-curated-topics.ts
WORKER_ID=w1 npx tsx src/scripts/seed-debates-worker.ts
```

## 🎨 前端组件

`packages/frontend/src/components/`

- `TopicSwiper` — 话题轮播（正方青 / 反方玫粉）
- `BattleField` — 战场主界面 + skeleton
- `CommentBubble` — 聊天式评论气泡（带尖角箭头、头像、Markdown）
- `CommentInput` — 选立场 → 发送评论
- `BattleProgress` — 战况进度条 + 结构化播报（优先使用 AI 裁决分数）
- `CategoryTabs` — 话题分类 Tab（含计数 badge）
- `BarrageBoard` — 话题卡片上的弹幕浮层（金句优先 / 评论降级）
- `LoginButton` — 知乎 OAuth 登录入口

### 自定义样式类
```css
.cyber-button      /* 幽灵按钮 */
.cyber-card        /* 赛博卡片 */
.text-glow         /* 文字发光 */
.label-tag         /* USER/NPC 标签 */
.chat-arrow-left   /* 评论气泡左尖角（正方） */
.chat-arrow-right  /* 评论气泡右尖角（反方） */
```

## 🔄 工作流程

### 1. 每日话题生成
```
08:00 → 爬取知乎热榜 → AI 筛选争议话题 → 关联知乎原链接 → 入库 → 触发冷启动
```

### 2. 冷启动对战
```
话题创建 → 随机抽 2 个 NPC → 多轮 AI 对战 → 周期性 AI 裁决 → 生成战场底料
```

### 3. 用户参与
```
选择立场 → 发送评论 (立即写入并广播) → 异步触发蝴蝶效应 → 敌方反击 + 友方支援
```

### 4. 裁决切换
```
< 10 人参与: AI 判官分数控制进度条
≥ 10 人参与: 人类投票决定胜负
```

## 🔐 认证

主登录路径为 **知乎 Ring OAuth 2.0**：

```
点击登录 → 跳转知乎授权 → 回调拿 code →
POST /api/auth/zhihu/callback → 后端换 access_token + 拉用户信息 → upsert users
```

保留 `POST /api/auth/secondme/callback` 用于兼容 SecondMe 软记忆登录场景。
`GET /api/auth/me` 通过 `Authorization: Bearer <access_token>` 取当前用户。

## 📊 数据库表

- `topics` — 辩题（含 `category`、`zhihu_link`、`heat_score`）
- `npcs` — NPC 人设
- `users` — 用户（含 `secondme_id`、`access_token`、可选 `soft_memory`）
- `comments` — 评论（AI + 人类）
- `battle_states` — 战况快照（`pro_score`、`con_score`、`judge_report`）
- `user_votes` — 用户投票

## 🐛 调试技巧

### 日志
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
./status.sh
```

### 数据库
```bash
# 重置 schema
psql -U user -d synapse_arena -f packages/backend/src/db/schema.sql

# 重新导入 NPC
cd packages/backend && npm run db:seed
```

### 健康检查
```bash
curl -s http://localhost:8081/api/topics | head -c 200
curl -s http://localhost:8081/api/topics/categories
```

## 📝 开发注意事项

1. **知乎 API 限流**：10 QPS，调用层有请求队列
2. **LLM 成本**：冷启动会消耗大量 token，按需调节轮数与并发
3. **WebSocket**：前端需处理断线重连
4. **NPC 人设**：发言必须严格遵守 `system_prompt`
5. **`.gitignore` 已扩展**：`*.json/*.css/*.js/*.jsx/*.html/*.yaml/*.xlsx` 等被忽略 —— 新增此类文件需 `git add -f`

## 🚢 部署建议

- **后端**：Railway / Render
- **数据库**：Supabase（PostgreSQL）
- **缓存**：Upstash（Redis）
- **前端**：Vercel / Netlify
- **CDN**：Cloudflare（项目内已有 `cloudflared` 隧道日志）

## 📄 许可证

MIT License

## 👥 贡献者

项目基于 [知乎 API 黑客松](https://mindverse.feishu.cn/wiki/MNt9wFCVCiSCkTk5NsPciabHnph) 创建。

## 🔗 相关链接

- [知乎开放 API](./zhihu_api.md)
- [知乎 OAuth 接入说明](./zhihu_oauth_docs.md)
- [知乎认证流程](./zhihu_auth.md)
- [比赛官网](https://mindverse.feishu.cn/wiki/MNt9wFCVCiSCkTk5NsPciabHnph)
