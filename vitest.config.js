import { defineConfig } from "vitest/config";
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ['./src/tests/setup.js'],
    mockReset: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/setup.js',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});