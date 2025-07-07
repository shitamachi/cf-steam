import { describe, it, expect } from "vitest"

describe("简单测试", () => {
	it("基本数学运算", () => {
		expect(1 + 1).toBe(2)
	})

	it("字符串测试", () => {
		expect("hello".toUpperCase()).toBe("HELLO")
	})

	it("Workers 环境检查", () => {
		// 基本的环境检查
		expect(typeof globalThis).toBe("object")
		expect(typeof fetch).toBe("function")
		console.log("测试运行在:", typeof HTMLRewriter !== "undefined" ? "Workers 环境" : "Node.js 环境")
	})
}) 