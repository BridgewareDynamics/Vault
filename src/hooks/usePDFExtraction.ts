import { useState, useCallback } from 'react';
import { ExtractedPage, ExtractionProgress, PDFDocument } from '../types';
import { setupPDFWorker } from '../utils/pdfWorker';
import { getUserFriendlyError } from '../utils/errorMessages';
import { cleanupPDFBlobUrl } from '../utils/pdfSource';

export function usePDFExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [extractedPages, setExtractedPages] = useState<ExtractedPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const extractPDF = useCallback(async (pdfPath: string, onProgress?: (progress: ExtractionProgress) => void) => {
    setIsExtracting(true);
    setError(null);
    setExtractedPages([]);
    setStatusMessage('Validating PDF file...');
    
    // Show initial progress
    setProgress({
      currentPage: 0,
      totalPages: 0,
      percentage: 0,
    });

    try {
      // Validate PDF first
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      setStatusMessage('Validating PDF file...');
      await window.electronAPI.validatePDFForExtraction(pdfPath);

      // Read PDF file as array buffer via IPC
      setStatusMessage('Reading PDF file...');
      setProgress({
        currentPage: 0,
        totalPages: 0,
        percentage: 5,
      });

      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      // Setup PDF.js worker
      await setupPDFWorker();
      
      // Dynamically import pdfjs-dist and pdfSource for code splitting
      const [pdfjsLib, { createChunkedPDFSource }] = await Promise.all([
        import('pdfjs-dist'),
        import('../utils/pdfSource'),
      ]);
      
      const fileData = await window.electronAPI.readPDFFile(pdfPath);
      
      // Load PDF document
      setStatusMessage('Loading PDF document...');
      setProgress({
        currentPage: 0,
        totalPages: 0,
        percentage: 10,
      });

      let pdf: PDFDocument | null = null;
      
      try {
        // Handle new format with type field
        if (fileData && typeof fileData === 'object' && 'type' in fileData) {
          if (fileData.type === 'file-path') {
            // Large file - use chunked reading
            pdf = await createChunkedPDFSource(fileData.path, pdfjsLib);
          } else if (fileData.type === 'base64') {
            // Small file - decode base64
            const cleanBase64 = fileData.data.trim().replace(/\s/g, '');
            const binaryString = atob(cleanBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const arrayBuffer = bytes.buffer;
            pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          } else {
            throw new Error('Unexpected PDF file data format');
          }
        } else if (typeof fileData === 'string') {
          // Legacy format: base64 string
          const cleanBase64 = fileData.trim().replace(/\s/g, '');
          const binaryString = atob(cleanBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const arrayBuffer = bytes.buffer;
          pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        } else if (Array.isArray(fileData)) {
          // Legacy format: array of numbers
          const arrayBuffer = new Uint8Array(fileData).buffer;
          pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        } else {
          throw new Error('Unexpected PDF file data format');
        }
        const totalPages = pdf.numPages;

        setStatusMessage(`Found ${totalPages} page${totalPages !== 1 ? 's' : ''}. Starting extraction...`);
        setProgress({
          currentPage: 0,
          totalPages,
          percentage: 15,
        });

        const pages: ExtractedPage[] = [];

        // Extract each page with memory management
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          setStatusMessage(`Extracting page ${pageNum} of ${totalPages}...`);
          
          let page = null;
          let canvas: HTMLCanvasElement | null = null;
          
          try {
            page = await pdf.getPage(pageNum);
            
            // Use adaptive scale based on page size to prevent OOM
            // For large pages, use lower scale; for normal pages, use 1.5
            const baseViewport = page.getViewport({ scale: 1.0 });
            const pageArea = baseViewport.width * baseViewport.height;
            const maxArea = 1920 * 1080; // Full HD area
            const scale = pageArea > maxArea * 2 ? 1.0 : pageArea > maxArea ? 1.25 : 1.5;
            
            const viewport = page.getViewport({ scale });

            // Create canvas element
            canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d', { 
              willReadFrequently: false,
              alpha: false // Disable alpha channel to save memory
            });

            if (!context) {
              throw new Error('Failed to get canvas context');
            }

            // Render PDF page to canvas
            const renderTask = page.render({
              canvasContext: context,
              viewport: viewport,
            });
            
            await renderTask.promise;

            // Convert canvas to base64 JPEG with compression to reduce memory
            // JPEG is more memory-efficient than PNG for photos/documents
            const imageData = canvas.toDataURL('image/jpeg', 0.92);

            pages.push({
              pageNumber: pageNum,
              imagePath: '', // Not needed for renderer
              imageData,
            });

            // Clean up canvas immediately
            context.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = 0;
            canvas.height = 0;
            canvas = null;

            // Destroy page to free memory
            if (page) {
              page.cleanup();
              page = null;
            }

            // Force garbage collection hint every 5 pages
            if (pageNum % 5 === 0) {
              // Request garbage collection if available (Chrome DevTools with --js-flags=--expose-gc)
              if (typeof globalThis !== 'undefined' && (globalThis as any).gc) {
                (globalThis as any).gc();
              }
            }

            // Update progress - calculate percentage with base 15% for initial steps
            // and 85% for the actual extraction (15% to 100%)
            const extractionProgress = (pageNum / totalPages) * 85;
            const currentProgress: ExtractionProgress = {
              currentPage: pageNum,
              totalPages,
              percentage: Math.round(15 + extractionProgress),
            };

            setProgress(currentProgress);
            if (onProgress) {
              onProgress(currentProgress);
            }
          } catch (error) {
            // Clean up on error
            if (canvas) {
              canvas.width = 0;
              canvas.height = 0;
              canvas = null;
            }
            if (page) {
              try {
                page.cleanup();
              } catch (e) {
                // Ignore cleanup errors
              }
              page = null;
            }
            throw error;
          }
        }

        // Destroy PDF document to free memory
        if (pdf) {
          try {
            // Clean up blob URL if it exists
            cleanupPDFBlobUrl(pdf);
            await pdf.destroy();
          } catch (e) {
            // Ignore destroy errors
          }
          pdf = null;
        }

        setStatusMessage('Extraction complete!');
        setProgress({
          currentPage: totalPages,
          totalPages,
          percentage: 100,
        });

        setExtractedPages(pages);
        setIsExtracting(false);
        return pages;
      } finally {
        // Ensure PDF is destroyed even on error
        if (pdf) {
          try {
            // Clean up blob URL if it exists
            cleanupPDFBlobUrl(pdf);
            await pdf.destroy();
          } catch (e) {
            // Ignore destroy errors
          }
          pdf = null;
        }
      }
    } catch (err) {
      const errorMessage = getUserFriendlyError(err, { operation: 'PDF extraction', fileName: pdfPath });
      setError(errorMessage);
      setIsExtracting(false);
      throw new Error(errorMessage);
    }
  }, []);

  const reset = useCallback(() => {
    setIsExtracting(false);
    setProgress(null);
    setExtractedPages([]);
    setError(null);
    setStatusMessage('');
  }, []);

  return {
    extractPDF,
    isExtracting,
    progress,
    extractedPages,
    error,
    statusMessage,
    reset,
  };
}

