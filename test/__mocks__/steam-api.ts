/**
 * Steam API Mock数据
 * 提供真实的Steam API响应结构用于测试
 */

import type { GameInfo } from "../../src/steam-service"

// The Witcher 3: Wild Hunt (292030) - 完整测试数据
export const witcher3MockData: GameInfo = {
	appid: 292030,
	name: "The Witcher 3: Wild Hunt",
	type: "game",
	shortDescription: "作为怪物猎人杰洛特，踏上前往找寻命中注定之子的旅程，这个孩子是能拯救或摧毁这个世界的关键。",
	detailedDescription: "《巫师3：狂猎》是一款故事丰富的次世代开放世界角色扮演游戏...",
	price: "¥ 127.00",
	currentPrice: "¥ 127.00",
	originalPrice: "¥ 127.00",
	discountedPrice: undefined,
	discountPercentage: "0",
	isOnSale: false,
	isFree: false,
	releaseDate: "2015年5月18日",
	developer: "CD PROJEKT RED",
	publisher: "CD PROJEKT RED",
	reviewSummary: "好评如潮",
	reviewDescription: "在 547,203 篇用户评测中，有 97% 为好评。",
	reviewScore: 97,
	reviewCount: 547203,
	headerImage: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg",
	screenshots: [
		"https://cdn.akamai.steamstatic.com/steam/apps/292030/ss_1.jpg",
		"https://cdn.akamai.steamstatic.com/steam/apps/292030/ss_2.jpg"
	],
	tags: ["RPG", "开放世界", "故事丰富", "选择重要", "第三人称"],
	supportedPlatforms: ["windows", "mac"],
	supportedLanguages: "简体中文, 繁体中文, 英语等",
	achievementCount: "78",
	requiredAge: 18,
	isUpcoming: false,
	isEarlyAccess: false,
	scrapedAt: new Date().toISOString(),
	dataSource: "steam_api"
}

// Counter-Strike 2 (730) - 免费游戏测试数据
export const cs2MockData: GameInfo = {
	appid: 730,
	name: "Counter-Strike 2",
	type: "game",
	shortDescription: "有史以来最受欢迎的团队射击游戏的新时代已经开始。",
	price: "免费游戏",
	isFree: true,
	isOnSale: false,
	releaseDate: "2023年9月27日",
	developer: "Valve",
	publisher: "Valve",
	reviewSummary: "多半好评",
	reviewScore: 78,
	reviewCount: 1250000,
	headerImage: "https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg",
	tags: ["射击", "多人", "竞技", "战术", "团队"],
	supportedPlatforms: ["windows", "mac", "linux"],
	requiredAge: 0,
	isUpcoming: false,
	isEarlyAccess: false
}

// Cyberpunk 2077 (1091500) - 折扣游戏测试数据
export const cyberpunk2077MockData: GameInfo = {
	appid: 1091500,
	name: "Cyberpunk 2077",
	type: "game",
	shortDescription: "《赛博朋克2077》是一款开放世界动作冒险RPG，故事发生在末世大都会夜之城。",
	price: "¥ 178.00",
	currentPrice: "¥ 89.00",
	originalPrice: "¥ 178.00",
	discountedPrice: "¥ 89.00",
	discountPercentage: "50",
	isOnSale: true,
	isFree: false,
	releaseDate: "2020年12月10日",
	developer: "CD PROJEKT RED",
	publisher: "CD PROJEKT RED",
	reviewSummary: "多半好评",
	reviewScore: 79,
	reviewCount: 689542,
	headerImage: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg",
	tags: ["开放世界", "RPG", "科幻", "射击", "成人"],
	supportedPlatforms: ["windows"],
	requiredAge: 18,
	isUpcoming: false,
	isEarlyAccess: false
}

// 即将发行游戏测试数据
export const upcomingGameMockData: GameInfo = {
	appid: 123456,
	name: "Upcoming Test Game",
	type: "game",
	shortDescription: "即将发行的测试游戏",
	releaseDate: "2025年12月31日",
	developer: "Test Developer",
	publisher: "Test Publisher",
	headerImage: "https://example.com/header.jpg",
	isUpcoming: true,
	isEarlyAccess: false
}

