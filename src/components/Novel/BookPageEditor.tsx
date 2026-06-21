import { useCallback, useRef, useEffect } from 'react';
import { NovelDocument, NovelPageImage } from '../../types';
import { Theme } from '../../types';
import { getContentPageNumber } from './engine/pageNumbering';
import { computeEditorContentHeightPx } from './engine/pageLayoutEngine';
import { parseNovelImageDrag } from './novelImageUtils';
import { getElementVisualScale, parseDroppedImageFiles } from './novelPageImageUtils';
import { getEditorTextHtml, removeEditorImageSpacer, syncEditorImageSpacers } from './novelEditorImageSync';
import { formatFontFamilyCss } from './novelFontUtils';
import { BookPageShell } from './BookPageShell';
import { PageImageLayer } from './PageImageLayer';
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
  pageImages: NovelPageImage[];
  imagePreviewUrls: Record<string, string | null>;
  selectedImageId: string | null;
  spreadDragImageId?: string | null;
  side: 'left' | 'right';
  isActiveTypingPage?: boolean;
  isImageDropTarget?: boolean;
  onChange?: (html: string) => void;
  onPageInput?: (payload: PageEditorInputPayload) => void;
  onInsertImage?: (
    pageId: string,
    vaultPath: string,
    relativePath: string,
    position: { x: number; y: number }
  ) => void;
  onUpdatePageImages?: (pageId: string, images: NovelPageImage[]) => void;
  onSelectImage?: (pageId: string, imageId: string | null) => void;
  onCropImage?: (pageId: string, imageId: string) => void;
  onActivatePage?: (pageId: string) => void;
  onRegisterFlowRef?: (pageId: string, element: HTMLDivElement | null) => void;
  onSpreadDragStart?: (
    pageId: string,
    image: NovelPageImage,
    clientX: number,
    clientY: number,
    frameElement: HTMLElement
  ) => void;
  active?: boolean;
  autoFocus?: boolean;
}

