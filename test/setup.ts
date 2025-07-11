/**
 * 测试环境设置
 * 全局测试配置和工具函数
 */

import { beforeAll, beforeEach, afterEach, afterAll, vi } from "vitest"
import { mockSteamApiResponses, MockSteamAPI } from "./__mocks__/steam-api"
import { getHtmlResponseByUrl } from "./__mocks__/html-responses"
import { createMockD1Database } from "./__mocks__/db-fixtures"

// 全局变量声明
declare global {
	var testUtils: {
		mockDb: any
		mockSteamAPI: MockSteamAPI
		clearAllMocks: () => void
		resetTestData: () => void
	}
}

// 测试数据缓存
const testDataCache = new Map<string, string>()

/**
 * 清理测试数据缓存
 */
export function clearTestDataCache() {
	testDataCache.clear()
}

/**
 * 设置全局fetch模拟
 */
function setupFetchMock() {
	const mockFetch = vi.fn((url: string | Request | URL, options?: RequestInit) => {
		const urlString = typeof url === "string" ? url : url.toString()
		
		// Steam API模拟
		if (urlString.includes("api.steampowered.com")) {
			if (urlString.includes("GetAppList")) {
				return Promise.resolve(new Response(JSON.stringify({
					applist: { apps: mockSteamApiResponses.gamesList.success }
				}), { status: 200 }))
			}
			
			if (urlString.includes("appdetails")) {
				const appidMatch = urlString.match(/appids=(\d+)/)
				if (appidMatch) {
					const appid = parseInt(appidMatch[1])
					const gameData = mockSteamApiResponses.gameDetails.success[appid as keyof typeof mockSteamApiResponses.gameDetails.success]
					
					if (gameData) {
						return Promise.resolve(new Response(JSON.stringify({
							[appid]: { success: true, data: gameData }
						}), { status: 200 }))
					}
				}
				
				// 返回404对于未找到的游戏
				return Promise.resolve(new Response(JSON.stringify({
					success: false
				}), { status: 404 }))
			}
		}
		
		// Steam商店页面模拟
		if (urlString.includes("store.steampowered.com")) {
			const html = getHtmlResponseByUrl(urlString)
			return Promise.resolve(new Response(html, {
				status: 200,
				headers: { "Content-Type": "text/html" }
			}))
		}
		
		// 默认成功响应
		return Promise.resolve(new Response("OK", { status: 200 }))
	})
	
	vi.stubGlobal("fetch", mockFetch)
	return mockFetch
}

/**
 * 设置全局测试工具
 */
function setupGlobalTestUtils() {
	const mockDb = createMockD1Database()
	const mockSteamAPI = new MockSteamAPI("TEST_API_KEY")
	
	global.testUtils = {
		mockDb,
		mockSteamAPI,
		clearAllMocks: () => {
			vi.clearAllMocks()
			mockDb._clear()
			testDataCache.clear()
		},
		resetTestData: () => {
			mockDb._clear()
			testDataCache.clear()
		}
	}
}

/**
 * Workers环境检测
 */
function checkWorkersEnvironment() {
	const hasResponse = typeof Response !== "undefined"
	const hasRequest = typeof Request !== "undefined"
	const hasFetch = typeof fetch !== "undefined"
	const hasHTMLRewriter = typeof HTMLRewriter !== "undefined"
	
	console.log("🧪 测试环境检查:")
	console.log(`  ✅ Response API: ${hasResponse}`)
	console.log(`  ✅ Request API: ${hasRequest}`)
	console.log(`  ✅ Fetch API: ${hasFetch}`)
	console.log(`  ${hasHTMLRewriter ? "✅" : "⚠️"} HTMLRewriter: ${hasHTMLRewriter}`)
	
	if (!hasResponse || !hasRequest || !hasFetch) {
		throw new Error("缺少必要的Workers API")
	}
}

// 全局设置 - 在所有测试开始前运行一次
beforeAll(async () => {
	console.log("🚀 初始化测试环境...")
	
	// 检查Workers环境
	checkWorkersEnvironment()
	
	// 设置fetch模拟
	setupFetchMock()
	
	// 设置全局测试工具
	setupGlobalTestUtils()
	
	console.log("✅ 测试环境初始化完成")
})

// 每个测试前运行
beforeEach(() => {
	// 重置所有模拟
	if (global.testUtils) {
		global.testUtils.clearAllMocks()
	}
})

// 每个测试后运行
afterEach(() => {
	// 清理测试数据
	if (global.testUtils) {
		global.testUtils.resetTestData()
	}
})

// 全局清理 - 在所有测试结束后运行
afterAll(() => {
	console.log("🧹 清理测试环境...")
	clearTestDataCache()
	vi.restoreAllMocks()
	console.log("✅ 测试环境清理完成")
})

/**
 * 主要设置函数
 */
async function setup(): Promise<void> {
	// 基础设置已在beforeAll中完成
	// 这里可以添加额外的设置逻辑
}

export default setup