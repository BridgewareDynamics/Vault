import { useEffect, useState } from 'react';
import { FileConverterSource } from '../types';

export interface FileConverterSourcePreviewState {
  loading: boolean;
  imageSrc: string | null;
  videoSrc: string | null;
  unavailable: boolean;
}

const EMPTY_PREVIEW: FileConverterSourcePreviewState = {
  loading: false,
  imageSrc: null,
  videoSrc: null,
  unavailable: false,
};

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
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    default:
      return null;
  }
}

async function loadImagePreview(sourcePath: string): Promise<string | null> {
  if (window.electronAPI?.readFileData) {
    const data = await window.electronAPI.readFileData(sourcePath);
    const mimeType =
      data.mimeType === 'application/octet-stream'
        ? mimeTypeFromPath(sourcePath) ?? data.mimeType
        : data.mimeType;
    if (mimeType.startsWith('image/')) {
      return `data:${mimeType};base64,${data.data}`;
    }
  }

  if (window.electronAPI?.getFileThumbnail) {
    return window.electronAPI.getFileThumbnail(sourcePath);
  }

  return null;
}

async function loadPdfPreview(sourcePath: string): Promise<string | null> {
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

export function useFileConverterSourcePreview(
  source: FileConverterSource | null
): FileConverterSourcePreviewState {
  const [preview, setPreview] = useState<FileConverterSourcePreviewState>(EMPTY_PREVIEW);

  useEffect(() => {
    if (!source) {
      setPreview(EMPTY_PREVIEW);
      return;
    }

    const activeSource = source;
    let cancelled = false;

    async function loadPreview() {
      setPreview({ loading: true, imageSrc: null, videoSrc: null, unavailable: false });

      try {
        if (activeSource.category === 'video') {
          if (!cancelled) {
            setPreview({
              loading: false,
              imageSrc: null,
              videoSrc: activeSource.sourcePath.startsWith('http')
                ? activeSource.sourcePath
                : `vault-video://${encodeURIComponent(activeSource.sourcePath)}`,
              unavailable: false,
            });
          }
          return;
        }

        if (activeSource.category === 'image' || activeSource.category === 'gif') {
          const imageSrc = await loadImagePreview(activeSource.sourcePath);
          if (!cancelled) {
            setPreview({
              loading: false,
              imageSrc,
              videoSrc: null,
              unavailable: !imageSrc,
            });
          }
          return;
        }

        if (activeSource.category === 'pdf') {
          const imageSrc = await loadPdfPreview(activeSource.sourcePath);
          if (!cancelled) {
            setPreview({
              loading: false,
              imageSrc,
              videoSrc: null,
              unavailable: !imageSrc,
            });
          }
          return;
        }

        if (window.electronAPI?.getFileThumbnail) {
          const imageSrc = await window.electronAPI.getFileThumbnail(activeSource.sourcePath);
          if (!cancelled) {
            setPreview({
              loading: false,
              imageSrc,
              videoSrc: null,
              unavailable: !imageSrc,
            });
          }
          return;
        }

        if (!cancelled) {
          setPreview({ loading: false, imageSrc: null, videoSrc: null, unavailable: true });
        }
      } catch {
        if (!cancelled) {
          setPreview({ loading: false, imageSrc: null, videoSrc: null, unavailable: true });
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [source?.sourcePath, source?.category]);

  return preview;
}
