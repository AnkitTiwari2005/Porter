import { defineConfig } from 'vitest/config';
export default defineConfig({
  css: { postcss: { plugins: [] } }, // do not pick up the web app's PostCSS config from the parent folder
  test: { environment: 'node', include: ['test/**/*.test.js'], testTimeout: 30000, hookTimeout: 30000, pool: 'forks' }
});
