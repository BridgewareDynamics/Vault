import { useState, useCallback } from 'react';
import { ExtractedPage, ExtractionProgress, PDFDocument } from '../types';
import { setupPDFWorker } from '../utils/pdfWorker';
import { getUserFriendlyError } from '../utils/errorMessages';

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

      let pdf: PDFDocument;
      
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

      // Extract each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setStatusMessage(`Extracting page ${pageNum} of ${totalPages}...`);
        
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality

        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Failed to get canvas context');
        }

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Convert canvas to base64 PNG
        const imageData = canvas.toDataURL('image/png');

        pages.push({
          pageNumber: pageNum,
          imagePath: '', // Not needed for renderer
          imageData,
        });

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

