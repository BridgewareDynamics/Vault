import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for Electron compatibility
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@electron': path.resolve(__dirname, './electron'),
    },
  },
  server: {
    port: 5173,
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



