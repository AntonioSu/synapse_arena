# 部署指南

## 前置要求

1. PostgreSQL 数据库
2. Redis 实例
3. OpenAI API Key
4. SecondMe OAuth 凭证

## 后端部署 (Railway)

### 1. 创建新项目

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 初始化项目
railway init
```

### 2. 配置环境变量

在 Railway 控制台设置以下环境变量：

```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
ZHIHU_APP_KEY=stan-saber
ZHIHU_APP_SECRET=mjcgMVerUfH5H6gzmuiAKSdxQk2IH3SH
SECONDME_CLIENT_ID=...
SECONDME_CLIENT_SECRET=...
OPENAI_API_KEY=...
BACKEND_PORT=8080
FRONTEND_URL=https://your-frontend.vercel.app
```

### 3. 部署

```bash
cd packages/backend
railway up
```

### 4. 初始化数据库

```bash
railway run npm run db:migrate
railway run npm run db:seed
```

## 前端部署 (Vercel)

### 1. 连接 Git 仓库

在 Vercel 控制台导入项目。

### 2. 配置构建设置

- **Framework Preset**: Next.js
- **Root Directory**: `packages/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 3. 环境变量

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_SECONDME_CLIENT_ID=...
NEXT_PUBLIC_SECONDME_REDIRECT_URI=https://your-domain.vercel.app/auth/callback
```

### 4. 部署

```bash
cd packages/frontend
vercel --prod
```

## 数据库 (Supabase)

### 1. 创建项目

在 [Supabase](https://supabase.com) 创建新项目。

### 2. 获取连接字符串

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

### 3. 运行迁移

使用 Supabase SQL Editor 执行 `packages/backend/src/db/schema.sql`。

## Redis (Upstash)

### 1. 创建数据库

在 [Upstash](https://upstash.com) 创建 Redis 数据库。

### 2. 获取连接字符串

```
REDIS_URL=rediss://default:[PASSWORD]@[HOST]:6379
```

## 健康检查

部署完成后，访问：

- 后端：`https://your-backend.railway.app/health`
- 前端：`https://your-domain.vercel.app`

## 故障排除

### 数据库连接失败

检查 `DATABASE_URL` 格式是否正确，确保包含 SSL 参数：
```
?sslmode=require
```

### Redis 连接超时

确保 Redis URL 使用 `rediss://` (带SSL)。

### OpenAI 调用失败

检查 API Key 是否有效，余额是否充足。

### SecondMe OAuth 失败

确认回调 URL 与配置一致。
