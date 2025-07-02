import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const games = sqliteTable('games', {
  appid: integer('appid').primaryKey(),
  name: text('name').notNull(),
  lastFetchedAt: integer('last_fetched_at', { mode: 'timestamp' }),
}, (table) => [
  // 为 name 字段创建索引，优化按名称查询的性能
  index('idx_games_name').on(table.name),
  // 为 lastFetchedAt 字段创建索引，优化按时间排序的性能
  index('idx_games_last_fetched_at').on(table.lastFetchedAt),
]);
