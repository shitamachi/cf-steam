# Stormkit 部署支持

本项目对 [Stormkit](https://www.stormkit.io) 的部署支持说明：接入方式、配置步骤、以及踩过的坑。

## 概述

Stormkit 是一个跑在 **AWS Lambda** 上的 JS 平台即服务，但**没有官方 Hono 适配器**（[honojs/hono#1463](https://github.com/honojs/hono/issues/1463) 至今未合入）。

关键结论：**Stormkit 的函数契约不是 Lambda 的 `(event, context)`，而是 Node 风格的 `(req, res)`**——它的运行时（[stormkit-io/serverless](https://github.com/stormkit-io/serverless)）把函数包装成 `(req: http.IncomingMessage, res: http.ServerResponse)` 调用，且其 Request/Response 类直接继承 `node:http` 的真实类。因此直接复用 `@hono/node-server` 的 `getRequestListener` 即可桥接 Hono app，**不需要 `hono/aws-lambda`**。

## 接入方式（已实现）

| 文件 | 作用 |
|---|---|
| `src/index.stormkit.ts` | 函数入口：`getRequestListener((req) => app.fetch(req, process.env))` |
| `vite.config.stormkit.ts` | 打包为单个 CJS 文件 → `.stormkit/api/*.cjs` |
| `package.json` | `stormkit:build` 脚本 |
| `.gitignore` | 忽略 `.stormkit/` 构建产物 |

### 实现原理

- **构建**：`npm run stormkit:build` 产出 `.stormkit/api/*.cjs`（单文件 CJS，全部依赖内联）。Stormkit 检测到 `.stormkit/api` 目录会直接上传为 Lambda 函数，跳过其自动构建流程。
- **catch-all 路由**：Stormkit 的文件系统路由用 `node-match-path`，**不支持 `[...slug]` 语法**。构建产物命名为字面量 `*`（`*.cjs`），会被转换为路由 `/*`，匹配所有路径（含根路径）。
- **CJS 而非 ESM**：仓库 `package.json` 是 `"type": "module"`，若输出 `.js` 的 CJS 文件会被 Node 当作 ESM 解析导致崩溃，故用 `.cjs` 扩展名。
- **环境变量**：Stormkit 的 env config 变量在构建时注入且**运行时对函数可见**（`process.env`）。

## 后台配置（Environment > Config）

| 配置项 | 值 |
|---|---|
| Install command | `npm install --omit=dev --no-audit --no-fund` |
| Build command | `npm run stormkit:build` |
| Environment Variables | `STEAM_API_KEY` 等业务变量 |
| **Environment Variables（必填）** | `SK_BUILD_API=off` |

## 踩过的坑

### 0. 安装失败：ENOSPC（磁盘空间不足）

Stormkit 构建机的 `/tmp` 磁盘空间有限，**完整 `npm install`（约 2.1GB）装不下**，报 `ENOSPC: no space left on device`（解压 `drizzle-orm` 时满）。

**原因**：`node_modules` 的大头全是 Cloudflare/Fastly/vitest 生态（`@cloudflare/*` 295M、`@bytecodealliance` 144M、`binaryen` 93M、`@fastly/*` 78M、wrangler、miniflare 等），Stormkit 构建完全用不到。

**解决**：构建必需的包（`vite`、`vite-ssr-components`、`@protobuf-ts/runtime`、`@protobuf-ts/runtime-rpc`）已从 devDependencies 移入 dependencies，Install command 用 `npm install --omit=dev`（只装 ~90M）。改控制台 Install command 即可。

**另一个坑**：`steamapi` 原为 git 依赖（`github:shitamachi/node-steamapi`），有 EALLOWGIT / SSH key / git+ssh 解析等多重问题；且 npm 12 在 Deno Deploy 构建环境（Deno 的 npm shim）下对 git 依赖做 preparation 必然崩溃（详见 docs/deno-deploy.md 坑 5）。现已发布为 registry 包 **`steamapi-wasm`**（fork 构建产物，无 git 依赖、无需 allow-git 配置）。

### 1. `api/` 目录触发 Stormkit 自动构建失败（必踩）

仓库根目录的 `api/` 是 **Vercel 专用入口**（`vercel.json` 把所有流量 rewrite 到 `/api`）。Stormkit 只要检测到 `api/` 目录就会尝试用 webpack 自动构建它，而其 `api/index.ts` 的 import `../dist/steam/index.js` 是**陈旧失效路径**（当前任何构建都不产出该文件），必然报错：

```
We found `api` dir. We'll try to build it automatically.
failed to bundle index: build errors for index: Could not resolve "../dist/steam/index.js"
```

**解决**：环境变量设置 `SK_BUILD_API=off`（日志里会直接提示该开关），Stormkit 跳过自动构建，改用我们预构建的 `.stormkit/api`。

### 2. `c.env` 在 Node 模式不等于 `process.env`

`@hono/node-server` 默认把 `{ incoming, outgoing }` 作为第二参数传给 fetch，导致 `c.env.STEAM_API_KEY` 等永远为 `undefined`。入口必须显式传：

```ts
getRequestListener((request) => app.fetch(request, process.env))
```

### 3. `.stormkit/api` 下不能有多余文件

输出目录下**每个文件都会被当作路由端点**（walkTree 遍历全部文件）。Vite 默认会把 `public/` 静态资源拷进输出目录（如 `favicon.ico`、`.assetsignore`），它们会被当成端点匹配、干扰 catch-all。故 `vite.config.stormkit.ts` 设了 `publicDir: false`，保证目录里只有 `*.cjs`。

### 4. 不支持 `[...slug]`

文件系统路由只支持 `[id]` 参数和字面量 `*`，不支持动态 catch-all。用 `*` 文件名解决，但**不要提交 `*` 命名的源码文件进 git**（Windows 无法 checkout）——由构建产出即可规避。

### 5. D1 不可用

`c.env.DB`（Cloudflare D1）只存在于 Cloudflare。Stormkit 上真正执行 SQL 的路由报错（`Cannot read properties of undefined (reading 'prepare')`），纯抓取类接口（搜索、热门等）不受影响。这是所有非 Cloudflare 目标的共同限制。

### 6. 函数超时 15 秒

Stormkit 函数超时默认 15 秒。Steam 网页抓取接口（如搜索会抓取大量游戏详情页）可能超时，需要更长时间需联系 Stormkit 调整。

### 7. 请求路径前缀

Stormkit 的 API Path 默认 `/api`——只有 `/api/*` 的请求会进入函数，`/health`、`/docs`、`/` 走静态托管会 404。若需要完整应用路由，可在环境配置中调整 API Path。注意：apiPrefix 只影响**文件匹配**，传给函数的 `req.url` 始终是完整原始 URL，Hono 路由不受影响。

### 8. 其他

- **入口文件必须提交**：`src/index.stormkit.ts` 未提交时构建报 `Could not resolve entry module`。
- `api/index.ts`（Vercel 入口）的 import 路径在当前构建体系中已失效，**Vercel 部署本身也可能受影响**，修复需改指向真实入口（如 `../src/index.ts`）并同步 `vercel.json`。
- **`http://` 请求会收到 301 跳转**：Stormkit 边缘层强制 HTTPS，`http://.../api/...` 会 301 到同路径的 `https://` URL（返回的 HTML 里 href 就是跳转目标）。用 `https://` 访问即正常，不是应用问题。

## 本地验证

模拟 Stormkit 运行时契约（walkTree → `await import()` → 以 `(req, res)` 调用）的验证方式：用真实 `http.createServer` 把请求转发给构建产物 `default` 导出，即可验证 CJS interop、catch-all、响应链路。

```bash
npm run stormkit:build
# 用 http server 加载 .stormkit/api/*.cjs 的 default 导出，curl 各端点
```

实测结果：`/health`、`/`、`/docs`、`/openapi.json` 200；未知路径返回 Hono 404；POST 流程正常（500 为 D1 缺失的预期行为）。
