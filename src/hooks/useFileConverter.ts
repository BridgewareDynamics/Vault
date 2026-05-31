import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FileConverterProgress,
  FileConverterResult,
  FileConverterSource,
  FileConverterTarget,
  FileConverterCapabilities,
  PDFDocument,
} from '../types';
import { setupPDFWorker } from '../utils/pdfWorker';
import { getUserFriendlyError } from '../utils/errorMessages';
import {
  getCachedFileConverterCapabilities,
  prefetchFileConverterCapabilities,
} from '../utils/fileConverterPrefetch';

function detectCategoryFromPath(filePath: string): FileConverterSource['category'] | null {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'webp', 'tiff', 'tif', 'bmp'].includes(ext)) {
    return 'image';
  }
  if (ext === 'gif') {
    return 'gif';
  }
  if (ext === 'pdf') {
    return 'pdf';
  }
  if (['mp4', 'mov', 'mkv', 'webm', 'avi', 'wmv', 'flv'].includes(ext)) {
    return 'video';
  }
  return null;
}

async function renderPdfPages(
  pdfPath: string,
  dpi: number,
  onProgress: (percent: number, message: string) => void
): Promise<Array<{ pageNumber: number; imageData: string }>> {
  if (!window.electronAPI?.readPDFFile) {
    throw new Error('Electron API not available');
  }

  setupPDFWorker();
  const pdfjsLib = await import('pdfjs-dist');

  const pdfData = await window.electronAPI.readPDFFile(pdfPath);
  let loadingTask;

  if (typeof pdfData === 'object' && pdfData !== null && 'type' in pdfData) {
    if (pdfData.type === 'base64') {
      loadingTask = pdfjsLib.getDocument({ data: atob(pdfData.data) });
    } else {
      loadingTask = pdfjsLib.getDocument({ url: pdfData.path });
    }
  } else if (typeof pdfData === 'string') {
    loadingTask = pdfjsLib.getDocument({ data: atob(pdfData) });
  } else {
    throw new Error('Unsupported PDF data format');
  }

  const pdf = (await loadingTask.promise) as PDFDocument;
  const pages: Array<{ pageNumber: number; imageData: string }> = [];
  const scale = dpi / 96;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress(Math.round((pageNum / pdf.numPages) * 50), `Rendering page ${pageNum} of ${pdf.numPages}…`);
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not create canvas context');
    }

    await page.render({ canvasContext: context, viewport }).promise;
    pages.push({ pageNumber: pageNum, imageData: canvas.toDataURL('image/jpeg', 0.92) });
    canvas.width = 0;
    canvas.height = 0;
  }

  return pages;
}

export function useFileConverter() {
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<FileConverterProgress | null>(null);
  const [result, setResult] = useState<FileConverterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<FileConverterCapabilities | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    const cached = getCachedFileConverterCapabilities();
    if (cached) {
      setCapabilities(cached);
      return;
    }
    void prefetchFileConverterCapabilities().then((caps) => {
      if (caps) {
        setCapabilities(caps);
      }
    });
  }, []);

  useEffect(() => {
    if (!window.electronAPI?.onFileConverterProgress) {
      return;
    }
    const unsubscribe = window.electronAPI.onFileConverterProgress((event) => {
      setProgress(event);
    });
    return unsubscribe;
  }, []);

  const reset = useCallback(() => {
    setIsConverting(false);
    setProgress(null);
    setResult(null);
    setError(null);
    cancelRef.current = false;
  }, []);

  const cancel = useCallback(async () => {
    cancelRef.current = true;
    if (window.electronAPI?.cancelFileConversion) {
      await window.electronAPI.cancelFileConversion();
    }
    setIsConverting(false);
    setProgress(null);
  }, []);

  const convert = useCallback(
    async (source: FileConverterSource, target: FileConverterTarget) => {
      if (!window.electronAPI?.convertFile) {
        setError('Electron API not available');
        return null;
      }

      setIsConverting(true);
      setError(null);
      setResult(null);
      setProgress({
        percent: 0,
        statusMessage: 'Starting conversion…',
        phase: 'preparing',
        cancellable: true,
      });

      try {
        let renderedPages: Array<{ pageNumber: number; imageData: string }> | undefined;

        if (source.category === 'pdf' && target.format !== 'pdf') {
          renderedPages = await renderPdfPages(
            source.sourcePath,
            target.dpi ?? 150,
            (percent, message) => {
              setProgress({
                percent,
                statusMessage: message,
                phase: 'preparing',
                cancellable: true,
              });
            }
          );
        } else if (source.category === 'pdf' && target.format === 'pdf') {
          renderedPages = await renderPdfPages(source.sourcePath, target.dpi ?? 150, (percent, message) => {
            setProgress({ percent, statusMessage: message, phase: 'preparing', cancellable: true });
          });
        }

        if (cancelRef.current) {
          return null;
        }

        const conversionResult = await window.electronAPI.convertFile({
          sourcePath: source.sourcePath,
          outputFormat: target.format,
          quality: target.quality ?? 85,
          dpi: target.dpi ?? 150,
          renderedPages,
        });

        if (!conversionResult.success) {
          throw new Error(conversionResult.error ?? 'Conversion failed');
        }

        const nextResult: FileConverterResult = {
          outputPath: conversionResult.outputPath,
          outputPaths: conversionResult.outputPaths,
        };
        setResult(nextResult);
        setProgress({
          percent: 100,
          statusMessage: 'Conversion complete',
          phase: 'complete',
          cancellable: false,
        });
        return nextResult;
      } catch (err) {
        const message = getUserFriendlyError(err, { operation: 'file conversion' });
        setError(message);
        return null;
      } finally {
        setIsConverting(false);
      }
    },
    []
  );

  const buildSourceFromPath = useCallback(
    (
      sourcePath: string,
      origin: FileConverterSource['origin'],
      casePath?: string | null
    ): FileConverterSource | null => {
      const category = detectCategoryFromPath(sourcePath);
      if (!category) {
        return null;
      }
      const fileName = sourcePath.split(/[/\\]/).pop() ?? sourcePath;
      return { origin, casePath, sourcePath, fileName, category };
    },
    []
  );

  return {
    convert,
    cancel,
    reset,
    isConverting,
    progress,
    result,
    error,
    capabilities,
    buildSourceFromPath,
  };
}

export { detectCategoryFromPath };
