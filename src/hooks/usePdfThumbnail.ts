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
    setLoading(true);
    setUnavailable(false);
    setThumbnail(null);

    void loadPdfPreviewThumbnail(filePath, { maxSize })
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
    };
  }, [filePath, maxSize]);

  return { thumbnail, loading, unavailable };
}
