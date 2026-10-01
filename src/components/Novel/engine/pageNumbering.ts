import { NovelPage } from '../../../types';
import { getSpreads } from './spreadNavigator';

export function getContentPageNumber(pages: NovelPage[], pageId: string): number | null {
  const contentPages = pages.filter((p) => p.type === 'content');
  const index = contentPages.findIndex((p) => p.id === pageId);
  return index >= 0 ? index + 1 : null;
}

export function reindexPageSides(pages: NovelPage[]): NovelPage[] {
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

function createBlankContentPage(): NovelPage {
  return {
    id: crypto.randomUUID(),
    side: 'left',
    type: 'content',
    contentHtml: '<p><br></p>',
    images: [],
  };
}

function splitCoverAndContent(pages: NovelPage[]) {
  return {
    coverPages: pages.filter((p) => p.type === 'cover'),
    contentPages: pages.filter((p) => p.type === 'content'),
  };
}

/** Insert a blank page on the chosen side of the active spread. */
export function insertPageInSpread(
  pages: NovelPage[],
  spreadIndex: number,
  side: 'left' | 'right'
): NovelPage[] {
  const spreads = getSpreads(pages);
  const spread = spreads[spreadIndex];
  if (!spread) return pages;

  const { coverPages, contentPages } = splitCoverAndContent(pages);
  const newPage = createBlankContentPage();

  if (spread.isCoverSpread) {
    const insertAt = side === 'left' ? 0 : Math.min(1, contentPages.length);
    const nextContent = [...contentPages];
    nextContent.splice(insertAt, 0, newPage);
    return reindexPageSides([...coverPages, ...nextContent]);
  }

  const leftIndex = spread.leftPage ? contentPages.findIndex((p) => p.id === spread.leftPage!.id) : -1;
  const rightIndex = spread.rightPage ? contentPages.findIndex((p) => p.id === spread.rightPage!.id) : -1;

  let insertAt = contentPages.length;

  if (side === 'left') {
    if (leftIndex >= 0) {
      insertAt = leftIndex;
    } else if (rightIndex >= 0) {
      insertAt = rightIndex;
    }
  } else if (rightIndex >= 0) {
    insertAt = rightIndex;
  } else if (leftIndex >= 0) {
    insertAt = leftIndex + 1;
  }

  insertAt = Math.max(0, Math.min(insertAt, contentPages.length));

  const nextContent = [...contentPages];
  nextContent.splice(insertAt, 0, newPage);
  return reindexPageSides([...coverPages, ...nextContent]);
}

export function getSpreadIndexForPage(pages: NovelPage[], pageId: string): number | null {
  const spreads = getSpreads(pages);
  const match = spreads.find(
    (spread) => spread.leftPage?.id === pageId || spread.rightPage?.id === pageId
  );
  return match?.spreadIndex ?? null;
}

/** @deprecated Use insertPageInSpread with the UI spread index */
export function insertPageAtSpine(
  pages: NovelPage[],
  contentSpreadIndex: number,
  side: 'left' | 'right'
): NovelPage[] {
  return insertPageInSpread(pages, contentSpreadIndex + 1, side);
}
