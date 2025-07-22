import { defineConfig } from "vite"

export default defineConfig({
  build: {
    lib: {
      entry: {
        'node-server': 'src/node-server.ts'
      },
      formats: ['es']
    },
    rollupOptions: {
      external: ['@hono/node-server']
    },
    outDir: 'dist/steam',
    sourcemap: true,
    minify: false
  },
  define: {
    global: "globalThis",
  }
}) 