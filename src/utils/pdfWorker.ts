// PDF.js worker configuration utility
// Handles setting up the worker with proper CSP compliance for Electron

let workerInitialized = false;

export async function setupPDFWorker(): Promise<void> {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Only set worker source if not already set or if it was reset
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc || pdfjsLib.GlobalWorkerOptions.workerSrc === '') {
    // Use relative path for Electron compatibility with base: './'
    // In production, this resolves to ./pdf.worker.min.js from the HTML file location
    // The worker file is copied to dist/ during build
    pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js';
  }
  
  workerInitialized = true;
}

export function isWorkerInitialized(): boolean {
  return workerInitialized;
}

