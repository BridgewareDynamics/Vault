import { MapBlock, MapCanvasSide, MapEdge } from '../types';
import { isBranchBlock, sortBlocksByChronology } from './mapLayout';

export type MapHandleSide = MapCanvasSide;

export function sourceHandleId(side: MapHandleSide): string {
  return `source-${side}`;
}

export function targetHandleId(side: MapHandleSide): string {
  return `target-${side}`;
}

/** Pick connection sides so the edge uses the closest faces between two blocks. */
export function getClosestHandleSides(
  source: MapBlock,
  target: MapBlock
): { sourceSide: MapHandleSide; targetSide: MapHandleSide } {
  const sw = source.size?.width ?? 200;
  const sh = source.size?.height ?? 200;
  const tw = target.size?.width ?? 200;
  const th = target.size?.height ?? 200;

  const scx = source.position.x + sw / 2;
  const scy = source.position.y + sh / 2;
  const tcx = target.position.x + tw / 2;
  const tcy = target.position.y + th / 2;

  const dx = tcx - scx;
  const dy = tcy - scy;

  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx >= 0) {
      return { sourceSide: 'right', targetSide: 'left' };
    }
    return { sourceSide: 'left', targetSide: 'right' };
  }
  if (dy >= 0) {
    return { sourceSide: 'bottom', targetSide: 'top' };
  }
  return { sourceSide: 'top', targetSide: 'bottom' };
}

export interface FlowEdgeWithHandles {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  style: 'solid' | 'dotted';
  kind: 'chronology' | 'branch';
}

export function buildFlowEdgesFromBlocks(
  blocks: MapBlock[],
  edgeDefs: MapEdge[],
  defaultStyle: 'solid' | 'dotted' = 'solid'
): FlowEdgeWithHandles[] {
  const blockById = new Map(blocks.map((b) => [b.id, b]));

  return edgeDefs
    .map((edge) => {
      const source = blockById.get(edge.sourceBlockId);
      const target = blockById.get(edge.targetBlockId);
      if (!source || !target) return null;

      const isBranchEdge = edge.kind === 'branch';
      const { sourceSide, targetSide } = isBranchEdge
        ? {
            sourceSide: (edge.sourceHandle?.replace('source-', '') as MapHandleSide | undefined) ?? 'right',
            targetSide: (edge.targetHandle?.replace('target-', '') as MapHandleSide | undefined) ?? 'left',
          }
        : getClosestHandleSides(source, target);
      return {
        id: edge.id,
        source: edge.sourceBlockId,
        target: edge.targetBlockId,
        sourceHandle: edge.sourceHandle ?? sourceHandleId(sourceSide),
        targetHandle: edge.targetHandle ?? targetHandleId(targetSide),
        style: edge.style ?? defaultStyle,
        kind: edge.kind ?? 'chronology',
      };
    })
    .filter((e): e is FlowEdgeWithHandles => e !== null);
}

/** Regenerate edge list with closest-handle metadata stored on MapEdge (optional fields). */
export function enrichEdgesWithHandles(blocks: MapBlock[], edges: MapEdge[]): MapEdge[] {
  const blockById = new Map(blocks.map((b) => [b.id, b]));
  return edges.map((edge) => {
    if (edge.kind === 'branch') {
      return edge;
    }
    const source = blockById.get(edge.sourceBlockId);
    const target = blockById.get(edge.targetBlockId);
    if (!source || !target) return edge;
    const { sourceSide, targetSide } = getClosestHandleSides(source, target);
    return {
      ...edge,
      sourceHandle: sourceHandleId(sourceSide),
      targetHandle: targetHandleId(targetSide),
    };
  });
}

export function buildChronologicalEdgesWithHandles(
  blocks: MapBlock[],
  defaultStyle: 'solid' | 'dotted' = 'solid'
): MapEdge[] {
  const sorted = sortBlocksByChronology(blocks);
  const edges: MapEdge[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const source = sorted[i];
    const target = sorted[i + 1];
    const { sourceSide, targetSide } = getClosestHandleSides(source, target);
    edges.push({
      id: `edge-${source.id}-${target.id}`,
      kind: 'chronology',
      sourceBlockId: source.id,
      targetBlockId: target.id,
      style: defaultStyle,
      sourceHandle: sourceHandleId(sourceSide),
      targetHandle: targetHandleId(targetSide),
    });
  }
  return edges;
}

export function buildBranchEdges(blocks: MapBlock[]): MapEdge[] {
  const blockById = new Map(blocks.map((block) => [block.id, block]));
  const edges: MapEdge[] = [];

  blocks
    .filter(isBranchBlock)
    .forEach((block) => {
      if (!block.branchParentBlockId || !block.branchSide) {
        return;
      }
      const parent = blockById.get(block.branchParentBlockId);
      if (!parent) {
        return;
      }
      const sourceSide: MapHandleSide = block.branchSourceSide ?? block.branchSide;
      const targetSide: MapHandleSide = block.branchSide === 'left' ? 'right' : 'left';
      edges.push({
        id: `edge-branch-${parent.id}-${block.id}`,
        kind: 'branch',
        sourceBlockId: parent.id,
        targetBlockId: block.id,
        style: 'dotted',
        sourceHandle: sourceHandleId(sourceSide),
        targetHandle: targetHandleId(targetSide),
      });
    });

  return edges;
}

export function buildMapEdges(
  blocks: MapBlock[],
  defaultStyle: 'solid' | 'dotted' = 'solid'
): MapEdge[] {
  return [
    ...buildChronologicalEdgesWithHandles(blocks, defaultStyle),
    ...buildBranchEdges(blocks),
  ];
}
