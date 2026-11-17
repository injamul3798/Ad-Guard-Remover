import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist/assets',
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      input: { 'popup-blocker': 'src/content/popup-blocker.ts' },
      output: {
        format: 'iife',
        name: 'PopupBlocker',
        entryFileNames: '[name].js',
      },
    },
  },
});
