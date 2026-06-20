import { setupPDFWorker } from './pdfWorker';
import { logger } from './logger';

export interface GeneratePdfThumbnailOptions {
  /** Max width/height in pixels (default 200). */
  maxSize?: number;
  /** Cancel in-flight PDF reads when the caller no longer needs the thumbnail. */
  signal?: AbortSignal;
}

function createPdfPlaceholderDataUrl(): string {
  const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a2e"/>
    <text x="50%" y="50%" font-size="64" text-anchor="middle" dominant-baseline="middle" fill="#8b5cf6">📄</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

export function isPdfPlaceholderThumbnail(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/svg+xml');
}

/**
 * Renders the first page of a PDF to a JPEG data URL (renderer / pdf.js).
 */
export async function generatePdfThumbnailInRenderer(
  filePath: string,
  options: GeneratePdfThumbnailOptions = {}
): Promise<string> {
  const maxSize = options.maxSize ?? 200;
  let pdf: any = null;
  let page: any = null;
  let canvas: HTMLCanvasElement | null = null;

  try {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    if (options.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const pdfjsLib = await import('pdfjs-dist');
    await setupPDFWorker();
    const { createChunkedPDFSource, cleanupPDFBlobUrl } = await import('./pdfSource');

    pdf = await createChunkedPDFSource(filePath, pdfjsLib, undefined, undefined, {
      skipWarning: true,
      signal: options.signal,
    });

    if (options.signal?.aborted) {
      cleanupPDFBlobUrl(pdf);
      await pdf.destroy();
      pdf = null;
      throw new DOMException('Aborted', 'AbortError');
    }

    page = (await pdf.getPage(1)) as typeof page;

    const baseViewport = page!.getViewport({ scale: 1.0 });
    const aspectRatio = baseViewport.width / baseViewport.height;
    let width = maxSize;
    let height = maxSize;

    if (aspectRatio > 1) {
      height = maxSize / aspectRatio;
    } else {
      width = maxSize * aspectRatio;
    }

    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', {
      willReadFrequently: false,
      alpha: false,
    });

    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    const renderScale = width / baseViewport.width;
    const renderViewport = page!.getViewport({ scale: renderScale });

    await page!.render({
      canvasContext: context,
      viewport: renderViewport,
    }).promise;

    const thumbnail = canvas.toDataURL('image/jpeg', 0.88);

    try {
      page!.cleanup();
    } catch {
      // ignore
    }
    page = null;

    try {
      cleanupPDFBlobUrl(pdf);
      await pdf!.destroy();
    } catch {
      // ignore
    }
    pdf = null;

    canvas.width = 0;
    canvas.height = 0;
    canvas = null;

    try {
      await window.electronAPI.closePDFFileHandle(filePath);
    } catch {
      // ignore
    }

    return thumbnail;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    if (page) {
      try {
        page.cleanup();
      } catch {
        // ignore
      }
    }

    if (pdf) {
      try {
        const { cleanupPDFBlobUrl } = await import('./pdfSource');
        cleanupPDFBlobUrl(pdf);
        await pdf.destroy();
      } catch {
        // ignore
      }
    }

    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }

    try {
      await window.electronAPI?.closePDFFileHandle(filePath);
    } catch {
      // ignore
    }

    logger.error('Failed to generate PDF thumbnail:', error);
    return createPdfPlaceholderDataUrl();
  }
}
