import { defineConfig } from "vite"
import { buildDefine } from "./scripts/git-info"

// Deno Deploy 构建（console.deno.com 新平台）
// 产出单文件 ESM bundle → dist/deno/index.ts
// 与 vite.config.deno.ts（Supabase）相同的模式，仅入口与输出目录不同：
// Deno Deploy 的 Dynamic Entrypoint 指向 dist/deno/index.ts，
// install=npm install，build=npm run deno-deploy:build

export default defineConfig({
	publicDir: false,
	define: {
		global: "globalThis",
		...buildDefine,
	},
	build: {
		target: "esnext",
		lib: {
			entry: "src/index.deno-deploy.ts",
			formats: ["es"],
			fileName: () => "index.ts",
		},
		outDir: "dist/deno",
		emptyOutDir: false,
		minify: false,
		sourcemap: false,
		rollupOptions: {
			// Deno 原生支持 node: 内置模块（node:buffer 等），保持 external
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
