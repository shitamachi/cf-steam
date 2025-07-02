## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
# 复制环境变量示例文件
cp .dev.vars.example .dev.vars

# 编辑 .dev.vars 文件，配置您的环境变量
# 例如：STEAM_API_KEY=your_steam_api_key_here
```

### 3. 本地开发
```bash
npm run cf-dev
```

### 4. 部署
```bash
# 开发/测试部署
npm run deploy

# 生产部署
npm run deploy:production
```

## 环境变量配置

项目支持多环境配置，详细信息请参阅 [环境变量配置指南](./docs/ENVIRONMENT_VARIABLES.md)。

### 支持的环境变量

- `STEAM_API_KEY`: Steam API 密钥（可选）
- `NODE_ENV`: 运行环境（development/staging/production）
- `LOG_LEVEL`: 日志级别（debug/info/warn/error）
- `STEAM_RATE_LIMIT`: Steam API 速率限制
- `STEAM_CACHE_TTL`: Steam 缓存时间

更多配置选项请查看 `.dev.vars.example` 文件。

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
