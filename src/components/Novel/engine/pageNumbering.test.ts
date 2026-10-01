import { describe, expect, it } from 'vitest';
import {
  getContentPageNumber,
  getSpreadIndexForPage,
  insertPageInSpread,
  reindexPageSides,
} from './pageNumbering';
import { getSpreads } from './spreadNavigator';
import type { NovelPage } from '../../../types';

function makePage(id: string, type: 'cover' | 'content', side: 'left' | 'right'): NovelPage {
  return { id, type, side, contentHtml: '', images: [] };
}

describe('pageNumbering', () => {
  it('reindexes content page sides alternately', () => {
    const pages = reindexPageSides([
      makePage('cover', 'cover', 'left'),
      makePage('p1', 'content', 'right'),
      makePage('p2', 'content', 'right'),
      makePage('p3', 'content', 'right'),
    ]);

    expect(pages[1].side).toBe('left');
    expect(pages[2].side).toBe('right');
    expect(pages[3].side).toBe('left');
  });

  it('inserts a page on the left side of the current content spread', () => {
    const pages = [
      makePage('cover', 'cover', 'left'),
      makePage('p1', 'content', 'left'),
      makePage('p2', 'content', 'right'),
      makePage('p3', 'content', 'left'),
      makePage('p4', 'content', 'right'),
    ];

    const next = insertPageInSpread(pages, 1, 'left');
    const spread = getSpreads(next)[1];

    expect(next.filter((p) => p.type === 'content')).toHaveLength(5);
    expect(spread.leftPage?.id).not.toBe('p1');
    expect(spread.rightPage?.id).toBe('p1');
  });

  it('inserts a page on the right side of the current content spread', () => {
    const pages = [
      makePage('cover', 'cover', 'left'),
      makePage('p1', 'content', 'left'),
      makePage('p2', 'content', 'right'),
    ];

    const next = insertPageInSpread(pages, 1, 'right');
    const spread = getSpreads(next)[1];

    expect(spread.leftPage?.id).toBe('p1');
    expect(spread.rightPage?.id).not.toBe('p2');
    expect(spread.rightPage?.contentHtml).toBe('<p><br></p>');
  });

  it('inserts into the first content spread from the cover spread', () => {
    const pages = [
      makePage('cover', 'cover', 'left'),
      makePage('p1', 'content', 'left'),
      makePage('p2', 'content', 'right'),
    ];

    const next = insertPageInSpread(pages, 0, 'left');
    const firstContentSpread = getSpreads(next)[1];

    expect(firstContentSpread.leftPage?.contentHtml).toBe('<p><br></p>');
    expect(firstContentSpread.rightPage?.id).toBe('p1');
  });

  it('returns content page numbers excluding cover', () => {
    const pages = [
      makePage('cover', 'cover', 'left'),
      makePage('p1', 'content', 'left'),
      makePage('p2', 'content', 'right'),
    ];
    expect(getContentPageNumber(pages, 'p1')).toBe(1);
    expect(getContentPageNumber(pages, 'p2')).toBe(2);
    expect(getContentPageNumber(pages, 'cover')).toBeNull();
  });

  it('finds spread index for a page id', () => {
    const pages = [
      makePage('cover', 'cover', 'left'),
      makePage('p1', 'content', 'left'),
      makePage('p2', 'content', 'right'),
    ];
    expect(getSpreadIndexForPage(pages, 'p2')).toBe(1);
  });
});
