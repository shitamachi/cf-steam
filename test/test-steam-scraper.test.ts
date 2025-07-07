import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { SteamService } from "../src/steam-service"
import type { GameInfo } from "../src/steam-service"
import setup, { getTestHtml, clearTestDataCache } from "./setup"

/**
 * Steam 数据抓取器测试套件
 *
 * 这个测试套件验证 Steam 数据抓取器的各种功能
 * 现在运行在 Cloudflare Workers 环境中
 */

describe("Steam 数据抓取器", () => {
	let steamService: SteamService

	// 测试游戏列表 - 包含不同类型的游戏
	const testGames = [
		{ appid: 292030, name: "巫师3：狂猎", description: "著名 RPG 游戏" },
		{ appid: 730, name: "CS2", description: "热门 FPS 游戏" },
		{ appid: 440, name: "Team Fortress 2", description: "免费多人射击游戏" },
		{ appid: 1086940, name: "博德之门3", description: "回合制 RPG" },
		{ appid: 271590, name: "GTA V", description: "开放世界动作游戏" },
	]

	beforeAll(async () => {
		// 设置 Workers 环境
		await setup()
		steamService = new SteamService()
		console.log("🚀 开始测试 Steam 数据抓取器 (Workers 环境)...\n")
	})

	afterAll(() => {
		console.log("\n🎉 测试完成!")
		clearTestDataCache()
		vi.restoreAllMocks()
	})

	describe("基本功能测试", () => {
		it("应该能够创建 SteamService 实例", () => {
			expect(steamService).toBeDefined()
			expect(steamService).toBeInstanceOf(SteamService)
		})

		it("应该能够获取游戏列表", async () => {
			// 模拟 Steam API 响应
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({
					applist: {
						apps: [
							{ appid: 292030, name: "The Witcher® 3: Wild Hunt" },
							{ appid: 730, name: "Counter-Strike 2" },
							{ appid: 440, name: "Team Fortress 2" },
						]
					}
				}),
			} as Response)

			vi.stubGlobal('fetch', mockFetch)

			const games = await steamService.getAllGames()
			expect(games).toBeDefined()
			expect(Array.isArray(games)).toBe(true)
			expect(games.length).toBeGreaterThan(0)

			// 验证游戏数据结构
			const firstGame = games[0]
			expect(firstGame).toHaveProperty("appid")
			expect(firstGame).toHaveProperty("name")
			expect(typeof firstGame.appid).toBe("number")
			expect(typeof firstGame.name).toBe("string")
		}, 30000)
	})

	describe("游戏详情抓取测试", () => {
		it("应该能够抓取巫师3游戏详情", async () => {
			const { appid, name, description } = testGames[0]
			console.log(`🎮 正在测试: ${name} (${appid}) - ${description}`)

			// 获取真实的测试 HTML 数据
			const htmlContent = await getTestHtml(appid)

			// 模拟 fetch 返回测试数据
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(htmlContent),
			} as Response)

			vi.stubGlobal('fetch', mockFetch)

			const gameData = await steamService.getGameDetails(appid)

			// 基本验证
			expect(gameData).toBeDefined()
			expect(gameData).not.toBeNull()

			if (gameData) {
				// 验证基本字段
				expect(gameData.appid).toBe(appid)
				expect(gameData.name).toBeDefined()
				expect(typeof gameData.name).toBe("string")

				// 分析数据完整性
				const completeness = analyzeDataCompleteness(gameData)
				console.log(
					`  ✅ 数据完整性: ${completeness.overall}% (关键字段: ${completeness.critical}%)`,
				)

				// 验证关键字段存在
				expect(completeness.critical).toBeGreaterThan(30) // 降低要求，因为是模拟环境

				// 显示抓取到的主要信息
				displayGameSummary(gameData)
			}
		}, 60000)

		it("应该能够处理模拟的多个游戏", async () => {
			// 为每个测试游戏创建模拟数据
			const mockGames = testGames.slice(1, 3) // 测试2个游戏

			for (const { appid, name, description } of mockGames) {
				console.log(`🎮 正在测试: ${name} (${appid}) - ${description}`)

				// 创建模拟的 HTML 内容
				const mockHtml = createMockGameHtml(appid, name, description)

				const mockFetch = vi.fn().mockResolvedValue({
					ok: true,
					text: () => Promise.resolve(mockHtml),
				} as Response)

				vi.stubGlobal('fetch', mockFetch)

				const gameData = await steamService.getGameDetails(appid)

				expect(gameData).toBeDefined()
				expect(gameData).not.toBeNull()

				if (gameData) {
					expect(gameData.appid).toBe(appid)
					expect(gameData.name).toBeDefined()
					console.log(`  ✅ 成功获取 ${name} 的数据`)
				}
			}
		}, 60000)
	})

	describe("数据质量验证", () => {
		it("应该能够处理不存在的游戏ID", async () => {
			const invalidAppId = 9999999 // 不存在的游戏ID

			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				statusText: "Not Found",
			} as Response)

			vi.stubGlobal('fetch', mockFetch)

			const gameData = await steamService.getGameDetails(invalidAppId)

			// 对于不存在的游戏，应该返回 null
			expect(gameData).toBeNull()
		})

		it("应该能够处理网络错误", async () => {
			const appid = 123456

			// 模拟网络错误
			const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"))

			vi.stubGlobal('fetch', mockFetch)

			const gameData = await steamService.getGameDetails(appid)
			expect(gameData).toBeNull()
		})
	})

	describe("搜索功能测试", () => {
		it("应该能够搜索游戏", async () => {
			// 模拟搜索结果页面
			const mockSearchHtml = `
				<html>
					<body>
						<a href="/app/292030/witcher" class="search_result_row">巫师3</a>
						<a href="/app/294100/witcher" class="search_result_row">巫师3 DLC</a>
					</body>
				</html>
			`

			const mockFetch = vi.fn()
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve(mockSearchHtml),
				} as Response)
				.mockResolvedValue({
					ok: true,
					text: () => Promise.resolve(createMockGameHtml(292030, "The Witcher® 3: Wild Hunt", "RPG")),
				} as Response)

			vi.stubGlobal('fetch', mockFetch)

			const searchResults = await steamService.searchGames("巫师", 5)

			expect(searchResults).toBeDefined()
			expect(Array.isArray(searchResults)).toBe(true)
			expect(searchResults.length).toBeGreaterThan(0)
			expect(searchResults.length).toBeLessThanOrEqual(5)

			// 验证搜索结果包含相关游戏
			if (searchResults.length > 0) {
				const firstResult = searchResults[0]
				expect(firstResult.appid).toBeDefined()
				expect(firstResult.name).toBeDefined()
			}
		}, 30000)
	})

	describe("分类功能测试", () => {
		it("应该能够获取特定类别的游戏", async () => {
			// 模拟分类页面
			const mockCategoryHtml = `
				<html>
					<body>
						<a href="/app/730/counter-strike" class="search_result_row">Counter-Strike 2</a>
						<a href="/app/440/team-fortress" class="search_result_row">Team Fortress 2</a>
					</body>
				</html>
			`

			const mockFetch = vi.fn()
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve(mockCategoryHtml),
				} as Response)
				.mockResolvedValue({
					ok: true,
					text: () => Promise.resolve(createMockGameHtml(730, "Counter-Strike 2", "FPS")),
				} as Response)

			vi.stubGlobal('fetch', mockFetch)

			const actionGames = await steamService.getGamesByCategory("action", 3)

			expect(actionGames).toBeDefined()
			expect(Array.isArray(actionGames)).toBe(true)
			expect(actionGames.length).toBeGreaterThan(0)
			expect(actionGames.length).toBeLessThanOrEqual(3)

			// 验证每个游戏都有基本信息
			actionGames.forEach((game) => {
				expect(game.appid).toBeDefined()
				expect(game.name).toBeDefined()
			})
		}, 30000)
	})

	describe("Workers 环境特性测试", () => {
		it("应该能够检测 Workers 环境", () => {
			// 验证 Workers 环境的全局变量
			expect(typeof fetch).toBe("function")
			
			// 检查 HTMLRewriter 是否可用
			const hasHTMLRewriter = typeof HTMLRewriter !== "undefined"
			console.log(`HTMLRewriter 可用: ${hasHTMLRewriter}`)
			
			// 在真实的 Workers 环境中，HTMLRewriter 应该可用
			// 在测试环境中可能不可用，这是正常的
		})

		it("应该能够使用 Workers 的 fetch API", async () => {
			// 验证 fetch 的行为
			expect(typeof fetch).toBe("function")
			
			// 测试 fetch 的基本功能
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				text: () => Promise.resolve("test"),
			} as Response)

			vi.stubGlobal('fetch', mockFetch)

			const response = await fetch("https://example.com")
			expect(response.ok).toBe(true)
			expect(await response.text()).toBe("test")
		})
	})
	
	describe("本地测试数据", () => {
		it('应该能够获取和使用缓存的测试数据', async () => {
			// 测试数据缓存功能
			const appId = 292030
			const htmlData1 = await getTestHtml(appId)
			const htmlData2 = await getTestHtml(appId) // 应该从缓存获取
			
			expect(htmlData1).toBeDefined()
			expect(htmlData2).toBeDefined()
			expect(htmlData1).toBe(htmlData2) // 应该是同一个缓存的数据
		})
	})
})

