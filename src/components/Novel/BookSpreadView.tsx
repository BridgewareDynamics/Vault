import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NovelDocument, NovelPage, NovelPageImage } from '../../types';
import { Theme } from '../../types';
import { useNovelTheme } from './novelTheme';
import { BookCoverPage } from './BookCoverPage';
import { BookPageEditor, buildPageMeasureOptions } from './BookPageEditor';
import { BookPageFlipAnimation, BOOK_FLIP_DURATION_MS, type BookPageFlipPivot } from './BookPageFlipAnimation';
import { BookPageShell } from './BookPageShell';
import { BookSpineInsertMenu } from './BookSpineInsertMenu';
import { BookStage } from './BookStage';
import { NovelImageCropDialog } from './NovelImageCropDialog';
import { clampSpreadIndex, getSpreads } from './engine/spreadNavigator';
import { getSpreadIndexForPage, insertPageInSpread, reindexPageSides } from './engine/pageNumbering';
import { mergeHtmlFragments, paginatePageInput } from './engine/pageLayoutEngine';
import { useNovelAssetPreviewCache } from './hooks/useNovelAssetPreviewCache';
import {
  clampPageImage,
  clientPointToPageLocal,
  computeSpreadDragGrabOffset,
  createPageImage,
  hitTestPageFlowAtPoint,
  normalizePageImages,
  resolveInsertTargetPageId,
} from './novelPageImageUtils';
import { useBookDisplayMetrics } from './hooks/useBookDisplayMetrics';
import type { PageEditorInputPayload } from './BookPageEditor';

export interface BookSpreadFlipRequest {
  direction: 'next' | 'prev';
  targetSpreadIndex: number;
}

interface BookSpreadViewProps {
  theme: Theme;
  document: NovelDocument;
  spreadIndex: number;
  flipRequest?: BookSpreadFlipRequest | null;
  coverImageUrl?: string | null;
  onUpdatePages: (pages: NovelPage[]) => void;
  onUpdateSettings: (settings: Partial<NovelDocument['settings']>) => void;
  onSelectCoverImage?: () => void;
  onSpreadAdvance?: () => void;
  onFlipComplete?: () => void;
  onRequestSpreadIndex?: (spreadIndex: number) => void;
  onPageInserted?: (side: 'left' | 'right') => void;
  selectingCoverImage?: boolean;
  insertImageRequest?: { nonce: number } | null;
  onInsertImageRequestHandled?: () => void;
}

interface SpreadImageDragState {
  sourcePageId: string;
  image: NovelPageImage;
  previewUrl: string | null;
  /** Grab point offset from frame top-left in screen pixels. */
  offsetScreenX: number;
  offsetScreenY: number;
  /** Frame size on screen while dragging. */
  visualWidth: number;
  visualHeight: number;
}

