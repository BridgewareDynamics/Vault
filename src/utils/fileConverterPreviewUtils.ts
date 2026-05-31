import { detectCategoryFromPath } from '../hooks/useFileConverter';
import type { FileConverterSource } from '../types';

function mimeTypeFromPath(filePath: string): string | null {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'tif':
    case 'tiff':
      return 'image/tiff';
    case 'bmp':
      return 'image/bmp';
    default:
      return null;
  }
}

async function loadImageDataUrl(sourcePath: string): Promise<string | null> {
  if (!window.electronAPI?.readFileData) {
    return null;
  }

  const data = await window.electronAPI.readFileData(sourcePath);
  const mimeType =
    data.mimeType === 'application/octet-stream'
      ? mimeTypeFromPath(sourcePath) ?? data.mimeType
      : data.mimeType;

  if (!mimeType.startsWith('image/')) {
    return null;
  }

  return `data:${mimeType};base64,${data.data}`;
}

async function loadPdfThumbnail(sourcePath: string): Promise<string | null> {
  if (window.electronAPI?.readPDFThumbnail) {
    const thumbnail = await window.electronAPI.readPDFThumbnail(sourcePath);
    if (thumbnail) {
      return thumbnail;
    }
  }

  if (window.electronAPI?.getFileThumbnail) {
    return window.electronAPI.getFileThumbnail(sourcePath);
  }

  return null;
}

/** Small list thumbnail — prefers generated thumbs for performance. */
export async function loadCaseFileThumbnail(filePath: string): Promise<string | null> {
  if (window.electronAPI?.getFileThumbnail) {
    try {
      const thumbnail = await window.electronAPI.getFileThumbnail(filePath);
      if (thumbnail) {
        return thumbnail;
      }
    } catch {
      // fall through to category-specific loaders
    }
  }

  const category = detectCategoryFromPath(filePath);
  if (category === 'pdf') {
    return loadPdfThumbnail(filePath);
  }

  if (category === 'image' || category === 'gif') {
    return loadImageDataUrl(filePath);
  }

  return null;
}

export async function loadFileConverterSourcePreview(
  source: FileConverterSource
): Promise<{ imageSrc: string | null; videoSrc: string | null; unavailable: boolean }> {
  if (source.category === 'video') {
    return {
      imageSrc: null,
      videoSrc: source.sourcePath.startsWith('http')
        ? source.sourcePath
        : `vault-video://${encodeURIComponent(source.sourcePath)}`,
      unavailable: false,
    };
  }

  if (source.category === 'image' || source.category === 'gif') {
    const imageSrc = await loadImageDataUrl(source.sourcePath);
    if (imageSrc) {
      return { imageSrc, videoSrc: null, unavailable: false };
    }

    const thumbnail = await loadCaseFileThumbnail(source.sourcePath);
    return { imageSrc: thumbnail, videoSrc: null, unavailable: !thumbnail };
  }

  if (source.category === 'pdf') {
    const imageSrc = await loadPdfThumbnail(source.sourcePath);
    return { imageSrc, videoSrc: null, unavailable: !imageSrc };
  }

  const imageSrc = await loadCaseFileThumbnail(source.sourcePath);
  return { imageSrc, videoSrc: null, unavailable: !imageSrc };
}
