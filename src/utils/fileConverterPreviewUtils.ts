import { detectCategoryFromPath } from '../hooks/useFileConverter';
import type { FileConverterSource } from '../types';
import { loadPdfPreviewThumbnail } from './loadPdfThumbnail';
import { resolveReadFileDataUrl, resolveReadFileMimeType } from './readFileDataUtils';

async function loadImageDataUrl(sourcePath: string): Promise<string | null> {
  if (!window.electronAPI?.readFileData) {
    return null;
  }

  const data = await window.electronAPI.readFileData(sourcePath);
  const mimeType = resolveReadFileMimeType(data.mimeType, sourcePath);

  if (!mimeType.startsWith('image/')) {
    return null;
  }

  return resolveReadFileDataUrl(data, sourcePath);
}

/** Small list thumbnail — prefers generated thumbs for performance. */
export async function loadCaseFileThumbnail(filePath: string): Promise<string | null> {
  const category = detectCategoryFromPath(filePath);
  if (category === 'pdf') {
    return loadPdfPreviewThumbnail(filePath);
  }

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
    const imageSrc = await loadPdfPreviewThumbnail(source.sourcePath, { maxSize: 420 });
    return { imageSrc, videoSrc: null, unavailable: !imageSrc };
  }

  const imageSrc = await loadCaseFileThumbnail(source.sourcePath);
  return { imageSrc, videoSrc: null, unavailable: !imageSrc };
}
