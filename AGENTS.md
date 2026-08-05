# AGENTS.md

本文件为 AI 编码代理提供本项目所需的背景、结构、命令与约定。修改本文档涉及的内容（命令、结构、约定）时，必须同步更新本文档。

## 项目概述

**Steam Fetch API**：一个 Steam 游戏信息抓取与管理 API 服务。

- 主运行时：**Cloudflare Workers**（Hono + D1 + Cron）
- 同时维护多个部署目标：Cloudflare Workers（主）、Node.js（standalone）、Stormkit、Vercel、Netlify、Fastly、Supabase、Deno
- 核心能力：Steam 官方 API + 网页抓取（HTMLRewriter / 正则双实现）、D1 数据库存储、OpenAPI 3.1 文档（Scalar）、定时同步（Cron）

## 技术栈

- **语言**：TypeScript（ESM，`"type": "module"`）
- **框架**：Hono 4 + `@hono/zod-openapi`（OpenAPI 3.1）+ `@scalar/hono-api-reference`
- **数据库**：Cloudflare D1（SQLite）+ Drizzle ORM（schema 在 `src/db/schema.ts`，迁移在 `drizzle/`）
- **构建**：Vite 6（多配置文件，见下文）+ Wrangler 4
- **测试**：Vitest 3 + `@cloudflare/vitest-pool-workers`（Miniflare）
- **代码规范**：Biome 2（替代 ESLint/Prettier）
- **包管理**：仓库同时存在 pnpm 脚本习惯与 `package-lock.json`；CI 使用 **pnpm 10**，本地用 npm 亦可

## 目录结构

```
src/
  index.ts            # 主入口（Cloudflare Workers）：Hono app + fetch/scheduled 导出
  node-server.ts      # Node.js standalone 入口（@hono/node-server）
  index.stormkit.ts   # Stormkit serverless 入口（getRequestListener 桥接）
  index.deno.ts       # Deno/Supabase 入口
  index.edgeone.ts    # EdgeOne Cloud Functions 入口（onRequest → app.fetch）
  renderer.tsx        # JSX 渲染中间件（vite-ssr-components）
  steam-service.ts    # 核心服务：Steam API + 网页抓取逻辑（~1200 行）
  error.ts            # HttpError 等错误处理
  types.ts            # EnvVars / AppBindings / AppEnv 类型
  routes/             # 路由：steam.ts、games.ts、health.ts（index.ts 汇总）
  schemas/            # Zod 校验 schema（index.ts + games.ts）
  db/schema.ts        # Drizzle D1 表定义
  utils/env.ts        # EnvHelper：环境变量读取封装
  generated/          # protoc 生成的 TS（protobuf），勿手改
  pb/                 # .proto 源文件
api/index.ts          # Vercel serverless 入口
netlify/functions/    # Netlify Functions 入口
supabase/functions/   # Supabase Edge Functions 入口
edgeone.json          # EdgeOne Makers 项目配置（buildCommand / outputDirectory 覆盖控制台）
drizzle/              # D1 迁移文件（drizzle-kit 生成，勿手改）
scripts/              # git-info.ts（构建期注入版本信息）、prepare-config.mjs（CI 生成 wrangler.jsonc）
test/                 # 测试 + __mocks__（fetch/D1 mock、HTML 样本）
examples/             # 示例
```

## 常用命令

### 开发

```bash
pnpm dev                # vite 开发服务器（Cloudflare Workers 模式，推荐）
pnpm cf-dev             # wrangler dev
pnpm dev:debug          # wrangler dev --local --port 8787 --inspector-port 9229
pnpm start              # Node 模式开发：tsx src/node-server.ts（默认端口 3000，PORT 可覆盖）
```

### 构建（多目标，切勿混淆）

| 命令 | 配置文件 | 产物 | 用途 |
|---|---|---|---|
| `pnpm build` | `vite.config.ts` | `dist/`（Workers + client） | **Cloudflare Workers（默认目标）** |
| `pnpm build:node` | `vite.config.node.ts` | `dist/steam/node-server.js` | Node.js standalone（VPS/PaaS） |
| `pnpm stormkit:build` | `vite.config.stormkit.ts` | `.stormkit/api/*.cjs`（单文件 CJS） | **Stormkit** serverless |
| `pnpm wasm:build` | `vite.config.wasm.ts` | — | WASM 目标 |
| `pnpm fastly:prebuild` | `vite.config.prebuild.ts` | `dist/fastly/` | Fastly 前置构建 |
| `pnpm supabase:build` | `vite.config.deno.ts` | — | Supabase Edge Functions |
| `pnpm edgeone:build` | `vite.config.edgeone.ts` | `dist/edgeone/`（cloud-functions/[[default]].js 单文件） | **EdgeOne Makers** Cloud Functions |

