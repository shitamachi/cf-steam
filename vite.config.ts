import { cloudflare } from "@cloudflare/vite-plugin"
import { defineConfig } from "vite"
import ssrPlugin from "vite-ssr-components/plugin"

export default defineConfig({
	plugins: [cloudflare(), ssrPlugin()],
	define: {
		global: "globalThis",
	},
	build: {
		sourcemap: true,
		minify: false, // 调试时禁用压缩
		target: "esnext",
		rollupOptions: {
			output: {
				sourcemapExcludeSources: false
			}
		}
	},
	// 开发模式配置
	server: {
		sourcemapIgnoreList: false
	}
})
