import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Production-only CSP hardening. The static CSP in index.html keeps
 * `script-src 'unsafe-inline'` because the Vite dev server injects an inline
 * React-refresh preamble during `vite` (dev). Production builds emit only
 * external module scripts, so we strip `'unsafe-inline'` from `script-src` at
 * build time, leaving `script-src 'self'`. `'unsafe-eval'` is no longer needed:
 * pdf.js v4 is loaded with `isEvalSupported: false`, so the directive was
 * dropped from index.html entirely.
 */
function productionCspPlugin() {
  return {
    name: 'production-csp',
    apply: 'build' as const,
    transformIndexHtml(html: string) {
      return html.replace(
        "script-src 'self' 'unsafe-inline'",
        "script-src 'self'"
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), productionCspPlugin()],
  base: './', // Use relative paths for Electron compatibility
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@electron': path.resolve(__dirname, './electron'),
    },
  },
  server: {
    port: 5173,
    // Fail loudly if another dev server is already on 5173 instead of silently
    // switching ports (which leaves Electron loading a stale/wrong Vite instance).
    strictPort: true,
    // Keep the file watcher off large generated artifact trees. The coverage
    // reports (cov-forks/, cov-threads/, coverage/) contain thousands of HTML/JS
    // files; watching them triggers a full-page-reload storm that prevents the
    // Electron renderer from ever stabilizing (the window never shows).
    watch: {
      ignored: [
        '**/cov-forks/**',
        '**/cov-threads/**',
        '**/coverage/**',
        '**/release/**',
        '**/dist-electron/**',
        '**/*.tmp',
      ],
    },
    // Warm the heaviest modules so they're transformed before Electron's first
    // request, avoiding a stall on initial paint.
    warmup: {
      clientFiles: ['./src/main.tsx', './src/App.tsx'],
    },
  },
  optimizeDeps: {
    // Pre-bundle heavy deps at server start instead of on-demand. Several of
    // these (notably pdfjs-dist) are loaded via dynamic import(), so declaring
    // them here prevents a blocking "re-optimizing dependencies" page reload the
    // first time a PDF/editor/map view is opened during a dev session.
    include: [
      'react',
      'react-dom',
      'pdfjs-dist',
      'framer-motion',
      'lucide-react',
      'lexical',
      // @lexical/react has no top-level "." export; pre-bundle the subpaths
      // actually imported by the editor instead of the bare package.
      '@lexical/react/LexicalComposer',
      '@lexical/react/LexicalRichTextPlugin',
      '@lexical/react/LexicalContentEditable',
      '@lexical/react/LexicalHistoryPlugin',
      '@lexical/react/LexicalOnChangePlugin',
      '@lexical/react/LexicalComposerContext',
      '@lexical/rich-text',
      '@lexical/list',
      '@lexical/link',
      '@lexical/table',
      '@lexical/code',
      '@lexical/html',
      '@xyflow/react',
      'react-window',
    ],
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB (default is 500KB)
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate PDF.js into its own chunk for better code splitting
          'pdfjs': ['pdfjs-dist'],
          // Separate vendor libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
        },
      },
      onwarn(warning, warn) {
        // Suppress eval warnings from pdfjs-dist (known issue with the library)
        if (warning.code === 'EVAL' && warning.id?.includes('pdfjs-dist')) {
          return;
        }
        // Suppress warnings about dynamic imports that won't move to another chunk
        // This is expected behavior when we intentionally use dynamic imports for code splitting
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || 
            (warning.message && warning.message.includes('dynamically imported'))) {
          return;
        }
        // Use default warning handler for other warnings
        warn(warning);
      },
    },
  },
  esbuild: {
    // Suppress eval warnings during transform phase
    legalComments: 'none',
  },
});