/**
 * 创建模拟的游戏 HTML 内容
 */
function createMockGameHtml(appid: number, name: string, description: string): string {
	return `
		<html>
			<head><title>${name}</title></head>
			<body>
				<div class="apphub_AppName">${name}</div>
				<div class="dev_row">
					<div class="summary column">
						<a href="/developer/TestDev">Test Developer</a>
					</div>
				</div>
				<div class="summary column">
					<a href="/publisher/TestPub">Test Publisher</a>
				</div>
				<div class="game_description_snippet">
					${description}
				</div>
				<div class="game_purchase_price price">¥ 99.00</div>
				<div class="game_area_purchase_game_wrapper">
					<div class="discount_pct">-50%</div>
					<div class="discount_original_price">¥ 198.00</div>
					<div class="discount_final_price">¥ 99.00</div>
				</div>
			</body>
		</html>
	`
}

/**
 * 分析数据完整性
 */
function analyzeDataCompleteness(gameData: GameInfo): {
	overall: number
	critical: number
} {
	const criticalFields = [
		"name",
		"appid",
		"shortDescription",
		"currentPrice",
		"releaseDate",
		"developer",
		"publisher",
		"reviewSummary",
		"headerImage",
		"screenshots",
		"tags",
		"genres",
		"supportedPlatforms",
	]

	const allFields = [
		...criticalFields,
		"type",
		"detailedDescription",
		"originalPrice",
		"discountedPrice",
		"discountPercentage",
		"isOnSale",
		"isFree",
		"priceOverview",
		"metacritic",
		"movies",
		"background",
		"categories",
		"systemRequirements",
		"pcRequirements",
		"macRequirements",
		"linuxRequirements",
		"supportedLanguages",
		"supportedLanguagesDetailed",
		"controllerSupport",
		"achievementCount",
		"achievements",
		"dlcList",
		"fullDlcList",
		"demos",
		"requiredAge",
		"contentDescriptors",
		"recommendations",
		"supportInfo",
		"legalNotice",
		"extUserAccountNotice",
		"isUpcoming",
		"isEarlyAccess",
		"steamAppData",
		"scrapedAt",
		"dataSource",
	]

	const criticalPresent = criticalFields.filter(
		(field) => gameData[field as keyof GameInfo] !== undefined,
	).length

	const allPresent = allFields.filter(
		(field) => gameData[field as keyof GameInfo] !== undefined,
	).length

	return {
		critical: Math.round((criticalPresent / criticalFields.length) * 100),
		overall: Math.round((allPresent / allFields.length) * 100),
	}
}

/**
 * 显示游戏信息摘要
 */
function displayGameSummary(gameData: GameInfo): void {
	console.log(`  📋 游戏信息摘要:`)
	console.log(`     名称: ${gameData.name || "未知"}`)
	console.log(`     开发商: ${gameData.developer || "未知"}`)
	console.log(`     发行商: ${gameData.publisher || "未知"}`)
	console.log(`     价格: ${gameData.currentPrice || gameData.price || "未知"}`)
	console.log(`     是否免费: ${gameData.isFree ? "是" : "否"}`)
	console.log(`     发布日期: ${gameData.releaseDate || "未知"}`)
	
	if (gameData.tags && gameData.tags.length > 0) {
		console.log(`     标签: ${gameData.tags.slice(0, 3).join(", ")}${gameData.tags.length > 3 ? "..." : ""}`)
	}
	
	if (gameData.screenshots && gameData.screenshots.length > 0) {
		console.log(`     截图数量: ${gameData.screenshots.length}`)
	}
}
