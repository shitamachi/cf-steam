import { app } from "./index.js"

// EdgeOne Makers Cloud Functions（Node.js 运行时）入口
// 按 Build Output API v3 规范部署为 .edgeone/cloud-functions/ssr-node/handler.js，
// 契约：export default async (req: IncomingMessage, context) => Response
// （与 nitro / @edgeone/vite 两个官方 adapter 的 handler 契约一致）
// 必须显式传入 context?.env，否则 c.env 读不到 STEAM_API_KEY 等环境变量。

// biome-ignore lint/suspicious/noExplicitAny: EdgeOne 的 nodeReq 为 Node IncomingMessage，类型宽松
function nodeRequestToWebRequest(nodeReq: any): Request {
	const protocol =
		nodeReq.headers["x-forwarded-proto"] ||
		(nodeReq.connection?.encrypted ? "https" : "http")
	const host =
		nodeReq.headers["eo-pages-host"] ||
		nodeReq.headers["x-forwarded-host"] ||
		nodeReq.headers.host ||
		"localhost"
	const url = `${protocol}://${host}${nodeReq.url}`

	const headers = new Headers()
	for (const [key, value] of Object.entries(nodeReq.headers) as [
		string,
		string | string[],
	][]) {
		if (value) {
			if (Array.isArray(value)) {
				for (const v of value) headers.append(key, v)
			} else {
				headers.set(key, value)
			}
		}
	}

	const init: RequestInit = {
		method: nodeReq.method,
		headers,
	}
	if (nodeReq.method !== "GET" && nodeReq.method !== "HEAD") {
		if (nodeReq.body instanceof ReadableStream) {
			init.body = nodeReq.body
		} else if (typeof nodeReq.on === "function") {
			init.body = nodeReq
		} else if (nodeReq.body !== undefined && nodeReq.body !== null) {
			init.body = nodeReq.body
		}
		;(init as RequestInit & { duplex: "half" }).duplex = "half"
	}
	return new Request(url, init)
}

export default async function handler(
	// biome-ignore lint/suspicious/noExplicitAny: EdgeOne 的 nodeReq 类型宽松，与官方模板保持一致
	nodeReq: any,
	context?: { env?: Record<string, string> },
): Promise<Response> {
	const request = nodeRequestToWebRequest(nodeReq)
	return app.fetch(request, context?.env ?? {})
}
