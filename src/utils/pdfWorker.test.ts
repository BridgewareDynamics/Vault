import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupPDFWorker } from './pdfWorker';

// Mock pdfjs-dist
const mockGlobalWorkerOptions = { workerSrc: '' };
vi.mock('pdfjs-dist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pdfjs-dist')>();
  return {
    ...actual,
    GlobalWorkerOptions: mockGlobalWorkerOptions,
  };
});

describe('pdfWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGlobalWorkerOptions.workerSrc = '';
  });

  it('should setup PDF worker with correct worker source', async () => {
    await setupPDFWorker();
    
    // Worker source should be set to the relative path (./pdf.worker.min.js)
    // Re-import to check the value was set (dynamic imports in the function may bypass mock)
    const pdfjsLib = await import('pdfjs-dist');
    // The workerSrc should be set - if mock worked, check mock object, otherwise check actual
    const workerSrc = pdfjsLib.GlobalWorkerOptions?.workerSrc || mockGlobalWorkerOptions.workerSrc;
    // The implementation uses relative path './pdf.worker.min.js' for Electron compatibility
    expect(workerSrc).toBe('./pdf.worker.min.js');
  });

  it('should handle worker setup without errors', async () => {
    await expect(setupPDFWorker()).resolves.not.toThrow();
  });
});

