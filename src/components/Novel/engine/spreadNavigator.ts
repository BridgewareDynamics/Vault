import { NovelPage } from '../../../types';

export interface SpreadInfo {
  spreadIndex: number;
  leftPage: NovelPage | null;
  rightPage: NovelPage | null;
  isCoverSpread: boolean;
}

export function getSpreads(pages: NovelPage[]): SpreadInfo[] {
  const cover = pages.find((p) => p.type === 'cover') ?? null;
  const content = pages.filter((p) => p.type === 'content');
  const spreads: SpreadInfo[] = [{ spreadIndex: 0, leftPage: cover, rightPage: null, isCoverSpread: true }];

  for (let i = 0; i < content.length; i += 2) {
    spreads.push({
      spreadIndex: spreads.length,
      leftPage: content[i] ?? null,
      rightPage: content[i + 1] ?? null,
      isCoverSpread: false,
    });
  }

  return spreads;
}

export function getSpreadCount(pages: NovelPage[]): number {
  return getSpreads(pages).length;
}

export function clampSpreadIndex(pages: NovelPage[], index: number): number {
  const max = Math.max(0, getSpreadCount(pages) - 1);
  return Math.min(Math.max(0, index), max);
}

export interface SpreadNavigationPlan {
  pages: NovelPage[];
  targetSpreadIndex: number;
  didExtend: boolean;
}

/** Resolve next/prev navigation, appending pages when advancing past the final spread. */
export function planSpreadNavigation(
  pages: NovelPage[],
  currentSpreadIndex: number,
  direction: 'next' | 'prev'
): SpreadNavigationPlan {
  if (direction === 'prev') {
    return {
      pages,
      targetSpreadIndex: clampSpreadIndex(pages, currentSpreadIndex - 1),
      didExtend: false,
    };
  }

  const spreadCount = getSpreadCount(pages);
  if (currentSpreadIndex < spreadCount - 1) {
    return {
      pages,
      targetSpreadIndex: currentSpreadIndex + 1,
      didExtend: false,
    };
  }

  const spreads = getSpreads(pages);
  const current = spreads[currentSpreadIndex];
  if (!current) {
    return { pages, targetSpreadIndex: currentSpreadIndex, didExtend: false };
  }

  const coverPages = pages.filter((p) => p.type === 'cover');
  const contentPages = pages.filter((p) => p.type === 'content');
  const blankPage = (): NovelPage => ({
    id: crypto.randomUUID(),
    side: 'left',
    type: 'content',
    contentHtml: '<p><br></p>',
    images: [],
  });

  if (current.isCoverSpread) {
    if (spreadCount > 1) {
      return { pages, targetSpreadIndex: 1, didExtend: false };
    }
    const nextPages = [
      ...coverPages,
      blankPage(),
      blankPage(),
    ];
    return {
      pages: reindexContentPageSides(nextPages),
      targetSpreadIndex: 1,
      didExtend: true,
    };
  }

  if (!current.rightPage) {
    const insertAt = current.leftPage
      ? contentPages.findIndex((p) => p.id === current.leftPage!.id) + 1
      : contentPages.length;
    const nextContent = [...contentPages];
    nextContent.splice(insertAt, 0, blankPage());
    const nextPages = [...coverPages, ...nextContent];
    return {
      pages: reindexContentPageSides(nextPages),
      targetSpreadIndex: currentSpreadIndex,
      didExtend: true,
    };
  }

  const nextPages = [...coverPages, ...contentPages, blankPage(), blankPage()];
  return {
    pages: reindexContentPageSides(nextPages),
    targetSpreadIndex: getSpreadCount(nextPages) - 1,
    didExtend: true,
  };
}

function reindexContentPageSides(pages: NovelPage[]): NovelPage[] {
  let contentIndex = 0;
  return pages.map((page) => {
    if (page.type === 'cover') {
      return { ...page, side: 'left' as const };
    }
    const side = contentIndex % 2 === 0 ? ('left' as const) : ('right' as const);
    contentIndex += 1;
    return { ...page, side };
  });
}
