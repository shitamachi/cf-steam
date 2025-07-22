import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/fastly',
    minify: true,
    rollupOptions: {
      external: [
        /^node:/,
        /^fastly:.*/,
        'fs',
        'path',
        'crypto',
        'stream',
        'events',
        'util',
        'url',
        'querystring',
        'http',
        'https',
        'zlib',
        'buffer',
        'process',
        'os',
        'child_process',
        'cluster',
        'dgram',
        'dns',
        'domain',
        'module',
        'net',
        'readline',
        'repl',
        'string_decoder',
        'tls',
        'tty',
        'v8',
        'vm',
        'worker_threads'
      ],
      output: {
        entryFileNames: 'index.js',
        format: 'es',
      },
    },
    emptyOutDir: false,
  },
}); 