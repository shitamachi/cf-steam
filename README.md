# Steam Fetch API

一个功能完整的 Steam 游戏信息抓取和管理 API 服务，基于 Cloudflare Workers 构建。

## ✨ 功能特性

- 🎮 **Steam 数据获取** - 从 Steam 官方 API 获取游戏信息
- 💾 **游戏数据管理** - 本地数据库存储和管理游戏信息
- 🔍 **搜索与分类** - 支持游戏搜索和按类别筛选
- 📦 **批量操作** - 支持批量添加和更新游戏数据
- 📚 **完整的 API 文档** - 基于 OpenAPI 3.1 规范的交互式文档
- 🌐 **自动域名检测** - 从请求中自动获取正确的服务器域名

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
    "STEAM_API_KEY": "your_steam_api_key"
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

## 🛠 开发指南

### 本地开发

```bash
# 启动开发服务器
pnpm dev

# 访问本地文档
open http://127.0.0.1:8787/docs
```

### 部署到 Cloudflare Workers

```bash
# 部署到生产环境
pnpm deploy

# 部署到指定环境
wrangler deploy --env production
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

## 🎯 API 端点

### Steam 数据接口
- `GET /api/steam/apps` - 获取所有 Steam 游戏列表

### 游戏查询接口
- `GET /api/games/popular` - 获取热门游戏
- `GET /api/games/discounted` - 获取折扣游戏
- `GET /api/games/search` - 搜索游戏
- `GET /api/games/{appid}` - 获取特定游戏详情

### 数据库操作接口
- `POST /api/games/batch` - 批量插入游戏数据
- `PUT /api/games/{appid}` - 更新游戏信息
- `GET /api/games/query` - 数据库查询游戏

## 📄 许可证

MIT License