### 部署

```bash
pnpm deploy             # build + wrangler deploy（Cloudflare，主目标）
pnpm netlify:deploy:prod
pnpm fastly:deploy
pnpm supabase:deploy
# Node 平台（VPS/PaaS）：install=npm install，build=npm run build:node，
#   start=node dist/steam/node-server.js（等价 npm run start:prod）
# Stormkit：Build command = npm run stormkit:build（产出 .stormkit/api 即被识别上传，
#   环境变量在后台 Environment > Config 配置，运行时对函数可见）。
#   ⚠️ 必须额外设置环境变量 SK_BUILD_API=off：仓库根目录的 api/ 是 Vercel 入口，
#   若不禁用，Stormkit 会尝试自动 webpack 构建 api/（其 import 指向不存在的
#   dist/steam/index.js，必然失败）
# EdgeOne Makers：依赖仓库根 edgeone.json（buildCommand=vite build --config
#   vite.config.edgeone.ts，outputDirectory=./dist/edgeone，nodeVersion=20.18.0），
#   控制台无需额外改动；产物 dist/edgeone/ 内含 cloud-functions/[[default]].js
#   （Node 云函数，onRequest 入口）+ public/ 静态资源 + package.json。
#   环境变量在控制台项目设置里配置，运行时经 context.env 注入（c.env）。
```

### 测试

```bash
pnpm test               # vitest（watch 模式）
pnpm test:workers       # 单次运行：Workers 池全部测试（vitest.config.ts）
pnpm test:node          # 单次运行：Node 环境测试（vitest.node.config.ts，仅年龄验证集成测试）
pnpm test:all           # 两套都跑
```

- Workers 池使用 Miniflare，绑定见 `vitest.config.ts`（含 mock D1、`STEAM_API_KEY` 测试值）
- `test/setup.ts` 全局 mock 了 `fetch`（Steam API / 商店页 / 社区页），**测试不允许访问真实外网**
- HTML 样本文件（`test/*.html`）供年龄验证、抓取测试使用

### 代码检查

```bash
npx biome check .       # lint + format 检查
npx biome check --write .   # 自动修复
npx tsc --noEmit        # 类型检查
```

### 数据库（D1）

```bash
npx drizzle-kit generate            # 根据 src/db/schema.ts 生成迁移到 drizzle/
npx wrangler d1 migrations apply steam_games --remote   # 应用迁移到远端
npx wrangler d1 migrations apply steam_games --local    # 本地
```

### 其他

```bash
pnpm cf-typegen         # 生成 worker-configuration.d.ts（CloudflareBindings）
pnpm prepare-config     # CI 用：从 wrangler.template.jsonc + D1_DATABASE_ID 生成 wrangler.jsonc
pnpm protoc:generate    # 从 src/pb/*.proto 重新生成 src/generated/（需本机 protoc）
```

## 编码约定

- **格式化**：Biome，tab 缩进（宽 2）、行宽 80、双引号、尾随逗号、分号按需（`asNeeded`）
- **Lint**：Biome recommended；`noExplicitAny` 仅警告，但新代码应避免 `any`（已有代码大量使用 `biome-ignore` 注释豁免，沿用该模式）
- **命名**：`useNamingConvention` 已关闭，不强制
- **注释/文档**：项目注释以**中文**为主，保持一致
- **导入**：Biome assist 会自动 organize imports；路径内相对导入在部分入口文件使用 `.js` 后缀（如 `node-server.ts` 中 `./index.js`，ESM 约定）
- **提交前**：至少跑 `npx biome check --write .` 和相关测试

## 架构要点与坑（重要）

1. **多入口共享同一 Hono app**：`src/index.ts` 导出 `app` 与 Workers 默认导出（`fetch` + `scheduled`）。Node/Deno/Vercel/Netlify/EdgeOne 入口各自包装 `app.fetch`。改路由只动 `src/routes/`，勿动各平台胶水代码。

2. **`c.env` 在 Node 模式下不等于 `process.env`**：`@hono/node-server` 默认把 `{ incoming, outgoing }` 作为第二参数传给 fetch。`src/node-server.ts` 与 `src/index.stormkit.ts` 已显式 `app.fetch(request, process.env)`，`src/index.edgeone.ts` 显式 `app.fetch(request, context.env)`——**修改这些文件时务必保留此行为**，否则云平台环境变量全部失效。

3. **D1 绑定仅存在于 Cloudflare**：`src/routes/games.ts` 的中间件会 `drizzle(c.env.DB)`。非 Cloudflare 部署上 `c.env.DB` 为 `undefined`，真正执行 SQL 的路由会报错；纯抓取类路由（搜索、热门等）不受影响。

