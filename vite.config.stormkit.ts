import { builtinModules } from "node:module"
import { defineConfig } from "vite"
import { buildDefine } from "./scripts/git-info"

// Stormkit 部署：构建为单个 CommonJS 文件，输出到 .stormkit/api/
// Stormkit 检测到 .stormkit/api 目录会直接上传为 Lambda 函数，跳过自动构建。
//
// 文件名必须是字面量 "*"：Stormkit 的文件系统路由用 node-match-path 匹配，
// "*" 会被转换为路由 "/*"，从而 catch-all 所有请求（含根路径），
// 不支持 [...slug] 语法。
export default defineConfig({
	build: {
		lib: {
			entry: "src/index.stormkit.ts",
			formats: ["cjs"],
			fileName: () => "*.cjs",
		},
		rollupOptions: {
			// Node 内置模块保持 external，运行时由 Lambda Node 环境提供
			external: (id) => builtinModules.includes(id) || id.startsWith("node:"),
		},
		outDir: ".stormkit/api",
		sourcemap: false,
		minify: false,
	},
	// 不要拷贝 public/ 静态资源：输出目录下的每个文件都会被
	// Stormkit 当作路由端点，多余文件会干扰 catch-all 匹配
	publicDir: false,
	define: {
		global: "globalThis",
		...buildDefine,
	},
})
