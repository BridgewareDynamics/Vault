// Custom PDF.js source for large files that need chunked reading
// Reads file in chunks via IPC and creates a blob URL for PDF.js

import type { PDFDocumentProxy } from 'pdfjs-dist';

export async function createChunkedPDFSource(
  filePath: string,
  pdfjsLib: typeof import('pdfjs-dist')
): Promise<PDFDocumentProxy> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  // Get file size
  const fileSize = await window.electronAPI.getPDFFileSize(filePath);
  const chunkSize = 2 * 1024 * 1024; // 2MB chunks
  
  // Read file in chunks and assemble into a blob
  const chunks: Uint8Array[] = [];
  let offset = 0;
  
  while (offset < fileSize) {
    const length = Math.min(chunkSize, fileSize - offset);
    const chunkBase64 = await window.electronAPI.readPDFFileChunk(filePath, offset, length);
    
    // Decode base64 chunk
    const cleanBase64 = chunkBase64.trim().replace(/\s/g, '');
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    chunks.push(bytes);
    offset += length;
  }
  
  // Combine all chunks into a single Uint8Array
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let position = 0;
  for (const chunk of chunks) {
    combined.set(chunk, position);
    position += chunk.length;
  }
  
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
    
    // Clean up blob URL after a delay (PDF.js may still need it)
    // We'll clean it up when the PDF is closed/destroyed
    // For now, we'll keep it - the browser will clean it up when the page unloads
    
    return pdf;
  } catch (error) {
    // Clean up blob URL on error
    URL.revokeObjectURL(blobUrl);
    throw error;
  }
}

