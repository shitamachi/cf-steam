import { Hono } from "hono"
import { app } from "./index"

declare const Deno: {
	serve: (handler: (request: Request) => Response | Promise<Response>) => void
	env: { toObject: () => Record<string, string | undefined> }
}

// === Deno 运行时兼容垫片 ===
// Deno Deploy 无构建期（vite 打包时 define 已内联 __APP_VERSION__ 等），
// 但缺少 Node 全局：process / Buffer，这里补齐。

// biome-ignore lint/suspicious/noExplicitAny: <deno runtime shim>
const g = globalThis as any

const env = Deno.env.toObject()

if (g.process === undefined) {
	g.process = { env }
}

if (g.Buffer === undefined) {
	const { Buffer } = await import("node:buffer")
	g.Buffer = Buffer
}

// === 挂载应用 ===
// Deno Deploy 的 App 域名（如 xxx.deno.dev 或自定义域名）根路径直接服务，
// 无需 basePath，也无需 HTML 重定向（无 Supabase 网关的 text/plain 限制）

const server = new Hono()

server.route("/", app)

// Deno Deploy 必须使用 Deno.serve（旧 std http serve() 会在部署 warmup 阶段超时）
Deno.serve((request) => server.fetch(request, env))
