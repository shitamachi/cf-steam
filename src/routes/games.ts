import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { eq, like } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"
import { createMiddleware } from "hono/factory"
import * as schema from "../db/schema"
import {
	CategoryParamSchema,
	ErrorResponseSchema,
	GameCreateResponseSchema,
	GameCreateSchema,
	GameQuerySchema,
	GamesBatchCreateSchema,
	GamesBatchResponseSchema,
	GamesResponseSchema,
	GameUpdateSchema,
	LimitQuerySchema,
	PaginationQuerySchema,
	SearchQuerySchema,
	SimpleGamesResponseSchema,
} from "../schemas"
import { GetGameDetailsResponseSchema } from "../schemas/games"
import { SteamService } from "../steam-service"
import type { AppEnv } from "../types"
import { createEnvHelper } from "../utils/env"

const app = new OpenAPIHono<AppEnv>().basePath("/api/games")

// 创建中间件来初始化和缓存必要的服务实例
const initServices = createMiddleware<AppEnv>(async (c, next) => {
	// 初始化 Drizzle 数据库实例并保存到 Context
	const db = drizzle(c.env.DB, { schema })
	c.set("db", db)

	// 初始化环境变量助手
	const envHelper = createEnvHelper(c.env)

	// 初始化 Steam 服务实例并保存到 Context，使用环境变量配置
	const steamService = new SteamService(envHelper.getSteamApiKey(), {
		rateLimit: envHelper.getSteamRateLimit(),
		cacheTTL: envHelper.getSteamCacheTTL(),
	})
	c.set("steamService", steamService)

	await next()
})

// 应用中间件到所有路由
app.use("*", initServices)

// === 路由定义 ===

