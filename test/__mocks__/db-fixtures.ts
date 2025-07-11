/**
 * 数据库测试夹具
 * 提供标准化的测试数据和工厂函数
 */

import { drizzle } from "drizzle-orm/d1"
import * as schema from "../../src/db/schema"

// 游戏测试夹具数据
export const gameFixtures = {
	witcher3: {
		appid: 292030,
		name: "The Witcher 3: Wild Hunt",
		lastFetchedAt: 1703980800
	},
	cyberpunk: {
		appid: 1091500,
		name: "Cyberpunk 2077",
		lastFetchedAt: 1703980800
	},
	cs2: {
		appid: 730,
		name: "Counter-Strike 2",
		lastFetchedAt: 1703980800
	}
}

// 根据Cloudflare官方文档，使用正确的D1 Mock方式
export function createMockD1Database(): D1Database {
	const data = new Map<string, any>()
	let nextId = 1

	// 模拟D1Database接口
	const mockDatabase: D1Database = {
		// 模拟prepare方法，返回D1PreparedStatement
		prepare(query: string): D1PreparedStatement {
			return {
				bind(...values: any[]): D1PreparedStatement {
					return this
				},
				
				first<T = Record<string, unknown>>(): Promise<T | null> {
					// 简单的查询模拟逻辑
					if (query.includes('SELECT') && query.includes('LIMIT 1')) {
						const firstValue = Array.from(data.values())[0]
						return Promise.resolve(firstValue || null)
					}
					return Promise.resolve(null)
				},
				
				all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
					const results = Array.from(data.values()) as T[]
					return Promise.resolve({
						results,
						success: true,
						meta: {
							changed_db: false,
							changes: 0,
							duration: 10,
							last_row_id: 0,
							rows_read: results.length,
							rows_written: 0,
							size_after: 1000,
						}
					})
				},
				
				run(): Promise<D1Result<Record<string, unknown>>> {
					// 模拟INSERT/UPDATE/DELETE操作
					if (query.includes('INSERT')) {
						const id = nextId++
						data.set(id.toString(), { id, ...gameFixtures.witcher3 })
						return Promise.resolve({
							results: [],
							success: true,
							meta: {
								changed_db: true,
								changes: 1,
								duration: 15,
								last_row_id: id,
								rows_read: 0,
								rows_written: 1,
								size_after: 1000,
							}
						})
					}
					
					return Promise.resolve({
						results: [],
						success: true,
						meta: {
							changed_db: false,
							changes: 0,
							duration: 5,
							last_row_id: 0,
							rows_read: 0,
							rows_written: 0,
							size_after: 1000,
						}
					})
				},
				
				raw<T = unknown[]>(): Promise<T[]> {
					return Promise.resolve([] as T[])
				}
			}
		},
		
		// 模拟exec方法
		exec(query: string): Promise<D1ExecResult> {
			return Promise.resolve({
				count: 1,
				duration: 10
			})
		},
		
		// 模拟dump方法  
		dump(): Promise<ArrayBuffer> {
			return Promise.resolve(new ArrayBuffer(0))
		},
		
		// 模拟batch方法
		batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
			return Promise.resolve(statements.map(() => ({
				results: [] as T[],
				success: true,
				meta: {
					changed_db: true,
					changes: 1,
					duration: 20,
					last_row_id: nextId++,
					rows_read: 0,
					rows_written: 1,
					size_after: 1000,
				}
			})))
		},
		
		// 添加清理方法用于测试重置
		_clear(): void {
			data.clear()
			nextId = 1
		}
	} as D1Database & { _clear(): void }

	return mockDatabase
}

// 创建游戏夹具的工厂函数
export function createGameFixture(overrides: Partial<typeof gameFixtures.witcher3> = {}) {
	return {
		...gameFixtures.witcher3,
		...overrides
	}
}

// 数据库测试工具类
export class DbTestUtils {
	private db: ReturnType<typeof drizzle>

	constructor(database: D1Database) {
		this.db = drizzle(database, { schema })
	}

	// 种子数据方法
	async seedGames() {
		await this.db.insert(schema.games).values([
			gameFixtures.witcher3,
			gameFixtures.cyberpunk,
			gameFixtures.cs2
		])
	}

	// 清理数据方法
	async cleanGames() {
		await this.db.delete(schema.games)
	}

	// 获取数据库实例
	getDb() {
		return this.db
	}
} 