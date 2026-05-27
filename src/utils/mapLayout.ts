import { MapBlock, MapDocument } from '../types';
import { compareSortKeys } from './mapChronology';
import { buildChronologicalEdgesWithHandles, buildMapEdges } from './mapEdgeRouting';

export const BLOCK_WIDTH = 280;
export const BLOCK_HEIGHT = 186;
export const BRANCH_BLOCK_WIDTH = 248;
export const BRANCH_BLOCK_HEIGHT = 118;

const LEGACY_TIMELINE_SIZES = [{ width: 200, height: 200 }];
const LEGACY_BRANCH_SIZES = [{ width: 176, height: 132 }];
const VERTICAL_GAP = 72;
const HORIZONTAL_GAP = 104;
const SNAKE_ROWS = 5;
const BRANCH_HORIZONTAL_GAP = 72;
const BRANCH_VERTICAL_GAP = 20;
const BRANCH_COLLISION_PADDING_X = 24;
const BRANCH_COLLISION_PADDING_Y = 16;
// Reserve a gutter for the floating top-left canvas toolbar
// so newly laid out blocks do not appear underneath it.
const START_X = 380;
const START_Y = 72;

export const MAP_BLOCK_DEFAULT_SIZE = { width: BLOCK_WIDTH, height: BLOCK_HEIGHT };
export const MAP_BRANCH_BLOCK_DEFAULT_SIZE = {
  width: BRANCH_BLOCK_WIDTH,
  height: BRANCH_BLOCK_HEIGHT,
};

export function isBranchBlock(block: MapBlock): boolean {
  return block.kind === 'branch';
}

export function isTimelineBlock(block: MapBlock): boolean {
  return block.kind !== 'branch';
}

function matchesLegacySize(
  size: { width: number; height: number },
  legacySizes: { width: number; height: number }[]
): boolean {
  return legacySizes.some(
    (legacy) => legacy.width === size.width && legacy.height === size.height
  );
}

export function getMapBlockSize(block: MapBlock): { width: number; height: number } {
  const defaults = isBranchBlock(block)
    ? MAP_BRANCH_BLOCK_DEFAULT_SIZE
    : MAP_BLOCK_DEFAULT_SIZE;
  const legacySizes = isBranchBlock(block) ? LEGACY_BRANCH_SIZES : LEGACY_TIMELINE_SIZES;

  if (block.size?.width && block.size?.height) {
    if (matchesLegacySize(block.size, legacySizes)) {
      return { ...defaults };
    }
    return block.size;
  }
  return { ...defaults };
}

function normalizeLayoutBlock(block: MapBlock): MapBlock {
  return {
    ...block,
    kind: isBranchBlock(block) ? 'branch' : 'timeline',
    size: getMapBlockSize(block),
  };
}

export function sortBlocksByChronology(blocks: MapBlock[]): MapBlock[] {
  return [...blocks]
    .filter(isTimelineBlock)
    .sort((a, b) => compareSortKeys(a.chronology?.sortKey ?? '', b.chronology?.sortKey ?? ''));
}

/**
 * Timeline layout: place blocks in a 5-row snake.
 * Column 1 goes top -> bottom, column 2 goes bottom -> top, then repeats.
 * This fills more horizontal canvas space while preserving chronological order.
 */
export function applyTimelineLayout(blocks: MapBlock[], resetLocked = false): MapBlock[] {
  const sorted = sortBlocksByChronology(blocks).map(normalizeLayoutBlock);

  return sorted.map((block, globalIndex) => {
    if (block.positionLocked && !resetLocked) {
      return {
        ...block,
        size: getMapBlockSize(block),
      };
    }

    const columnIndex = Math.floor(globalIndex / SNAKE_ROWS);
    const indexInColumn = globalIndex % SNAKE_ROWS;
    const rowIndex =
      columnIndex % 2 === 0 ? indexInColumn : SNAKE_ROWS - 1 - indexInColumn;
    const x = START_X + columnIndex * (BLOCK_WIDTH + HORIZONTAL_GAP);
    const y = START_Y + rowIndex * (BLOCK_HEIGHT + VERTICAL_GAP);

    const positioned: MapBlock = {
      ...block,
      position: { x, y },
      size: getMapBlockSize(block),
      positionLocked: resetLocked ? false : block.positionLocked,
    };

    return positioned;
  });
}

