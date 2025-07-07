import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { HealthResponseSchema } from "../schemas"
import type { AppEnv } from "../types"

const app = new OpenAPIHono<AppEnv>()

// 健康检查路由定义
const healthCheckRoute = createRoute({
	method: "get",
	path: "/health",
	summary: "健康检查",
	description: "检查 API 服务状态和运行时间",
	tags: ["System"],
	responses: {
		200: {
			description: "服务运行正常",
			content: {
				"application/json": {
					schema: HealthResponseSchema,
				},
			},
		},
	},
})

// 健康检查端点
app.openapi(healthCheckRoute, (c) => {
	const startTime = Date.now()
	const uptime = process.uptime ? process.uptime() : 0

	return c.json(
		{
			status: "ok" as const,
			timestamp: new Date().toISOString(),
			version: "1.0.0",
			uptime: uptime,
		},
		200,
	)
})

export default app
