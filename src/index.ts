import type {
	ExecutionContext,
	ScheduledEvent,
} from "@cloudflare/workers-types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { Scalar } from "@scalar/hono-api-reference"
import { drizzle } from "drizzle-orm/d1"
import { cors } from "hono/cors"
import { timing } from "hono/timing"
import * as schema from "./db/schema"
import { renderer } from "./renderer"
import { games, health, steam } from "./routes"
import { SteamService } from "./steam-service"
import type { AppBindings } from "./types"
import { createEnvHelper } from "./utils/env"

// 结构化日志工具函数
// biome-ignore lint/suspicious/noExplicitAny: <logInfo>
function logInfo(message: string, context?: Record<string, any>) {
	console.log(
		JSON.stringify({
			level: "info",
			message,
			timestamp: new Date().toISOString(),
			...context,
		}),
	)
}

function logError(
	message: string,
	error?: Error,
	// biome-ignore lint/suspicious/noExplicitAny: <logError>
	context?: Record<string, any>,
) {
	console.error(
		JSON.stringify({
			level: "error",
			message,
			error: error?.message,
			stack: error?.stack,
			timestamp: new Date().toISOString(),
			...context,
		}),
	)
}

// biome-ignore lint/suspicious/noExplicitAny: <logDebug>
function logDebug(message: string, context?: Record<string, any>) {
	console.log(
		JSON.stringify({
			level: "debug",
			message,
			timestamp: new Date().toISOString(),
			...context,
		}),
	)
}

// 创建 OpenAPI Hono 应用实例
const app = new OpenAPIHono<{ Bindings: AppBindings }>({
	defaultHook: (result, c) => {
		// 统一错误处理
		if (!result.success) {
			logError("API 验证错误", undefined, {
				path: c.req.path,
				method: c.req.method,
				errors: result.error.errors.map(
					(e) => `${e.path.join(".")}: ${e.message}`,
				),
			})

			return c.json(
				{
					success: false,
					error: "Validation Error",
					message: result.error.errors
						.map((e) => `${e.path.join(".")}: ${e.message}`)
						.join(", "),
				},
				400,
			)
		}
	},
})

// === 中间件配置 ===

// 请求日志中间件
app.use("*", async (c, next) => {
	const start = Date.now()
	const method = c.req.method
	const path = c.req.path
	
	// 跳过健康检查端点的日志
	if (path === "/health") {
		await next()
		return
	}
	
	const userAgent = c.req.header("User-Agent") || "unknown"

	logInfo("请求开始", {
		method,
		path,
		userAgent,
		ip: c.req.header("CF-Connecting-IP") || "unknown",
	})

	await next()

	const duration = Date.now() - start
	const status = c.res.status

	logInfo("请求完成", {
		method,
		path,
		status,
		duration: `${duration}ms`,
		success: status < 400,
	})
})

// CORS 配置
app.use(
	"*",
	cors({
		origin: "*",
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
	}),
)

// 性能监控
app.use("*", timing())

// 渲染器
app.use(renderer)

// === OpenAPI 文档配置 ===

// OpenAPI 规范 - 动态获取当前域名
app.doc("/openapi.json", (c) => {
	// 直接从请求URL获取域名
	const currentOrigin = new URL(c.req.url).origin
	logDebug("生成 OpenAPI 文档", { origin: currentOrigin })

	return {
		openapi: "3.1.0",
		info: {
			title: "Steam Fetch API",
			version: __APP_VERSION__,
			description: "一个用于获取和管理 Steam 游戏信息的 API 服务",
			contact: {
				name: "API Support",
				email: "support@example.com",
			},
			license: {
				name: "MIT",
				url: "https://opensource.org/licenses/MIT",
			},
		},
		servers: [
			{
				url: currentOrigin,
				description: "Current server",
			},
		],
		tags: [
			{
				name: "Steam",
				description: "Steam API 相关接口",
			},
			{
				name: "Games",
				description: "游戏数据管理接口",
			},
			{
				name: "System",
				description: "系统健康检查接口",
			},
		],
	}
})

// Scalar API 文档界面
app.get(
	"/docs",
	Scalar({
		url: "/openapi.json",
		theme: "default",
	}),
)

