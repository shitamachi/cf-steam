# Steam Fetch API

一个功能完整的 Steam 游戏信息抓取和管理 API 服务，基于 Cloudflare Workers 构建。

## 🚀 主要功能

- **Steam 数据获取** - 从 Steam 官方 API 获取游戏信息
- **游戏数据管理** - 本地数据库存储和管理游戏信息
- **搜索与分类** - 支持游戏搜索和按类别筛选
- **批量操作** - 支持批量添加和更新游戏数据
- **完整的 API 文档** - 基于 OpenAPI 3.1 规范的交互式文档
- **结构化日志** - 完整的请求追踪和错误监控

## 📊 日志和监控

### 日志配置

项目已启用 Cloudflare Workers Logs，支持以下日志功能：

- **实时日志监控** - 通过 `wrangler tail` 查看实时日志
- **结构化日志** - JSON 格式的日志，便于过滤和分析
- **请求追踪** - 自动记录所有 API 请求和响应
- **错误监控** - 详细的错误日志和堆栈跟踪

### 查看日志

#### 1. 实时日志监控
```bash
# 查看所有日志
npx wrangler tail

# 过滤错误日志
npx wrangler tail --status error

# 过滤特定HTTP方法
npx wrangler tail --method POST

# 过滤特定路径
npx wrangler tail --search "/api/games"

# 显示更多详细信息
npx wrangler tail --format pretty
```

#### 2. 仪表板查看
1. 登录 [Cloudflare 仪表板](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 选择你的 Worker (steam)
4. 点击 **Logs** 标签
5. 选择 **Live** 查看实时日志

### 日志格式

应用使用结构化 JSON 日志格式，包含以下字段：

```json
{
  "level": "info|error|debug",
  "message": "描述信息",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "context": {
    "method": "GET",
    "path": "/api/games",
    "status": 200,
    "duration": "123ms",
    "userAgent": "...",
    "ip": "...",
    "syncId": "1704067200000"
  }
}
```

### 日志级别

- **info** - 一般信息日志（请求开始/完成、任务执行等）
- **error** - 错误日志（API 错误、验证失败等）
- **debug** - 调试日志（详细的执行过程）

### 成本说明

- **免费计划**：每天 200,000 条日志，保存 3 天
- **付费计划**：每月 2000 万条日志，超出部分 $0.60/百万条，保存 7 天

当前配置采样率为 100%（`head_sampling_rate: 1`），记录所有请求。如需降低成本，可以调整为 0.1（10%）或更低。

## 🚀 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境变量
在 `wrangler.jsonc` 中配置：

```jsonc
{
  "vars": {
    "NODE_ENV": "production",
    "STEAM_API_KEY": "your_steam_api_key",
    "LOG_LEVEL": "info",
    "API_BASE_URL": "https://your-domain.workers.dev"
  }
}
```

### 3. 本地开发
```bash
pnpm dev
```

### 4. 部署
```bash
pnpm deploy
```

## 🌐 域名配置

### 自动域名检测

系统会自动从每个请求的 URL 中获取当前域名，无需任何配置。这意味着：

- **开发环境**: 自动使用 `http://127.0.0.1:8787`
- **生产环境**: 自动使用实际的生产域名
- **多域名支持**: 支持多个自定义域名，无需额外配置

### OpenAPI 文档

访问任何域名下的以下端点：

- **交互式文档**: `/docs`
- **OpenAPI 规范**: `/openapi.json`
- **健康检查**: `/health`

OpenAPI 文档会自动显示当前访问域名作为服务器地址。

## 🛠️ 开发和部署

### 本地开发
```bash
# 启动开发服务器
pnpm dev

# 查看本地日志
npx wrangler dev --local-protocol https
```

### 部署
```bash
# 部署到 Cloudflare Workers
pnpm deploy

# 查看部署后的实时日志
npx wrangler tail
```

### 数据库管理
```bash
# 应用数据库迁移
npx wrangler d1 migrations apply steam_games --remote

# 查看数据库信息
npx wrangler d1 info steam_games
```

## 🔧 技术栈

- **运行时**: Cloudflare Workers
- **框架**: Hono + OpenAPI
- **数据库**: Cloudflare D1 + Drizzle ORM
- **API 文档**: Scalar + OpenAPI 3.1
- **工具链**: TypeScript + Wrangler

## 📝 环境变量

| 变量名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| `NODE_ENV` | string | 运行环境 | `development` |
| `STEAM_API_KEY` | string | Steam API 密钥 | - |
| `STEAM_RATE_LIMIT` | number | Steam API 请求限制 | `100` |
| `STEAM_CACHE_TTL` | number | 缓存过期时间(秒) | `3600` |
| `LOG_LEVEL` | string | 日志级别 | `info` |
| `API_BASE_URL` | string | API 基础 URL | - |

## 🎯 API 端点

### Steam 数据接口
- `GET /api/steam/apps` - 获取所有 Steam 游戏列表

### 游戏查询接口
- `GET /api/games/popular` - 获取热门游戏
- `GET /api/games/discounted` - 获取折扣游戏
- `GET /api/games/upcoming` - 获取即将发行的游戏
- `GET /api/games/search` - 搜索游戏
- `GET /api/games/category/{category}` - 按类别获取游戏
- `GET /api/games/{appid}` - 获取特定游戏详情

### 数据库操作接口
- `POST /api/games/batch` - 批量插入游戏数据
- `POST /api/games/` - 新增单个游戏数据
- `PUT /api/games/{appid}` - 更新游戏信息
- `GET /api/games/query` - 数据库查询游戏
- `GET /api/games/local` - 获取本地存储的游戏

## 📄 许可证

MIT License

## 🚀 在线演示

- **API 服务**: https://steam.guolake.workers.dev
- **API 文档**: https://steam.guolake.workers.dev/docs

## 📞 支持

如遇问题，请查看日志输出或提交 Issue。
