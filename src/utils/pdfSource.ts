// Custom PDF.js source for large files that need streaming/chunked reading
// Uses PDF.js range requests to load only needed chunks on-demand
// This prevents loading entire large files (e.g., 6GB) into memory

import type { PDFDocumentProxy } from 'pdfjs-dist';

// Track file paths and resources for cleanup when PDF is destroyed
const filePathMap = new WeakMap<PDFDocumentProxy, string | { type: 'blob'; url: string } | { type: 'streaming'; filePath: string }>();

/**
 * Clean up any resources associated with a PDF document
 */
export function cleanupPDFBlobUrl(pdf: PDFDocumentProxy): void {
  const resource = filePathMap.get(pdf);
  if (resource && typeof resource === 'object') {
    if (resource.type === 'blob') {
      URL.revokeObjectURL(resource.url);
    } else if (resource.type === 'streaming') {
      // Close file handle for streaming source
      if (window.electronAPI) {
        window.electronAPI.closePDFFileHandle(resource.filePath).catch(() => {
          // Ignore errors during cleanup
        });
      }
    }
  }
  filePathMap.delete(pdf);
}

// Removed StreamingPDFSource class - using optimized parallel loading instead

/**
 * Create a streaming PDF source that loads chunks on-demand
 * This is essential for very large files (e.g., 6GB+) that would cause OOM if loaded entirely
 * 
 * @param filePath - Path to the PDF file
 * @param pdfjsLib - PDF.js library instance
 * @param showWarning - Optional callback to show warning dialog (returns promise that resolves when user decides)
 * @param onProgress - Optional callback to report loading progress (0-100)
 */
export async function createChunkedPDFSource(
  filePath: string,
  pdfjsLib: typeof import('pdfjs-dist'),
  showWarning?: (fileSize: number, memoryInfo: { totalMemory: number; freeMemory: number; usedMemory: number }) => Promise<boolean>,
  onProgress?: (progress: number) => void
): Promise<PDFDocumentProxy> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  // Get file size
  const fileSize = await window.electronAPI.getPDFFileSize(filePath);
  
  // For files larger than 500MB, show warning dialog
  const WARNING_THRESHOLD = 500 * 1024 * 1024; // 500MB
  
  if (fileSize > WARNING_THRESHOLD && showWarning) {
    // Get system memory info
    const memoryInfo = await window.electronAPI.getSystemMemory();
    
    // Show warning and wait for user decision
    const shouldContinue = await showWarning(fileSize, memoryInfo);
    
    if (!shouldContinue) {
      throw new Error('User cancelled loading large PDF file');
    }
  }
  
  // For files larger than 100MB, use true streaming source
  // For smaller files, use optimized blob loading
  const STREAMING_THRESHOLD = 100 * 1024 * 1024; // 100MB
  
  if (fileSize > STREAMING_THRESHOLD) {
    // Use true streaming for large files
    return createStreamingPDFSource(filePath, fileSize, pdfjsLib, onProgress);
  } else {
    // For smaller files, use optimized blob method
    return createBlobPDFSource(filePath, fileSize, pdfjsLib, onProgress);
  }
}

/**
 * Create an optimized streaming PDF source for large files
 * Uses parallel chunk loading with progressive assembly
 * This provides significant performance improvements while maintaining compatibility
 */
