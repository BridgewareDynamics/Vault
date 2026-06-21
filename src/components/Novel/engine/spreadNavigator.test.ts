import { describe, expect, it } from 'vitest';
import { getSpreadCount, getSpreads, planSpreadNavigation } from './spreadNavigator';
import type { NovelPage } from '../../../types';

function makePage(id: string, type: 'cover' | 'content', side: 'left' | 'right'): NovelPage {
  return { id, type, side, contentHtml: '<p><br></p>', images: [] };
}

describe('spreadNavigator', () => {
  it('advances to the next spread without extending when one exists', () => {
    const pages = [
      makePage('cover', 'cover', 'left'),
      makePage('p1', 'content', 'left'),
      makePage('p2', 'content', 'right'),
      makePage('p3', 'content', 'left'),
      makePage('p4', 'content', 'right'),
    ];

    const plan = planSpreadNavigation(pages, 1, 'next');

    expect(plan.didExtend).toBe(false);
    expect(plan.targetSpreadIndex).toBe(2);
    expect(plan.pages).toBe(pages);
  });

  it('appends a right page when advancing from a spread missing its right page', () => {
    const pages = [
      makePage('cover', 'cover', 'left'),
      makePage('p1', 'content', 'left'),
      makePage('p2', 'content', 'right'),
      makePage('p3', 'content', 'left'),
    ];

    const plan = planSpreadNavigation(pages, 2, 'next');

    expect(plan.didExtend).toBe(true);
    expect(plan.targetSpreadIndex).toBe(2);
    expect(getSpreads(plan.pages)[2].rightPage).not.toBeNull();
  });

  it('appends a new spread when advancing from the final full spread', () => {
    const pages = [
      makePage('cover', 'cover', 'left'),
      makePage('p1', 'content', 'left'),
      makePage('p2', 'content', 'right'),
    ];

    const plan = planSpreadNavigation(pages, 1, 'next');

    expect(plan.didExtend).toBe(true);
    expect(getSpreadCount(plan.pages)).toBe(3);
    expect(plan.targetSpreadIndex).toBe(2);
  });

  it('creates the first content spread when advancing from cover-only book', () => {
    const pages = [makePage('cover', 'cover', 'left')];

    const plan = planSpreadNavigation(pages, 0, 'next');

    expect(plan.didExtend).toBe(true);
    expect(getSpreadCount(plan.pages)).toBe(2);
    expect(plan.targetSpreadIndex).toBe(1);
  });
});
