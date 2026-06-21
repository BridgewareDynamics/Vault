import { useState, useCallback, useRef } from 'react';
import { ExtractionProgress, PDFDocument } from '../types';
import { useToast } from '../components/Toast/ToastContext';
import { setupPDFWorker } from '../utils/pdfWorker';
import { getUserFriendlyError } from '../utils/errorMessages';
import { cleanupPDFBlobUrl } from '../utils/pdfSource';

export function useArchiveExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [extractingCasePath, setExtractingCasePath] = useState<string | null>(null);
  const [extractingFolderPath, setExtractingFolderPath] = useState<string | null>(null);
  const cancelRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const toast = useToast();

  const throwIfCancelled = (signal: AbortSignal) => {
    if (cancelRef.current || signal.aborted) {
      throw new DOMException('Extraction cancelled by user', 'AbortError');
    }
  };

  const isCancellationError = (err: unknown): boolean => {
    if (cancelRef.current) {
      return true;
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      return true;
    }
    if (err instanceof Error && err.message.toLowerCase().includes('cancelled')) {
      return true;
    }
    return false;
  };

  const extractPDF = useCallback(async (
    pdfPath: string,
    casePath: string,
    folderName: string,
    saveParentFile: boolean,
    onProgress?: (progress: ExtractionProgress) => void
  ) => {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const { signal } = abortController;

    cancelRef.current = false;
    setIsExtracting(true);
    setExtractingCasePath(casePath);
    const folderPath = `${casePath}/${folderName}`;
    setExtractingFolderPath(folderPath);
    setStatusMessage('Validating PDF file...');

    const extractionToastId: string | null = toast.info('Starting PDF extraction...', 0);

    setProgress({
      currentPage: 0,
      totalPages: 0,
      percentage: 0,
    });

    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      setStatusMessage('Validating PDF file...');
      await window.electronAPI.validatePDFForExtraction(pdfPath);
      throwIfCancelled(signal);

      setStatusMessage('Reading PDF file...');
      setProgress({
        currentPage: 0,
        totalPages: 0,
        percentage: 5,
      });

      await setupPDFWorker();

      const [pdfjsLib, { createChunkedPDFSource }] = await Promise.all([
        import('pdfjs-dist'),
        import('../utils/pdfSource'),
      ]);

      const fileData = await window.electronAPI.readPDFFile(pdfPath);
      throwIfCancelled(signal);

      setStatusMessage('Loading PDF document...');
      setProgress({
        currentPage: 0,
        totalPages: 0,
        percentage: 10,
      });

      let pdf: PDFDocument | null = null;

      try {
        if (fileData && typeof fileData === 'object' && 'type' in fileData) {
          if (fileData.type === 'file-path') {
            pdf = await createChunkedPDFSource(fileData.path, pdfjsLib, undefined, undefined, {
              skipWarning: true,
              signal,
            });
          } else if (fileData.type === 'base64') {
            const cleanBase64 = fileData.data.trim().replace(/\s/g, '');
            const binaryString = atob(cleanBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            pdf = await pdfjsLib.getDocument({ data: bytes.buffer }).promise;
          } else {
            throw new Error('Unexpected PDF file data format');
          }
        } else if (typeof fileData === 'string') {
          const cleanBase64 = fileData.trim().replace(/\s/g, '');
          const binaryString = atob(cleanBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          pdf = await pdfjsLib.getDocument({ data: bytes.buffer }).promise;
        } else if (Array.isArray(fileData)) {
          const arrayBuffer = new Uint8Array(fileData).buffer;
          pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        } else {
          throw new Error('Unexpected PDF file data format');
        }

        throwIfCancelled(signal);

        const totalPages = pdf.numPages;

        setStatusMessage(`Found ${totalPages} page${totalPages !== 1 ? 's' : ''}. Starting extraction...`);
        setProgress({
          currentPage: 0,
          totalPages,
          percentage: 15,
        });

        const extractedPages: Array<{ pageNumber: number; imageData: string; fileName: string }> = [];

        const generateFileName = (path: string, pageNumber: number): string => {
          const pdfBasename = path.replace(/\\/g, '/').split('/').pop()?.replace(/\.pdf$/i, '') || 'page';
          return `${pdfBasename}_page_${String(pageNumber).padStart(3, '0')}.jpg`;
        };

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          throwIfCancelled(signal);

          setStatusMessage(`Extracting page ${pageNum} of ${totalPages}...`);

          let page = null;
          let canvas: HTMLCanvasElement | null = null;

          try {
            page = await pdf.getPage(pageNum);

            const baseViewport = page.getViewport({ scale: 1.0 });
            const pageArea = baseViewport.width * baseViewport.height;
            const maxArea = 1920 * 1080;
            const scale = pageArea > maxArea * 2 ? 1.0 : pageArea > maxArea ? 1.25 : 1.5;

            const viewport = page.getViewport({ scale });

            canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d', {
              willReadFrequently: false,
              alpha: false,
            });

            if (!context) {
              throw new Error('Failed to get canvas context');
            }

            const renderTask = page.render({
              canvasContext: context,
              viewport: viewport,
            });

            let renderCancelled = false;
            const progressInterval = setInterval(() => {
              if (cancelRef.current || signal.aborted) {
                renderCancelled = true;
                clearInterval(progressInterval);
                renderTask.cancel();
              }
            }, 100);

            try {
              await renderTask.promise;
            } finally {
              clearInterval(progressInterval);
            }

            if (renderCancelled) {
              throw new DOMException('Extraction cancelled by user', 'AbortError');
            }

            const imageData = canvas.toDataURL('image/jpeg', 0.92);

            extractedPages.push({
              pageNumber: pageNum,
              imageData,
              fileName: generateFileName(pdfPath, pageNum),
            });

            context.clearRect(0, 0, canvas.width, canvas.height);
            if (canvas.parentNode) {
              canvas.parentNode.removeChild(canvas);
            }
            canvas.width = 0;
            canvas.height = 0;
            canvas = null;

            if (page) {
              page.cleanup();
              page = null;
            }

            if (pageNum % 5 === 0) {
              if (typeof globalThis !== 'undefined' && (globalThis as { gc?: () => void }).gc) {
                (globalThis as { gc?: () => void }).gc?.();
              }
            }

            const extractionProgress = (pageNum / totalPages) * 70;
            const currentProgress: ExtractionProgress = {
              currentPage: pageNum,
              totalPages,
              percentage: Math.round(15 + extractionProgress),
            };

            setProgress(currentProgress);
            onProgress?.(currentProgress);

            if (extractionToastId) {
              if (totalPages <= 10) {
                toast.updateToast(extractionToastId, `Extracting page ${pageNum} of ${totalPages}...`);
              } else if (pageNum % 5 === 0 || pageNum === totalPages) {
                toast.updateToast(extractionToastId, `Extracting ${pageNum} of ${totalPages} pages...`);
              }
            }
          } catch (error) {
            if (canvas) {
              canvas.width = 0;
              canvas.height = 0;
              canvas = null;
            }
            if (page) {
              try {
                page.cleanup();
              } catch {
                // Ignore cleanup errors
              }
              page = null;
            }
            throw error;
          }
        }

        if (pdf) {
          try {
            cleanupPDFBlobUrl(pdf);
            await pdf.destroy();
          } catch {
            // Ignore destroy errors
          }
          pdf = null;
        }

        throwIfCancelled(signal);

        setStatusMessage('Saving extracted pages...');
        setProgress({
          currentPage: totalPages,
          totalPages,
          percentage: 85,
        });

        if (extractionToastId) {
          toast.updateToast(extractionToastId, 'Saving extracted pages to vault...');
        }

        const result = await window.electronAPI.extractPDFFromArchive({
          pdfPath,
          casePath,
          folderName,
          saveParentFile,
          saveToZip: false,
          extractedPages,
        });

        extractedPages.length = 0;

        setStatusMessage('Extraction complete!');
        setProgress({
          currentPage: totalPages,
          totalPages,
          percentage: 100,
        });

        if (extractionToastId) {
          toast.updateToast(
            extractionToastId,
            `Successfully extracted ${totalPages} page${totalPages !== 1 ? 's' : ''} to vault`,
            'success',
          );
          setTimeout(() => {
            toast.dismissToast(extractionToastId!);
          }, 3000);
        }

        setIsExtracting(false);
        setExtractingCasePath(null);
        setExtractingFolderPath(null);
        return result;
      } finally {
        if (pdf) {
          try {
            cleanupPDFBlobUrl(pdf);
            await pdf.destroy();
          } catch {
            // Ignore destroy errors
          }
        }
      }
    } catch (err) {
      const cancelled = isCancellationError(err);
      const errorMessage = cancelled
        ? 'Extraction was cancelled by user'
        : getUserFriendlyError(err, { operation: 'PDF extraction', fileName: pdfPath });

      setStatusMessage(cancelled ? 'Extraction cancelled' : '');
      setIsExtracting(false);
      setExtractingCasePath(null);
      setExtractingFolderPath(null);

      if (extractionToastId) {
        toast.updateToast(extractionToastId, errorMessage, cancelled ? 'info' : 'error');
        setTimeout(() => {
          toast.dismissToast(extractionToastId);
        }, cancelled ? 3000 : 5000);
      } else if (!cancelled) {
        toast.error(errorMessage);
      }

      throw cancelled ? new DOMException(errorMessage, 'AbortError') : new Error(errorMessage);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [toast]);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    abortControllerRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = false;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
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
    cancel,
    reset,
  };
}