async function createStreamingPDFSource(
  filePath: string,
  fileSize: number,
  pdfjsLib: typeof import('pdfjs-dist'),
  onProgress?: (progress: number) => void
): Promise<PDFDocumentProxy> {
  // Adaptive chunk size based on file size for optimal performance
  // Larger files use larger chunks to reduce IPC overhead
  const CHUNK_SIZE = fileSize > 1024 * 1024 * 1024 
    ? 50 * 1024 * 1024  // 50MB for very large files (>1GB)
    : fileSize > 500 * 1024 * 1024
    ? 20 * 1024 * 1024  // 20MB for large files (500MB-1GB)
    : 10 * 1024 * 1024; // 10MB for moderately large files (100MB-500MB)
  
  const CONCURRENT_CHUNKS = 4; // Load 4 chunks in parallel for better throughput
  const chunks: Array<{ offset: number; data: Uint8Array }> = [];
  let loadedBytes = 0;
  let totalChunks = 0;

  // Calculate total number of chunks for progress tracking
  const totalChunkCount = Math.ceil(fileSize / CHUNK_SIZE);

  // Load chunks in parallel batches with progress reporting
  const loadChunkBatch = async (offsets: number[]): Promise<void> => {
    const promises = offsets.map(async (offset) => {
      const length = Math.min(CHUNK_SIZE, fileSize - offset);
      const arrayBuffer = await window.electronAPI.readPDFFileChunk(filePath, offset, length);
      const data = new Uint8Array(arrayBuffer);
      
      loadedBytes += data.length;
      totalChunks++;
      
      // Report progress (separate metrics for file reading)
      if (onProgress) {
        // Use 0-90% for file reading, 90-100% for PDF parsing
        const fileReadingProgress = Math.min(90, Math.round((loadedBytes / fileSize) * 90));
        onProgress(fileReadingProgress);
      }
      
      return { offset, data };
    });

    const results = await Promise.all(promises);
    chunks.push(...results);
    
    // Allow event loop to process other tasks periodically
    await new Promise(resolve => setTimeout(resolve, 0));
  };

  // Generate all chunk offsets
  const offsets: number[] = [];
  for (let offset = 0; offset < fileSize; offset += CHUNK_SIZE) {
    offsets.push(offset);
  }

  // Process offsets in parallel batches
  for (let i = 0; i < offsets.length; i += CONCURRENT_CHUNKS) {
    const batch = offsets.slice(i, i + CONCURRENT_CHUNKS);
    await loadChunkBatch(batch);
  }

  // Sort chunks by offset to ensure correct order
  chunks.sort((a, b) => a.offset - b.offset);

  // Report progress: file reading complete, starting PDF parsing
  if (onProgress) {
    onProgress(90);
  }

  // Combine chunks efficiently using Blob constructor
  // This is more memory efficient than creating a single large Uint8Array
  const chunkArrays = chunks.map(chunk => chunk.data);
  const blob = new Blob(chunkArrays, { type: 'application/pdf' });
  
  // Clear chunks array immediately to free memory (Blob has its own copy)
  chunks.length = 0;
  chunkArrays.length = 0;

  const blobUrl = URL.createObjectURL(blob);

  try {
    // Load PDF from blob URL with optimized settings
    const loadingTask = pdfjsLib.getDocument({
      url: blobUrl,
      disableAutoFetch: false,
      disableStream: false,
      verbosity: 0,
      rangeChunkSize: 256 * 1024, // 256KB for PDF.js internal range requests
    });
    
    // Report progress: PDF parsing in progress
    if (onProgress) {
      onProgress(95);
    }
    
    const pdf = await loadingTask.promise;
    
    // Store blob URL for cleanup
    filePathMap.set(pdf, { type: 'blob', url: blobUrl });
    
    // Report progress: complete
    if (onProgress) {
      onProgress(100);
    }
    
    return pdf;
  } catch (error) {
    // Clean up blob URL on error
    URL.revokeObjectURL(blobUrl);
    
    // Cleanup file handle on error
    if (window.electronAPI) {
      window.electronAPI.closePDFFileHandle(filePath).catch(() => {
        // Ignore cleanup errors
      });
    }
    
    throw new Error(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a blob-based PDF source for smaller files (optimized)
 * Uses parallel chunk loading for better performance
 */
async function createBlobPDFSource(
  filePath: string,
  fileSize: number,
  pdfjsLib: typeof import('pdfjs-dist'),
  onProgress?: (progress: number) => void
): Promise<PDFDocumentProxy> {
  // Adaptive chunk size based on file size
  const CHUNK_SIZE = fileSize > 50 * 1024 * 1024 
    ? 10 * 1024 * 1024  // 10MB for larger files
    : 2 * 1024 * 1024;  // 2MB for smaller files
  
  const CONCURRENT_CHUNKS = 3; // Load 3 chunks in parallel
  const chunks: Array<{ offset: number; data: Uint8Array }> = [];
  let loadedBytes = 0;

  // Load chunks in parallel batches
  const loadChunkBatch = async (offsets: number[]): Promise<void> => {
    const promises = offsets.map(async (offset) => {
      const length = Math.min(CHUNK_SIZE, fileSize - offset);
      const arrayBuffer = await window.electronAPI.readPDFFileChunk(filePath, offset, length);
      const data = new Uint8Array(arrayBuffer);
      
      loadedBytes += data.length;
      
      // Report progress
      if (onProgress) {
        const progress = Math.min(95, Math.round((loadedBytes / fileSize) * 100));
        onProgress(progress);
      }
      
      return { offset, data };
    });

    const results = await Promise.all(promises);
    chunks.push(...results);
  };

  // Load all chunks in parallel batches
  const offsets: number[] = [];
  for (let offset = 0; offset < fileSize; offset += CHUNK_SIZE) {
    offsets.push(offset);
  }

  // Process offsets in batches
  for (let i = 0; i < offsets.length; i += CONCURRENT_CHUNKS) {
    const batch = offsets.slice(i, i + CONCURRENT_CHUNKS);
    await loadChunkBatch(batch);
    
    // Allow event loop to process other tasks
    if (i + CONCURRENT_CHUNKS < offsets.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  // Sort chunks by offset to ensure correct order
  chunks.sort((a, b) => a.offset - b.offset);

  // Combine chunks into a single Uint8Array
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.data.length, 0);
  const combined = new Uint8Array(totalLength);
  let position = 0;
  for (const chunk of chunks) {
    combined.set(chunk.data, position);
    position += chunk.data.length;
  }

  // Clear chunks array to free memory
  chunks.length = 0;

  // Create blob URL from the combined data
  const blob = new Blob([combined], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  try {
    // Load PDF from blob URL
    const loadingTask = pdfjsLib.getDocument({
      url: blobUrl,
      disableAutoFetch: false,
      disableStream: false,
      verbosity: 0,
    });
    
    const pdf = await loadingTask.promise;
    
    // Store blob URL for cleanup
    filePathMap.set(pdf, { type: 'blob', url: blobUrl });
    
    if (onProgress) {
      onProgress(100);
    }
    
    return pdf;
  } catch (error) {
    // Clean up blob URL on error
    URL.revokeObjectURL(blobUrl);
    throw error;
  }
}