// 获取热门游戏
const getPopularGamesRoute = createRoute({
	method: "get",
	path: "/popular",
	summary: "获取热门游戏",
	description: "从 Steam 获取当前热门游戏列表",
	tags: ["Games"],
	request: {
		query: LimitQuerySchema,
	},
	responses: {
		200: {
			description: "成功获取热门游戏",
			content: {
				"application/json": {
					schema: GamesResponseSchema,
				},
			},
		},
		500: {
			description: "服务器内部错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
})

app.openapi(getPopularGamesRoute, async (c) => {
	try {
		const { limit } = c.req.valid("query")
		const steamService = c.var.steamService
		const games = await steamService.getPopularGames(limit)

		return c.json(
			{
				success: true as const,
				data: games,
				count: games.length,
				message: "获取热门游戏成功",
			},
			200,
		)
	} catch (error) {
		console.error("获取热门游戏失败:", error)
		return c.json(
			{
				success: false as const,
				error: "获取热门游戏失败",
				message: error instanceof Error ? error.message : "未知错误",
			},
			500,
		)
	}
})

// 获取折扣游戏
const getDiscountedGamesRoute = createRoute({
	method: "get",
	path: "/discounted",
	summary: "获取折扣游戏",
	description: "从 Steam 获取当前有折扣的游戏列表",
	tags: ["Games"],
	request: {
		query: LimitQuerySchema,
	},
	responses: {
		200: {
			description: "成功获取折扣游戏",
			content: {
				"application/json": {
					schema: GamesResponseSchema,
				},
			},
		},
		500: {
			description: "服务器内部错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
})

app.openapi(getDiscountedGamesRoute, async (c) => {
	try {
		const { limit } = c.req.valid("query")
		const steamService = c.var.steamService
		const games = await steamService.getDiscountedGames(limit)

		return c.json(
			{
				success: true as const,
				data: games,
				count: games.length,
				message: "获取折扣游戏成功",
			},
			200,
		)
	} catch (error) {
		console.error("获取折扣游戏失败:", error)
		return c.json(
			{
				success: false as const,
				error: "获取折扣游戏失败",
				message: error instanceof Error ? error.message : "未知错误",
			},
			500,
		)
	}
})

// 获取即将发行的游戏
const getUpcomingGamesRoute = createRoute({
	method: "get",
	path: "/upcoming",
	summary: "获取即将发行的游戏",
	description: "从 Steam 获取即将发行的游戏列表",
	tags: ["Games"],
	request: {
		query: LimitQuerySchema,
	},
	responses: {
		200: {
			description: "成功获取即将发行的游戏",
			content: {
				"application/json": {
					schema: GamesResponseSchema,
				},
			},
		},
		500: {
			description: "服务器内部错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
})

app.openapi(getUpcomingGamesRoute, async (c) => {
	try {
		const { limit } = c.req.valid("query")
		const steamService = c.var.steamService
		const games = await steamService.getUpcomingGames(limit)

		return c.json(
			{
				success: true as const,
				data: games,
				count: games.length,
				message: "获取即将发行的游戏成功",
			},
			200,
		)
	} catch (error) {
		console.error("获取即将发行的游戏失败:", error)
		return c.json(
			{
				success: false as const,
				error: "获取即将发行的游戏失败",
				message: error instanceof Error ? error.message : "未知错误",
			},
			500,
		)
	}
})

// 搜索游戏
const searchGamesRoute = createRoute({
	method: "get",
	path: "/search",
	summary: "搜索游戏",
	description: "根据关键词搜索 Steam 游戏",
	tags: ["Games"],
	request: {
		query: SearchQuerySchema,
	},
	responses: {
		200: {
			description: "成功搜索游戏",
			content: {
				"application/json": {
					schema: GamesResponseSchema,
				},
			},
		},
		400: {
			description: "请求参数错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "服务器内部错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
})

app.openapi(searchGamesRoute, async (c) => {
	try {
		const { q, limit } = c.req.valid("query")
		const steamService = c.var.steamService
		const games = await steamService.searchGames(q, limit)

		return c.json(
			{
				success: true as const,
				data: games,
				count: games.length,
				message: `搜索游戏 "${q}" 成功`,
			},
			200,
		)
	} catch (error) {
		console.error("搜索游戏失败:", error)
		return c.json(
			{
				success: false as const,
				error: "搜索游戏失败",
				message: error instanceof Error ? error.message : "未知错误",
			},
			500,
		)
	}
})

// 按类别获取游戏
const getGamesByCategoryRoute = createRoute({
	method: "get",
	path: "/category/{category}",
	summary: "按类别获取游戏",
	description: "根据游戏类别获取 Steam 游戏列表",
	tags: ["Games"],
	request: {
		params: CategoryParamSchema,
		query: LimitQuerySchema,
	},
	responses: {
		200: {
			description: "成功获取类别游戏",
			content: {
				"application/json": {
					schema: GamesResponseSchema,
				},
			},
		},
		500: {
			description: "服务器内部错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
})

app.openapi(getGamesByCategoryRoute, async (c) => {
	try {
		const { category } = c.req.valid("param")
		const { limit } = c.req.valid("query")
		const steamService = c.var.steamService
		const games = await steamService.getGamesByCategory(category, limit)

		return c.json(
			{
				success: true as const,
				data: games,
				count: games.length,
				message: `获取 ${category} 类别游戏成功`,
			},
			200,
		)
	} catch (error) {
		console.error("获取类别游戏失败:", error)
		return c.json(
			{
				success: false as const,
				error: "获取类别游戏失败",
				message: error instanceof Error ? error.message : "未知错误",
			},
			500,
		)
	}
})

const getGameDetailsRoute = createRoute({
	method: "get",
	path: "/{appid}",
	summary: "获取游戏详情",
	description: "根据 appid 获取特定游戏的详细信息",
	tags: ["Games"],
	request: {
		params: z.object({
			appid: z.coerce.number().int().positive(),
		}),
	},
	responses: {
		200: {
			description: "成功获取游戏详情",
			content: {
				"application/json": {
					schema: GetGameDetailsResponseSchema,
				},
			},
		},
		404: {
			description: "游戏不存在",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "服务器内部错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
})

app.openapi(getGameDetailsRoute, async (c) => {
	try {
		const { appid } = c.req.valid("param")
		const steamService = c.var.steamService
		const game = await steamService.getGameDetails(appid)

		if (!game) {
			return c.json(
				{
					success: false as const,
					error: "游戏不存在",
					message: `找不到 ID 为 ${appid} 的游戏`,
				},
				404,
			)
		}

		return c.json(
			{
				success: true as const,
				data: game,
				message: `获取游戏 ${appid} 详情成功`,
			},
			200,
		)
	} catch (error) {
		console.error("获取游戏详情失败:", error)
		return c.json(
			{
				success: false as const,
				error: "获取游戏详情失败",
				message: error instanceof Error ? error.message : "未知错误",
			},
			500,
		)
	}
})

// 批量插入游戏数据
const batchCreateGamesRoute = createRoute({
	method: "post",
	path: "/batch",
	summary: "批量插入游戏数据",
	description: "批量插入或更新游戏数据到数据库",
	tags: ["Games"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: GamesBatchCreateSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "成功批量处理游戏数据",
			content: {
				"application/json": {
					schema: GamesBatchResponseSchema,
				},
			},
		},
		400: {
			description: "请求参数错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "服务器内部错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
})

app.openapi(batchCreateGamesRoute, async (c) => {
	try {
		const games = c.req.valid("json")
		const db = c.var.db

		// 使用事务批量插入，性能优化
		const result = await db.transaction(async (tx) => {
			const inserted = []
			const batchSize = 100 // 每批插入100条，避免单次操作过大

			for (let i = 0; i < games.length; i += batchSize) {
				const batch = games.slice(i, i + batchSize)
				const batchResult = await tx
					.insert(schema.games)
					.values(
						batch.map((game) => ({
							appid: game.appid,
							name: game.name,
							lastFetchedAt: game.lastFetchedAt
								? new Date(game.lastFetchedAt * 1000)
								: new Date(),
						})),
					)
					.onConflictDoUpdate({
						target: schema.games.appid,
						set: {
							name: schema.games.name,
							lastFetchedAt: new Date(),
						},
					})
					.returning()

				inserted.push(...batchResult)
			}

			return inserted
		})

		return c.json(
			{
				success: true as const,
				data: result.map((game) => ({
					appid: game.appid,
					name: game.name,
					lastFetchedAt: game.lastFetchedAt?.toISOString(),
				})),
				count: result.length,
				message: `成功批量保存 ${result.length} 个游戏数据`,
			},
			200,
		)
	} catch (error) {
		console.error("批量保存游戏数据失败:", error)
		return c.json(
			{
				success: false as const,
				error: "批量保存游戏数据失败",
				message: error instanceof Error ? error.message : "未知错误",
			},
			500,
		)
	}
})

// 新增单个游戏数据
const createGameRoute = createRoute({
	method: "post",
	path: "/",
	summary: "新增游戏数据",
	description: "向数据库添加单个游戏数据",
	tags: ["Games"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: GameCreateSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "成功创建游戏数据",
			content: {
				"application/json": {
					schema: GameCreateResponseSchema,
				},
			},
		},
		400: {
			description: "请求参数错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "服务器内部错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
})

app.openapi(createGameRoute, async (c) => {
	try {
		const gameData = c.req.valid("json")
		const db = c.var.db

		const result = await db
			.insert(schema.games)
			.values({
				appid: gameData.appid,
				name: gameData.name,
				lastFetchedAt: gameData.lastFetchedAt
					? new Date(gameData.lastFetchedAt * 1000)
					: new Date(),
			})
			.onConflictDoUpdate({
				target: schema.games.appid,
				set: {
					name: schema.games.name,
					lastFetchedAt: new Date(),
				},
			})
			.returning()

		return c.json(
			{
				success: true as const,
				data: {
					appid: result[0].appid,
					name: result[0].name,
					lastFetchedAt: result[0].lastFetchedAt?.toISOString(),
				},
				message: `成功保存游戏 ${gameData.appid}`,
			},
			201,
		)
	} catch (error) {
		console.error("保存游戏数据失败:", error)
		return c.json(
			{
				success: false as const,
				error: "保存游戏数据失败",
				message: error instanceof Error ? error.message : "未知错误",
			},
			500,
		)
	}
})

// 更新游戏数据
const updateGameRoute = createRoute({
	method: "put",
	path: "/{appid}",
	summary: "更新游戏数据",
	description: "根据 appid 更新游戏信息",
	tags: ["Games"],
	request: {
		params: z.object({
			appid: z.coerce.number().int().positive(),
		}),
		body: {
			content: {
				"application/json": {
					schema: GameUpdateSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "成功更新游戏数据",
			content: {
				"application/json": {
					schema: GameCreateResponseSchema,
				},
			},
		},
		404: {
			description: "游戏不存在",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "服务器内部错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
})

app.openapi(updateGameRoute, async (c) => {
	try {
		const { appid } = c.req.valid("param")
		const updateData = c.req.valid("json")
		const db = c.var.db

		const result = await db
			.update(schema.games)
			.set({
				name: updateData.name,
				lastFetchedAt: new Date(),
			})
			.where(eq(schema.games.appid, appid))
			.returning()

		if (result.length === 0) {
			return c.json(
				{
					success: false as const,
					error: "游戏不存在",
					message: `找不到ID为 ${appid} 的游戏`,
				},
				404,
			)
		}

		return c.json(
			{
				success: true as const,
				data: {
					appid: result[0].appid,
					name: result[0].name,
					lastFetchedAt: result[0].lastFetchedAt?.toISOString(),
				},
				message: `成功更新游戏 ${appid} 的信息`,
			},
			200,
		)
	} catch (error) {
		console.error("更新游戏数据失败:", error)
		return c.json(
			{
				success: false as const,
				error: "更新游戏数据失败",
				message: error instanceof Error ? error.message : "未知错误",
			},
			500,
		)
	}
})

// 查询游戏数据
const queryGamesRoute = createRoute({
	method: "get",
	path: "/query",
	summary: "查询游戏数据",
	description: "根据 appid 或名称查询数据库中的游戏",
	tags: ["Games"],
	request: {
		query: GameQuerySchema,
	},
	responses: {
		200: {
			description: "成功查询游戏数据",
			content: {
				"application/json": {
					schema: SimpleGamesResponseSchema,
				},
			},
		},
		400: {
			description: "请求参数错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: "服务器内部错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
})

app.openapi(queryGamesRoute, async (c) => {
	try {
		const { appid, name, limit } = c.req.valid("query")
		const db = c.var.db

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		let whereClause: any
		if (appid) {
			whereClause = eq(schema.games.appid, appid)
		} else if (name) {
			whereClause = like(schema.games.name, `%${name}%`)
		}

		const result = await db
			.select()
			.from(schema.games)
			.where(whereClause)
			.limit(limit)

		return c.json(
			{
				success: true as const,
				data: result.map((game) => ({
					appid: game.appid,
					name: game.name,
					lastFetchedAt: game.lastFetchedAt?.toISOString(),
				})),
				count: result.length,
				message: `查询到 ${result.length} 个游戏`,
			},
			200,
		)
	} catch (error) {
		console.error("查询游戏数据失败:", error)
		return c.json(
			{
				success: false as const,
				error: "查询游戏数据失败",
				message: error instanceof Error ? error.message : "未知错误",
			},
			500,
		)
	}
})

// 获取本地游戏数据（分页）
const getLocalGamesRoute = createRoute({
	method: "get",
	path: "/local",
	summary: "获取本地游戏数据",
	description: "分页获取数据库中存储的游戏数据",
	tags: ["Games"],
	request: {
		query: PaginationQuerySchema,
	},
	responses: {
		200: {
			description: "成功获取本地游戏数据",
			content: {
				"application/json": {
					schema: SimpleGamesResponseSchema,
				},
			},
		},
		500: {
			description: "服务器内部错误",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
})

app.openapi(getLocalGamesRoute, async (c) => {
	try {
		const { limit, offset } = c.req.valid("query")
		const db = c.var.db

		const result = await db
			.select()
			.from(schema.games)
			.limit(limit)
			.offset(offset)
			.orderBy(schema.games.lastFetchedAt)

		return c.json(
			{
				success: true as const,
				data: result.map((game) => ({
					appid: game.appid,
					name: game.name,
					lastFetchedAt: game.lastFetchedAt?.toISOString(),
				})),
				count: result.length,
				message: `获取本地游戏数据成功，偏移 ${offset}，限制 ${limit}`,
			},
			200,
		)
	} catch (error) {
		console.error("获取本地游戏数据失败:", error)
		return c.json(
			{
				success: false as const,
				error: "获取本地游戏数据失败",
				message: error instanceof Error ? error.message : "未知错误",
			},
			500,
		)
	}
})

export default app