export function BookPageEditor({
  theme,
  metrics,
  pageId,
  document,
  contentHtml,
  pageImages,
  imagePreviewUrls,
  selectedImageId,
  spreadDragImageId = null,
  side,
  isActiveTypingPage = false,
  isImageDropTarget = false,
  onChange,
  onPageInput,
  onInsertImage,
  onUpdatePageImages,
  onSelectImage,
  onCropImage,
  onActivatePage,
  onRegisterFlowRef,
  onSpreadDragStart,
  active = true,
  autoFocus = false,
}: BookPageEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const pendingInputHtmlRef = useRef<string | null>(null);
  const pageNumber = getContentPageNumber(document.pages, pageId);
  const editorContentHeightPx = computeEditorContentHeightPx(
    metrics,
    document.settings.showPageNumbers
  );
  const contentWidthPx = Math.max(40, metrics.contentWidthPx);

  const syncSpacers = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    syncEditorImageSpacers(editor, pageImages, contentWidthPx);
  }, [contentWidthPx, pageImages]);

  useEffect(() => {
    onRegisterFlowRef?.(pageId, flowRef.current);
    return () => onRegisterFlowRef?.(pageId, null);
  }, [onRegisterFlowRef, pageId]);

  const activatePage = useCallback(() => {
    onActivatePage?.(pageId);
  }, [onActivatePage, pageId]);

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
      syncSpacers();
      return;
    }

    const currentText = getEditorTextHtml(el);
    if (currentText !== nextHtml) {
      el.innerHTML = nextHtml;
    }
    syncSpacers();
  }, [pageId, contentHtml, syncSpacers]);

  useEffect(() => {
    syncSpacers();
  }, [syncSpacers]);

  useEffect(() => {
    if (!autoFocus) return;
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    placeCursorAtEnd(el);
    activatePage();
  }, [activatePage, autoFocus, pageId, placeCursorAtEnd]);

  const handleInput = useCallback(() => {
    activatePage();
    const el = editorRef.current;
    if (!el) return;
    const html = getEditorTextHtml(el);
    pendingInputHtmlRef.current = html;

    if (onPageInput) {
      onPageInput({
        html,
        contentWidthPx: Math.max(40, el.clientWidth),
      });
      return;
    }

    onChange?.(html);
  }, [activatePage, onChange, onPageInput]);

  const getDropPosition = useCallback((event: React.DragEvent) => {
    const flow = flowRef.current;
    if (!flow) return { x: 16, y: 16 };
    const rect = flow.getBoundingClientRect();
    const scale = getElementVisualScale(flow);
    return {
      x: Math.max(0, (event.clientX - rect.left) / scale - DEFAULT_DROP_OFFSET),
      y: Math.max(0, (event.clientY - rect.top) / scale - DEFAULT_DROP_OFFSET),
    };
  }, []);

  const ingestSourcePath = useCallback(
    async (sourcePath: string, position: { x: number; y: number }) => {
      if (!window.electronAPI?.copyNovelAssetToNovel) return;
      activatePage();
      const assetId = crypto.randomUUID();
      const copied = await window.electronAPI.copyNovelAssetToNovel(
        document.novelFolderPath,
        sourcePath,
        assetId
      );
      onInsertImage?.(pageId, copied.vaultPath, copied.relativePath, position);
    },
    [activatePage, document.novelFolderPath, onInsertImage, pageId]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      activatePage();
      const position = getDropPosition(event);

      const pending = parseNovelImageDrag(event.dataTransfer);
      if (pending) {
        await ingestSourcePath(pending.sourcePath, position);
        return;
      }

      const filePaths = parseDroppedImageFiles(event.dataTransfer);
      if (filePaths.length > 0) {
        await ingestSourcePath(filePaths[0], position);
      }
    },
    [activatePage, getDropPosition, ingestSourcePath]
  );

  const updateImages = useCallback(
    (updater: (images: NovelPageImage[]) => NovelPageImage[]) => {
      onUpdatePageImages?.(pageId, updater(pageImages));
    },
    [onUpdatePageImages, pageId, pageImages]
  );

  const handleMoveImage = useCallback(
    (imageId: string, x: number, y: number) => {
      updateImages((images) =>
        images.map((image) => (image.id === imageId ? { ...image, x, y } : image))
      );
    },
    [updateImages]
  );

  const handleWrapModeChange = useCallback(
    (imageId: string, wrapMode: NovelPageImage['wrapMode']) => {
      updateImages((images) =>
        images.map((image) => (image.id === imageId ? { ...image, wrapMode } : image))
      );
    },
    [updateImages]
  );

  const handleDeleteImage = useCallback(
    (imageId: string) => {
      const editor = editorRef.current;
      if (editor) {
        removeEditorImageSpacer(editor, imageId);
      }
      updateImages((images) => images.filter((image) => image.id !== imageId));
      onSelectImage?.(pageId, null);
    },
    [onSelectImage, pageId, updateImages]
  );

  const handleEditorPointerDown = useCallback(
    (event: React.PointerEvent) => {
      activatePage();
      const target = event.target as HTMLElement;
      if (target.closest('[data-novel-image-spacer]') || target.closest('[data-novel-image-id]')) {
        return;
      }
      onSelectImage?.(pageId, null);
      editorRef.current?.focus();
    },
    [activatePage, onSelectImage, pageId]
  );

  return (
    <BookPageShell
      theme={theme}
      metrics={metrics}
      side={side}
      pageNumber={pageNumber}
      showPageNumbers={document.settings.showPageNumbers}
      variant="content"
      isActiveTypingPage={isActiveTypingPage}
      isImageDropTarget={isImageDropTarget}
      onDragOver={(e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(e: React.DragEvent) => void handleDrop(e)}
    >
      <div
        ref={flowRef}
        data-novel-page-flow={pageId}
        className="novel-page-flow relative min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden"
        style={{ height: editorContentHeightPx, maxHeight: editorContentHeightPx }}
      >
        <PageImageLayer
          images={pageImages}
          previewUrls={imagePreviewUrls}
          selectedImageId={selectedImageId}
          spreadDragImageId={spreadDragImageId}
          contentWidthPx={contentWidthPx}
          contentHeightPx={editorContentHeightPx}
          placement="behind"
          onSelectImage={(imageId) => onSelectImage?.(pageId, imageId)}
          onMoveImage={handleMoveImage}
          onSpreadDragStart={(image, clientX, clientY, frameElement) =>
            onSpreadDragStart?.(pageId, image, clientX, clientY, frameElement)
          }
          onWrapModeChange={handleWrapModeChange}
          onDeleteImage={handleDeleteImage}
          onCropImage={(imageId) => onCropImage?.(pageId, imageId)}
        />

        <div
          ref={editorRef}
          contentEditable={active}
          suppressContentEditableWarning
          className="novel-page-editor relative z-[1] min-h-full w-full break-words outline-none leading-[1.65] selection:bg-amber-500/25 [display:flow-root] [&_div]:mb-[0.65em] [&_div:last-child]:mb-0 [&_p]:mb-[0.65em] [&_p:last-child]:mb-0"
          style={{
            fontFamily: formatFontFamilyCss(document.settings.fontFamily),
            fontSize: `${document.settings.fontSize}pt`,
            minHeight: editorContentHeightPx,
          }}
          onFocus={activatePage}
          onPointerDown={handleEditorPointerDown}
          onInput={handleInput}
        />

        <PageImageLayer
          images={pageImages}
          previewUrls={imagePreviewUrls}
          selectedImageId={selectedImageId}
          spreadDragImageId={spreadDragImageId}
          contentWidthPx={contentWidthPx}
          contentHeightPx={editorContentHeightPx}
          placement="front"
          onSelectImage={(imageId) => onSelectImage?.(pageId, imageId)}
          onMoveImage={handleMoveImage}
          onSpreadDragStart={(image, clientX, clientY, frameElement) =>
            onSpreadDragStart?.(pageId, image, clientX, clientY, frameElement)
          }
          onWrapModeChange={handleWrapModeChange}
          onDeleteImage={handleDeleteImage}
          onCropImage={(imageId) => onCropImage?.(pageId, imageId)}
        />
      </div>
    </BookPageShell>
  );
}

const DEFAULT_DROP_OFFSET = 24;
