import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/setup.ts'],
    css: true,
    testTimeout: 10000, // 10 seconds per test
    hookTimeout: 10000, // 10 seconds for hooks
    teardownTimeout: 5000, // 5 seconds for teardown
    forceRerunTriggers: [], // Prevent unnecessary reruns
    exclude: [
      'node_modules/**',
      'dist/**',
      'dist-electron/**',
      '**/*.d.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'dist-electron/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/test-utils/**',
        '**/__tests__/**',
        'vite.config.ts',
        'vitest.config.ts',
      ],
      thresholds: process.env.CI
        ? {
            statements: 80,
            branches: 85,
            functions: 80,
            lines: 80,
          }
        : undefined,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@electron': path.resolve(__dirname, './electron'),
    },
  },
});



