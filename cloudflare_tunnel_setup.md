# ai-agent-everything.icu 域名绑定记录

## 一、操作步骤总览

### 1. 创建 hello world 页面

- 创建了一个最小 HTML 验证页面，内容：`<h1>hello world</h1>`
- 文件位于：`/data1/suwenyuan/synapse_arena/hello_world.html`

### 2. 启动本地 HTTP 服务

```bash
python3 -m http.server 3000 --directory /data1/suwenyuan/synapse_arena
```

- 监听端口：`3000`
- 服务目录：`/data1/suwenyuan/synapse_arena`（最终用于 Cloudflare Tunnel）
- 注意：若需要访问 `/hello_world.html`，应将该文件放在当前服务目录下或其子目录

### 3. 安装 cloudflared

```bash
curl -L -o /tmp/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x /tmp/cloudflared
sudo install -m 755 /tmp/cloudflared /usr/local/bin/cloudflared
```

- 安装路径：`/usr/local/bin/cloudflared`（系统命令）
- 版本：`2026.3.0`

### 5. Cloudflare 账号配置（手动操作）

- 注册 Cloudflare 账号：`Suwenyuan2014@gmail.com`
- 在 Cloudflare 添加域名 `ai-agent-everything.icu`，选择 Free 计划
- 在腾讯云域名管理中将 NS 服务器从 DNSPod 改为 Cloudflare：
  - `emerie.ns.cloudflare.com`
  - `justin.ns.cloudflare.com`

### 6. cloudflared 登录认证

```bash
cloudflared tunnel login
```

- 通过浏览器打开授权链接，选择 `ai-agent-everything.icu` 授权
- 认证证书保存在：`/home/lijunyi/.cloudflared/cert.pem`

### 7. 创建固定隧道

```bash
cloudflared tunnel create hello-world
```

- 隧道名称：`hello-world`
- 隧道 ID：`7686ff06-f557-4719-af6c-5bf9f89a2cd1`
- 凭证文件：`/home/lijunyi/.cloudflared/7686ff06-f557-4719-af6c-5bf9f89a2cd1.json`

### 8. 配置 DNS 路由

```bash
cloudflared tunnel route dns hello-world ai-agent-everything.icu
```

- 自动在 Cloudflare DNS 添加了 CNAME 记录：`ai-agent-everything.icu → 隧道`

### 9. 编写隧道配置文件

配置文件路径：`/home/lijunyi/.cloudflared/config.yml`

```yaml
tunnel: 7686ff06-f557-4719-af6c-5bf9f89a2cd1
credentials-file: /home/lijunyi/.cloudflared/7686ff06-f557-4719-af6c-5bf9f89a2cd1.json

ingress:
  - hostname: ai-agent-everything.icu
    service: http://localhost:3000
  - service: http_status:404
```


## 三、关键文件清单

| 文件 | 路径 | 说明 |
|------|------|------|
| 网页文件 | `/data1/suwenyuan/synapse_arena/hello_world.html` | hello world 页面 |
| cloudflared 二进制 | `/usr/local/bin/cloudflared` | 隧道客户端（系统命令） |
| 认证证书 | `/home/lijunyi/.cloudflared/cert.pem` | Cloudflare 账号认证凭据 |
| 隧道凭证 | `/home/lijunyi/.cloudflared/7686ff06-f557-4719-af6c-5bf9f89a2cd1.json` | 隧道身份凭据 |
| 隧道配置 | `/home/lijunyi/.cloudflared/config.yml` | 路由配置 |


## 五、风险与注意事项

1. **项目目录可能被整体暴露到公网**  
   命令 `python3 -m http.server 3000 --directory /data1/suwenyuan/synapse_arena` 会将该目录下**所有文件**（包括代码、配置、文档）暴露为可下载。任何人访问 `https://ai-agent-everything.icu/` 都可能浏览目录列表并下载文件（包括潜在敏感文件）。  
   **建议**：将服务目录改为一个只包含公开静态文件的独立目录，或改用 Nginx/Node 仅暴露指定路由。

2. **凭证文件安全**  
   - `cert.pem` 是 Cloudflare 账号级凭据，拥有它可以管理你账号下所有隧道
   - `7686ff06-...json` 是隧道凭据，拥有它可以接管这个隧道
   - 这些文件不应提交到 Git 或分享给他人

5. **进程无守护，重启即丢失**  
   Python HTTP 服务和 cloudflared 都是前台进程，机器重启后不会自动恢复。  
   **建议**：配置 systemd service 实现开机自启：
   ```bash
   # 安装为 systemd 服务
   sudo cloudflared service install
   ```

### 🟢 低风险

7. **DNS 传播延迟**  
   部分地区（尤其是公司内网 DNS）可能需要数小时才能解析到 Cloudflare，期间访问会超时。

8. **免费计划限制**  
   Cloudflare Free 计划的 Tunnel 无带宽限制，但不提供 SLA 保障。对于 hello world 演示足够。


## 七、两种链接方式（针对本项目）

当前项目常见端口：
- 前端（Next dev）：`http://localhost:3000`
- 后端（API）：`http://localhost:8081`

### 方式 A：DNS 直连公网 IP（DNSPod）

**原理**：域名直接解析到服务器公网 IP，用户直接访问你的机器。  
**典型配置**：

1. 在 DNSPod 配置解析：
   - `A  @  -> <服务器公网IPv4>`
   - （可选）`A  www -> <服务器公网IPv4>`
2. 服务器开放 `80/443` 端口（云安全组 + 本机防火墙）
3. 用 Nginx/Caddy 反向代理到本地服务：
   - `/` -> `localhost:3000`
   - `/api` -> `localhost:8081`
4. 配置 HTTPS 证书（Let's Encrypt）

**优点**：
- 路径短，架构直观，性能开销小
- 不依赖第三方隧道进程

**风险/代价**：
- 机器真实公网入口暴露（需要自己扛扫描与攻击）
- 对网络、运维能力要求更高（防火墙、证书、限流）
- 运营商/网络环境可能限制入站端口

### 方式 B：Cloudflare Tunnel（当前文档方案）

**原理**：本机 `cloudflared` 主动连 Cloudflare，域名流量经 Cloudflare 回源到本地端口。  
**典型配置（本项目可拆分子域）**：

- `app.ai-agent-everything.icu` -> `http://localhost:3000`
- `api.ai-agent-everything.icu` -> `http://localhost:8081`

**优点**：
- 通常不需要开放服务器入站 `80/443`
- 可隐藏源站公网 IP，接入更快
- 适合开发测试、临时演示、轻运维场景

**风险/代价**：
- 依赖 `cloudflared` 进程和 Cloudflare 服务可用性
- 配置不当仍可能暴露本地目录/调试服务
- 需妥善保护 `cert.pem` 与 tunnel 凭据文件

### 选型建议（本项目）

1. **开发/演示优先**：用方式 B（Tunnel），但只暴露必要路由，不要直接暴露整个目录。
2. **长期稳定对外服务**：优先方式 A（Nginx + HTTPS + 最小暴露面）或 Tunnel + Zero Trust 访问控制。
3. 无论哪种方式，都避免将 `.env`、日志、凭据目录置于可公网访问路径。
