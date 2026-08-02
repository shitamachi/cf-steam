import { serve } from "@hono/node-server"
import { app } from "./index.js"

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

console.log(`🚀 Node.js 服务器启动中，端口: ${port}`)

serve({
	// 显式传入 process.env，否则 c.env 会是 { incoming, outgoing }，
	// 导致 STEAM_API_KEY 等环境变量在云平台上读取不到
	fetch: (request) => app.fetch(request, process.env),
	port,
})
