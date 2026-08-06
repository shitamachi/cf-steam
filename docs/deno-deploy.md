# Deno Deploy 部署说明

将本项目部署到 [Deno Deploy](https://console.deno.com)（新平台）的步骤与踩坑记录。

## 背景：平台现状（2026-08 核实）

- **Deploy Classic（dash.deno.com）已于 2026-07-20 关闭**，不再接受新项目。
- **deployctl 已弃用**，新平台用 `deno deploy` 子命令（Deno 2.x 自带）。
- 新平台（console.deno.com）采用 **GitHub 集成 + 内置构建**：无需 GitHub Actions YAML，
  build 日志在 dashboard 实时查看，构建分为 Prepare / Install / Build / Warm up / Route 五个阶段。
- 新平台**暂不支持 subdirectory monorepo**（应用必须位于仓库根）；本项目满足。

## 部署步骤

1. 访问 https://console.deno.com 登录，创建 Organization（slug 创建后不可改）。
2. Organization 页面 → `+ New App` → 选择本仓库（若未出现，需授权 Deno Deploy GitHub App 访问该仓库）。
3. App Config 配置：

   | 配置项 | 值 |
   |---|---|
   | Framework preset | No Preset |
   | Install command | `npm install` |
   | Build command | `npm run deno-deploy:build` |
   | Runtime configuration | Dynamic |
   | Dynamic Entrypoint | `dist/deno/index.ts` |
   | Static Directory | 留空（无独立静态资源，favicon 等忽略） |
   | Regions | us / eu / global（默认即可） |

4. 环境变量：`Add/Edit environment variables` 配置 `STEAM_API_KEY`（secret）、
   `API_BASE_URL` 等，选择 contexts（Production / Development）。
5. `Create App` 开始首次构建，构建成功即自动部署。之后 push main 自动触发重新部署。

## 本地开发与验证

需要本机安装 Deno（`curl -fsSL https://deno.land/install.sh | sh`）：

```bash
npm run deno-deploy:build   # vite 构建单文件产物 → dist/deno/index.ts
npm run deno:dev            # deno run --allow-net --allow-env dist/deno/index.ts（默认端口 8000）
```

## 已知限制（与 Cloudflare 部署的差异）

- **无 D1 数据库**：`c.env.DB` 为 undefined，依赖 SQL 的路由（`POST /api/games/*`、
  `GET /api/games/query|local`）会报错；纯抓取类路由（搜索、热门、折扣、top sellers 等）正常。
- **无 HTMLRewriter**：steam-service 按 `typeof HTMLRewriter` 运行时检测，
  Deno 下自动走正则抓取实现，无需改动。
- **cron 同步**：`scheduled` 处理器只在 Workers 存在；Deno Deploy 如需定时任务需改用
  `Deno.cron()`，但 D1 不存在时同步无意义，故未接入。

## 踩过的坑

1. **必须用 `Deno.serve()`**：新平台不支持旧 `std/http/server.ts` 的 `serve()`，
   用了会在部署 Warm up 阶段超时失败。入口 `src/index.deno-deploy.ts` 已是 `Deno.serve`。
2. **入口不能有 basePath**：Deno Deploy 的 App 域名根路径直接服务，无需 `/steam` 前缀
   （对比 Supabase 版 `src/index.deno.ts` 需要 basePath `/steam`）。
3. **共享 `app` 与运行时垫片**：`src/index.ts` 的 `onError` 直接读 `process.env.NODE_ENV`，
   入口需 shim `globalThis.process`；`node:buffer` 为 external（Deno 原生支持）。
4. **构建产物自包含**：vite lib mode 把所有依赖（hono/zod/steamapi 等）打进单个
   `dist/deno/index.ts`，Deno Deploy 无需 import map / deno.json。
