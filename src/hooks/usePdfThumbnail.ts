import { useEffect, useState } from 'react';
import { loadPdfPreviewThumbnail, type LoadPdfThumbnailOptions } from '../utils/loadPdfThumbnail';

export function usePdfThumbnail(filePath: string | null, options: LoadPdfThumbnailOptions = {}) {
  const maxSize = options.maxSize ?? 200;
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!filePath) {
      setThumbnail(null);
      setUnavailable(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setUnavailable(false);
    setThumbnail(null);

    void loadPdfPreviewThumbnail(filePath, { maxSize, signal: controller.signal })
      .then((src) => {
        if (cancelled) {
          return;
        }
        setThumbnail(src);
        setUnavailable(!src);
      })
      .catch(() => {
        if (!cancelled) {
          setThumbnail(null);
          setUnavailable(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      // Abort the in-flight pdf.js render/read so fast navigation or unmount does
      // not keep burning CPU/IO on a thumbnail nobody will display.
      controller.abort();
    };
  }, [filePath, maxSize]);

  return { thumbnail, loading, unavailable };
}
