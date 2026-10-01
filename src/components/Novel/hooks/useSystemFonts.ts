import { useCallback, useEffect, useState } from 'react';
import { getFallbackFonts } from '../novelFontUtils';

export function useSystemFonts() {
  const [fonts, setFonts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && fonts.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (window.electronAPI?.getSystemFonts) {
        const installed = await window.electronAPI.getSystemFonts(forceRefresh);
        setFonts(installed);
      } else {
        setFonts(getFallbackFonts());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load system fonts');
      setFonts(getFallbackFonts());
    } finally {
      setLoading(false);
    }
  }, [fonts.length]);

  useEffect(() => {
    void load();
  }, [load]);

  return { fonts, loading, error, reload: load };
}
