import { defineConfig } from "vite"
import { buildDefine } from "./scripts/git-info"

// Supabase Edge Functions 构建（Deno 运行时）
// 产出单文件 ESM bundle → supabase/functions/steam/index.ts
// 与 vite.config.node.ts / vite.config.prebuild.ts 相同的多平台构建模式

export default defineConfig({
	// Supabase 函数目录只应包含 index.ts，不复制 public/
	publicDir: false,
	define: {
		global: "globalThis",
		...buildDefine,
	},
	build: {
		target: "esnext",
		lib: {
			entry: "src/index.deno.ts",
			formats: ["es"],
			fileName: () => "index.ts",
		},
		outDir: "supabase/functions/steam",
		emptyOutDir: false,
		minify: false,
		sourcemap: false,
		rollupOptions: {
			// Deno 原生支持 node: 内置模块，保持 external
			external: [/^node:/],
			output: {
				entryFileNames: "index.ts",
				format: "es",
			},
		},
	},
	resolve: {
		alias: {
			// vite-ssr-components 依赖 Vite 运行时，Deno 下用静态替代
			"vite-ssr-components/hono": "/scripts/supabase-renderer-stub.tsx",
		},
	},
})