function getTimelineColumnIndex(globalIndex: number): number {
  return Math.floor(globalIndex / SNAKE_ROWS);
}

function getTimelineRowIndex(globalIndex: number): number {
  const columnIndex = getTimelineColumnIndex(globalIndex);
  const indexInColumn = globalIndex % SNAKE_ROWS;
  return columnIndex % 2 === 0 ? indexInColumn : SNAKE_ROWS - 1 - indexInColumn;
}

function getTimelineY(globalIndex: number): number {
  return START_Y + getTimelineRowIndex(globalIndex) * (BLOCK_HEIGHT + VERTICAL_GAP);
}

function getBlockBounds(block: MapBlock) {
  return {
    left: block.position.x,
    right: block.position.x + block.size.width,
    top: block.position.y,
    bottom: block.position.y + block.size.height,
  };
}

function collectDescendantIds(
  rootId: string,
  childrenByParent: Map<string, MapBlock[]>,
  collected = new Set<string>()
): Set<string> {
  const children = childrenByParent.get(rootId) ?? [];
  children.forEach((child) => {
    if (collected.has(child.id)) {
      return;
    }
    collected.add(child.id);
    collectDescendantIds(child.id, childrenByParent, collected);
  });
  return collected;
}

function getNonOverlappingX(
  child: MapBlock,
  desiredX: number,
  desiredY: number,
  direction: 'left' | 'right',
  positionedBlocks: Iterable<MapBlock>
): number {
  let nextX = desiredX;

  for (let i = 0; i < 64; i++) {
    const candidateBounds = {
      left: nextX - BRANCH_COLLISION_PADDING_X,
      right: nextX + child.size.width + BRANCH_COLLISION_PADDING_X,
      top: desiredY - BRANCH_COLLISION_PADDING_Y,
      bottom: desiredY + child.size.height + BRANCH_COLLISION_PADDING_Y,
    };

    const blocker = Array.from(positionedBlocks).find((existingBlock) => {
      const existingBounds = getBlockBounds(existingBlock);
      return !(
        candidateBounds.right <= existingBounds.left ||
        candidateBounds.left >= existingBounds.right ||
        candidateBounds.bottom <= existingBounds.top ||
        candidateBounds.top >= existingBounds.bottom
      );
    });

    if (!blocker) {
      return nextX;
    }

    nextX =
      direction === 'left'
        ? blocker.position.x - child.size.width - BRANCH_HORIZONTAL_GAP
        : blocker.position.x + blocker.size.width + BRANCH_HORIZONTAL_GAP;
  }

  return nextX;
}

function buildBranchChildrenMap(blocks: MapBlock[]): Map<string, MapBlock[]> {
  const childrenByParent = new Map<string, MapBlock[]>();

  blocks.filter(isBranchBlock).forEach((block) => {
    if (!block.branchParentBlockId) {
      return;
    }
    const siblings = childrenByParent.get(block.branchParentBlockId) ?? [];
    siblings.push(block);
    childrenByParent.set(block.branchParentBlockId, siblings);
  });

  childrenByParent.forEach((siblings, parentId) => {
    siblings.sort((a, b) => {
      const orderDelta = (a.branchOrder ?? 0) - (b.branchOrder ?? 0);
      if (orderDelta !== 0) {
        return orderDelta;
      }
      return a.id.localeCompare(b.id);
    });
    childrenByParent.set(parentId, siblings);
  });

  return childrenByParent;
}

