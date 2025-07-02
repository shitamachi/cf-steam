import { z } from 'zod'

// === 基础类型 Schema ===

export const AppIdSchema = z.number().int().positive().describe('Steam 应用ID')

export const GameBaseSchema = z.object({
  appid: AppIdSchema,
  name: z.string().min(1).max(255).describe('游戏名称'),
  developer: z.string().optional().describe('开发商'),
  publisher: z.string().optional().describe('发行商'),
  price: z.string().optional().describe('当前价格'),
  originalPrice: z.string().optional().describe('原价'),
  discount: z.number().min(0).max(100).optional().describe('折扣百分比'),
  releaseDate: z.string().optional().describe('发行日期'),
  reviewScore: z.number().min(0).max(100).optional().describe('评分'),
  reviewCount: z.number().min(0).optional().describe('评论数量'),
  tags: z.array(z.string()).optional().describe('游戏标签'),
  description: z.string().optional().describe('游戏描述'),
  headerImage: z.string().url().optional().describe('头图URL'),
  screenshots: z.array(z.string().url()).optional().describe('截图URLs'),
  isOnSale: z.boolean().default(false).describe('是否促销'),
  isUpcoming: z.boolean().default(false).describe('是否即将发行'),
  isFree: z.boolean().default(false).describe('是否免费'),
})

export const GameSimpleSchema = z.object({
  appid: AppIdSchema,
  name: z.string().describe('游戏名称'),
  lastFetchedAt: z.string().datetime().optional().describe('最后获取时间'),
})

// === 查询参数 Schema ===

export const LimitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('限制返回数量'),
})

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(100).describe('搜索关键词'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('限制返回数量'),
})

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('限制返回数量'),
  offset: z.coerce.number().int().min(0).default(0).describe('偏移量'),
})

export const GameQuerySchema = z.object({
  appid: z.coerce.number().int().positive().optional().describe('游戏ID'),
  name: z.string().min(1).optional().describe('游戏名称'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('限制返回数量'),
}).refine(data => data.appid || data.name, {
  message: '必须提供 appid 或 name 中的至少一个参数'
})

export const CategoryParamSchema = z.object({
  category: z.enum(['action', 'adventure', 'strategy', 'rpg', 'simulation', 'sports', 'racing', 'indie', 'free']).describe('游戏类别'),
})

// === 请求体 Schema ===

export const GameCreateSchema = z.object({
  appid: AppIdSchema,
  name: z.string().min(1).max(255).describe('游戏名称'),
  lastFetchedAt: z.number().optional().describe('最后获取时间戳'),
})

export const GameUpdateSchema = z.object({
  name: z.string().min(1).max(255).describe('新的游戏名称'),
})

export const GamesBatchCreateSchema = z.array(GameCreateSchema).min(1).max(1000).describe('批量游戏数据')

// === 响应 Schema ===

export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().describe('成功消息'),
})

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().describe('错误类型'),
  message: z.string().describe('错误详情'),
})

export const GameResponseSchema = SuccessResponseSchema.extend({
  data: GameBaseSchema,
})

export const GamesResponseSchema = SuccessResponseSchema.extend({
  data: z.array(GameBaseSchema),
  count: z.number().min(0).describe('返回的游戏数量'),
})

export const SimpleGamesResponseSchema = SuccessResponseSchema.extend({
  data: z.array(GameSimpleSchema),
  count: z.number().min(0).describe('返回的游戏数量'),
})

export const GameCreateResponseSchema = SuccessResponseSchema.extend({
  data: GameSimpleSchema.extend({
    id: z.number().optional().describe('数据库记录ID'),
  }),
})

export const GamesBatchResponseSchema = SuccessResponseSchema.extend({
  data: z.array(GameSimpleSchema.extend({
    id: z.number().optional().describe('数据库记录ID'),
  })),
  count: z.number().min(0).describe('成功处理的游戏数量'),
})

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime().describe('检查时间'),
  version: z.string().describe('API版本'),
  uptime: z.number().describe('运行时间（秒）'),
})

// === 类型导出 ===

export type GameBase = z.infer<typeof GameBaseSchema>
export type GameSimple = z.infer<typeof GameSimpleSchema>
export type GameCreate = z.infer<typeof GameCreateSchema>
export type GameUpdate = z.infer<typeof GameUpdateSchema>
export type GamesBatchCreate = z.infer<typeof GamesBatchCreateSchema>
export type LimitQuery = z.infer<typeof LimitQuerySchema>
export type SearchQuery = z.infer<typeof SearchQuerySchema>
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>
export type GameQuery = z.infer<typeof GameQuerySchema>
export type CategoryParam = z.infer<typeof CategoryParamSchema>
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
export type GameResponse = z.infer<typeof GameResponseSchema>
export type GamesResponse = z.infer<typeof GamesResponseSchema>
export type SimpleGamesResponse = z.infer<typeof SimpleGamesResponseSchema>
export type GameCreateResponse = z.infer<typeof GameCreateResponseSchema>
export type GamesBatchResponse = z.infer<typeof GamesBatchResponseSchema>
export type HealthResponse = z.infer<typeof HealthResponseSchema> 