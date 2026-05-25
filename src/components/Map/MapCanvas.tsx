import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Panel,
  MiniMap,
  useReactFlow,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Plus,
  Minus,
  ScanSearch,
  LayoutGrid,
  Link2,
  Link2Off,
} from 'lucide-react';
import { MapBlock, MapBranchSide, MapCanvasSide, MapDocument, Theme } from '../../types';
import { MapBlockNode, type MapBlockNodeData } from './MapBlockNode';
import { useMapTheme } from './mapTheme';
import {
  buildFlowEdgesFromBlocks,
  buildMapEdges,
  enrichEdgesWithHandles,
  type MapHandleSide,
} from '../../utils/mapEdgeRouting';

const nodeTypes = { mapBlock: MapBlockNode };

interface MapCanvasProps {
  document: MapDocument;
  theme: Theme;
  edgeStyle: 'solid' | 'dotted';
  onBlocksChange: (blocks: MapBlock[]) => void;
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
  onExpandBlock: (blockId: string) => void;
  onPreviewBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onEditBlock: (blockId: string) => void;
  onCreateBranch: (blockId: string, side: MapBranchSide, sourceSide: MapCanvasSide) => void;
  onNewBlock: () => void;
  onToggleEdgeStyle: () => void;
  onRelayout: () => void;
}

interface MapCanvasToolbarProps {
  theme: Theme;
  edgeStyle: 'solid' | 'dotted';
  onNewBlock: () => void;
  onToggleEdgeStyle: () => void;
  onRelayout: () => void;
}