function computeBranchSubtreeHeights(
  blockId: string,
  childrenByParent: Map<string, MapBlock[]>,
  heightCache: Map<string, number>,
  blockById: Map<string, MapBlock>
): number {
  if (heightCache.has(blockId)) {
    return heightCache.get(blockId) ?? 0;
  }

  const block = blockById.get(blockId);
  if (!block) {
    return 0;
  }

  const children = childrenByParent.get(blockId) ?? [];
  const childHeightsBySide = {
    left: children.filter((child) => child.branchSide === 'left'),
    right: children.filter((child) => child.branchSide === 'right'),
  };

  const stackHeight = (sideChildren: MapBlock[]) => {
    if (sideChildren.length === 0) {
      return 0;
    }
    return sideChildren.reduce((total, child, index) => {
      const subtreeHeight = computeBranchSubtreeHeights(child.id, childrenByParent, heightCache, blockById);
      return total + subtreeHeight + (index > 0 ? BRANCH_VERTICAL_GAP : 0);
    }, 0);
  };

  const height = Math.max(
    block.size.height,
    stackHeight(childHeightsBySide.left),
    stackHeight(childHeightsBySide.right)
  );

  heightCache.set(blockId, height);
  return height;
}

function layoutBranchDescendants(
  parent: MapBlock,
  childrenByParent: Map<string, MapBlock[]>,
  heightCache: Map<string, number>,
  positionedById: Map<string, MapBlock>,
  currentGroupIds: Set<string>
) {
  const children = childrenByParent.get(parent.id) ?? [];
  const layoutSide = (side: 'left' | 'right') => {
    const sideChildren = children.filter((child) => child.branchSide === side);
    if (sideChildren.length === 0) {
      return;
    }

    const totalHeight = sideChildren.reduce((total, child, index) => {
      const subtreeHeight = heightCache.get(child.id) ?? child.size.height;
      return total + subtreeHeight + (index > 0 ? BRANCH_VERTICAL_GAP : 0);
    }, 0);
    let cursorY = parent.position.y + parent.size.height / 2 - totalHeight / 2;

    sideChildren.forEach((child) => {
      const subtreeHeight = heightCache.get(child.id) ?? child.size.height;
      const desiredX =
        side === 'left'
          ? parent.position.x - BRANCH_HORIZONTAL_GAP - child.size.width
          : parent.position.x + parent.size.width + BRANCH_HORIZONTAL_GAP;
      const y = cursorY + (subtreeHeight - child.size.height) / 2;
      const x = getNonOverlappingX(
        child,
        desiredX,
        y,
        side,
        Array.from(currentGroupIds)
          .map((id) => positionedById.get(id))
          .filter((block): block is MapBlock => Boolean(block))
      );
      const positionedChild: MapBlock = {
        ...child,
        position: { x, y },
        positionLocked: false,
      };

      positionedById.set(child.id, positionedChild);
      currentGroupIds.add(child.id);
      layoutBranchDescendants(positionedChild, childrenByParent, heightCache, positionedById, currentGroupIds);
      cursorY += subtreeHeight + BRANCH_VERTICAL_GAP;
    });
  };

  layoutSide('left');
  layoutSide('right');
}

