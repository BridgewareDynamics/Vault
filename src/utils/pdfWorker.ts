// PDF.js worker configuration utility
// Handles setting up the worker with proper CSP compliance for Electron

let workerInitialized = false;

export async function setupPDFWorker(): Promise<void> {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Only set worker source if not already set or if it was reset
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc || pdfjsLib.GlobalWorkerOptions.workerSrc === '') {
    // Use relative path for Electron compatibility with base: './'
    // In production, this resolves to ./pdf.worker.min.mjs from the HTML file location.
    // PDF.js v4 ships an ESM-only worker (`.mjs`); the file is served from
    // public/ and copied to dist/ during build. It is loaded as a module worker.
    pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.mjs';
  }
  
  workerInitialized = true;
}

export function isWorkerInitialized(): boolean {
  return workerInitialized;
}