// === 主页路由 ===

app.get("/", (c) => {
	// 直接从请求URL获取当前域名
	const currentDomain = new URL(c.req.url).origin

	return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Steam Fetch API</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        h1 { color: #2c3e50; margin-bottom: 30px; }
        h2 { color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h3 { color: #7f8c8d; }
        .api-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .docs-link {
          display: inline-block;
          background: #3498db;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 10px 10px 10px 0;
          transition: background 0.3s;
        }
        .docs-link:hover { background: #2980b9; }
        .endpoint {
          background: white;
          padding: 10px;
          margin: 8px 0;
          border-left: 4px solid #3498db;
          border-radius: 4px;
        }
        .method { font-weight: bold; }
        .get { color: #28a745; }
        .post { color: #007bff; }
        .put { color: #ffc107; }
        .delete { color: #dc3545; }
        code {
          background: #f1f2f6;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Consolas', monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎮 Steam Fetch API</h1>
        <p>一个功能完整的 Steam 游戏信息抓取和管理 API 服务</p>
        
        <div style="margin: 30px 0;">
          <a href="${currentDomain}/docs" class="docs-link">📚 查看 API 文档</a>
          <a href="${currentDomain}/openapi.json" class="docs-link">📄 OpenAPI 规范</a>
          <a href="${currentDomain}/health" class="docs-link">💚 健康检查</a>
          <a href="${currentDomain}/version" class="docs-link">🏷️ 版本信息</a>
        </div>

        <div class="api-section">
          <h2>🚀 主要功能</h2>
          <ul>
            <li><strong>Steam 数据获取</strong> - 从 Steam 官方 API 获取游戏信息</li>
            <li><strong>游戏数据管理</strong> - 本地数据库存储和管理游戏信息</li>
            <li><strong>搜索与分类</strong> - 支持游戏搜索和按类别筛选</li>
            <li><strong>批量操作</strong> - 支持批量添加和更新游戏数据</li>
            <li><strong>完整的 API 文档</strong> - 基于 OpenAPI 3.1 规范的交互式文档</li>
          </ul>
        </div>

        <div class="api-section">
          <h2>📋 API 端点概览</h2>
          
          <h3>🎮 Steam 数据接口</h3>
          <div class="endpoint">
            <span class="method get">GET</span> <code>/api/steam/apps</code> - 获取所有 Steam 游戏列表
          </div>

          <h3>🎯 游戏查询接口</h3>
          <div class="endpoint">
            <span class="method get">GET</span> <code>/api/games/popular</code> - 获取热门游戏
          </div>
          <div class="endpoint">
            <span class="method get">GET</span> <code>/api/games/discounted</code> - 获取折扣游戏
          </div>
          <div class="endpoint">
            <span class="method get">GET</span> <code>/api/games/upcoming</code> - 获取即将发行的游戏
          </div>
          <div class="endpoint">
            <span class="method get">GET</span> <code>/api/games/search</code> - 搜索游戏
          </div>
          <div class="endpoint">
            <span class="method get">GET</span> <code>/api/games/category/{category}</code> - 按类别获取游戏
          </div>
          <div class="endpoint">
            <span class="method get">GET</span> <code>/api/games/{appid}</code> - 获取特定游戏详情
          </div>

          <h3>💾 数据库操作接口</h3>
          <div class="endpoint">
            <span class="method post">POST</span> <code>/api/games/batch</code> - 批量插入游戏数据
          </div>
          <div class="endpoint">
            <span class="method post">POST</span> <code>/api/games/</code> - 新增单个游戏数据
          </div>
          <div class="endpoint">
            <span class="method put">PUT</span> <code>/api/games/{appid}</code> - 更新游戏信息
          </div>
          <div class="endpoint">
            <span class="method get">GET</span> <code>/api/games/query</code> - 数据库查询游戏
          </div>
          <div class="endpoint">
            <span class="method get">GET</span> <code>/api/games/local</code> - 获取本地存储的游戏
          </div>
        </div>

        <div class="api-section">
          <h2>🎯 支持的游戏类别</h2>
          <p><code>action</code> <code>adventure</code> <code>strategy</code> <code>rpg</code> <code>simulation</code> <code>sports</code> <code>racing</code> <code>indie</code> <code>free</code></p>
        </div>

                  <div class="api-section">
          <h2>💡 使用说明</h2>
          <p>所有 API 响应都采用统一的 JSON 格式，包含 <code>success</code>、<code>data</code>、<code>message</code> 等字段。</p>
          <p>详细的请求参数、响应格式和示例请查看 <a href="${currentDomain}/docs">API 文档</a>。</p>
          <p><strong>当前服务器:</strong> <code>${currentDomain}</code></p>
        </div>
      </div>
    </body>
    </html>
  `)
})

// === 路由挂载 ===

// 挂载路由模块 - 因为各路由已经定义了basePath，所以直接挂载到根路径
app.route("/", games)
app.route("/", health)
app.route("/", steam)

// === 错误处理 ===

// 404 处理
app.notFound((c) => {
	return c.json(
		{
			success: false,
			error: "Not Found",
			message: "请求的资源不存在，请检查 API 路径是否正确",
		},
		404,
	)
})

// 全局错误处理
app.onError((err, c) => {
	logError("API 全局错误", err, {
		path: c.req.path,
		method: c.req.method,
		userAgent: c.req.header("User-Agent"),
	})

	return c.json(
		{
			success: false,
			error: "Internal Server Error",
			message:
				process.env.NODE_ENV === "development" ? err.message : "服务器内部错误",
		},
		500,
	)
})

// === Worker 导出 ===

export { app }

export default {
	fetch: app.fetch,

	// 定时任务：同步 Steam 游戏数据
	async scheduled(
		event: ScheduledEvent,
		env: AppBindings,
		ctx: ExecutionContext,
	) {
		const scheduledTime = new Date(event.scheduledTime).toISOString()

		logInfo("定时任务开始执行", {
			scheduledTime,
			cron: event.cron,
			type: "scheduled",
		})

		try {
			// todo 暂时关闭定时任务
			// ctx.waitUntil(syncSteamGames(env))

			logInfo("定时任务执行完成", {
				scheduledTime,
				status: "skipped",
				reason: "暂时关闭",
			})
		} catch (error) {
			logError(
				"定时任务执行失败",
				error instanceof Error ? error : new Error(String(error)),
				{
					scheduledTime,
					cron: event.cron,
				},
			)
		}
	},
}

// === 定时任务函数 ===

async function syncSteamGames(env: AppBindings) {
	const envHelper = createEnvHelper(env)
	const steamService = new SteamService(envHelper.getSteamApiKey(), {
		rateLimit: envHelper.getSteamRateLimit(),
		cacheTTL: envHelper.getSteamCacheTTL(),
	})
	const db = drizzle(env.DB, { schema })
	const syncId = Date.now().toString() // 用于追踪这次同步任务

	try {
		logInfo("开始同步 Steam 游戏列表", {
			syncId,
			steamRateLimit: envHelper.getSteamRateLimit(),
			cacheTTL: envHelper.getSteamCacheTTL(),
		})

		const apps = await steamService.getAllGames()
		logInfo("获取 Steam 游戏列表成功", {
			syncId,
			totalGames: apps.length,
		})

		const batchSize = 1000 // 每批插入1000条
		let processedCount = 0

		for (let i = 0; i < apps.length; i += batchSize) {
			const batch = apps.slice(i, i + batchSize)

			await db
				.insert(schema.games)
				.values(
					batch.map((app) => ({
						appid: app.appid,
						name: app.name,
						lastFetchedAt: new Date(),
					})),
				)
				.onConflictDoNothing()

			processedCount += batch.length

			logDebug("批量数据处理进度", {
				syncId,
				processed: processedCount,
				total: apps.length,
				progress: `${Math.round((processedCount / apps.length) * 100)}%`,
				batchSize: batch.length,
			})
		}

		logInfo("Steam 游戏列表同步完成", {
			syncId,
			totalProcessed: processedCount,
			totalGames: apps.length,
			batchSize,
		})
	} catch (error) {
		logError(
			"同步 Steam 游戏列表失败",
			error instanceof Error ? error : new Error(String(error)),
			{
				syncId,
				operation: "syncSteamGames",
			},
		)
		throw error // 重新抛出错误以便上层处理
	}
}
