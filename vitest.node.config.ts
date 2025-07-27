import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'test/integration/steam-community-age-verification-node.test.ts'
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 30000,
    hookTimeout: 30000,
    globals: true,
    environment: 'node',
    setupFiles: [],
  }
}) 