import { describe, expect, it } from 'vitest';
import type { MapBlock } from '../../types';
import { buildChronology } from '../../utils/mapChronology';
import { MAP_BLOCK_DEFAULT_SIZE } from '../../utils/mapLayout';
import {
  getMapEdgeAppearanceLabel,
  normalizeMapEdgeAppearance,
  resolveMapEdgeRenderStyle,
} from './mapEdgeAppearance';

function makeBlock(id: string, surfaceColor?: string, borderColor?: string): MapBlock {
  return {
    id,
    kind: 'timeline',
    title: id,
    chronology: buildChronology({ tier: 'year', year: 2024 }),
    notesHtml: '',
    attachments: [],
    position: { x: 0, y: 0 },
    size: { ...MAP_BLOCK_DEFAULT_SIZE },
    surfaceColor,
    borderColor,
  };
}

describe('mapEdgeAppearance', () => {
  it('normalizes missing appearance config to the theme defaults', () => {
    expect(normalizeMapEdgeAppearance()).toEqual({
      colorMode: 'theme',
      strokeColor: undefined,
      glowColor: undefined,
    });
    expect(getMapEdgeAppearanceLabel()).toBe('Theme connector palette');
  });

  it('resolves custom connector colors without a gradient', () => {
    const style = resolveMapEdgeRenderStyle({
      appearance: {
        colorMode: 'custom',
        strokeColor: '#A855F7',
        glowColor: '#14B8A6',
      },
      kind: 'chronology',
      style: 'solid',
      theme: 'dark',
    });

    expect(style).toMatchObject({
      strokeColor: '#A855F7',
      glowColor: '#14B8A6',
      gradientMode: 'none',
    });
  });

  it('links connector gradients to the connected block accents', () => {
    const style = resolveMapEdgeRenderStyle({
      appearance: { colorMode: 'linked-blocks' },
      sourceBlock: makeBlock('source', '#A855F7', '#7C3AED'),
      targetBlock: makeBlock('target', '#14B8A6', '#0EA5E9'),
      kind: 'chronology',
      style: 'solid',
      theme: 'dark',
    });

    expect(style.gradientMode).toBe('linked-blocks');
    expect(style.gradientStartColor).toBe('#7C3AED');
    expect(style.gradientEndColor).toBe('#0EA5E9');
  });
});
