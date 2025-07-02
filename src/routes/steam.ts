import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { SteamService } from '../steam-service'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types'
import { createEnvHelper } from '../utils/env'
import {
  SimpleGamesResponseSchema,
  ErrorResponseSchema,
} from '../schemas'

const app = new OpenAPIHono<AppEnv>().basePath('/api/steam')

// 创建中间件来初始化和缓存必要的服务实例
const initServices = createMiddleware<AppEnv>(async (c, next) => {
  // 初始化环境变量助手
  const envHelper = createEnvHelper(c.env)

  // 初始化 Steam 服务实例并保存到 Context
  const steamService = new SteamService(
    envHelper.getSteamApiKey(),
    {
      rateLimit: envHelper.getSteamRateLimit(),
      cacheTTL: envHelper.getSteamCacheTTL()
    }
  )
  c.set('steamService', steamService)

  await next()
})

// 应用中间件到所有路由
app.use('*', initServices)

// 定义获取所有游戏列表的路由
const getAppsRoute = createRoute({
  method: 'get',
  path: '/apps',
  summary: '获取所有 Steam 游戏列表',
  description: '从 Steam API 获取所有游戏的 appid 和名称',
  tags: ['Steam'],
  responses: {
    200: {
      description: '成功获取游戏列表',
      content: {
        'application/json': {
          schema: SimpleGamesResponseSchema,
        },
      },
    },
    500: {
      description: '服务器内部错误',
      content: {
        'application/json': {
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

    return c.json({
      success: true as const,
      data: games.map(game => ({
        appid: game.appid,
        name: game.name,
        lastFetchedAt: undefined, // 可选字段，Steam API 获取的数据没有此字段
      })),
      count: games.length,
      message: '获取所有游戏列表成功'
    }, 200)
  } catch (error) {
    console.error('获取所有游戏列表失败:', error)
    return c.json({
      success: false as const,
      error: '获取所有游戏列表失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, 500)
  }
})

export default app
