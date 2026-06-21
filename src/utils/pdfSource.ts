// Custom PDF.js source for large files that need streaming/chunked reading
// Uses PDF.js range requests to load only needed chunks on-demand
// This prevents loading entire large files (e.g., 6GB) into memory

import type { PDFDocumentProxy } from 'pdfjs-dist';
import { logger } from './logger';

/** Align with IPC base64 crossover — strategy boundary, not a file-size cap. */
export const STREAMING_THRESHOLD_BYTES = 64 * 1024 * 1024;

const WARNING_THRESHOLD_BYTES = 500 * 1024 * 1024;

export type CreateChunkedPDFSourceOptions = {
  /** Skip the 500MB warning dialog (e.g. background thumbnail generation). */
  skipWarning?: boolean;
  /** Abort in-flight range chunk reads when the viewer switches files. */
  signal?: AbortSignal;
};

// Track file paths and resources for cleanup when PDF is destroyed
const filePathMap = new WeakMap<
  PDFDocumentProxy,
  string | { type: 'blob'; url: string; filePath: string } | { type: 'streaming'; filePath: string }
>();

/**
 * Clean up any resources associated with a PDF document
 */
export function cleanupPDFBlobUrl(pdf: PDFDocumentProxy): void {
  const resource = filePathMap.get(pdf);
  if (resource && typeof resource === 'object') {
    if (resource.type === 'blob') {
      URL.revokeObjectURL(resource.url);
      if (window.electronAPI) {
        window.electronAPI.closePDFFileHandle(resource.filePath).catch(() => {
          // Ignore errors during cleanup
        });
      }
    } else if (resource.type === 'streaming') {
      if (window.electronAPI) {
        window.electronAPI.closePDFFileHandle(resource.filePath).catch(() => {
          // Ignore errors during cleanup
        });
      }
    }
  }
  filePathMap.delete(pdf);
}

/**
 * Create a streaming PDF source that loads chunks on-demand
 */
