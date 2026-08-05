import { renameSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, type Plugin } from "vite"
import { buildDefine } from "./scripts/git-info"

const rootDir = dirname(fileURLToPath(import.meta.url))

// 在产物根目录写入 package.json，EdgeOne Makers 依据它识别 cloud-functions 目录，
// 并将函数入口改名为 [[default]].js（EdgeOne 的 catch-all 路由命名）
function emitPackageJson(): Plugin {
	return {
		name: "edgeone:emit-package-json",
		closeBundle() {
			const outDir = resolve(rootDir, "dist/edgeone")
			const fnDir = resolve(outDir, "cloud-functions")
			renameSync(resolve(fnDir, "index.js"), resolve(fnDir, "[[default]].js"))
			writeFileSync(
				resolve(outDir, "package.json"),
				JSON.stringify(
					{
						name: "cf-steam",
						version: "1.0.0",
						type: "module",
					},
					null,
					"\t",
				),
			)
		},
	}
}

// EdgeOne Cloud Functions 构建：产出单一函数 bundle，部署到 cloud-functions/ 目录
export default defineConfig({
	plugins: [emitPackageJson()],
	publicDir: "public",
	define: {
		global: "globalThis",
		...buildDefine,
	},
	build: {
		outDir: "dist/edgeone",
		emptyOutDir: true,
		sourcemap: false,
		minify: false,
		target: "node20",
		rollupOptions: {
			input: resolve(rootDir, "src/index.edgeone.ts"),
			// 非 lib 构建下 Vite 默认 preserveEntrySignatures: false，
			// 会把入口的 export 全部 tree-shake 掉，必须显式保留
			preserveEntrySignatures: "strict",
			output: {
				format: "es",
				entryFileNames: "cloud-functions/index.js",
			},
		},
	},
})
