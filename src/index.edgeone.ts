import { app } from "./index.js"

// EdgeOne Cloud Functions（Node.js 运行时）入口
// 复用共享 Hono app（与 node-server.ts / index.stormkit.ts 同一模式）。
// 必须显式传入 context.env，否则 c.env 读不到 STEAM_API_KEY 等环境变量。
export function onRequest(context: {
	request: Request
	// biome-ignore lint/suspicious/noExplicitAny: EdgeOne 事件上下文类型宽松，与官方模板保持一致
	env: Record<string, any>
	params: Record<string, string>
}): Response | Promise<Response> {
	return app.fetch(context.request, context.env)
}
