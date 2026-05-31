import { useEffect, useMemo, useRef, useState } from 'react';
import { NovelDocument, NovelPage } from '../../types';
import { Theme } from '../../types';
import { useNovelTheme } from './novelTheme';
import { BookCoverPage } from './BookCoverPage';
import { BookPageEditor, buildPageMeasureOptions } from './BookPageEditor';
import { BookPageFlipAnimation, BOOK_FLIP_DURATION_MS, type BookPageFlipPivot } from './BookPageFlipAnimation';
import { BookPageShell } from './BookPageShell';
import { BookSpineInsertMenu } from './BookSpineInsertMenu';
import { BookStage } from './BookStage';
import { clampSpreadIndex, getSpreads } from './engine/spreadNavigator';
import { insertPageInSpread, reindexPageSides } from './engine/pageNumbering';
import { measureHtmlOverflow, mergeHtmlFragments } from './engine/pageLayoutEngine';
import { loadNovelAssetPreviewUrl } from './novelAssetUtils';
import { useBookDisplayMetrics } from './hooks/useBookDisplayMetrics';

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
}: BookSpreadViewProps) {
  const t = useNovelTheme(theme);
  const stageRef = useRef<HTMLDivElement>(null);
  const insertButtonRef = useRef<HTMLButtonElement>(null);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const metrics = useBookDisplayMetrics(
    novelDoc.settings.bookSizeId,
    novelDoc.settings.marginMm,
    stageRef
  );

  const spreads = getSpreads(novelDoc.pages);
  const spread = spreads[spreadIndex] ?? spreads[0];
  const targetSpread = flipRequest ? spreads[flipRequest.targetSpreadIndex] : null;

  const measureOptions = useMemo(
    () => buildPageMeasureOptions(metrics, novelDoc),
    [metrics, novelDoc.settings.fontFamily, novelDoc.settings.fontSize]
  );

  const handlePageContent = (pageId: string, html: string) => {
    let pages = [...novelDoc.pages];
    let pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex < 0) return;

    let currentHtml = html;
    let changed = false;

    while (pageIndex >= 0 && pageIndex < pages.length) {
      const page = pages[pageIndex];
      if (page.type !== 'content') break;

      const split = measureHtmlOverflow(currentHtml, measureOptions);
      if (!split.isOverflowing) {
        if (pages[pageIndex].contentHtml !== currentHtml) {
          pages[pageIndex] = { ...pages[pageIndex], contentHtml: currentHtml };
          changed = true;
        }
        break;
      }

      pages[pageIndex] = { ...pages[pageIndex], contentHtml: split.keptHtml };
      changed = true;
      pageIndex += 1;

      if (pageIndex < pages.length && pages[pageIndex].type === 'content') {
        currentHtml = mergeHtmlFragments(split.overflowHtml, pages[pageIndex].contentHtml);
        pages[pageIndex] = { ...pages[pageIndex], contentHtml: currentHtml };
      } else {
        pages.splice(pageIndex, 0, {
          id: crypto.randomUUID(),
          side: 'right',
          type: 'content',
          contentHtml: split.overflowHtml,
          images: [],
        });
        break;
      }
    }

    if (!changed) return;

    const reindexed = reindexPageSides(pages);
    onUpdatePages(reindexed);

    const spreadInfo = getSpreads(reindexed)[spreadIndex];
    if (
      spreadInfo &&
      !spreadInfo.isCoverSpread &&
      spreadInfo.leftPage &&
      spreadInfo.rightPage &&
      onSpreadAdvance
    ) {
      const leftFull = measureHtmlOverflow(spreadInfo.leftPage.contentHtml, measureOptions).isOverflowing;
      const rightFull = measureHtmlOverflow(spreadInfo.rightPage.contentHtml, measureOptions).isOverflowing;
      if (leftFull && rightFull) {
        onSpreadAdvance();
      }
    }
  };
  const insertPageImage = (pageId: string, vaultPath: string, relativePath: string) => {
    void loadNovelAssetPreviewUrl(vaultPath).then((previewUrl) => {
      const src = previewUrl ?? vaultPath;
      onUpdatePages(
        novelDoc.pages.map((p) => {
          if (p.id !== pageId) return p;
          const imgTag = `<img src="${src}" alt="" data-novel-asset="${relativePath}" style="width:120px;height:auto;float:left;margin:0 12px 8px 0;shape-outside:margin-box;" />`;
          return { ...p, contentHtml: `${p.contentHtml}${imgTag}` };
        })
      );
    });
  };

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
      return (
        <BookPageEditor
          key={spreadData.leftPage.id}
          theme={theme}
          metrics={metrics}
          pageId={spreadData.leftPage.id}
          document={novelDoc}
          contentHtml={spreadData.leftPage.contentHtml}
          side="left"
          onChange={(html) => handlePageContent(spreadData.leftPage!.id, html)}
          onOverflow={(html) => handlePageContent(spreadData.leftPage!.id, html)}
          onInsertImage={insertPageImage}
          active={editable}
        />
      );
    }
    return <BookPageShell theme={theme} metrics={metrics} side="left" variant="blank" />;
  };

  const renderRightPage = (spreadData: typeof spread, editable = true) => {
    if (spreadData.rightPage) {
      return (
        <BookPageEditor
          key={spreadData.rightPage.id}
          theme={theme}
          metrics={metrics}
          pageId={spreadData.rightPage.id}
          document={novelDoc}
          contentHtml={spreadData.rightPage.contentHtml}
          side="right"
          onChange={(html) => handlePageContent(spreadData.rightPage!.id, html)}
          onOverflow={(html) => handlePageContent(spreadData.rightPage!.id, html)}
          onInsertImage={insertPageImage}
          active={editable}
        />
      );
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

  const flipBackPage =
    flipRequest && targetSpread
      ? flipRequest.direction === 'next'
        ? renderLeftPage(targetSpread, false)
        : renderRightPage(targetSpread, false)
      : null;

  return (
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
    </BookStage>
  );
}

export { BOOK_FLIP_DURATION_MS };
