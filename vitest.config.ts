import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/setup.ts'],
    // Build/refresh a Node-ABI copy of better-sqlite3 so the REAL database
    // tests can load the native addon under Node (the installed binary is
    // compiled for Electron's ABI). See sqliteNodeAbi.ts.
    globalSetup: ['./electron/database/__tests__/sqliteNodeAbi.ts'],
    css: true,
    // Run suites in child-process workers (forks) rather than worker_threads:
    // the REAL better-sqlite3 native addon (used by the database tests) is not
    // safe to unload from a worker thread and segfaults on thread teardown.
    // Coverage numbers are identical between pools (verified), so this only
    // affects native-module stability, not reported coverage.
    pool: 'forks',
    testTimeout: 10000, // 10 seconds per test
    hookTimeout: 10000, // 10 seconds for hooks
    teardownTimeout: 5000, // 5 seconds for teardown
    fileParallelism: false,
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
      // No-regression floor set just below current actuals (with a small
      // buffer for run-to-run / cross-platform variance). Ratchet these upward
      // as coverage improves rather than treating them as the long-term target.
      //
      // Measured actuals on the current tree (full suite incl. the real
      // better-sqlite3 DB/migration/watcher tests added in P1-1):
      //   statements ~28.3, branches ~62.9, functions ~44.8, lines ~28.3.
      // Statement/line coverage is dominated by the large electron/main.ts
      // (~34%), which a later phase (P2-1) decomposes; branch/function floors
      // are ratcheted up here toward their (higher) actuals.
      thresholds: process.env.CI
        ? {
            statements: 27,
            branches: 61,
            functions: 43,
            lines: 27,
          }
        : undefined,
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: '@electron', replacement: path.resolve(__dirname, './electron') },
      // Resolve better-sqlite3 to the Node-ABI cache prepared by globalSetup so
      // real DB tests can require the addon under Node. The Electron build at
      // node_modules/better-sqlite3 is left untouched.
      {
        find: /^better-sqlite3$/,
        replacement: path.resolve(__dirname, './node_modules/.cache/better-sqlite3-node'),
      },
    ],
  },
});