export async function createChunkedPDFSource(
  filePath: string,
  pdfjsLib: typeof import('pdfjs-dist'),
  showWarning?: (
    fileSize: number,
    memoryInfo: { totalMemory: number; freeMemory: number; usedMemory: number },
  ) => Promise<boolean>,
  onProgress?: (progress: number) => void,
  options?: CreateChunkedPDFSourceOptions,
): Promise<PDFDocumentProxy> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  if (options?.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const fileSize = await window.electronAPI.getPDFFileSize(filePath);

  if (fileSize > WARNING_THRESHOLD_BYTES && showWarning && !options?.skipWarning) {
    const memoryInfo = await window.electronAPI.getSystemMemory();
    const shouldContinue = await showWarning(fileSize, memoryInfo);

    if (!shouldContinue) {
      throw new Error('User cancelled loading large PDF file');
    }
  }

  if (options?.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (fileSize > STREAMING_THRESHOLD_BYTES) {
    return createRangePDFSource(filePath, fileSize, pdfjsLib, onProgress, options?.signal);
  }

  return createBlobPDFSource(filePath, fileSize, pdfjsLib, onProgress, options?.signal);
}

type RangeTransportInstance = {
  requestDataRange: (begin: number, end: number) => void;
  onDataRange: (begin: number, chunk: ArrayBuffer | Uint8Array) => void;
  onDataProgress: (loaded: number, total: number) => void;
};

type PDFJSWithRangeTransport = typeof import('pdfjs-dist') & {
  PDFDataRangeTransport: new (length: number, initialData: Uint8Array) => RangeTransportInstance;
};

/**
 * Load large PDFs via PDF.js range transport (lazy chunk reads over IPC).
 */
async function createRangePDFSource(
  filePath: string,
  fileSize: number,
  pdfjsLib: typeof import('pdfjs-dist'),
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<PDFDocumentProxy> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  const PDFDataRangeTransport = (pdfjsLib as PDFJSWithRangeTransport).PDFDataRangeTransport;
  if (!PDFDataRangeTransport) {
    throw new Error('PDF.js PDFDataRangeTransport is not available');
  }

  let failed = false;
  let loadingTask: { promise: Promise<PDFDocumentProxy>; destroy: () => void } | null = null;

  const closeHandle = () => {
    if (window.electronAPI) {
      window.electronAPI.closePDFFileHandle(filePath).catch(() => {
        // Ignore cleanup errors
      });
    }
  };

  const failLoad = (error: unknown) => {
    if (failed) {
      return;
    }
    failed = true;
    try {
      loadingTask?.destroy();
    } catch {
      // Ignore destroy errors
    }
    closeHandle();
    logger.error('PDF range load failed:', error);
  };

  const INITIAL_HEADER_SIZE = Math.min(256 * 1024, fileSize);
  const headerBuffer = await window.electronAPI.readPDFFileChunk(filePath, 0, INITIAL_HEADER_SIZE);
  if (signal?.aborted) {
    closeHandle();
    throw new DOMException('Aborted', 'AbortError');
  }

  const initialData = new Uint8Array(headerBuffer);
  const transport = new PDFDataRangeTransport(fileSize, initialData);

  let highestLoadedByte = initialData.length;

  transport.requestDataRange = (begin: number, end: number) => {
    if (failed || signal?.aborted) {
      return;
    }

    void (async () => {
      try {
        const length = end - begin;
        const arrayBuffer = await window.electronAPI!.readPDFFileChunk(filePath, begin, length);
        if (failed || signal?.aborted) {
          return;
        }
        const chunk = new Uint8Array(arrayBuffer);
        highestLoadedByte = Math.max(highestLoadedByte, begin + chunk.length);
        if (onProgress) {
          onProgress(Math.min(90, Math.round((highestLoadedByte / fileSize) * 90)));
        }
        transport.onDataRange(begin, chunk);
      } catch (error) {
        logger.error('Failed to load PDF range chunk:', error);
        failLoad(error);
      }
    })();
  };

  if (onProgress) {
    onProgress(Math.min(90, Math.round((INITIAL_HEADER_SIZE / fileSize) * 90)));
  }

  const onAbort = () => {
    if (!failed) {
      failed = true;
      try {
        loadingTask?.destroy();
      } catch {
        // Ignore destroy errors
      }
      closeHandle();
    }
  };

  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    loadingTask = pdfjsLib.getDocument({
      range: transport,
      length: fileSize,
      disableAutoFetch: false,
      disableStream: false,
      verbosity: 0,
      rangeChunkSize: 256 * 1024,
    });

    if (onProgress) {
      onProgress(95);
    }

    const pdf = await loadingTask.promise;

    if (failed || signal?.aborted) {
      try {
        cleanupPDFBlobUrl(pdf);
        await pdf.destroy();
      } catch {
        // Ignore cleanup errors
      }
      throw new DOMException('Aborted', 'AbortError');
    }

    filePathMap.set(pdf, { type: 'streaming', filePath });

    if (onProgress) {
      onProgress(100);
    }

    return pdf;
  } catch (error) {
    closeHandle();
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new Error(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}

async function createBlobPDFSource(
  filePath: string,
  fileSize: number,
  pdfjsLib: typeof import('pdfjs-dist'),
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<PDFDocumentProxy> {
  const throwIfAborted = (): void => {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
  };

  const closeHandle = (): void => {
    void Promise.resolve(window.electronAPI?.closePDFFileHandle?.(filePath)).catch(() => {
      // Ignore cleanup errors
    });
  };

  const CHUNK_SIZE = fileSize > 50 * 1024 * 1024
    ? 10 * 1024 * 1024
    : 2 * 1024 * 1024;

  const CONCURRENT_CHUNKS = 3;
  const chunks: Array<{ offset: number; data: Uint8Array }> = [];
  let loadedBytes = 0;

  const loadChunkBatch = async (offsets: number[]): Promise<void> => {
    throwIfAborted();

    const promises = offsets.map(async (offset) => {
      throwIfAborted();
      const length = Math.min(CHUNK_SIZE, fileSize - offset);
      const arrayBuffer = await window.electronAPI!.readPDFFileChunk(filePath, offset, length);
      throwIfAborted();
      const data = new Uint8Array(arrayBuffer);

      loadedBytes += data.length;

      if (onProgress) {
        const progress = Math.min(95, Math.round((loadedBytes / fileSize) * 100));
        onProgress(progress);
      }

      return { offset, data };
    });

    const results = await Promise.all(promises);
    chunks.push(...results);
  };

  const offsets: number[] = [];
  for (let offset = 0; offset < fileSize; offset += CHUNK_SIZE) {
    offsets.push(offset);
  }

  try {
    for (let i = 0; i < offsets.length; i += CONCURRENT_CHUNKS) {
      throwIfAborted();
      const batch = offsets.slice(i, i + CONCURRENT_CHUNKS);
      await loadChunkBatch(batch);

      if (i + CONCURRENT_CHUNKS < offsets.length) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    throwIfAborted();

    chunks.sort((a, b) => a.offset - b.offset);

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.data.length, 0);
  const combined = new Uint8Array(totalLength);
  let position = 0;
  for (const chunk of chunks) {
    combined.set(chunk.data, position);
    position += chunk.data.length;
  }

  chunks.length = 0;

  const blob = new Blob([combined], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const loadingTask = pdfjsLib.getDocument({
      url: blobUrl,
      disableAutoFetch: false,
      disableStream: false,
      verbosity: 0,
    });

      const pdf = await loadingTask.promise;

      throwIfAborted();

      filePathMap.set(pdf, { type: 'blob', url: blobUrl, filePath });

    if (onProgress) {
      onProgress(100);
    }

    return pdf;
    } catch (error) {
      URL.revokeObjectURL(blobUrl);
      closeHandle();

      if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        throw new DOMException('Aborted', 'AbortError');
      }

      throw error;
    }
  } catch (error) {
    closeHandle();

    if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      throw new DOMException('Aborted', 'AbortError');
    }

    throw error;
  }
}
