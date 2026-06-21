import { describe, expect, it } from 'vitest';
import {
  computeSpacerPlacement,
  findSpacerInsertBefore,
  getEditorTextHtml,
  syncEditorImageSpacers,
} from './novelEditorImageSync';
import type { NovelPageImage } from '../../types';

function mockBlock(top: number, height: number): HTMLParagraphElement {
  const paragraph = document.createElement('p');
  Object.defineProperty(paragraph, 'offsetTop', { value: top, configurable: true });
  Object.defineProperty(paragraph, 'offsetHeight', { value: height, configurable: true });
  return paragraph;
}

describe('novelEditorImageSync', () => {
  it('finds insert point at the first block below targetY', () => {
    const editor = document.createElement('div');
    editor.append(mockBlock(0, 24), mockBlock(30, 24), mockBlock(60, 24));

    expect(findSpacerInsertBefore(editor, 0)?.offsetTop).toBe(0);
    expect(findSpacerInsertBefore(editor, 25)?.offsetTop).toBe(30);
    expect(findSpacerInsertBefore(editor, 55)?.offsetTop).toBe(60);
    expect(findSpacerInsertBefore(editor, 100)).toBeNull();
  });

  it('places spacer after content when image sits below all blocks', () => {
    const editor = document.createElement('div');
    const first = mockBlock(0, 20);
    editor.append(first);

    const placement = computeSpacerPlacement(editor, 80);
    expect(placement.insertBefore).toBeNull();
    expect(placement.marginTop).toBe(60);
  });

  it('inserts spacer after existing text so content can sit above the image', () => {
    const editor = document.createElement('div');
    editor.style.width = '300px';
    const above = mockBlock(0, 22);
    above.textContent = 'Text above the image';
    const below = mockBlock(28, 22);
    below.textContent = 'Text beside and below';
    editor.append(above, below);

    const image: NovelPageImage = {
      id: 'img-1',
      assetPath: 'assets/a.jpg',
      x: 10,
      y: 48,
      width: 120,
      height: 90,
      wrapMode: 'square',
    };

    syncEditorImageSpacers(editor, [image], 300);

    const spacer = editor.querySelector('[data-novel-image-spacer]');
    expect(spacer).toBeTruthy();
    expect(spacer?.previousElementSibling).toBe(above);
    expect(spacer?.nextElementSibling).toBe(below);
    expect(getEditorTextHtml(editor)).toContain('Text above the image');
    expect(getEditorTextHtml(editor)).not.toContain('data-novel-image-spacer');
  });
});
