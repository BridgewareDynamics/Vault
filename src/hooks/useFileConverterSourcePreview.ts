import { useEffect, useState } from 'react';
import { FileConverterSource } from '../types';
import { resolveReadFileDataUrl, resolveReadFileMimeType } from '../utils/readFileDataUtils';

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

async function loadImagePreview(sourcePath: string): Promise<string | null> {
  if (window.electronAPI?.readFileData) {
    const data = await window.electronAPI.readFileData(sourcePath);
    const mimeType = resolveReadFileMimeType(data.mimeType, sourcePath);
    if (mimeType.startsWith('image/')) {
      return resolveReadFileDataUrl(data, sourcePath);
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
