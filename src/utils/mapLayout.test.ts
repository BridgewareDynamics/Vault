import { describe, it, expect } from 'vitest';
import { MapBlock } from '../types';
import { buildChronology } from './mapChronology';
import {
  applyTimelineLayout,
  buildChronologicalEdges,
  getMapBlockSize,
  relayoutDocument,
  MAP_BLOCK_DEFAULT_SIZE,
  MAP_BRANCH_BLOCK_DEFAULT_SIZE,
} from './mapLayout';
import { MapDocument } from '../types';

function makeBlock(id: string, year: number): MapBlock {
  return {
    id,
    kind: 'timeline',
    chronology: buildChronology({ tier: 'year', year }),
    notesHtml: '',
    attachments: [],
    position: { x: 0, y: 0 },
    size: { ...MAP_BLOCK_DEFAULT_SIZE },
  };
}

function makeBranch(id: string, parentBlockId: string, side: 'left' | 'right', order = 0): MapBlock {
  return {
    id,
    kind: 'branch',
    notesHtml: '',
    attachments: [],
    position: { x: 0, y: 0 },
    size: { ...MAP_BRANCH_BLOCK_DEFAULT_SIZE },
    branchParentBlockId: parentBlockId,
    branchSide: side,
    branchOrder: order,
  };
}

function overlap(a: MapBlock, b: MapBlock): boolean {
  return !(
    a.position.x + a.size.width <= b.position.x ||
    b.position.x + b.size.width <= a.position.x ||
    a.position.y + a.size.height <= b.position.y ||
    b.position.y + b.size.height <= a.position.y
  );
}

