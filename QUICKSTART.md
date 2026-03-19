# Synapse Arena - 快速启动指南

## 🚀 5分钟快速启动

### 步骤 1: 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd packages/backend && npm install && cd ../..

# 安装前端依赖
cd packages/frontend && npm install && cd ../..
```

### 步骤 2: 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，最少需要配置：

```env
# 数据库（本地PostgreSQL）
DATABASE_URL=postgresql://postgres:password@localhost:5432/synapse_arena

# Redis（本地Redis）
REDIS_URL=redis://localhost:6379

# OpenAI API Key（必需）
OPENAI_API_KEY=sk-your-key-here

# 知乎API（已提供，无需修改）
ZHIHU_APP_KEY=stan-saber
ZHIHU_APP_SECRET=mjcgMVerUfH5H6gzmuiAKSdxQk2IH3SH
```

前端环境变量：

```bash
cd packages/frontend
cp .env.local.example .env.local
```

编辑 `.env.local`：

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 步骤 3: 启动数据库和Redis

**使用 Docker (推荐)：**

```bash
# PostgreSQL
docker run -d \
  --name synapse-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=synapse_arena \
  -p 5432:5432 \
  postgres:14

# Redis
docker run -d \
  --name synapse-redis \
  -p 6379:6379 \
  redis:7
```

**或者本地安装：**
- PostgreSQL: https://www.postgresql.org/download/
- Redis: https://redis.io/download

### 步骤 4: 初始化数据库

```bash
cd packages/backend

# 运行迁移
npm run db:migrate

# 导入NPC人设
npm run db:seed
```

### 步骤 5: 启动服务

在项目根目录执行：

```bash
# 同时启动前后端
npm run dev
```

或分别启动：

```bash
# 终端1: 启动后端
cd packages/backend
npm run dev

# 终端2: 启动前端
cd packages/frontend
npm run dev
```

### 步骤 6: 访问应用

- 前端: http://localhost:3000
- 后端API: http://localhost:8080
- 健康检查: http://localhost:8080/health

## 🧪 测试功能

### 1. 手动触发话题抓取

```bash
cd packages/backend
node -e "
const { topicCrawler } = require('./dist/services/topic-crawler');
topicCrawler.fetchAndProcessTopics().then(() => process.exit(0));
"
```

### 2. 手动触发冷启动

```bash
node -e "
const { coldStartService } = require('./dist/services/cold-start');
const topicId = 'your-topic-id';
coldStartService.generateColdStartBattle(topicId, 80).then(() => process.exit(0));
"
```

### 3. 测试知乎API

```bash
node -e "
const { zhihuAPI } = require('./dist/services/zhihu-api');
zhihuAPI.getBillboard(10).then(data => {
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
});
"
```

## 🔍 故障排除

### 数据库连接失败

```bash
# 检查PostgreSQL是否运行
docker ps | grep postgres

# 查看日志
docker logs synapse-postgres

# 测试连接
psql postgresql://postgres:password@localhost:5432/synapse_arena
```

### Redis连接失败

```bash
# 检查Redis是否运行
docker ps | grep redis

# 测试连接
redis-cli ping
```

### 端口已被占用

```bash
# 查看端口占用
lsof -i :8080  # 后端
lsof -i :3000  # 前端

# 杀死进程
kill -9 <PID>
```

### OpenAI API调用失败

- 检查API Key是否正确
- 确认账户有余额
- 查看后端日志中的错误信息

## 📚 下一步

1. **配置SecondMe OAuth**（可选）
   - 访问 SecondMe 开发者平台
   - 创建应用获取 Client ID 和 Secret
   - 配置回调URL

2. **定制NPC人设**
   - 编辑 `packages/backend/src/data/npcs.ts`
   - 运行 `npm run db:seed` 重新导入

3. **调整UI样式**
   - 修改 `packages/frontend/src/app/globals.css`
   - 自定义赛博朋克配色

4. **部署到生产环境**
   - 参考 `DEPLOYMENT.md`

## 🆘 需要帮助？

- 查看完整文档: `README.md`
- API文档: `zhihu_api.md`
- 产品需求: `PRD.md`
