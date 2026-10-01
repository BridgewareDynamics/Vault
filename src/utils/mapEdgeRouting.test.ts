import { describe, it, expect } from 'vitest';
import {
  buildBranchEdges,
  buildChronologicalEdgesWithHandles,
  buildFlowEdgesFromBlocks,
  buildMapEdges,
  getClosestHandleSides,
} from './mapEdgeRouting';
import { MAP_BLOCK_DEFAULT_SIZE, MAP_BRANCH_BLOCK_DEFAULT_SIZE } from './mapLayout';
import { buildChronology } from './mapChronology';
import { MapBlock } from '../types';

function block(id: string, x: number, y: number): MapBlock {
  return {
    id,
    kind: 'timeline',
    chronology: buildChronology({ tier: 'year', year: 2000 }),
    notesHtml: '',
    attachments: [],
    position: { x, y },
    size: { ...MAP_BLOCK_DEFAULT_SIZE },
  };
}

function branch(id: string, parentBlockId: string, side: 'left' | 'right', x: number, y: number): MapBlock {
  return {
    id,
    kind: 'branch',
    notesHtml: '',
    attachments: [],
    position: { x, y },
    size: { ...MAP_BRANCH_BLOCK_DEFAULT_SIZE },
    branchParentBlockId: parentBlockId,
    branchSide: side,
    branchSourceSide: side,
    branchOrder: 0,
  };
}

describe('mapEdgeRouting', () => {
  it('connects right to left when target is to the right', () => {
    const source = block('a', 0, 0);
    const target = block('b', 400, 0);
    const sides = getClosestHandleSides(source, target);
    expect(sides.sourceSide).toBe('right');
    expect(sides.targetSide).toBe('left');
  });

  it('connects bottom to top when target is below', () => {
    const source = block('a', 0, 0);
    const target = block('b', 0, 300);
    const sides = getClosestHandleSides(source, target);
    expect(sides.sourceSide).toBe('bottom');
    expect(sides.targetSide).toBe('top');
  });

  it('stores handle ids on chronological edges', () => {
    const edges = buildChronologicalEdgesWithHandles([block('a', 0, 0), block('b', 0, 300)]);
    expect(edges[0].sourceHandle).toBe('source-bottom');
    expect(edges[0].targetHandle).toBe('target-top');
  });

  it('pins branch edges to the explicit left/right handles', () => {
    const parent = block('timeline', 400, 0);
    const child = branch('branch-left', 'timeline', 'left', 420, 500);
    const edges = buildBranchEdges([parent, child]);
    const flowEdges = buildFlowEdgesFromBlocks([parent, child], edges);

    expect(edges[0].kind).toBe('branch');
    expect(edges[0].sourceHandle).toBe('source-left');
    expect(edges[0].targetHandle).toBe('target-right');
    expect(flowEdges[0].sourceHandle).toBe('source-left');
    expect(flowEdges[0].targetHandle).toBe('target-right');
  });

  it('builds chronology and branch edges together for mixed maps', () => {
    const edges = buildMapEdges(
      [
        block('a', 0, 0),
        block('b', 0, 300),
        branch('branch-right', 'a', 'right', 300, 0),
      ],
      'solid'
    );

    expect(edges.filter((edge) => edge.kind === 'chronology')).toHaveLength(1);
    expect(edges.filter((edge) => edge.kind === 'branch')).toHaveLength(1);
  });

  it('uses a custom branch source side for turnaround block branches', () => {
    const parent = block('timeline', 400, 300);
    const child: MapBlock = {
      ...branch('branch-left', 'timeline', 'left', 120, 300),
      branchSourceSide: 'bottom',
    };

    const edges = buildBranchEdges([parent, child]);

    expect(edges[0].sourceHandle).toBe('source-bottom');
    expect(edges[0].targetHandle).toBe('target-right');
  });
});
