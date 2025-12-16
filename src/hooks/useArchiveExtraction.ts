import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ExtractionProgress } from '../types';
import { useToast } from '../components/Toast/ToastContext';
import { setupPDFWorker } from '../utils/pdfWorker';
import { createChunkedPDFSource } from '../utils/pdfSource';
import { getUserFriendlyError } from '../utils/errorMessages';

export function useArchiveExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [extractingCasePath, setExtractingCasePath] = useState<string | null>(null);
  const [extractingFolderPath, setExtractingFolderPath] = useState<string | null>(null);
  const toast = useToast();

  const extractPDF = useCallback(async (
    pdfPath: string,
    casePath: string,
    folderName: string,
    saveParentFile: boolean,
    onProgress?: (progress: ExtractionProgress) => void
  ) => {
    setIsExtracting(true);
    setExtractingCasePath(casePath);
    // Set folder path for tracking extraction state
    const folderPath = `${casePath}/${folderName}`;
    setExtractingFolderPath(folderPath);
    setStatusMessage('Validating PDF file...');
    
    // Show a single persistent toast that will be updated with progress
    let extractionToastId: string | null = toast.info('Starting PDF extraction...', 0); // 0 duration = persistent
    
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

      // Setup PDF.js worker
      await setupPDFWorker();
      
      const fileData = await window.electronAPI.readPDFFile(pdfPath);
      
      // Load PDF document
      setStatusMessage('Loading PDF document...');
      setProgress({
        currentPage: 0,
        totalPages: 0,
        percentage: 10,
      });

      let pdf: any;
      
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

      const extractedPages: Array<{ pageNumber: number; imageData: string }> = [];

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

        extractedPages.push({
          pageNumber: pageNum,
          imageData,
        });

        // Update progress - calculate percentage with base 15% for initial steps
        // and 70% for the actual extraction (15% to 85%)
        const extractionProgress = (pageNum / totalPages) * 70;
        const currentProgress: ExtractionProgress = {
          currentPage: pageNum,
          totalPages,
          percentage: Math.round(15 + extractionProgress),
        };

        setProgress(currentProgress);
        if (onProgress) {
          onProgress(currentProgress);
        }

        // Update the persistent toast with progress (every page for small PDFs, every 5 for larger)
        if (extractionToastId) {
          if (totalPages <= 10) {
            // For small PDFs, update every page
            toast.updateToast(extractionToastId, `Extracting page ${pageNum} of ${totalPages}...`);
          } else if (pageNum % 5 === 0 || pageNum === totalPages) {
            // For larger PDFs, update every 5 pages
            toast.updateToast(extractionToastId, `Extracting ${pageNum} of ${totalPages} pages...`);
          }
        }
      }

      setStatusMessage('Saving extracted pages...');
      setProgress({
        currentPage: totalPages,
        totalPages,
        percentage: 85,
      });
      
      // Update toast to show saving status
      if (extractionToastId) {
        toast.updateToast(extractionToastId, 'Saving extracted pages to vault...');
      }

      // Save to archive
      const result = await window.electronAPI.extractPDFFromArchive({
        pdfPath,
        casePath,
        folderName,
        saveParentFile,
        extractedPages,
      });

      setStatusMessage('Extraction complete!');
      setProgress({
        currentPage: totalPages,
        totalPages,
        percentage: 100,
      });

      // Update the toast to success and auto-dismiss after 3 seconds
      if (extractionToastId) {
        toast.updateToast(extractionToastId, `Successfully extracted ${totalPages} page${totalPages !== 1 ? 's' : ''} to vault`, 'success');
        setTimeout(() => {
          toast.dismissToast(extractionToastId!);
        }, 3000);
      }
      
      setIsExtracting(false);
      setExtractingCasePath(null);
      setExtractingFolderPath(null);
      return result;
    } catch (err) {
      const errorMessage = getUserFriendlyError(err, { operation: 'PDF extraction', fileName: pdfPath });
      setStatusMessage('');
      setIsExtracting(false);
      setExtractingCasePath(null);
      setExtractingFolderPath(null);
      
      // Update the toast to show error and auto-dismiss after 5 seconds
      if (extractionToastId) {
        toast.updateToast(extractionToastId, errorMessage, 'error');
        setTimeout(() => {
          toast.dismissToast(extractionToastId);
        }, 5000);
      } else {
        toast.error(errorMessage);
      }
      
      throw new Error(errorMessage);
    }
  }, [toast]);

  const reset = useCallback(() => {
    setIsExtracting(false);
    setProgress(null);
    setStatusMessage('');
    setExtractingCasePath(null);
    setExtractingFolderPath(null);
  }, []);

  return {
    extractPDF,
    isExtracting,
    progress,
    statusMessage,
    extractingCasePath,
    extractingFolderPath,
    reset,
  };
}