4. **构建期常量**：`__APP_VERSION__`、`__GIT_COMMIT__`、`__BUILD_INFO__` 等由各 vite 配置通过 `scripts/git-info.ts` 的 `buildDefine` 注入。类型声明在 `src/vite-env.d.ts`。无 git 环境时回退为 `unknown`。

5. **环境变量读取**：统一走 `src/utils/env.ts` 的 `EnvHelper`（接受 `c.env`），不要在业务代码里直接读 `process.env`。本地开发变量放 `.dev.vars`（模板见 `.dev.vars.example`，**勿提交**）；Workers 非敏感变量在 `wrangler.jsonc` 的 `vars`。

6. **Steam 抓取双实现**：`steam-service.ts` 中 HTMLRewriter（仅 Workers 可用）与正则两种实现并存，改动抓取逻辑需两边同步。`src/generated/` 的 protobuf 客户端用于 Steam 内部接口（top sellers / charts）。

7. **wrangler.jsonc 是生成物**：CI 从 `wrangler.template.jsonc` + secret `D1_DATABASE_ID` 生成（`pnpm prepare-config`）。本地仓库中的 `wrangler.jsonc` 含真实 D1 ID，修改配置应优先改模板。

8. **定时任务**：`wrangler.jsonc` 配置 `crons: ["0 0,12 * * *"]`（每天 0 点和 12 点），触发 `scheduled` 处理器同步 Steam 全量游戏列表到 D1（分批插入，见 `src/index.ts` 尾部）。

9. **`dist/`、`.wrangler/`、`.stormkit/` 不入库**；`drizzle/` 迁移文件由 drizzle-kit 生成，勿手改。

10. **Stormkit 的函数契约是 Node 风格 `(req, res)` 而非 Lambda `(event, context)`**（虽然跑在 AWS Lambda 上），所以入口用 `@hono/node-server` 的 `getRequestListener` 而非 `hono/aws-lambda`。其文件系统路由用 node-match-path，不支持 `[...slug]`；构建产物命名为字面量 `*.cjs`，会被转成路由 `/*` 实现 catch-all。`.stormkit/api` 下不能有多余文件（每个文件都会被当端点匹配），故 `vite.config.stormkit.ts` 里设了 `publicDir: false`。部署时环境变量需设 `SK_BUILD_API=off`，否则 Stormkit 会尝试自动构建 Vercel 的 `api/` 目录（见"常用命令 → 部署"）。完整说明与踩坑记录见 `docs/stormkit.md`。

11. **`api/` 目录是 Vercel 专用入口**（`vercel.json` 把所有流量 rewrite 到 `/api`），它 import 的 `dist/steam/index.js` 在当前构建体系中已不存在（陈旧路径），Vercel 部署本身也可能受影响；改动该目录需同步 `vercel.json`。

## API 概览

- 文档：`/docs`（Scalar）、`/openapi.json`、健康检查 `/health`
- Steam：`GET /api/steam/apps`（全量列表）
- 游戏查询：`/api/games/popular|discounted|upcoming|search|category/{c}|{appid}`
- 数据库：`POST /api/games/`、`POST /api/games/batch`、`PUT /api/games/{appid}`、`GET /api/games/query|local`

## CI/CD（GitHub Actions）

- `.github/workflows/test.yml`：push/PR 到 main 跑测试
- `.github/workflows/deploy.yml`：push main → pnpm install → prepare-config → build → test（non-blocking）→ wrangler-action 部署。所需 secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、`D1_DATABASE_ID`

## 环境变量

| 变量 | 说明 | 默认 |
|---|---|---|
| `STEAM_API_KEY` | Steam Web API 密钥（可选，无则走网页抓取） | - |
| `NODE_ENV` | development / staging / production | development |
| `LOG_LEVEL` | debug / info / warn / error | info |
| `API_BASE_URL` | API 基础 URL | http://localhost:3000 |
| `STEAM_RATE_LIMIT` | Steam API 速率限制 | 100 |
| `STEAM_CACHE_TTL` | 缓存 TTL（秒） | 3600 |
| `PORT` | Node 模式监听端口（PaaS 注入） | 3000 |

## 常见任务指引

- **加新 API 端点**：在 `src/routes/` 对应文件用 `createRoute`（zod-openapi）定义 → 实现 handler → 在 `src/schemas/` 加 Zod schema → 跑 `pnpm test:workers`。
- **改数据库表**：改 `src/db/schema.ts` → `npx drizzle-kit generate` → 本地/远端 apply 迁移。
- **改抓取逻辑**：注意 HTMLRewriter 与正则双实现（要点 6）；测试样本在 `test/*.html` 与 `test/__mocks__/html-responses.ts`。
- **改部署目标**：对应 vite 配置文件 + `package.json` scripts；并更新本文件。
