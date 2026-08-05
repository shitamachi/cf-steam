import {
	copyFileSync,
	mkdirSync,
	readdirSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, type Plugin } from "vite"
import { buildDefine } from "./scripts/git-info"

const rootDir = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(rootDir, "dist/edgeone")
const ssrDir = join(outDir, ".edgeone", "cloud-functions", "ssr-node")

// EdgeOne Makers 构建产物：
// 1) .edgeone/（Build Output API v3）→ 同时写入 dist/edgeone/.edgeone/ 与仓库根 .edgeone/
//    （Makers 构建 CLI 按项目根扫描 server-handler，两条路径都覆盖）
// 2) .edgeone/assets/ 静态资源 + cloud-functions/ssr-node/{handler.js,config.json}
function buildEdgeoneOutput(): Plugin {
	return {
		name: "edgeone:emit-output",
		closeBundle() {
			// 静态资源 → .edgeone/assets/
			const assetsDir = join(outDir, ".edgeone", "assets")
			mkdirSync(assetsDir, { recursive: true })
			for (const file of readdirSync(join(rootDir, "public"))) {
				if (file === ".assetsignore") continue
				copyFileSync(join(rootDir, "public", file), join(assetsDir, file))
			}

			// 路由配置：静态优先，其余全部进入 ssr-node handler
			writeFileSync(
				join(ssrDir, "config.json"),
				JSON.stringify(
					{
						version: 3,
						routes: [
							{
								src: "^/assets/(.*)$",
								headers: {
									"cache-control": "public, max-age=31536000, immutable",
								},
								continue: true,
							},
							{ handle: "filesystem" },
							{ src: "/.*" },
						],
					},
					null,
					"\t",
				),
			)

			writeFileSync(
				join(outDir, "package.json"),
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

			// 同步一份 .edgeone/ 到仓库根（Makers 构建 CLI 在项目根扫描 server-handler）
			const rootEdgeone = join(rootDir, ".edgeone")
			rmSync(rootEdgeone, { recursive: true, force: true })
			copyDir(join(outDir, ".edgeone"), rootEdgeone)
		},
	}
}

function copyDir(from: string, to: string) {
	mkdirSync(to, { recursive: true })
	for (const entry of readdirSync(from)) {
		const src = join(from, entry)
		if (statSync(src).isDirectory()) {
			copyDir(src, join(to, entry))
		} else {
			copyFileSync(src, join(to, entry))
		}
	}
}

// EdgeOne Cloud Functions（Node 运行时）构建：产出 Build Output API v3 目录结构
export default defineConfig({
	plugins: [buildEdgeoneOutput()],
	publicDir: false,
	define: {
		global: "globalThis",
		...buildDefine,
	},
	build: {
		outDir,
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
				entryFileNames: ".edgeone/cloud-functions/ssr-node/handler.js",
			},
		},
	},
})