export function BookSpreadView({
  theme,
  document: novelDoc,
  spreadIndex,
  flipRequest = null,
  coverImageUrl,
  onUpdatePages,
  onUpdateSettings,
  onSelectCoverImage,
  onSpreadAdvance,
  onFlipComplete,
  onRequestSpreadIndex,
  onPageInserted,
  selectingCoverImage = false,
  insertImageRequest = null,
  onInsertImageRequestHandled,
}: BookSpreadViewProps) {
  const t = useNovelTheme(theme);
  const stageRef = useRef<HTMLDivElement>(null);
  const insertButtonRef = useRef<HTMLButtonElement>(null);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [focusPageId, setFocusPageId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ pageId: string; imageId: string } | null>(null);
  const [cropTarget, setCropTarget] = useState<{ pageId: string; imageId: string } | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string | null>>({});
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [spreadDrag, setSpreadDrag] = useState<SpreadImageDragState | null>(null);
  const [imageDropHoverPageId, setImageDropHoverPageId] = useState<string | null>(null);
  const migratedRef = useRef(false);
  const pageFlowRefs = useRef(new Map<string, HTMLDivElement>());
  const spreadDragRef = useRef<SpreadImageDragState | null>(null);
  const dragOverlayRef = useRef<HTMLDivElement>(null);
  const lastDragPointerRef = useRef({ x: 0, y: 0 });
  const detachSpreadDragRef = useRef<(() => void) | null>(null);

  const metrics = useBookDisplayMetrics(
    novelDoc.settings.bookSizeId,
    novelDoc.settings.marginMm,
    stageRef
  );
  const { ensurePreviewUrl, invalidatePreview } = useNovelAssetPreviewCache(novelDoc.novelFolderPath);

  const measureOptions = useMemo(
    () => buildPageMeasureOptions(metrics, novelDoc),
    [metrics, novelDoc.settings.fontFamily, novelDoc.settings.fontSize, novelDoc.settings.showPageNumbers]
  );

  const spreads = useMemo(() => getSpreads(novelDoc.pages), [novelDoc.pages]);
  const spread = spreads[spreadIndex] ?? spreads[0];
  const targetSpread = flipRequest ? spreads[flipRequest.targetSpreadIndex] : null;

  useEffect(() => {
    const defaultPage =
      spread?.rightPage?.type === 'content'
        ? spread.rightPage
        : spread?.leftPage?.type === 'content'
          ? spread.leftPage
          : null;
    setActivePageId((current) => {
      if (
        current &&
        (spread?.leftPage?.id === current || spread?.rightPage?.id === current)
      ) {
        return current;
      }
      return defaultPage?.id ?? null;
    });
  }, [spread?.leftPage?.id, spread?.rightPage?.id, spreadIndex]);

  const registerPageFlowRef = useCallback((pageId: string, element: HTMLDivElement | null) => {
    if (element) {
      pageFlowRefs.current.set(pageId, element);
    } else {
      pageFlowRefs.current.delete(pageId);
    }
  }, []);

  useEffect(() => {
    if (migratedRef.current) return;
    const needsMigration = novelDoc.pages.some(
      (page) => page.contentHtml.includes('<img') || (page.images?.length ?? 0) > 0
    );
    if (!needsMigration) {
      migratedRef.current = true;
      return;
    }

    const normalized = novelDoc.pages.map((page) =>
      page.type === 'content'
        ? normalizePageImages(page, measureOptions.contentWidthPx, measureOptions.contentHeightPx)
        : page
    );
    migratedRef.current = true;
    onUpdatePages(normalized);
  }, [measureOptions.contentHeightPx, measureOptions.contentWidthPx, novelDoc.pages, onUpdatePages]);

  const allAssetPaths = useMemo(() => {
    const paths = new Set<string>();
    novelDoc.pages.forEach((page) => {
      page.images?.forEach((image) => paths.add(image.assetPath));
    });
    return Array.from(paths);
  }, [novelDoc.pages]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        allAssetPaths.map(async (assetPath) => {
          const url = await ensurePreviewUrl(assetPath);
          return [assetPath, url] as const;
        })
      );
      if (cancelled) return;
      setPreviewUrls(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [allAssetPaths, ensurePreviewUrl]);

  const updatePage = useCallback(
    (pageId: string, updater: (page: NovelPage) => NovelPage) => {
      onUpdatePages(
        novelDoc.pages.map((page) => (page.id === pageId ? updater(page) : page))
      );
    },
    [novelDoc.pages, onUpdatePages]
  );

  const handlePageContent = (pageId: string, payload: PageEditorInputPayload) => {
    let pages = [...novelDoc.pages];
    const startPageIndex = pages.findIndex((p) => p.id === pageId);
    if (startPageIndex < 0) return;

    const startPage = pages[startPageIndex];
    if ((startPage.images?.length ?? 0) > 0) {
      if (pages[startPageIndex].contentHtml !== payload.html) {
        pages[startPageIndex] = { ...pages[startPageIndex], contentHtml: payload.html };
        onUpdatePages(reindexPageSides(pages));
      }
      return;
    }

    let pageIndex = startPageIndex;
    let currentHtml = payload.html;
    let changed = false;
    let hadOverflowSplit = false;
    let typingTailPageId: string | null = null;

    const paginate = (html: string) =>
      paginatePageInput({
        html,
        contentWidthPx: payload.contentWidthPx,
        contentHeightPx: measureOptions.contentHeightPx,
        fontFamily: measureOptions.fontFamily,
        fontSize: measureOptions.fontSize,
      });

    while (pageIndex >= 0 && pageIndex < pages.length) {
      const page = pages[pageIndex];
      if (page.type !== 'content') break;

      const split = paginate(currentHtml);
      if (!split.isOverflowing) {
        if (pages[pageIndex].contentHtml !== currentHtml) {
          pages[pageIndex] = { ...pages[pageIndex], contentHtml: currentHtml };
          changed = true;
        }
        break;
      }

      hadOverflowSplit = true;
      pages[pageIndex] = { ...pages[pageIndex], contentHtml: split.keptHtml };
      changed = true;
      pageIndex += 1;

      if (pageIndex < pages.length && pages[pageIndex].type === 'content') {
        currentHtml = mergeHtmlFragments(split.overflowHtml, pages[pageIndex].contentHtml);
        pages[pageIndex] = { ...pages[pageIndex], contentHtml: currentHtml };
        typingTailPageId = pages[pageIndex].id;
      } else {
        const newPage: NovelPage = {
          id: crypto.randomUUID(),
          side: 'right',
          type: 'content',
          contentHtml: split.overflowHtml,
          images: [],
        };
        pages.splice(pageIndex, 0, newPage);
        typingTailPageId = newPage.id;
        break;
      }
    }

    if (!changed) return;

    const reindexed = reindexPageSides(pages);
    onUpdatePages(reindexed);

    if (hadOverflowSplit && typingTailPageId) {
      const targetSpread = getSpreadIndexForPage(reindexed, typingTailPageId);
      if (targetSpread !== null && targetSpread > spreadIndex) {
        onSpreadAdvance?.();
      }
      setFocusPageId(typingTailPageId);
    }
  };

  const insertPageImage = useCallback(
    (
      pageId: string,
      _vaultPath: string,
      relativePath: string,
      position: { x: number; y: number }
    ) => {
      const image = createPageImage(
        relativePath,
        position.x,
        position.y,
        measureOptions.contentWidthPx,
        measureOptions.contentHeightPx
      );
      updatePage(pageId, (page) => ({
        ...page,
        images: [...(page.images ?? []), image],
      }));
      setSelectedImage({ pageId, imageId: image.id });
      setActivePageId(pageId);
      void ensurePreviewUrl(relativePath).then((url) => {
        if (url) {
          setPreviewUrls((current) => ({ ...current, [relativePath]: url }));
        }
      });
    },
    [
      ensurePreviewUrl,
      measureOptions.contentHeightPx,
      measureOptions.contentWidthPx,
      updatePage,
    ]
  );

  const handleUpdatePageImages = (pageId: string, images: NovelPageImage[]) => {
    updatePage(pageId, (page) => ({ ...page, images }));
  };

  const handleSelectImage = (pageId: string, imageId: string | null) => {
    if (!imageId) {
      setSelectedImage(null);
      return;
    }
    setSelectedImage({ pageId, imageId });
    setActivePageId(pageId);
  };

  const finishSpreadDrag = useCallback(
    (clientX: number, clientY: number) => {
      const current = spreadDragRef.current;
      if (!current) return;

      const targetPageId =
        hitTestPageFlowAtPoint(pageFlowRefs.current, clientX, clientY) ?? current.sourcePageId;
      const flowEl = pageFlowRefs.current.get(targetPageId);
      if (!flowEl) {
        spreadDragRef.current = null;
        setSpreadDrag(null);
        setImageDropHoverPageId(null);
        return;
      }

      const rect = flowEl.getBoundingClientRect();
      const local = clientPointToPageLocal(
        clientX,
        clientY,
        rect,
        flowEl,
        current.offsetScreenX,
        current.offsetScreenY
      );
      const placed = clampPageImage(
        { ...current.image, x: local.x, y: local.y },
        measureOptions.contentWidthPx,
        measureOptions.contentHeightPx
      );

      onUpdatePages(
        novelDoc.pages.map((page) => {
          if (page.id === current.sourcePageId && targetPageId !== current.sourcePageId) {
            return {
              ...page,
              images: (page.images ?? []).filter((image) => image.id !== current.image.id),
            };
          }
          if (page.id === targetPageId) {
            const existing = page.images ?? [];
            const without =
              targetPageId === current.sourcePageId
                ? existing.filter((image) => image.id !== current.image.id)
                : existing;
            return { ...page, images: [...without, placed] };
          }
          return page;
        })
      );

      setSelectedImage({ pageId: targetPageId, imageId: current.image.id });
      setActivePageId(targetPageId);
      spreadDragRef.current = null;
      setSpreadDrag(null);
      setImageDropHoverPageId(null);
    },
    [
      measureOptions.contentHeightPx,
      measureOptions.contentWidthPx,
      novelDoc.pages,
      onUpdatePages,
    ]
  );

  const updateDragOverlayPosition = useCallback((clientX: number, clientY: number) => {
    const current = spreadDragRef.current;
    const overlay = dragOverlayRef.current;
    if (!current || !overlay) return;
    overlay.style.left = `${clientX - current.offsetScreenX}px`;
    overlay.style.top = `${clientY - current.offsetScreenY}px`;
  }, []);

  const bindSpreadDragListeners = useCallback(() => {
    detachSpreadDragRef.current?.();

    const handlePointerMove = (event: PointerEvent) => {
      lastDragPointerRef.current = { x: event.clientX, y: event.clientY };
      const current = spreadDragRef.current;
      if (current?.image.wrapMode === 'behind') {
        updateDragOverlayPosition(event.clientX, event.clientY);
      }
      setImageDropHoverPageId(hitTestPageFlowAtPoint(pageFlowRefs.current, event.clientX, event.clientY));
    };

    const handlePointerUp = (event: PointerEvent) => {
      detachSpreadDragRef.current?.();
      detachSpreadDragRef.current = null;
      finishSpreadDrag(event.clientX, event.clientY);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    detachSpreadDragRef.current = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [finishSpreadDrag, updateDragOverlayPosition]);

  const handleSpreadDragStart = useCallback(
    (
      pageId: string,
      image: NovelPageImage,
      clientX: number,
      clientY: number,
      frameElement: HTMLElement
    ) => {
      const frameRect = frameElement.getBoundingClientRect();
      const grab = computeSpreadDragGrabOffset(frameRect, clientX, clientY);
      const nextDrag: SpreadImageDragState = {
        sourcePageId: pageId,
        image,
        previewUrl: previewUrls[image.assetPath] ?? null,
        offsetScreenX: grab.offsetScreenX,
        offsetScreenY: grab.offsetScreenY,
        visualWidth: grab.visualWidth,
        visualHeight: grab.visualHeight,
      };
      spreadDragRef.current = nextDrag;
      lastDragPointerRef.current = { x: clientX, y: clientY };
      setSpreadDrag(nextDrag);
      setSelectedImage({ pageId, imageId: image.id });
      setActivePageId(pageId);
      bindSpreadDragListeners();
    },
    [bindSpreadDragListeners, previewUrls]
  );

  useEffect(() => () => detachSpreadDragRef.current?.(), []);

  useLayoutEffect(() => {
    if (!spreadDrag) return;
    const { x, y } = lastDragPointerRef.current;
    updateDragOverlayPosition(x, y);
  }, [spreadDrag, updateDragOverlayPosition]);

  const handleDeleteSelectedImage = useCallback(() => {
    if (!selectedImage) return;
    updatePage(selectedImage.pageId, (page) => ({
      ...page,
      images: (page.images ?? []).filter((image) => image.id !== selectedImage.imageId),
    }));
    setSelectedImage(null);
  }, [selectedImage, updatePage]);

  useEffect(() => {
    if (!selectedImage || cropTarget) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;

      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        active?.closest('[role="dialog"]')
      ) {
        return;
      }

      event.preventDefault();
      handleDeleteSelectedImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cropTarget, handleDeleteSelectedImage, selectedImage]);

  const handleCropImage = (pageId: string, imageId: string) => {
    setCropTarget({ pageId, imageId });
  };

  const cropImage = cropTarget
    ? novelDoc.pages
        .find((page) => page.id === cropTarget.pageId)
        ?.images?.find((image) => image.id === cropTarget.imageId)
    : null;
  const cropPreviewUrl = cropImage ? previewUrls[cropImage.assetPath] ?? null : null;

  const handleApplyCrop = async (_crop: NovelPageImage['crop'], croppedDataUrl: string) => {
    if (!cropTarget || !cropImage || !window.electronAPI?.writeNovelAssetFromDataUrl) return;
    await window.electronAPI.writeNovelAssetFromDataUrl(
      novelDoc.novelFolderPath,
      cropImage.assetPath,
      croppedDataUrl
    );
    invalidatePreview(cropImage.assetPath);
    const refreshed = await ensurePreviewUrl(cropImage.assetPath);
    if (refreshed) {
      setPreviewUrls((current) => ({ ...current, [cropImage.assetPath]: refreshed }));
    }
    updatePage(cropTarget.pageId, (page) => ({
      ...page,
      images: (page.images ?? []).map((image) =>
        image.id === cropTarget.imageId ? { ...image, crop: undefined } : image
      ),
    }));
    setCropTarget(null);
  };

  useEffect(() => {
    if (!insertImageRequest) return;
    const targetPageId = resolveInsertTargetPageId(activePageId, spread);
    if (!targetPageId) {
      onInsertImageRequestHandled?.();
      return;
    }

    const pickImage = async () => {
      if (!window.electronAPI?.selectImageFile) {
        onInsertImageRequestHandled?.();
        return;
      }
      const sourcePath = await window.electronAPI.selectImageFile();
      onInsertImageRequestHandled?.();
      if (!sourcePath || !window.electronAPI.copyNovelAssetToNovel) return;

      const assetId = crypto.randomUUID();
      const copied = await window.electronAPI.copyNovelAssetToNovel(
        novelDoc.novelFolderPath,
        sourcePath,
        assetId
      );
      insertPageImage(targetPageId, copied.vaultPath, copied.relativePath, {
        x: 24,
        y: 24,
      });
      setActivePageId(targetPageId);
      setSelectedImage(null);
    };
    void pickImage();
  }, [
    activePageId,
    insertImageRequest,
    insertPageImage,
    novelDoc.novelFolderPath,
    onInsertImageRequestHandled,
    spread,
  ]);

  const handleInsertPage = (side: 'left' | 'right') => {
    const nextPages = insertPageInSpread(novelDoc.pages, spreadIndex, side);
    onUpdatePages(nextPages);

    if (spread.isCoverSpread) {
      onRequestSpreadIndex?.(clampSpreadIndex(nextPages, 1));
    } else {
      onRequestSpreadIndex?.(clampSpreadIndex(nextPages, spreadIndex));
    }

    onPageInserted?.(side);
    setShowInsertMenu(false);
  };

  const renderPageEditor = (
    page: NovelPage,
    side: 'left' | 'right',
    editable = true
  ) => (
    <BookPageEditor
      key={page.id}
      theme={theme}
      metrics={metrics}
      pageId={page.id}
      document={novelDoc}
      contentHtml={page.contentHtml}
      pageImages={(page.images ?? []).map((image) =>
        clampPageImage(image, measureOptions.contentWidthPx, measureOptions.contentHeightPx)
      )}
      imagePreviewUrls={previewUrls}
      selectedImageId={selectedImage?.pageId === page.id ? selectedImage.imageId : null}
      spreadDragImageId={spreadDrag?.image.id ?? null}
      side={side}
      isActiveTypingPage={activePageId === page.id}
      isImageDropTarget={imageDropHoverPageId === page.id}
      onPageInput={(input) => handlePageContent(page.id, input)}
      onInsertImage={insertPageImage}
      onUpdatePageImages={handleUpdatePageImages}
      onSelectImage={handleSelectImage}
      onCropImage={handleCropImage}
      onActivatePage={setActivePageId}
      onRegisterFlowRef={registerPageFlowRef}
      onSpreadDragStart={handleSpreadDragStart}
      active={editable}
      autoFocus={focusPageId === page.id}
    />
  );

  const renderLeftPage = (spreadData: typeof spread, editable = true) => {
    if (spreadData.isCoverSpread && spreadData.leftPage) {
      return (
        <BookCoverPage
          theme={theme}
          metrics={metrics}
          document={novelDoc}
          onUpdateSettings={onUpdateSettings}
          onSelectCoverImage={onSelectCoverImage}
          coverImageUrl={coverImageUrl}
          selectingCoverImage={selectingCoverImage}
        />
      );
    }
    if (spreadData.leftPage) {
      return renderPageEditor(spreadData.leftPage, 'left', editable);
    }
    return <BookPageShell theme={theme} metrics={metrics} side="left" variant="blank" />;
  };

  const renderRightPage = (spreadData: typeof spread, editable = true) => {
    if (spreadData.rightPage) {
      return renderPageEditor(spreadData.rightPage, 'right', editable);
    }
    if (editable && !spreadData.isCoverSpread) {
      return (
        <button
          type="button"
          className="group/blank relative shrink-0 text-left"
          style={{ width: metrics.pageWidthPx, height: metrics.pageHeightPx }}
          onClick={() => handleInsertPage('right')}
        >
          <BookPageShell theme={theme} metrics={metrics} side="right" variant="blank" />
          <span
            className={`pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium ${t.muted}`}
          >
            Click to add page
          </span>
        </button>
      );
    }
    return <BookPageShell theme={theme} metrics={metrics} side="right" variant="blank" />;
  };

  const flippingPage =
    flipRequest?.direction === 'next'
      ? spread.isCoverSpread && spread.leftPage
        ? renderLeftPage(spread, false)
        : spread.rightPage
          ? renderRightPage(spread, false)
          : spread.leftPage
            ? renderLeftPage(spread, false)
            : null
      : spread.leftPage && !spread.isCoverSpread
        ? renderLeftPage(spread, false)
        : null;

  const flipPivot: BookPageFlipPivot =
    flipRequest?.direction === 'next'
      ? spread.isCoverSpread || !spread.rightPage
        ? 'left'
        : 'right'
      : 'left';

  const hideLeftDuringFlip =
    !!flipRequest && (flipRequest.direction === 'prev' || flipPivot === 'left');
  const hideRightDuringFlip =
    !!flipRequest && flipRequest.direction === 'next' && flipPivot === 'right';

  useEffect(() => {
    if (!flipRequest) return;
    if (!flippingPage) {
      onFlipComplete?.();
      return;
    }
    const timeout = window.setTimeout(() => onFlipComplete?.(), BOOK_FLIP_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [flipRequest, flippingPage, onFlipComplete]);

  useEffect(() => {
    if (!focusPageId) return;
    const targetSpread = getSpreadIndexForPage(novelDoc.pages, focusPageId);
    if (targetSpread !== spreadIndex) return;
    const timeout = window.setTimeout(() => setFocusPageId(null), 250);
    return () => window.clearTimeout(timeout);
  }, [focusPageId, spreadIndex, novelDoc.pages]);

  const flipBackPage =
    flipRequest && targetSpread
      ? flipRequest.direction === 'next'
        ? renderLeftPage(targetSpread, false)
        : renderRightPage(targetSpread, false)
      : null;

  const dragOverlay =
    spreadDrag &&
    spreadDrag.image.wrapMode === 'behind' &&
    createPortal(
      <div
        ref={dragOverlayRef}
        data-spread-image-drag
        className="pointer-events-none fixed z-[9999] overflow-hidden rounded-md shadow-2xl ring-2 ring-purple-400/80"
        style={{
          left: 0,
          top: 0,
          width: spreadDrag.visualWidth,
          height: spreadDrag.visualHeight,
          willChange: 'left, top',
        }}
      >
        {spreadDrag.previewUrl ? (
          <img
            src={spreadDrag.previewUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-stone-800/80 text-xs text-white">
            Moving…
          </div>
        )}
      </div>,
      document.body
    );

  return (
    <>
    <BookStage theme={theme} metrics={metrics} containerRef={stageRef}>
      <div
        className="relative flex items-stretch overflow-visible"
        style={{ width: metrics.pageWidthPx * 2 + metrics.spineWidthPx }}
      >
        {renderLeftPage(spread, !hideLeftDuringFlip)}
        <div
          className="relative flex shrink-0 items-center justify-center overflow-visible"
          style={{ width: metrics.spineWidthPx, zIndex: 40 }}
        >
          <div
            className="absolute inset-y-3 w-full rounded-sm"
            style={{ background: t.spineSurface, boxShadow: t.spineShadow }}
          />
          <div className="relative z-10">
            <BookSpineInsertMenu
              isOpen={showInsertMenu}
              anchorRef={insertButtonRef}
              onToggle={() => setShowInsertMenu((value) => !value)}
              onClose={() => setShowInsertMenu(false)}
              onInsertLeft={() => handleInsertPage('left')}
              onInsertRight={() => handleInsertPage('right')}
              menuClassName={t.insetSurface}
              buttonClassName={`rounded-full p-1.5 shadow-sm ${t.badgeNeutral}`}
              mutedClassName={t.muted}
            />
          </div>
        </div>
        {renderRightPage(spread, !hideRightDuringFlip)}

        {flipRequest && flippingPage && (
          <BookPageFlipAnimation
            direction={flipRequest.direction}
            pivot={flipPivot}
            isCoverOpening={spread.isCoverSpread && flipRequest.direction === 'next'}
            pageWidthPx={metrics.pageWidthPx}
            pageHeightPx={metrics.pageHeightPx}
            backContent={flipBackPage ?? undefined}
            onComplete={onFlipComplete}
            style={{
              left: flipPivot === 'right' ? metrics.pageWidthPx + metrics.spineWidthPx : 0,
            }}
          >
            {flippingPage}
          </BookPageFlipAnimation>
        )}
      </div>

      <NovelImageCropDialog
        isOpen={!!cropTarget && !!cropPreviewUrl}
        theme={theme}
        imageUrl={cropPreviewUrl}
        initialCrop={cropImage?.crop}
        onClose={() => setCropTarget(null)}
        onApply={(crop, croppedDataUrl) => void handleApplyCrop(crop, croppedDataUrl)}
      />
    </BookStage>
    {dragOverlay}
  </>
  );
}

export { BOOK_FLIP_DURATION_MS };
