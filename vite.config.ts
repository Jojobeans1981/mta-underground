import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  publicDir: 'public',
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');
          if (normalizedId.includes('/node_modules/phaser/')) {
            return 'phaser';
          }
          if (normalizedId.includes('/node_modules/')) {
            return 'vendor';
          }
          if (normalizedId.includes('/src/scenes/')) {
            return 'scene';
          }
          if (normalizedId.includes('/src/ui/')) {
            return 'ui';
          }
          if (normalizedId.includes('/src/systems/')) {
            return 'systems';
          }
          if (normalizedId.includes('/src/managers/')) {
            return 'managers';
          }
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
} as any);
