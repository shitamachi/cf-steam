import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config"

export default defineWorkersConfig({
	test: {
		include: ["**/*.test.ts"],
		exclude: ["**/node_modules/**"],
		testTimeout: 30000,
		hookTimeout: 30000,
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.jsonc" },
			},
		},
	},
}) 