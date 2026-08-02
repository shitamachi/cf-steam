import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { HealthResponseSchema, VersionResponseSchema } from "../schemas"
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
	const _startTime = Date.now()
	const uptime = process.uptime ? process.uptime() : 0

	return c.json(
		{
			status: "ok" as const,
			timestamp: new Date().toISOString(),
			version: __APP_VERSION__,
			commit: __GIT_COMMIT__,
			branch: __GIT_BRANCH__,
			date: __GIT_COMMIT_DATE__,
			uptime: uptime,
		},
		200,
	)
})

// 版本信息路由定义
const versionRoute = createRoute({
	method: "get",
	path: "/version",
	summary: "版本信息",
	description: "获取当前部署的版本信息和对应的 Git 提交",
	tags: ["System"],
	responses: {
		200: {
			description: "版本信息获取成功",
			content: {
				"application/json": {
					schema: VersionResponseSchema,
				},
			},
		},
	},
})

// 版本信息端点
app.openapi(versionRoute, (c) => {
	return c.json(
		{
			version: __APP_VERSION__,
			commit: __GIT_COMMIT__,
			commitFull: __GIT_COMMIT_FULL__,
			date: __GIT_COMMIT_DATE__,
			branch: __GIT_BRANCH__,
		},
		200,
	)
})

export default app
