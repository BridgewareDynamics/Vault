import { describe, expect, it } from 'vitest';
import {
  clamp,
  clampPageImage,
  clientPointToPageLocal,
  computeSpreadDragGrabOffset,
  createPageImage,
  getImageSpacerStyle,
  resolveInsertTargetPageId,
  stripInlineImagesFromHtml,
} from './novelPageImageUtils';

describe('novelPageImageUtils', () => {
  it('creates a page image within content bounds', () => {
    const image = createPageImage('assets/test.jpg', 10, 20, 300, 400);
    expect(image.assetPath).toBe('assets/test.jpg');
    expect(image.wrapMode).toBe('square');
    expect(image.x).toBeGreaterThanOrEqual(0);
    expect(image.y).toBeGreaterThanOrEqual(0);
  });

  it('clamps page image position and size', () => {
    const clamped = clampPageImage(
      {
        id: '1',
        assetPath: 'assets/a.jpg',
        x: 500,
        y: 500,
        width: 900,
        height: 900,
        wrapMode: 'inline',
      },
      300,
      400
    );
    expect(clamped.width).toBeLessThanOrEqual(300);
    expect(clamped.height).toBeLessThanOrEqual(400);
    expect(clamped.x).toBeLessThanOrEqual(300 - clamped.width);
    expect(clamped.y).toBeLessThanOrEqual(400 - clamped.height);
  });

  it('builds square wrap spacers with float side', () => {
    const left = getImageSpacerStyle(
      {
        id: '1',
        assetPath: 'assets/a.jpg',
        x: 10,
        y: 20,
        width: 120,
        height: 90,
        wrapMode: 'square',
      },
      300
    );
    expect(left.float).toBe('left');

    const right = getImageSpacerStyle(
      {
        id: '2',
        assetPath: 'assets/b.jpg',
        x: 200,
        y: 20,
        width: 120,
        height: 90,
        wrapMode: 'square',
      },
      300
    );
    expect(right.float).toBe('right');
  });

  it('strips inline images from html', () => {
    const html = '<div>Hello</div><img data-novel-asset="assets/x.jpg" /><div>World</div>';
    expect(stripInlineImagesFromHtml(html)).not.toContain('<img');
    expect(stripInlineImagesFromHtml(html)).toContain('Hello');
  });

  it('clamps numeric values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it('resolves insert target from active typing page', () => {
    const left = {
      id: 'left-page',
      side: 'left' as const,
      type: 'content' as const,
      contentHtml: '',
      images: [],
    };
    const right = {
      id: 'right-page',
      side: 'right' as const,
      type: 'content' as const,
      contentHtml: '',
      images: [],
    };

    expect(
      resolveInsertTargetPageId('left-page', { leftPage: left, rightPage: right })
    ).toBe('left-page');
    expect(
      resolveInsertTargetPageId('right-page', { leftPage: left, rightPage: right })
    ).toBe('right-page');
    expect(
      resolveInsertTargetPageId('missing', { leftPage: left, rightPage: right })
    ).toBe('right-page');
  });

  it('computes grab offset from frame rect in screen space', () => {
    const grab = computeSpreadDragGrabOffset(
      { left: 100, top: 200, width: 120, height: 90 } as DOMRect,
      130,
      230
    );
    expect(grab.offsetScreenX).toBe(30);
    expect(grab.offsetScreenY).toBe(30);
    expect(grab.visualWidth).toBe(120);
    expect(grab.visualHeight).toBe(90);
  });

  it('converts screen drag position to page-local coordinates with scale', () => {
    const flow = document.createElement('div');
    Object.defineProperty(flow, 'offsetWidth', { value: 200 });
    Object.defineProperty(flow, 'getBoundingClientRect', {
      value: () => ({ left: 50, top: 80, width: 100, height: 150 }),
    });

    const local = clientPointToPageLocal(130, 130, flow.getBoundingClientRect(), flow, 20, 10);
    expect(local.x).toBeCloseTo(120);
    expect(local.y).toBeCloseTo(80);
  });
});