function applyBranchLayout(blocks: MapBlock[], resetLocked = false): MapBlock[] {
  const normalizedBlocks = blocks.map(normalizeLayoutBlock);
  const timelineBlocks = sortBlocksByChronology(normalizedBlocks).map(normalizeLayoutBlock);
  const positionedById = new Map<string, MapBlock>();

  const childrenByParent = buildBranchChildrenMap(normalizedBlocks);
  const heightCache = new Map<string, number>();

  normalizedBlocks.forEach((block) => {
    computeBranchSubtreeHeights(
      block.id,
      childrenByParent,
      heightCache,
      new Map(normalizedBlocks.map((candidate) => [candidate.id, candidate]))
    );
  });

  const maxColumnIndex = timelineBlocks.length === 0 ? -1 : getTimelineColumnIndex(timelineBlocks.length - 1);
  let previousColumnRight = START_X - HORIZONTAL_GAP;

  for (let columnIndex = 0; columnIndex <= maxColumnIndex; columnIndex++) {
    const columnTimelineBlocks = timelineBlocks
      .map((block, globalIndex) => ({ block, globalIndex }))
      .filter(({ globalIndex }) => getTimelineColumnIndex(globalIndex) === columnIndex)
      .map(({ block, globalIndex }) => {
        const y = getTimelineY(globalIndex);
        return {
          ...block,
          position:
            block.positionLocked && !resetLocked
              ? block.position
              : {
                  x: previousColumnRight + HORIZONTAL_GAP,
                  y,
                },
          size: getMapBlockSize(block),
          positionLocked: resetLocked ? false : block.positionLocked,
        };
      });

    const rootIds = columnTimelineBlocks.map((block) => block.id);
    const groupIds = new Set<string>(rootIds);
    rootIds.forEach((rootId) => {
      collectDescendantIds(rootId, childrenByParent, groupIds);
    });

    columnTimelineBlocks.forEach((block) => {
      positionedById.set(block.id, block);
    });

    columnTimelineBlocks.forEach((timelineBlock) => {
      layoutBranchDescendants(timelineBlock, childrenByParent, heightCache, positionedById, groupIds);
    });

    const positionedGroupBlocks = Array.from(groupIds)
      .map((id) => positionedById.get(id))
      .filter((block): block is MapBlock => Boolean(block));
    const minX = positionedGroupBlocks.reduce(
      (leftmost, block) => Math.min(leftmost, block.position.x),
      Number.POSITIVE_INFINITY
    );
    const desiredMinX = columnIndex === 0 ? START_X : previousColumnRight + HORIZONTAL_GAP;
    const shiftX = Number.isFinite(minX) && minX < desiredMinX ? desiredMinX - minX : 0;

    if (shiftX > 0) {
      positionedGroupBlocks.forEach((block) => {
        positionedById.set(block.id, {
          ...block,
          position: {
            x: block.position.x + shiftX,
            y: block.position.y,
          },
        });
      });
    }

    const shiftedGroupBlocks = Array.from(groupIds)
      .map((id) => positionedById.get(id))
      .filter((block): block is MapBlock => Boolean(block));
    previousColumnRight = shiftedGroupBlocks.reduce(
      (rightmost, block) => Math.max(rightmost, block.position.x + block.size.width),
      previousColumnRight
    );
  }

  normalizedBlocks.forEach((block) => {
    if (!positionedById.has(block.id)) {
      positionedById.set(block.id, block);
    }
  });

  const positionedTimeline = timelineBlocks.map((block) => positionedById.get(block.id) ?? block);
  const orderedBranchBlocks = normalizedBlocks
    .filter(isBranchBlock)
    .sort((a, b) => {
      const parentCompare = (a.branchParentBlockId ?? '').localeCompare(b.branchParentBlockId ?? '');
      if (parentCompare !== 0) {
        return parentCompare;
      }
      const sideCompare = (a.branchSide ?? '').localeCompare(b.branchSide ?? '');
      if (sideCompare !== 0) {
        return sideCompare;
      }
      const orderCompare = (a.branchOrder ?? 0) - (b.branchOrder ?? 0);
      if (orderCompare !== 0) {
        return orderCompare;
      }
      return a.id.localeCompare(b.id);
    });
  const laidOutBlocks = [...positionedTimeline, ...orderedBranchBlocks].map(
    (block) => positionedById.get(block.id) ?? block
  );
  const minX = laidOutBlocks.reduce((leftmost, block) => Math.min(leftmost, block.position.x), Number.POSITIVE_INFINITY);
  if (Number.isFinite(minX) && minX < START_X) {
    const shiftX = START_X - minX;
    return laidOutBlocks.map((block) => ({
      ...block,
      position: {
        x: block.position.x + shiftX,
        y: block.position.y,
      },
    }));
  }

  return laidOutBlocks;
}

export function buildChronologicalEdges(
  blocks: MapBlock[],
  defaultStyle: 'solid' | 'dotted' = 'solid'
) {
  return buildChronologicalEdgesWithHandles(blocks, defaultStyle);
}

export function relayoutDocument(doc: MapDocument, resetLocked = false): MapDocument {
  const blocks = applyBranchLayout(doc.blocks, resetLocked);
  const edges = buildMapEdges(blocks, doc.defaultEdgeStyle);
  return { ...doc, blocks, edges };
}

/** Place a newly created block without disturbing locked positions more than necessary. */
export function layoutWithNewBlock(
  existingBlocks: MapBlock[],
  newBlock: MapBlock
): MapBlock[] {
  return applyBranchLayout([...existingBlocks, newBlock], false);
}
