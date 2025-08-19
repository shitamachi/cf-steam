import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config"

export default defineWorkersConfig({
	test: {
		include: ["test/**/*.test.ts"],
		exclude: [
			"**/node_modules/**", 
			"**/dist/**",
			"test/integration/steam-community-age-verification-node.test.ts"
		],
		testTimeout: 30000,
		hookTimeout: 30000,
		setupFiles: ["./test/setup.ts"],
		globals: true,
		maxConcurrency: 5,
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.jsonc" },
				miniflare: {
					bindings: {
						STEAM_API_KEY: "TEST_STEAM_API_KEY_123456",
						NODE_ENV: "test",
						LOG_LEVEL: "error"
					},
					d1Databases: ["DB"],
					compatibilityFlags: [
						"nodejs_compat",
						"nodejs_compat_populate_process_env"
					]
				}
			}
		},
		retry: 2,
		mockReset: true,
		clearMocks: true
	}
})