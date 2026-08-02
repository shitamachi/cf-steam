import { getRequestListener } from "@hono/node-server"
import { app } from "./index.js"

// Stormkit 的 serverless 函数虽然运行在 AWS Lambda 上，
// 但函数契约并非 Lambda 的 (event, context)，而是 Node 风格的
// (req: IncomingMessage, res: ServerResponse)，因此直接复用
// @hono/node-server 的 listener 桥接 Hono app。
// 注意：必须显式传入 process.env，否则 c.env 会是 { incoming, outgoing }。
export default getRequestListener((request) => app.fetch(request, process.env))
