import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { SteamService } from './steam-service'
import type * as schema from './db/schema'

/**
 * 环境变量类型定义
 */
export interface EnvVars {
  // Steam API 配置
  STEAM_API_KEY?: string
  
  // 数据库配置
  DATABASE_URL?: string
  
  // 应用配置
  NODE_ENV?: 'development' | 'staging' | 'production'
  LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error'
  API_BASE_URL?: string
  
  // Steam 服务配置
  STEAM_RATE_LIMIT?: string
  STEAM_CACHE_TTL?: string
  
  // 可选的第三方服务
  REDIS_URL?: string
  SENTRY_DSN?: string
}

/**
 * Cloudflare Workers 绑定类型
 */
export type AppBindings = {
  DB: D1Database
} & EnvVars

/**
 * Hono Context Variables 类型
 * 用于在请求生命周期中共享状态
 */
export type AppVariables = {
  db: DrizzleD1Database<typeof schema>
  steamService: SteamService
}

/**
 * 完整的 Hono 应用环境类型
 */
export type AppEnv = {
  Bindings: AppBindings
  Variables: AppVariables
} 