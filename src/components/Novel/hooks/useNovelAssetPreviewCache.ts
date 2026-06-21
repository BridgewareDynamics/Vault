import { useCallback, useEffect, useRef, useState } from 'react';
import { buildNovelAssetVaultPath, loadNovelAssetPreviewUrl } from '../novelAssetUtils';

export function useNovelAssetPreviewCache(novelFolderPath: string) {
  const cacheRef = useRef(new Map<string, string>());
  const [, bump] = useState(0);

  const getPreviewUrl = useCallback(
    (relativePath: string) => cacheRef.current.get(relativePath) ?? null,
    []
  );

  const ensurePreviewUrl = useCallback(
    async (relativePath: string) => {
      const cached = cacheRef.current.get(relativePath);
      if (cached) return cached;

      const vaultPath = buildNovelAssetVaultPath(novelFolderPath, relativePath);
      const url = await loadNovelAssetPreviewUrl(vaultPath);
      if (url) {
        cacheRef.current.set(relativePath, url);
        bump((value) => value + 1);
      }
      return url;
    },
    [novelFolderPath]
  );

  const invalidatePreview = useCallback((relativePath: string) => {
    cacheRef.current.delete(relativePath);
    bump((value) => value + 1);
  }, []);

  useEffect(() => {
    cacheRef.current.clear();
  }, [novelFolderPath]);

  return { getPreviewUrl, ensurePreviewUrl, invalidatePreview };
}
