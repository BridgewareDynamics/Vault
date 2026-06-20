import {
  generatePdfThumbnailInRenderer,
  isPdfPlaceholderThumbnail,
  type GeneratePdfThumbnailOptions,
} from './generatePdfThumbnail';
import { requestThumbnail } from './thumbnailService';

export type LoadPdfThumbnailOptions = GeneratePdfThumbnailOptions;

async function loadPdfPreviewThumbnailUncached(
  filePath: string,
  options: LoadPdfThumbnailOptions = {},
): Promise<string | null> {
  if (!window.electronAPI) {
    return null;
  }

  if (window.electronAPI.readPDFThumbnail) {
    try {
      const cached = await window.electronAPI.readPDFThumbnail(filePath);
      if (cached && !isPdfPlaceholderThumbnail(cached)) {
        return cached;
      }
    } catch {
      // generate below
    }
  }

  const rendered = await generatePdfThumbnailInRenderer(filePath, options);
  if (isPdfPlaceholderThumbnail(rendered)) {
    return null;
  }

  if (window.electronAPI.savePDFThumbnail) {
    try {
      await window.electronAPI.savePDFThumbnail(filePath, rendered);
    } catch {
      // thumbnail still usable in memory
    }
  }

  return rendered;
}

/**
 * Loads a real PDF page preview: disk cache first, then pdf.js render (never OS purple icon placeholder).
 */
export async function loadPdfPreviewThumbnail(
  filePath: string,
  options: LoadPdfThumbnailOptions = {},
): Promise<string | null> {
  if (!window.electronAPI) {
    return null;
  }

  try {
    const thumbnail = await requestThumbnail(filePath, async () => {
      const loaded = await loadPdfPreviewThumbnailUncached(filePath, options);
      if (!loaded) {
        throw new Error('PDF thumbnail unavailable');
      }
      return loaded;
    });

    if (isPdfPlaceholderThumbnail(thumbnail)) {
      return null;
    }

    return thumbnail;
  } catch {
    return null;
  }
}
