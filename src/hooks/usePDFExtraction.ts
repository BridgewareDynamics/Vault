import { useState, useCallback, useRef } from 'react';
import { ExtractedPage, ExtractionProgress, PDFDocument, ConversionSettings } from '../types';
import { setupPDFWorker } from '../utils/pdfWorker';
import { getUserFriendlyError } from '../utils/errorMessages';
import { cleanupPDFBlobUrl } from '../utils/pdfSource';

const DEFAULT_SETTINGS: ConversionSettings = {
  dpi: 150,
  quality: 85,
  format: 'jpeg',
  pageRange: 'all',
  colorSpace: 'rgb',
  compressionLevel: 6,
};

export function usePDFExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [extractedPages, setExtractedPages] = useState<ExtractedPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const cancelRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const pageTimesRef = useRef<number[]>([]);

  const calculateScale = (dpi: number, baseViewport: { width: number; height: number }): number => {
    // Calculate scale based on DPI
    // Standard DPI is 96, so for 150 DPI we want scale ~1.56
    // For 300 DPI we want scale ~3.125
    const baseScale = dpi / 96;
    
    // Use adaptive scale based on page size to prevent OOM
    const pageArea = baseViewport.width * baseViewport.height;
    const maxArea = 1920 * 1080; // Full HD area
    
    // For very large pages, cap the scale
    if (pageArea > maxArea * 4) {
      return Math.min(baseScale, 1.0);
    } else if (pageArea > maxArea * 2) {
      return Math.min(baseScale, 1.5);
    } else if (pageArea > maxArea) {
      return Math.min(baseScale, 2.0);
    }
    
    return baseScale;
  };

  const parseCustomPageRange = (customRange: string, totalPages: number): number[] => {
    const pages: number[] = [];
    const parts = customRange.split(',').map((p) => p.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const validStart = Math.max(1, Math.min(start, totalPages));
          const validEnd = Math.max(validStart, Math.min(end, totalPages));
          for (let i = validStart; i <= validEnd; i++) {
            if (!pages.includes(i)) pages.push(i);
          }
        }
      } else {
        const page = parseInt(part, 10);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
          if (!pages.includes(page)) pages.push(page);
        }
      }
    }
    
    return pages.sort((a, b) => a - b);
  };

  const getPagesToExtract = (
    totalPages: number,
    pageRange?: 'all' | 'custom' | 'selected',
    customPageRange?: string
  ): number[] => {
    if (!pageRange || pageRange === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (pageRange === 'custom' && customPageRange) {
      return parseCustomPageRange(customPageRange, totalPages);
    }

    // For 'selected', we'll need to get selected pages from elsewhere
    // For now, return all pages
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  };

  const estimateTimeRemaining = (
    currentPage: number,
    totalPages: number,
    pageTimes: number[]
  ): number | undefined => {
    if (pageTimes.length < 2) return undefined;

    // Calculate average time per page
    const avgTime = pageTimes.reduce((a, b) => a + b, 0) / pageTimes.length;
    const remainingPages = totalPages - currentPage;
    return avgTime * remainingPages;
  };

  const getMemoryUsage = async (): Promise<number | undefined> => {
    try {
      if (window.electronAPI?.getSystemMemory) {
        const memory = await window.electronAPI.getSystemMemory();
        return memory.usedMemory / (1024 * 1024); // Convert to MB
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  };

  const extractPDF = useCallback(
    async (
      pdfPath: string,
      settings: Partial<ConversionSettings> = {},
      onProgress?: (progress: ExtractionProgress) => void
    ) => {
      cancelRef.current = false;
      startTimeRef.current = Date.now();
      pageTimesRef.current = [];
      setIsExtracting(true);
      setError(null);
      setExtractedPages([]);
      setStatusMessage('Validating PDF file...');

      const finalSettings: ConversionSettings = { ...DEFAULT_SETTINGS, ...settings };

      // Show initial progress
      setProgress({
        currentPage: 0,
        totalPages: 0,
        percentage: 0,
        statusMessage: 'Validating PDF file...',
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
          statusMessage: 'Reading PDF file...',
        });

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
          statusMessage: 'Loading PDF document...',
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
          const pagesToExtract = getPagesToExtract(
            totalPages,
            finalSettings.pageRange,
            finalSettings.customPageRange
          );
          const totalPagesToExtract = pagesToExtract.length;

          if (pagesToExtract.length === 0) {
            throw new Error('No valid pages to extract');
          }

          setStatusMessage(
            `Found ${totalPages} page${totalPages !== 1 ? 's' : ''}. Extracting ${totalPagesToExtract} page${totalPagesToExtract !== 1 ? 's' : ''}...`
          );
          setProgress({
            currentPage: 0,
            totalPages: totalPagesToExtract,
            percentage: 15,
            statusMessage: `Found ${totalPages} page${totalPages !== 1 ? 's' : ''}. Starting extraction...`,
          });

          const pages: ExtractedPage[] = [];

          // Extract each page with memory management
          for (let idx = 0; idx < pagesToExtract.length; idx++) {
            if (cancelRef.current) {
              throw new Error('Extraction cancelled by user');
            }

            const pageNum = pagesToExtract[idx];
            const pageStartTime = Date.now();
            setStatusMessage(`Extracting page ${pageNum} of ${totalPages} (${idx + 1}/${totalPagesToExtract})...`);

            let page = null;
            let canvas: HTMLCanvasElement | null = null;

            try {
              page = await pdf.getPage(pageNum);

              // Calculate scale based on DPI
              const baseViewport = page.getViewport({ scale: 1.0 });
              const scale = calculateScale(finalSettings.dpi, baseViewport);
              const viewport = page.getViewport({ scale });

              // Create canvas element
              canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;

              const context = canvas.getContext('2d', {
                willReadFrequently: false,
                alpha: finalSettings.format === 'png', // Enable alpha for PNG
              });

              if (!context) {
                throw new Error('Failed to get canvas context');
              }

              // Apply color space conversion if needed
              if (finalSettings.colorSpace === 'grayscale') {
                context.filter = 'grayscale(100%)';
              }

              // Render PDF page to canvas with progress tracking
              const renderTask = page.render({
                canvasContext: context,
                viewport: viewport,
              });

              // Track render progress
              let renderProgress = 0;
              const progressInterval = setInterval(() => {
                renderProgress = Math.min(renderProgress + 10, 90);
                setProgress((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    currentPageProgress: renderProgress,
                    statusMessage: `Rendering page ${pageNum}...`,
                  };
                });
              }, 100);

              await renderTask.promise;
              clearInterval(progressInterval);

              // Convert canvas to image data based on format
              let imageData: string;
              if (finalSettings.format === 'png') {
                // PNG format
                imageData = canvas.toDataURL('image/png');
              } else {
                // JPEG format with quality
                const quality = finalSettings.quality / 100;
                imageData = canvas.toDataURL('image/jpeg', quality);
              }

              pages.push({
                pageNumber: pageNum,
                imagePath: '', // Not needed for renderer
                imageData,
              });

              // Track page processing time
              const pageTime = (Date.now() - pageStartTime) / 1000; // seconds
              pageTimesRef.current.push(pageTime);

              // Clean up canvas immediately to free memory
              context.clearRect(0, 0, canvas.width, canvas.height);
              if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
              }
              canvas.width = 0;
              canvas.height = 0;
              canvas = null;

              // Destroy page to free memory
              if (page) {
                page.cleanup();
                page = null;
              }

              // Force garbage collection hint every 5 pages
              if ((idx + 1) % 5 === 0) {
                if (typeof globalThis !== 'undefined' && (globalThis as any).gc) {
                  (globalThis as any).gc();
                }
              }

              // Update progress
              const extractionProgress = ((idx + 1) / totalPagesToExtract) * 85;
              const estimatedTime = estimateTimeRemaining(
                idx + 1,
                totalPagesToExtract,
                pageTimesRef.current
              );
              const memoryUsage = await getMemoryUsage();

              const currentProgress: ExtractionProgress = {
                currentPage: idx + 1,
                totalPages: totalPagesToExtract,
                percentage: Math.round(15 + extractionProgress),
                currentPageProgress: 100,
                estimatedTimeRemaining: estimatedTime,
                memoryUsage,
                statusMessage: `Extracted page ${pageNum} (${idx + 1}/${totalPagesToExtract})`,
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
              cleanupPDFBlobUrl(pdf);
              await pdf.destroy();
            } catch (e) {
              // Ignore destroy errors
            }
            pdf = null;
          }

          setStatusMessage('Extraction complete!');
          setProgress({
            currentPage: totalPagesToExtract,
            totalPages: totalPagesToExtract,
            percentage: 100,
            currentPageProgress: 100,
            statusMessage: 'Extraction complete!',
          });

          setExtractedPages(pages);
          setIsExtracting(false);
          return pages;
        } finally {
          // Ensure PDF is destroyed even on error
          if (pdf) {
            try {
              cleanupPDFBlobUrl(pdf);
              await pdf.destroy();
            } catch (e) {
              // Ignore destroy errors
            }
            pdf = null;
          }
        }
      } catch (err) {
        if (cancelRef.current) {
          setStatusMessage('Extraction cancelled');
          setError('Extraction was cancelled by user');
        } else {
          const errorMessage = getUserFriendlyError(err, {
            operation: 'PDF extraction',
            fileName: pdfPath,
          });
          setError(errorMessage);
        }
        setIsExtracting(false);
        throw err;
      }
    },
    []
  );

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = false;
    setIsExtracting(false);
    setProgress(null);
    setExtractedPages([]);
    setError(null);
    setStatusMessage('');
    startTimeRef.current = null;
    pageTimesRef.current = [];
  }, []);

  return {
    extractPDF,
    isExtracting,
    progress,
    extractedPages,
    error,
    statusMessage,
    cancel,
    reset,
  };
}
