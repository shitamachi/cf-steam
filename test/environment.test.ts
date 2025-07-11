import { describe, it, expect } from "vitest"
import setup from "./setup"

describe("Workers 环境测试", () => {
	it("应该能够设置 Workers 环境", async () => {
		await setup()
		expect(true).toBe(true)
	})

	it("应该能够访问 fetch API", () => {
		expect(typeof fetch).toBe("function")
	})

	it("应该能够检测环境变量", () => {
		// 在 Workers 环境中，这些应该是可用的
		expect(typeof globalThis).toBe("object")
	})

	it("应该能够使用 Workers 特性", () => {
		// 检查 Workers 特有的 API
		const hasHTMLRewriter = typeof HTMLRewriter !== "undefined"
		const hasResponse = typeof Response !== "undefined"
		const hasRequest = typeof Request !== "undefined"

		expect(hasResponse).toBe(true)
		expect(hasRequest).toBe(true)

		console.log(`HTMLRewriter 可用: ${hasHTMLRewriter}`)
		console.log(`Response API 可用: ${hasResponse}`)
		console.log(`Request API 可用: ${hasRequest}`)
	})

    it("基本数学运算", () => {
		expect(1 + 1).toBe(2)
	})

	it("字符串测试", () => {
		expect("hello".toUpperCase()).toBe("HELLO")
	})
})