describe('mapLayout', () => {
  it('sorts blocks chronologically before layout', () => {
    const blocks = [makeBlock('b', 2020), makeBlock('a', 1999)];
    const laid = applyTimelineLayout(blocks);
    expect(laid[0].id).toBe('a');
    expect(laid[1].position.y).toBeGreaterThanOrEqual(laid[0].position.y);
  });

  it('snakes to the next column after five blocks', () => {
    const blocks = [
      makeBlock('a', 2000),
      makeBlock('b', 2001),
      makeBlock('c', 2002),
      makeBlock('d', 2003),
      makeBlock('e', 2004),
      makeBlock('f', 2005),
    ];

    const laid = applyTimelineLayout(blocks);
    expect(laid[0].position.x).toBe(laid[4].position.x);
    expect(laid[5].position.x).toBeGreaterThan(laid[4].position.x);
    expect(laid[5].position.y).toBe(laid[4].position.y);
  });

  it('upgrades legacy default block sizes to the current rectangle defaults', () => {
    const legacyTimeline = makeBlock('legacy-timeline', 2000);
    legacyTimeline.size = { width: 200, height: 200 };

    const legacyBranch = makeBranch('legacy-branch', 'legacy-timeline', 'left');
    legacyBranch.size = { width: 176, height: 132 };

    expect(getMapBlockSize(legacyTimeline)).toEqual(MAP_BLOCK_DEFAULT_SIZE);
    expect(getMapBlockSize(legacyBranch)).toEqual(MAP_BRANCH_BLOCK_DEFAULT_SIZE);
  });

  it('keeps the first timeline column clear of the canvas toolbar', () => {
    const laid = applyTimelineLayout([makeBlock('a', 2000)]);

    expect(laid[0].position.x).toBeGreaterThanOrEqual(380);
  });

  it('builds edges between sorted blocks', () => {
    const blocks = [makeBlock('a', 1999), makeBlock('b', 2020)];
    const edges = buildChronologicalEdges(blocks);
    expect(edges).toHaveLength(1);
    expect(edges[0].sourceBlockId).toBe('a');
    expect(edges[0].targetBlockId).toBe('b');
  });

  it('relayouts full document', () => {
    const doc: MapDocument = {
      id: '1',
      title: 'Test',
      version: 1,
      createdAt: 0,
      updatedAt: 0,
      casePath: null,
      mapFolderPath: '/tmp/map',
      blocks: [makeBlock('b', 2020), makeBlock('a', 1999)],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      layoutMode: 'timeline-vertical',
      defaultEdgeStyle: 'solid',
    };
    const next = relayoutDocument(doc);
    expect(next.blocks[0].id).toBe('a');
    expect(next.edges.length).toBe(1);
  });

  it('positions left branch cards beside a timeline block and shifts the spine right', () => {
    const doc: MapDocument = {
      id: 'branch-doc',
      title: 'Branch test',
      version: 1,
      createdAt: 0,
      updatedAt: 0,
      casePath: null,
      mapFolderPath: '/tmp/map',
      blocks: [makeBlock('timeline', 2000), makeBranch('branch-left', 'timeline', 'left')],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      layoutMode: 'timeline-vertical',
      defaultEdgeStyle: 'solid',
    };

    const next = relayoutDocument(doc);
    const timeline = next.blocks.find((block) => block.id === 'timeline');
    const branch = next.blocks.find((block) => block.id === 'branch-left');

    expect(timeline).toBeDefined();
    expect(branch).toBeDefined();
    expect(timeline!.position.x).toBeGreaterThan(380);
    expect(branch!.position.x + branch!.size.width).toBeLessThan(timeline!.position.x);
    expect(next.edges.some((edge) => edge.kind === 'branch')).toBe(true);
  });

  it('lays out recursive branch cards relative to their parent side', () => {
    const doc: MapDocument = {
      id: 'nested-branch-doc',
      title: 'Nested branch test',
      version: 1,
      createdAt: 0,
      updatedAt: 0,
      casePath: null,
      mapFolderPath: '/tmp/map',
      blocks: [
        makeBlock('timeline', 2000),
        makeBranch('left-branch', 'timeline', 'left'),
        makeBranch('return-right', 'left-branch', 'right'),
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      layoutMode: 'timeline-vertical',
      defaultEdgeStyle: 'solid',
    };

    const next = relayoutDocument(doc);
    const leftBranch = next.blocks.find((block) => block.id === 'left-branch');
    const returnRight = next.blocks.find((block) => block.id === 'return-right');

    expect(leftBranch).toBeDefined();
    expect(returnRight).toBeDefined();
    expect(returnRight!.position.x).toBeGreaterThan(leftBranch!.position.x);
  });

  it('pushes later timeline columns outward when a turnaround block has right-side branches', () => {
    const timelineBlocks = Array.from({ length: 11 }, (_, index) => makeBlock(`t${index + 1}`, 2000 + index));
    const doc: MapDocument = {
      id: 'adaptive-spacing-doc',
      title: 'Adaptive spacing',
      version: 1,
      createdAt: 0,
      updatedAt: 0,
      casePath: null,
      mapFolderPath: '/tmp/map',
      blocks: [
        ...timelineBlocks,
        makeBranch('branch-a', 't10', 'right', 0),
        makeBranch('branch-b', 'branch-a', 'right', 0),
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      layoutMode: 'timeline-vertical',
      defaultEdgeStyle: 'solid',
    };

    const next = relayoutDocument(doc);
    const t10 = next.blocks.find((block) => block.id === 't10');
    const t11 = next.blocks.find((block) => block.id === 't11');
    const branchA = next.blocks.find((block) => block.id === 'branch-a');
    const branchB = next.blocks.find((block) => block.id === 'branch-b');

    expect(t10).toBeDefined();
    expect(t11).toBeDefined();
    expect(branchA).toBeDefined();
    expect(branchB).toBeDefined();
    expect(overlap(branchA!, t11!)).toBe(false);
    expect(overlap(branchB!, t11!)).toBe(false);
    expect(t11!.position.x).toBeGreaterThan(branchB!.position.x + branchB!.size.width);
  });

  it('avoids letting nested opposite-side branches collapse back over the spine block', () => {
    const doc: MapDocument = {
      id: 'nested-collision-doc',
      title: 'Nested collision avoidance',
      version: 1,
      createdAt: 0,
      updatedAt: 0,
      casePath: null,
      mapFolderPath: '/tmp/map',
      blocks: [
        makeBlock('timeline', 2000),
        makeBranch('branch-right', 'timeline', 'right', 0),
        makeBranch('branch-return', 'branch-right', 'left', 0),
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      layoutMode: 'timeline-vertical',
      defaultEdgeStyle: 'solid',
    };

    const next = relayoutDocument(doc);
    const timeline = next.blocks.find((block) => block.id === 'timeline');
    const branchReturn = next.blocks.find((block) => block.id === 'branch-return');

    expect(timeline).toBeDefined();
    expect(branchReturn).toBeDefined();
    expect(overlap(branchReturn!, timeline!)).toBe(false);
  });
});
