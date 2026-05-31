import { useCallback, useRef, useEffect } from 'react';
import { NovelDocument } from '../../types';
import { Theme } from '../../types';
import { getContentPageNumber } from './engine/pageNumbering';
import { computeEditorContentHeightPx } from './engine/pageLayoutEngine';
import { parseNovelImageDrag } from './novelImageUtils';
import { BookPageShell } from './BookPageShell';
import type { BookDisplayMetrics } from './engine/bookSizes';

export interface PageEditorInputPayload {
  html: string;
  contentWidthPx: number;
}

interface BookPageEditorProps {
  theme: Theme;
  metrics: BookDisplayMetrics;
  pageId: string;
  document: NovelDocument;
  contentHtml: string;
  side: 'left' | 'right';
  onChange?: (html: string) => void;
  onPageInput?: (payload: PageEditorInputPayload) => void;
  onInsertImage?: (pageId: string, vaultPath: string, relativePath: string) => void;
  active?: boolean;
  autoFocus?: boolean;
}

export function BookPageEditor({
  theme,
  metrics,
  pageId,
  document,
  contentHtml,
  side,
  onChange,
  onPageInput,
  onInsertImage,
  active = true,
  autoFocus = false,
}: BookPageEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const pendingInputHtmlRef = useRef<string | null>(null);
  const pageNumber = getContentPageNumber(document.pages, pageId);
  const editorContentHeightPx = computeEditorContentHeightPx(
    metrics,
    document.settings.showPageNumbers
  );

  const placeCursorAtEnd = useCallback((el: HTMLElement) => {
    const range = window.document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    const nextHtml = contentHtml || '<p><br></p>';
    if (!el) return;

    if (pendingInputHtmlRef.current === nextHtml) {
      pendingInputHtmlRef.current = null;
      return;
    }

    if (el.innerHTML === nextHtml) return;

    el.innerHTML = nextHtml;
  }, [pageId, contentHtml]);

  useEffect(() => {
    if (!autoFocus) return;
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    placeCursorAtEnd(el);
  }, [autoFocus, pageId, placeCursorAtEnd]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    pendingInputHtmlRef.current = html;

    if (onPageInput) {
      onPageInput({
        html,
        contentWidthPx: Math.max(40, el.clientWidth),
      });
      return;
    }

    onChange?.(html);
  }, [onChange, onPageInput]);

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
        className="novel-page-editor box-border min-h-0 w-full flex-1 overflow-hidden outline-none leading-[1.65] selection:bg-amber-500/25 [&_div]:mb-[0.65em] [&_div:last-child]:mb-0 [&_img]:max-w-[45%] [&_img]:float-left [&_img]:mr-3 [&_img]:mb-2 [&_p]:mb-[0.65em] [&_p:last-child]:mb-0"
        style={{
          fontFamily: document.settings.fontFamily,
          fontSize: `${document.settings.fontSize}pt`,
          height: editorContentHeightPx,
          maxHeight: editorContentHeightPx,
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
    contentWidthPx: metrics.contentWidthPx,
    contentHeightPx: computeEditorContentHeightPx(metrics, document.settings.showPageNumbers),
    fontFamily: document.settings.fontFamily,
    fontSize: document.settings.fontSize,
  };
}
