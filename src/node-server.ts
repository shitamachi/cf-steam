import { serve } from '@hono/node-server'
import { app } from './index.js'

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

console.log(`🚀 Node.js 服务器启动中，端口: ${port}`)

serve({
  fetch: app.fetch,
  port
}) 