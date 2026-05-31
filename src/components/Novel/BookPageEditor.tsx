import { useCallback, useRef, useEffect } from 'react';
import { NovelDocument } from '../../types';
import { Theme } from '../../types';
import { getContentPageNumber } from './engine/pageNumbering';
import { parseNovelImageDrag } from './novelImageUtils';
import { BookPageShell } from './BookPageShell';
import type { BookDisplayMetrics } from './engine/bookSizes';

interface BookPageEditorProps {
  theme: Theme;
  metrics: BookDisplayMetrics;
  pageId: string;
  document: NovelDocument;
  contentHtml: string;
  side: 'left' | 'right';
  onChange: (html: string) => void;
  onOverflow?: (overflowHtml: string) => void;
  onInsertImage?: (pageId: string, vaultPath: string, relativePath: string) => void;
  active?: boolean;
}

export function BookPageEditor({
  theme,
  metrics,
  pageId,
  document,
  contentHtml,
  side,
  onChange,
  onOverflow,
  onInsertImage,
  active = true,
}: BookPageEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const pageNumber = getContentPageNumber(document.pages, pageId);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || el.innerHTML === (contentHtml || '<p><br></p>')) return;
    el.innerHTML = contentHtml || '<p><br></p>';
  }, [pageId, contentHtml]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    if (onOverflow) {
      onOverflow(html);
      return;
    }
    onChange(html);
  }, [onChange, onOverflow]);

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      const pending = parseNovelImageDrag(event.dataTransfer);
      if (!pending || !window.electronAPI?.copyNovelAssetToNovel) return;
      const assetId = crypto.randomUUID();
      const copied = await window.electronAPI.copyNovelAssetToNovel(
        document.novelFolderPath,
        pending.sourcePath,
        assetId
      );
      onInsertImage?.(pageId, copied.vaultPath, copied.relativePath);
    },
    [document.novelFolderPath, onInsertImage, pageId]
  );

  return (
    <BookPageShell
      theme={theme}
      metrics={metrics}
      side={side}
      pageNumber={pageNumber}
      showPageNumbers={document.settings.showPageNumbers}
      variant="content"
      onDragOver={(e: React.DragEvent) => e.preventDefault()}
      onDrop={(e: React.DragEvent) => void handleDrop(e)}
    >
      <div
        ref={editorRef}
        contentEditable={active}
        suppressContentEditableWarning
        className="novel-page-editor min-h-0 flex-1 overflow-hidden outline-none leading-[1.65] selection:bg-amber-500/25 [&_img]:max-w-[45%] [&_img]:float-left [&_img]:mr-3 [&_img]:mb-2 [&_p]:mb-[0.65em] [&_p:last-child]:mb-0"
        style={{
          fontFamily: document.settings.fontFamily,
          fontSize: `${document.settings.fontSize}pt`,
          maxHeight: metrics.contentHeightPx,
        }}
        onInput={handleInput}
      />
    </BookPageShell>
  );
}

/** @deprecated Use metrics from useBookDisplayMetrics instead */
export const BOOK_PAGE_DIMENSIONS = {
  width: 340,
  height: 440,
  padding: 28,
};

export function buildPageMeasureOptions(metrics: BookDisplayMetrics, document: NovelDocument) {
  return {
    width: metrics.pageWidthPx,
    height: metrics.pageHeightPx,
    fontFamily: document.settings.fontFamily,
    fontSize: document.settings.fontSize,
    padding: metrics.marginPx,
  };
}
