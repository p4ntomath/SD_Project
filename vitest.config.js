import { defineConfig } from "vitest/config";
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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
    },
    testEnvironmentOptions: {
      customExportConditions: ['node', 'node-addons'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});