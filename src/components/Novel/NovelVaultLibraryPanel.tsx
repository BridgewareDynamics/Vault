import { useCallback, useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Theme } from '../../types';
import { useNovelTheme } from './novelTheme';
import { NOVEL_VAULT_DRAG_MIME, createPendingNovelImage } from './novelImageUtils';

interface NovelVaultLibraryPanelProps {
  theme: Theme;
  linkedCasePath: string;
}

export function NovelVaultLibraryPanel({ theme, linkedCasePath }: NovelVaultLibraryPanelProps) {
  const t = useNovelTheme(theme);
  const [images, setImages] = useState<Array<{ path: string; name: string }>>([]);

  const loadImages = useCallback(async () => {
    if (!window.electronAPI?.listCaseFiles) return;
    try {
      const result = await window.electronAPI.listCaseFiles(linkedCasePath);
      const imageFiles = result
        .filter((f) => !f.isFolder && /\.(png|jpe?g|gif|webp)$/i.test(f.name))
        .slice(0, 24)
        .map((f) => ({ path: f.path, name: f.name }));
      setImages(imageFiles);
    } catch {
      setImages([]);
    }
  }, [linkedCasePath]);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  if (images.length === 0) return null;

  return (
    <div className={`border-t px-4 py-3 ${t.insetSurface}`}>
      <p className={`mb-3 text-xs font-semibold uppercase tracking-widest ${t.primary}`}>
        Case images — drag onto pages
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((file) => (
          <div
            key={file.path}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                NOVEL_VAULT_DRAG_MIME,
                JSON.stringify(createPendingNovelImage(file.path, file.name))
              );
            }}
            className={`flex h-16 w-16 shrink-0 cursor-grab items-center justify-center rounded-lg border ${t.pageBorder}`}
            title={file.name}
          >
            <ImageIcon className="h-5 w-5 opacity-60" />
          </div>
        ))}
      </div>
    </div>
  );
}
