// PDF.js worker configuration utility
// Handles setting up the worker with proper CSP compliance for Electron

export async function setupPDFWorker(): Promise<void> {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Use worker from public directory (served by Vite)
  // This respects CSP and doesn't require external resources
  // The worker file should be copied to public/ during build
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

