import type { EnvVars } from '../types'

/**
 * 环境变量工具类
 */
export class EnvHelper {
  private env: EnvVars

  constructor(env: EnvVars) {
    this.env = env
  }

  /**
   * 获取 Steam API 密钥
   */
  getSteamApiKey(): string | undefined {
    return this.env.STEAM_API_KEY
  }

  /**
   * 获取数据库 URL
   */
  getDatabaseUrl(): string | undefined {
    return this.env.DATABASE_URL
  }

  /**
   * 获取当前环境
   */
  getNodeEnv(): 'development' | 'staging' | 'production' {
    return this.env.NODE_ENV || 'development'
  }

  /**
   * 获取日志级别
   */
  getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
    return this.env.LOG_LEVEL || 'info'
  }

  /**
   * 获取 API 基础 URL
   */
  getApiBaseUrl(): string {
    return this.env.API_BASE_URL || 'http://localhost:3000'
  }

  /**
   * 获取 Steam 速率限制
   */
  getSteamRateLimit(): number {
    const limit = this.env.STEAM_RATE_LIMIT
    return limit ? parseInt(limit, 10) : 100
  }

  /**
   * 获取 Steam 缓存 TTL
   */
  getSteamCacheTTL(): number {
    const ttl = this.env.STEAM_CACHE_TTL
    return ttl ? parseInt(ttl, 10) : 3600
  }

  /**
   * 获取 Redis URL
   */
  getRedisUrl(): string | undefined {
    return this.env.REDIS_URL
  }

  /**
   * 获取 Sentry DSN
   */
  getSentryDsn(): string | undefined {
    return this.env.SENTRY_DSN
  }

  /**
   * 检查是否为开发环境
   */
  isDevelopment(): boolean {
    return this.getNodeEnv() === 'development'
  }

  /**
   * 检查是否为生产环境
   */
  isProduction(): boolean {
    return this.getNodeEnv() === 'production'
  }

  /**
   * 验证必需的环境变量
   */
  validateRequired(): void {
    const errors: string[] = []

    // 根据实际需求添加必需的环境变量检查
    // if (!this.getSteamApiKey()) {
    //   errors.push('STEAM_API_KEY is required')
    // }

    if (errors.length > 0) {
      throw new Error(`Missing required environment variables: ${errors.join(', ')}`)
    }
  }

  /**
   * 获取所有环境变量（用于调试）
   */
  getAllVars(): EnvVars {
    return { ...this.env }
  }
}

/**
 * 创建环境变量助手实例
 */
export function createEnvHelper(env: EnvVars): EnvHelper {
  return new EnvHelper(env)
} 