import { Hono } from "hono"
import { app } from "./index"

declare const Deno: {
	serve: (handler: (request: Request) => Response | Promise<Response>) => void
	env: { toObject: () => Record<string, string | undefined> }
}

// === Deno 运行时兼容垫片 ===
// Supabase Edge Functions 无构建期（__APP_VERSION__ 等已由 Vite define 内联），
// 但缺少 Node 全局：process / Buffer，这里补齐。

// biome-ignore lint/suspicious/noExplicitAny: <deno runtime shim>
const g = globalThis as any

if (g.process === undefined) {
	g.process = { env: Deno.env.toObject() }
}

if (g.Buffer === undefined) {
	const { Buffer } = await import("node:buffer")
	g.Buffer = Buffer
}

// === 挂载应用 ===
// Supabase 网关路径为 /functions/v1/steam/*，Hono 需以函数名作为 basePath

const functionName = "steam"
const server = new Hono().basePath(`/${functionName}`)

// === HTML 页面重定向 ===
// Supabase 网关会把返回 text/html 的 GET 响应强制改写为 text/plain（平台限制，官方文档确认），
// 因此首页与 /docs（Scalar UI）无法在浏览器中渲染。若配置了 HTML_REDIRECT_BASE_URL，
// 将 GET / 与 GET /docs 重定向到外部站点（如 Cloudflare 部署），API 请求不受影响。

server.use("*", async (c, next) => {
	const env = c.env as Record<string, string | undefined>
	const base = env.HTML_REDIRECT_BASE_URL
	if (base && c.req.method === "GET") {
		const path = c.req.path
		if (path === `/${functionName}` || path === `/${functionName}/`) {
			return c.redirect(base, 302)
		}
		if (path === `/${functionName}/docs` || path === `/${functionName}/docs/`) {
			return c.redirect(`${base.replace(/\/+$/, "")}/docs`, 302)
		}
	}
	await next()
})

server.route("/", app)

// 注入环境变量（Deno.serve 的第二个参数是 info 而非 env，需显式传入）
Deno.serve((request) => server.fetch(request, Deno.env.toObject()))