function MapCanvasToolbar({
  theme,
  edgeStyle,
  onNewBlock,
  onToggleEdgeStyle,
  onRelayout,
}: MapCanvasToolbarProps) {
  const t = useMapTheme(theme);
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const shellClass = t.isPastel
    ? 'bg-white/88 border-pink-200/50 text-gray-800'
    : 'bg-gray-900/88 border-cyber-purple-500/40 text-white';
  const mutedClass = t.isPastel ? 'text-gray-500' : 'text-gray-400';
  const toolBtn = `w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${shellClass} ${
    t.isPastel ? 'hover:bg-white hover:border-purple-300/70' : 'hover:border-cyber-cyan-400/70 hover:bg-gray-900'
  }`;
  const actionBtn = `w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${shellClass} ${
    t.isPastel ? 'hover:bg-white hover:border-purple-300/70' : 'hover:border-cyber-cyan-400/70 hover:bg-gray-900'
  }`;

  return (
    <Panel position="top-left" className="!m-4 !pointer-events-auto">
      <div
        className={`w-[300px] rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden ${shellClass}`}
      >
        <div
          className={`px-4 py-3 border-b ${
            t.isPastel ? 'border-pink-200/30 bg-pink-50/60' : 'border-white/10 bg-black/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className={`w-4 h-4 ${t.primary}`} />
            <span className="text-sm font-semibold">Canvas Tools</span>
          </div>
          <p className={`text-xs mt-1 ${mutedClass}`}>
            Locked on the canvas for quick timeline building.
          </p>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => zoomIn({ duration: 180 })} className={toolBtn} aria-label="Zoom in">
              <Plus className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => zoomOut({ duration: 180 })} className={toolBtn} aria-label="Zoom out">
              <Minus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => fitView({ padding: 0.25, duration: 220 })}
              className={toolBtn}
              aria-label="Fit timeline to view"
            >
              <ScanSearch className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <button type="button" onClick={onNewBlock} className={`${actionBtn} ${t.button} border-0`}>
              <Plus className="w-5 h-5" />
              <span className="font-semibold">New Block</span>
            </button>

            <button type="button" onClick={onToggleEdgeStyle} className={actionBtn}>
              {edgeStyle === 'solid' ? (
                <Link2 className="w-5 h-5" />
              ) : (
                <Link2Off className="w-5 h-5" />
              )}
              <div className="text-left">
                <div className="text-sm font-medium">
                  {edgeStyle === 'solid' ? 'Solid connectors' : 'Dotted connectors'}
                </div>
                <div className={`text-xs ${mutedClass}`}>Toggle line style</div>
              </div>
            </button>

            <button type="button" onClick={onRelayout} className={actionBtn}>
              <LayoutGrid className="w-5 h-5" />
              <div className="text-left">
                <div className="text-sm font-medium">Re-layout timeline</div>
                <div className={`text-xs ${mutedClass}`}>Restore smart snake ordering</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function blocksToNodes(
  blocks: MapBlock[],
  branchButtonMap: Map<string, MapBlockNodeData['branchButtons']>,
  occupiedSideMap: Map<string, MapHandleSide[]>,
  theme: Theme,
  onExpand: (id: string) => void,
  onPreview: (id: string) => void,
  onDelete: (id: string) => void,
  onEdit: (id: string) => void,
  onCreateBranch: (id: string, side: MapBranchSide, sourceSide: MapCanvasSide) => void
): Node<MapBlockNodeData>[] {
  const isPastel = theme === 'pastel';
  return blocks.map((block) => ({
    id: block.id,
    type: 'mapBlock',
    position: block.position,
    data: {
      block,
      theme: isPastel ? 'pastel' : 'dark',
      onExpand,
      onPreview,
      onDelete,
      onEdit,
      onCreateBranch,
      branchButtons: branchButtonMap.get(block.id) ?? [],
      occupiedSides: occupiedSideMap.get(block.id) ?? [],
    },
    draggable: block.kind !== 'branch',
    style: { width: block.size.width, height: block.size.height },
  }));
}

function parseHandleSide(handleId?: string): MapHandleSide | null {
  if (!handleId) {
    return null;
  }
  const side = handleId.replace(/^(source|target)-/, '');
  return side === 'top' || side === 'right' || side === 'bottom' || side === 'left' ? side : null;
}

export function getBranchButtonsForBlock(
  block: MapBlock,
  occupiedSides: MapHandleSide[]
): MapBlockNodeData['branchButtons'] {
  if (block.kind === 'branch') {
    return [
      { branchSide: 'left', buttonSide: 'left' },
      { branchSide: 'right', buttonSide: 'right' },
    ];
  }

  const occupied = new Set<MapHandleSide>(occupiedSides);
  const usedButtonSides = new Set<MapHandleSide>();
  const fallbackOrder: MapHandleSide[] = ['bottom', 'top', 'left', 'right'];
  const preferredByBranchSide: Record<MapBranchSide, MapHandleSide[]> = {
    left: ['left', 'bottom', 'top', 'right'],
    right: ['right', 'bottom', 'top', 'left'],
  };

  return (['left', 'right'] as const).map((branchSide) => {
    const buttonSide =
      preferredByBranchSide[branchSide].find(
        (candidate) => !occupied.has(candidate) && !usedButtonSides.has(candidate)
      ) ??
      fallbackOrder.find((candidate) => !usedButtonSides.has(candidate)) ??
      branchSide;

    usedButtonSides.add(buttonSide);
    return { branchSide, buttonSide };
  });
}

function buildNodeAffordances(
  blocks: MapBlock[],
  edges: MapDocument['edges']
): {
  branchButtonsByBlockId: Map<string, MapBlockNodeData['branchButtons']>;
  occupiedSidesByBlockId: Map<string, MapHandleSide[]>;
} {
  const enrichedEdges = enrichEdgesWithHandles(blocks, edges);
  const occupiedSideSets = new Map<string, Set<MapHandleSide>>();

  const addOccupiedSide = (blockId: string, handleId?: string) => {
    const side = parseHandleSide(handleId);
    if (!side) {
      return;
    }
    const sides = occupiedSideSets.get(blockId) ?? new Set<MapHandleSide>();
    sides.add(side);
    occupiedSideSets.set(blockId, sides);
  };

  enrichedEdges.forEach((edge) => {
    addOccupiedSide(edge.sourceBlockId, edge.sourceHandle);
    addOccupiedSide(edge.targetBlockId, edge.targetHandle);
  });

  const occupiedSidesByBlockId = new Map<string, MapHandleSide[]>();
  const branchButtonsByBlockId = new Map<string, MapBlockNodeData['branchButtons']>();

  blocks.forEach((block) => {
    const occupiedSides = Array.from(occupiedSideSets.get(block.id) ?? []);
    occupiedSidesByBlockId.set(block.id, occupiedSides);
    branchButtonsByBlockId.set(block.id, getBranchButtonsForBlock(block, occupiedSides));
  });

  return { branchButtonsByBlockId, occupiedSidesByBlockId };
}

function flowEdgesFromDocument(doc: MapDocument): Edge[] {
  const enriched = enrichEdgesWithHandles(doc.blocks, doc.edges);
  const routed = buildFlowEdgesFromBlocks(doc.blocks, enriched, doc.defaultEdgeStyle);

  return routed.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: 'smoothstep',
    style: {
      stroke: e.kind === 'branch' ? '#f59e0b' : doc.defaultEdgeStyle === 'dotted' ? '#67e8f9' : '#a78bfa',
      strokeWidth: 2,
      strokeDasharray: e.style === 'dotted' ? '8 6' : undefined,
    },
    animated: e.style === 'dotted',
  }));
}

function blocksSignature(blocks: MapBlock[]): string {
  return blocks
    .map(
      (b) =>
        `${b.id}:${Math.round(b.position.x)}:${Math.round(b.position.y)}:${b.positionLocked ? 1 : 0}`
    )
    .join('|');
}

export function MapCanvas({
  document,
  theme,
  edgeStyle,
  onBlocksChange,
  onViewportChange,
  onExpandBlock,
  onPreviewBlock,
  onDeleteBlock,
  onEditBlock,
  onCreateBranch,
  onNewBlock,
  onToggleEdgeStyle,
  onRelayout,
}: MapCanvasProps) {
  const t = useMapTheme(theme);
  const isDraggingRef = useRef(false);
  const lastBlocksSigRef = useRef('');
  const fitViewOnceRef = useRef(false);

  const blockCallbacks = useMemo(
    () => ({
      onExpand: onExpandBlock,
      onPreview: onPreviewBlock,
      onDelete: onDeleteBlock,
      onEdit: onEditBlock,
      onCreateBranch,
    }),
    [onExpandBlock, onPreviewBlock, onDeleteBlock, onEditBlock, onCreateBranch]
  );

  const nodeAffordances = useMemo(
    () => buildNodeAffordances(document.blocks, document.edges),
    [document.blocks, document.edges]
  );

  const initialNodes = useMemo(
    () =>
      blocksToNodes(
        document.blocks,
        nodeAffordances.branchButtonsByBlockId,
        nodeAffordances.occupiedSidesByBlockId,
        theme,
        blockCallbacks.onExpand,
        blockCallbacks.onPreview,
        blockCallbacks.onDelete,
        blockCallbacks.onEdit,
        blockCallbacks.onCreateBranch
      ),
    [document.blocks, nodeAffordances, theme, blockCallbacks]
  );

  const initialEdges = useMemo(() => flowEdgesFromDocument(document), [document]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const blocksSig = blocksSignature(document.blocks);

  useEffect(() => {
    if (isDraggingRef.current) return;
    if (blocksSig === lastBlocksSigRef.current) {
      setEdges(flowEdgesFromDocument(document));
      return;
    }
    lastBlocksSigRef.current = blocksSig;
    setNodes(
      blocksToNodes(
        document.blocks,
        nodeAffordances.branchButtonsByBlockId,
        nodeAffordances.occupiedSidesByBlockId,
        theme,
        blockCallbacks.onExpand,
        blockCallbacks.onPreview,
        blockCallbacks.onDelete,
        blockCallbacks.onEdit,
        blockCallbacks.onCreateBranch
      )
    );
    setEdges(flowEdgesFromDocument(document));
  }, [blocksSig, document, nodeAffordances, theme, blockCallbacks, setNodes, setEdges]);

  const handleNodeDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node<MapBlockNodeData>) => {
      isDraggingRef.current = false;
      if (node.data.block.kind === 'branch') {
        return;
      }
      const updatedBlocks = document.blocks.map((b) =>
        b.id === node.id ? { ...b, position: node.position, positionLocked: true } : b
      );
      lastBlocksSigRef.current = blocksSignature(updatedBlocks);
      onBlocksChange(updatedBlocks);
      setEdges(
        flowEdgesFromDocument({
          ...document,
          blocks: updatedBlocks,
          edges: buildMapEdges(updatedBlocks, document.defaultEdgeStyle),
        })
      );
    },
    [document, onBlocksChange, setEdges]
  );

  return (
    <div className="w-full h-full map-canvas-root" style={{ background: 'transparent' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        selectNodesOnDrag={false}
        panOnDrag={[1, 2]}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        snapToGrid
        snapGrid={[12, 12]}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
        minZoom={0.15}
        maxZoom={2.5}
        defaultViewport={{
          x: document.viewport.x,
          y: document.viewport.y,
          zoom: document.viewport.zoom,
        }}
        onInit={(instance) => {
          if (!fitViewOnceRef.current && document.blocks.length > 0) {
            fitViewOnceRef.current = true;
            requestAnimationFrame(() => {
              instance.fitView({ padding: 0.25, duration: 200 });
            });
          }
        }}
        onMoveEnd={(_, viewport) => {
          onViewportChange({ x: viewport.x, y: viewport.y, zoom: viewport.zoom });
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Lines} gap={24} size={1} color={t.gridColor} />
        <MapCanvasToolbar
          theme={theme}
          edgeStyle={edgeStyle}
          onNewBlock={onNewBlock}
          onToggleEdgeStyle={onToggleEdgeStyle}
          onRelayout={onRelayout}
        />
        <MiniMap
          className={`!rounded-2xl !border !shadow-xl ${
            t.isPastel
              ? '!bg-white/85 !border-pink-200/40'
              : '!bg-gray-900/85 !border-cyber-purple-500/40'
          }`}
          nodeColor={() => (t.isPastel ? '#c4b5fd' : '#8b5cf6')}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