// 抢先体验游戏测试数据
export const earlyAccessMockData: GameInfo = {
	appid: 789012,
	name: "Early Access Test Game",
	type: "game",
	shortDescription: "抢先体验测试游戏",
	releaseDate: "2024年1月1日",
	developer: "EA Developer",
	publisher: "EA Publisher",
	headerImage: "https://example.com/ea_header.jpg",
	isUpcoming: false,
	isEarlyAccess: true
}

// Steam API响应Mock
export const mockSteamApiResponses = {
	// 游戏详情响应
	gameDetails: {
		success: {
			292030: witcher3MockData,
			730: cs2MockData,
			1091500: cyberpunk2077MockData,
			123456: upcomingGameMockData,
			789012: earlyAccessMockData
		},
		notFound: null,
		invalid: null
	},

	// 游戏列表响应
	gamesList: {
		success: [
			{ appid: 292030, name: "The Witcher 3: Wild Hunt" },
			{ appid: 730, name: "Counter-Strike 2" },
			{ appid: 1091500, name: "Cyberpunk 2077" },
			{ appid: 570, name: "Dota 2" },
			{ appid: 440, name: "Team Fortress 2" }
		],
		empty: [],
		limited: [
			{ appid: 292030, name: "The Witcher 3: Wild Hunt" },
			{ appid: 730, name: "Counter-Strike 2" }
		]
	},

	// 搜索结果响应
	searchResults: {
		witcher: [witcher3MockData],
		counter: [cs2MockData],
		empty: [],
		cyberpunk: [cyberpunk2077MockData]
	},

	// 分类游戏响应
	categoryGames: {
		popular: [witcher3MockData, cs2MockData, cyberpunk2077MockData],
		discounted: [cyberpunk2077MockData],
		upcoming: [upcomingGameMockData],
		earlyAccess: [earlyAccessMockData]
	},

	// 错误响应
	errors: {
		networkError: new Error("Network request failed"),
		apiError: new Error("Steam API error: Invalid API key"),
		timeoutError: new Error("Request timeout"),
		ratelimitError: new Error("Rate limit exceeded"),
		serverError: new Error("Steam servers unavailable")
	}
}

// 创建模拟的fetch响应
export function createMockFetchResponse(data: any, ok: boolean = true, status: number = 200) {
	return Promise.resolve({
		ok,
		status,
		statusText: ok ? "OK" : "Error",
		json: () => Promise.resolve(data),
		text: () => Promise.resolve(typeof data === "string" ? data : JSON.stringify(data)),
		headers: new Headers({
			"Content-Type": "application/json"
		})
	})
}

// 延迟模拟
export function createDelayedResponse(data: any, delay: number = 100) {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve(createMockFetchResponse(data))
		}, delay)
	})
}

// 创建模拟的SteamAPI类
export class MockSteamAPI {
	constructor(private apiKey?: string | boolean) {}

	async getAppList() {
		if (!this.apiKey) {
			throw mockSteamApiResponses.errors.apiError
		}
		return mockSteamApiResponses.gamesList.success
	}

	async getGameDetails(appid: number, options?: any) {
		if (!this.apiKey) {
			throw mockSteamApiResponses.errors.apiError
		}

		// 模拟不存在的游戏
		if (appid === 999999) {
			return null
		}

		// 模拟网络错误
		if (appid === 888888) {
			throw mockSteamApiResponses.errors.networkError
		}

		// 返回预定义的游戏数据
		const gameData = mockSteamApiResponses.gameDetails.success[appid as keyof typeof mockSteamApiResponses.gameDetails.success]
		return gameData || null
	}

	async getNumberOfCurrentPlayers(appid: number) {
		return Math.floor(Math.random() * 100000) + 1000
	}
}

// 默认导出
export default {
	mockSteamApiResponses,
	createMockFetchResponse,
	createDelayedResponse,
	MockSteamAPI
} 