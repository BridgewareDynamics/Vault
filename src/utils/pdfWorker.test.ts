import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupPDFWorker } from './pdfWorker';

// Mock pdfjs-dist
const mockGlobalWorkerOptions = { workerSrc: '' };
vi.mock('pdfjs-dist', async () => {
  return {
    default: {
      GlobalWorkerOptions: mockGlobalWorkerOptions,
    },
  };
});

describe('pdfWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGlobalWorkerOptions.workerSrc = '';
  });

  it('should setup PDF worker with correct worker source', async () => {
    await setupPDFWorker();
    
    // Worker source should be set to the public path
    expect(mockGlobalWorkerOptions.workerSrc).toBe('/pdf.worker.min.js');
  });

  it('should handle worker setup without errors', async () => {
    await expect(setupPDFWorker()).resolves.not.toThrow();
  });
});

