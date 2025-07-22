import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist-wasm',
    rollupOptions: {
      external: ['node:events', 'node:stream'],
    },
  },
  resolve: {
    alias: {
      'node:events': '/empty-shim.js',
      'node:stream': '/empty-shim.js',
    },
  },
}); 