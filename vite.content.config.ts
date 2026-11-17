import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist/assets',
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      input: { 'content-script': 'src/content/index.ts' },
      output: {
        format: 'iife',
        name: 'YouTubeAdBlocker',
        entryFileNames: '[name].js',
        inlineDynamicImports: true,
      },
    },
  },
});
