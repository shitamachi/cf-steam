# CLAUDE.md

本项目的 AI 代理指南统一维护在 [AGENTS.md](./AGENTS.md)，请先完整阅读该文件再开始工作。

要点速览：

- 主运行时 Cloudflare Workers（Hono + D1 + Cron），多部署目标共用 `src/index.ts` 的 Hono app
- 构建目标多，Cloudflare 用 `pnpm build`，Node 用 `pnpm build:node`，切勿混淆
- 测试用 `pnpm test:workers`（Miniflare，禁止真实外网请求）
- 代码规范用 Biome：`npx biome check --write .`
- 更多结构、命令、架构坑见 AGENTS.md
