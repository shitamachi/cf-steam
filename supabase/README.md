# Supabase Edge Functions 部署指南

本项目主应用基于 Cloudflare Workers（D1 + Cron），本目录是其 **Supabase Edge Functions** 部署。

## 架构

采用与本项目其他平台（Node / Fastly / Netlify）相同的**多平台构建模式**：
一个平台一个 Vite 构建配置，产出单文件 bundle。

```
src/index.deno.ts  ──(vite.config.deno.ts / pnpm supabase:build)──►  supabase/functions/steam/index.ts
```

| 文件 | 作用 |
|---|---|
| `vite.config.deno.ts` | Deno 构建配置：`define` 注入构建信息，`node:` 保持 external，alias 替换 `vite-ssr-components/hono` |
| `src/index.deno.ts` | Deno 入口：process/Buffer 垫片 + basePath `/steam` + `Deno.serve` |
| `scripts/supabase-renderer-stub.tsx` | `vite-ssr-components/hono` 的静态替代（原组件依赖 Vite 运行时，仅构建时生效） |
| `supabase/config.toml` | `[functions.steam] verify_jwt = false`（公开 API） |

### 设计原则：与其他平台零差异

数据库**不做任何特殊处理**——和其他平台（Node/Vercel/Netlify/Fastly）一样，
`c.env.DB` 在 Supabase 上不存在，DB 路由返回 500，行为与 Node 端完全一致。

## 部署

### 1. 登录并关联项目（一次性）

```bash
supabase login                              # 浏览器授权
supabase link --project-ref <你的项目ref>    # ref 是项目 URL 中那串：https://<ref>.supabase.co
```

### 2. 配置环境变量（secrets）

```bash
supabase secrets set STEAM_API_KEY=你的SteamKey \
  NODE_ENV=production \
  LOG_LEVEL=info \
  API_BASE_URL=https://<ref>.supabase.co \
  STEAM_RATE_LIMIT=100 \
  STEAM_CACHE_TTL=3600
```

### 3. 构建并部署

```bash
pnpm supabase:deploy
```

> `supabase:deploy` = `supabase:build` + `supabase functions deploy steam`。
> `supabase/functions/steam/index.ts` 是构建产物（已 gitignore），部署前必须执行构建。
> `src/` 有改动时同样重新构建部署即可，无需其他同步步骤。

### 4. 验证

```bash
curl https://<ref>.supabase.co/functions/v1/steam/health
curl https://<ref>.supabase.co/functions/v1/steam/api/games/popular?limit=5
```

## 本地开发

```bash
pnpm supabase:build     # 生成 bundle
# 方式一：Supabase 本地栈（需要 Docker）
supabase functions serve steam --no-verify-jwt --env-file .env.local
# 方式二：直接 Deno 运行（无需 Docker）
deno run --allow-net --allow-env supabase/functions/steam/index.ts
curl http://localhost:8000/steam/api/games/popular?limit=2
```

## 已知限制 / 后续工作

- **数据库**：Supabase 是 Postgres。接入时按其他平台同样的思路处理即可（如用 `@supabase/supabase-js` 连接池），无需改动现有 D1 代码路径
- **定时任务**：Cloudflare Cron 无法直接迁移，可用 Supabase `pg_cron` + `pg_net` 或 database webhook 代替
- **鉴权**：当前 `verify_jwt = false` 公开访问；如需鉴权改为 `true`，前端带 `Authorization: Bearer <JWT>`
- **依赖版本**：bundle 直接使用项目 `package.json` 依赖，无独立版本管理
