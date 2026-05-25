import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  server: {
    port: 5173,
    hmr: false,
  },
  resolve: {
    alias: [
      {
        find: '@salet/shared/coaster-entrypoint-core',
        replacement: path.resolve(__dirname, '../shared/src/coasterEntrypointCore.ts'),
      },
      {
        find: '@salet/shared',
        replacement: path.resolve(__dirname, '../shared/src/index.ts'),
      },
    ],
  },
});
