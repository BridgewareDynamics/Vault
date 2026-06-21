import { describe, expect, it, vi } from 'vitest';
import { getBranchButtonsForBlock, getMiniMapNodeColor } from './mapCanvasHelpers';
import { MAP_BLOCK_DEFAULT_SIZE, MAP_BRANCH_BLOCK_DEFAULT_SIZE } from '../../utils/mapLayout';
import { buildChronology } from '../../utils/mapChronology';
import type { MapBlock } from '../../types';

vi.mock('@xyflow/react', () => ({
  ReactFlow: () => null,
  Background: () => null,
  MiniMap: () => null,
  Panel: ({ children }: { children: unknown }) => children,
  Handle: () => null,
  Position: {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  },
  BackgroundVariant: { Lines: 'lines' },
  useReactFlow: () => ({
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    fitView: vi.fn(),
  }),
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
}));

function makeTimelineBlock(): MapBlock {
  return {
    id: 'timeline-1',
    kind: 'timeline',
    chronology: buildChronology({ tier: 'year', year: 2024 }),
    notesHtml: '',
    attachments: [],
    position: { x: 0, y: 0 },
    size: { ...MAP_BLOCK_DEFAULT_SIZE },
  };
}

function makeBranchBlock(): MapBlock {
  return {
    id: 'branch-1',
    kind: 'branch',
    notesHtml: '',
    attachments: [],
    position: { x: 0, y: 0 },
    size: { ...MAP_BRANCH_BLOCK_DEFAULT_SIZE },
    branchParentBlockId: 'timeline-1',
    branchSide: 'right',
    branchOrder: 0,
  };
}

describe('getBranchButtonsForBlock', () => {
  it('keeps branch cards horizontal only', () => {
    const buttons = getBranchButtonsForBlock(makeBranchBlock(), ['top', 'bottom']);

    expect(buttons).toEqual([
      { branchSide: 'left', buttonSide: 'left' },
      { branchSide: 'right', buttonSide: 'right' },
    ]);
  });

  it('keeps timeline blocks adaptive to open sides', () => {
    const buttons = getBranchButtonsForBlock(makeTimelineBlock(), ['top', 'left']);

    expect(buttons).toEqual([
      { branchSide: 'left', buttonSide: 'bottom' },
      { branchSide: 'right', buttonSide: 'right' },
    ]);
  });

  it('uses a block custom color on the minimap when present', () => {
    const block = { ...makeTimelineBlock(), surfaceColor: '#14B8A6', borderColor: '#7C3AED' };

    expect(getMiniMapNodeColor(block, 'pastel')).toBe('#3EC5B6');
    expect(getMiniMapNodeColor(block, 'brideware-purple')).toBe('#14A597');
  });

  it('still supports legacy single-color blocks on the minimap', () => {
    const block = { ...makeTimelineBlock(), color: '#14B8A6' };

    expect(getMiniMapNodeColor(block, 'pastel')).toBe('#3EC5B6');
  });
});
