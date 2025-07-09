import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { createMiddleware } from "hono/factory"
import {
	ErrorResponseSchema,
	SimpleGamesResponseSchema,
	SuccessResponseSchema,
} from "../schemas"
import {
	GameDetailsSchema,
	GetGameStoreRawDataResponseSchema,
} from "../schemas/games"
import { SteamService } from "../steam-service"
import type { AppEnv } from "../types"
import { createEnvHelper } from "../utils/env"

const app = new OpenAPIHono<AppEnv>().basePath("/api/steam")

// 创建中间件来初始化和缓存必要的服务实例
const initServices = createMiddleware<AppEnv>(async (c, next) => {
	// 初始化环境变量助手
	const envHelper = createEnvHelper(c.env)

	// 初始化 Steam 服务实例并保存到 Context
	const steamService = new SteamService(envHelper.getSteamApiKey(), {
		rateLimit: envHelper.getSteamRateLimit(),
		cacheTTL: envHelper.getSteamCacheTTL(),
	})
	c.set("steamService", steamService)

	await next()
})

// 应用中间件到所有路由
app.use("*", initServices)

// 定义获取所有游戏列表的路由
const getAppsRoute = createRoute({
	method: "get",
	path: "/apps",
	summary: "获取所有 Steam 游戏列表",
	description: "从 Steam API 获取所有游戏的 appid 和名称",
	tags: ["Steam"],
	responses: {
		200: {
			description: "成功获取游戏列表",
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

// 获取所有游戏列表
app.openapi(getAppsRoute, async (c) => {
	try {
		const steamService = c.var.steamService
		const games = await steamService.getAllGames()

		return c.json(
			{
				success: true as const,
				data: games.map((game) => ({
					appid: game.appid,
					name: game.name,
					lastFetchedAt: undefined, // 可选字段，Steam API 获取的数据没有此字段
				})),
				count: games.length,
				message: "获取所有游戏列表成功",
			},
			200,
		)
	} catch (error) {
		console.error("获取所有游戏列表失败:", error)
		return c.json(
			{
				success: false as const,
				error: "获取所有游戏列表失败",
				message: error instanceof Error ? error.message : "未知错误",
			},
			500,
		)
	}
})

// 定义获取游戏商店页原始数据路由
const getGameStoreRawDataRoute = createRoute({
	method: "get",
	path: "/apps/{appid}/store",
	summary: "获取游戏商店页原始数据",
	description: "从 Steam API 获取游戏商店页原始数据",
	tags: ["Steam"],
	request: {
		params: z.object({
			appid: z.coerce
				.number()
				.int()
				.positive()
				.describe("游戏的 appid")
				.openapi({
					param: {
						name: "appid",
						in: "path",
						required: true,
						description: "游戏的 appid，用于获取商店页原始数据",
					},
					example: 2933620,
				}),
		}),
		query: z.object({
			lang: z
				.string()
				.default("schinese")
				.describe("语言，默认 schinese(简体中文)")
				.openapi({
					param: {
						name: "lang",
						in: "query",
						required: false,
						description: "语言，默认 schinese(简体中文)",
					},
					default: "schinese",
					example: "schinese",
				}),
		}),
	},
	responses: {
		200: {
			description: "成功获取游戏商店页原始数据",
			content: {
				"application/json": {
					schema: GetGameStoreRawDataResponseSchema,
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

app.openapi(getGameStoreRawDataRoute, async (c) => {
	try {
		const { appid } = c.req.valid("param")
		const { lang } = c.req.valid("query")

		const steamService = c.var.steamService
		const game = steamService.getGameStoreUrl(appid, lang)
		const resp = await fetch(game)

		if (!resp.ok) {
			throw new Error(`Failed to fetch game data: ${resp.statusText}`)
		}

		const rawHtml = await resp.text()

		return c.json(
			{
				success: true as const,
				data: rawHtml,
				message: "获取游戏商店页原始数据成功",
			},
			200,
		)
	} catch (error) {
		console.error("获取游戏商店页原始数据失败:", error)
		return c.json(
			{
				success: false as const,
				error: "获取游戏商店页原始数据失败",
				message: error instanceof Error ? error.message : "未知错误",
			},
			500,
		)
	}
})

// appdetail
const getGameDetailsRoute = createRoute({
	method: "get",
	path: "/apps/{appid}/details",
	summary: "获取游戏详细信息",
	description: "从 Steam API 和获取游戏的详细信息",
	tags: ["Steam"],
	request: {
		params: z.object({
			appid: z.coerce
				.number()
				.int()
				.positive()
				.describe("游戏的 appid")
				.openapi({
					param: {
						name: "appid",
						in: "path",
						required: true,
						description: "要获取详情的游戏的 appid",
					},
					example: 578080, // PUBG: BATTLEGROUNDS
				}),
		}),
		query: z.object({
			lang: z
				.string()
				.default("english")
				.openapi({
					param: {
						name: "lang",
						in: "query",
						required: false,
						description: "语言，默认 english",
					},
					default: "english",
					example: "english",
				}),
		}),
	},
	responses: {
		200: {
			description: "成功获取游戏详细信息",
			content: {
				"application/json": {
					schema: SuccessResponseSchema.extend({
						data: GameDetailsSchema,
					}),
				},
			},
		},
		404: {
			description: "未找到游戏",
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
		const { lang } = c.req.valid("query")
		const steamService = c.var.steamService
		const gameDetails = await steamService.getApiGameDetails(appid, lang)

		if (!gameDetails) {
			return c.json(
				{
					success: false as const,
					error: "未找到游戏",
					message: `未找到 appid 为 ${appid} 的游戏`,
				},
				404,
			)
		}

		return c.json(
			{
				success: true as const,
				data: gameDetails,
				message: "获取游戏详细信息成功",
			},
			200,
		)
	} catch (error) {
		console.error("获取游戏详细信息失败:", error)
		return c.json(
			{
				success: false as const,
				error: "获取游戏详细信息失败",
				message: error instanceof Error ? error.message : "未知错误",
			},
			500,
		)
	}
})

export default app
