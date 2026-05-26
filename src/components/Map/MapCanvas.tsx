import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Plus,
  Minus,
  ScanSearch,
  LayoutGrid,
  Link2,
  Link2Off,
  PaintBucket,
  X,
} from 'lucide-react';
import {
  MapBlock,
  MapBranchSide,
  MapCanvasSide,
  MapDocument,
  MapEdgeAppearance,
  MapEdgeStyle,
  Theme,
} from '../../types';
import { MapBlockNode, type MapBlockNodeData } from './MapBlockNode';
import { useMapTheme } from './mapTheme';
import { getMapBlockMinimapColor } from './mapBlockColors';
import { MapEdgeColorPicker } from './MapEdgeColorPicker';
import { MapStyledEdge, type MapStyledFlowEdge } from './MapStyledEdge';
import {
  getMapEdgeAppearanceLabel,
  normalizeMapEdgeAppearance,
  resolveMapEdgeRenderStyle,
} from './mapEdgeAppearance';
import {
  buildFlowEdgesFromBlocks,
  buildMapEdges,
  enrichEdgesWithHandles,
  type MapHandleSide,
} from '../../utils/mapEdgeRouting';

const nodeTypes = { mapBlock: MapBlockNode };
const edgeTypes: EdgeTypes = { mapStyled: MapStyledEdge };

interface MapCanvasProps {
  document: MapDocument;
  theme: Theme;
  edgeStyle: MapEdgeStyle;
  edgeAppearance?: Partial<MapEdgeAppearance> | null;
  onBlocksChange: (blocks: MapBlock[]) => void;
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
  onExpandBlock: (blockId: string) => void;
  onPreviewBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onEditBlock: (blockId: string) => void;
  onEditBlockColor: (blockId: string) => void;
  onCreateBranch: (blockId: string, side: MapBranchSide, sourceSide: MapCanvasSide) => void;
  onNewBlock: () => void;
  onEdgeStyleChange: (style: MapEdgeStyle) => void;
  onEdgeAppearanceChange: (appearance: MapEdgeAppearance) => void;
  onRelayout: () => void;
}

interface MapCanvasToolbarProps {
  theme: Theme;
  edgeStyle: MapEdgeStyle;
  edgeAppearance?: Partial<MapEdgeAppearance> | null;
  onNewBlock: () => void;
  onEdgeStyleChange: (style: MapEdgeStyle) => void;
  onEdgeAppearanceChange: (appearance: MapEdgeAppearance) => void;
  onRelayout: () => void;
}

function MapCanvasToolbar({
  theme,
  edgeStyle,
  edgeAppearance,
  onNewBlock,
  onEdgeStyleChange,
  onEdgeAppearanceChange,
  onRelayout,
}: MapCanvasToolbarProps) {
  const t = useMapTheme(theme);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [isConnectorStudioOpen, setIsConnectorStudioOpen] = useState(false);
  const toolbarShellRef = useRef<HTMLDivElement>(null);
  const [connectorStudioStyle, setConnectorStudioStyle] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const normalizedAppearance = useMemo(
    () => normalizeMapEdgeAppearance(edgeAppearance),
    [edgeAppearance]
  );

  const shellClass = t.isPastel
    ? 'bg-white/88 border-pink-200/50 text-gray-800'
    : 'bg-gray-900/88 border-cyber-purple-500/40 text-white';
  const mutedClass = t.isPastel ? 'text-gray-500' : 'text-gray-400';
  const toolBtn = `h-9 w-9 rounded-xl border flex items-center justify-center transition-all ${shellClass} ${
    t.isPastel ? 'hover:bg-white hover:border-purple-300/70' : 'hover:border-cyber-cyan-400/70 hover:bg-gray-900'
  }`;
  const compactActionBtn = `h-10 w-full flex items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-all ${shellClass} ${
    t.isPastel ? 'hover:bg-white hover:border-purple-300/70' : 'hover:border-cyber-cyan-400/70 hover:bg-gray-900'
  }`;
  const connectorPill =
    'rounded-xl border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-default';

  useLayoutEffect(() => {
    if (!isConnectorStudioOpen) {
      setConnectorStudioStyle(null);
      return;
    }

    const updateConnectorStudioLayout = () => {
      const toolbarShell = toolbarShellRef.current;
      if (!toolbarShell) {
        return;
      }

      const margin = 16;
      const gap = 12;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const maxPanelWidth = Math.min(480, viewportWidth - margin * 2);
      const targetPanelHeight = Math.min(560, viewportHeight - margin * 2);
      const toolbarRect = toolbarShell.getBoundingClientRect();

      const top = Math.max(
        margin,
        Math.min(toolbarRect.bottom + gap, viewportHeight - margin - targetPanelHeight)
      );
      const left = Math.min(toolbarRect.left, viewportWidth - margin - maxPanelWidth);
      const maxHeight = Math.max(320, viewportHeight - top - margin);

      setConnectorStudioStyle({
        top,
        left: Math.max(margin, left),
        width: maxPanelWidth,
        maxHeight,
      });
    };

    updateConnectorStudioLayout();
    window.addEventListener('resize', updateConnectorStudioLayout);
    return () => window.removeEventListener('resize', updateConnectorStudioLayout);
  }, [isConnectorStudioOpen]);

  return (
    <Panel position="top-left" className="!m-4 !pointer-events-auto">
      <div ref={toolbarShellRef} className="relative w-[344px] overflow-visible">
        <div
          className={`rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden ${shellClass}`}
        >
          <div
            className={`px-4 py-2.5 border-b ${
              t.isPastel ? 'border-pink-200/30 bg-pink-50/60' : 'border-white/10 bg-black/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <LayoutGrid className={`w-4 h-4 ${t.primary}`} />
              <span className="text-sm font-semibold">Canvas Tools</span>
            </div>
            <p className={`mt-1 text-[11px] ${mutedClass}`}>
              Locked on the canvas for quick timeline building.
            </p>
          </div>

          <div className="p-3 space-y-3">
            <div className="grid grid-cols-[2.25rem_2.25rem_2.25rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 items-center">
              <button type="button" onClick={() => zoomIn({ duration: 180 })} className={toolBtn} aria-label="Zoom in">
                <Plus className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => zoomOut({ duration: 180 })} className={toolBtn} aria-label="Zoom out">
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fitView({ padding: 0.25, duration: 220 })}
                className={toolBtn}
                aria-label="Fit timeline to view"
              >
                <ScanSearch className="w-4 h-4" />
              </button>

              <button type="button" onClick={onNewBlock} className={`${compactActionBtn} ${t.button} border-0`}>
                <Plus className="w-4 h-4" />
                <span className="truncate">New Block</span>
              </button>

              <button type="button" onClick={onRelayout} className={compactActionBtn}>
                <LayoutGrid className="w-4 h-4" />
                <span className="truncate">Re-layout</span>
              </button>
            </div>

            <div
              className={`rounded-2xl border p-3 transition-all ${
                t.isPastel
                  ? 'border-purple-200/50 bg-white/75'
                  : 'border-white/10 bg-black/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                    t.isPastel ? 'border-purple-200/60 bg-purple-50/90' : 'border-white/10 bg-gray-950/70'
                  }`}
                >
                  {edgeStyle === 'solid' ? (
                    <Link2 className="h-5 w-5" />
                  ) : (
                    <Link2Off className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">Connector styling</div>
                  <div className={`text-[11px] ${mutedClass}`}>
                    {getMapEdgeAppearanceLabel(normalizedAppearance)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsConnectorStudioOpen((current) => !current)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                    t.isPastel
                      ? 'border-purple-200/60 bg-white/90 text-purple-600 hover:bg-purple-50'
                      : 'border-white/10 bg-gray-950/70 text-cyber-cyan-300 hover:bg-gray-900'
                  }`}
                  aria-label="Open connector color studio"
                  aria-pressed={isConnectorStudioOpen}
                >
                  <PaintBucket className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onEdgeStyleChange('solid')}
                  className={`${connectorPill} ${
                    edgeStyle === 'solid'
                      ? t.isPastel
                        ? 'border-purple-400 bg-purple-50/90 text-gray-900'
                        : 'border-cyber-cyan-400/60 bg-cyber-cyan-500/10 text-white'
                      : t.isPastel
                        ? 'border-purple-200/60 bg-white/85 text-gray-700 hover:bg-white'
                        : 'border-white/10 bg-gray-950/60 text-gray-200 hover:bg-gray-900'
                  }`}
                  aria-pressed={edgeStyle === 'solid'}
                >
                  Solid
                </button>
                <button
                  type="button"
                  onClick={() => onEdgeStyleChange('dotted')}
                  className={`${connectorPill} ${
                    edgeStyle === 'dotted'
                      ? t.isPastel
                        ? 'border-purple-400 bg-purple-50/90 text-gray-900'
                        : 'border-cyber-cyan-400/60 bg-cyber-cyan-500/10 text-white'
                      : t.isPastel
                        ? 'border-purple-200/60 bg-white/85 text-gray-700 hover:bg-white'
                        : 'border-white/10 bg-gray-950/60 text-gray-200 hover:bg-gray-900'
                  }`}
                  aria-pressed={edgeStyle === 'dotted'}
                >
                  Dotted
                </button>
              </div>
            </div>
          </div>
        </div>

        {isConnectorStudioOpen && (
          <div
            className={`absolute left-0 top-full z-50 mt-3 overflow-hidden rounded-[28px] border p-3 shadow-2xl backdrop-blur-xl ${
              t.isPastel
                ? 'border-purple-200/60 bg-white/88'
                : 'border-cyber-purple-500/35 bg-gray-950/88'
            }`}
            style={
              connectorStudioStyle
                ? {
                    position: 'fixed',
                    top: connectorStudioStyle.top,
                    left: connectorStudioStyle.left,
                    width: connectorStudioStyle.width,
                    maxHeight: connectorStudioStyle.maxHeight,
                    marginTop: 0,
                  }
                : {
                    position: 'fixed',
                    top: 16,
                    left: 16,
                    width: 'min(480px, calc(100vw - 2rem))',
                    maxHeight: 'calc(100vh - 2rem)',
                    marginTop: 0,
                  }
            }
          >
            <div
              className={`mb-3 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                t.isPastel
                  ? 'border-purple-200/50 bg-pink-50/70 text-gray-800'
                  : 'border-white/10 bg-black/25 text-white'
              }`}
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold">Connector Studio</div>
                <div className={`text-xs ${mutedClass}`}>
                  Floating over the canvas so the full line styling panel stays visible.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsConnectorStudioOpen(false)}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                  t.isPastel
                    ? 'border-purple-200/60 bg-white/90 text-gray-600 hover:bg-white'
                    : 'border-white/10 bg-gray-950/70 text-gray-300 hover:bg-gray-900'
                }`}
                aria-label="Close connector color studio"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              className="min-h-0 overflow-y-auto pr-1"
              style={{
                maxHeight: connectorStudioStyle
                  ? Math.max(220, connectorStudioStyle.maxHeight - 76)
                  : undefined,
              }}
            >
              <MapEdgeColorPicker
                theme={theme}
                appearance={normalizedAppearance}
                onChange={onEdgeAppearanceChange}
              />
            </div>
          </div>
        )}
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
  onEditColor: (id: string) => void,
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
      onEditColor,
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

function flowEdgesFromDocument(doc: MapDocument, theme: Theme): MapStyledFlowEdge[] {
  const enriched = enrichEdgesWithHandles(doc.blocks, doc.edges);
  const routed = buildFlowEdgesFromBlocks(doc.blocks, enriched, doc.defaultEdgeStyle);
  const blockById = new Map(doc.blocks.map((block) => [block.id, block]));
  const edgeTheme = theme === 'pastel' ? 'pastel' : 'dark';

  return routed.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: 'mapStyled',
    data: resolveMapEdgeRenderStyle({
      appearance: doc.defaultEdgeAppearance,
      sourceBlock: blockById.get(e.source),
      targetBlock: blockById.get(e.target),
      kind: e.kind,
      style: e.style,
      theme: edgeTheme,
    }),
    style: {
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
        [
          b.id,
          Math.round(b.position.x),
          Math.round(b.position.y),
          b.positionLocked ? 1 : 0,
          b.kind ?? '',
          b.title ?? '',
          b.color ?? '',
          b.surfaceColor ?? '',
          b.borderColor ?? '',
          b.chronology?.sortKey ?? '',
          b.notesHtml,
          b.branchSide ?? '',
          b.branchSourceSide ?? '',
          b.branchOrder ?? '',
          `${b.size.width}x${b.size.height}`,
          b.attachments
            .map((attachment) => `${attachment.id}:${attachment.type}:${attachment.fileName}`)
            .join(','),
        ].join(':')
    )
    .join('|');
}

export function getMiniMapNodeColor(block: MapBlock | undefined, theme: Theme): string {
  return getMapBlockMinimapColor(
    {
      surfaceColor: block?.surfaceColor,
      borderColor: block?.borderColor,
      legacyColor: block?.color,
    },
    theme === 'pastel' ? 'pastel' : 'dark'
  );
}

export function MapCanvas({
  document,
  theme,
  edgeStyle,
  edgeAppearance,
  onBlocksChange,
  onViewportChange,
  onExpandBlock,
  onPreviewBlock,
  onDeleteBlock,
  onEditBlock,
  onEditBlockColor,
  onCreateBranch,
  onNewBlock,
  onEdgeStyleChange,
  onEdgeAppearanceChange,
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
      onEditColor: onEditBlockColor,
      onCreateBranch,
    }),
    [onExpandBlock, onPreviewBlock, onDeleteBlock, onEditBlock, onEditBlockColor, onCreateBranch]
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
        blockCallbacks.onEditColor,
        blockCallbacks.onCreateBranch
      ),
    [document.blocks, nodeAffordances, theme, blockCallbacks]
  );

  const initialEdges = useMemo(() => flowEdgesFromDocument(document, theme), [document, theme]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<MapStyledFlowEdge>(initialEdges);

  const blocksSig = blocksSignature(document.blocks);

  useEffect(() => {
    if (isDraggingRef.current) return;
    if (blocksSig === lastBlocksSigRef.current) {
      setEdges(flowEdgesFromDocument(document, theme));
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
        blockCallbacks.onEditColor,
        blockCallbacks.onCreateBranch
      )
    );
    setEdges(flowEdgesFromDocument(document, theme));
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
        flowEdgesFromDocument(
          {
            ...document,
            blocks: updatedBlocks,
            edges: buildMapEdges(updatedBlocks, document.defaultEdgeStyle),
          },
          theme
        )
      );
    },
    [document, onBlocksChange, setEdges, theme]
  );

  return (
    <div className="w-full h-full map-canvas-root" style={{ background: 'transparent' }}>
      <ReactFlow<Node<MapBlockNodeData>, MapStyledFlowEdge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
          edgeAppearance={edgeAppearance}
          onNewBlock={onNewBlock}
          onEdgeStyleChange={onEdgeStyleChange}
          onEdgeAppearanceChange={onEdgeAppearanceChange}
          onRelayout={onRelayout}
        />
        <MiniMap
          className={`!rounded-2xl !border !shadow-xl ${
            t.isPastel
              ? '!bg-white/85 !border-pink-200/40'
              : '!bg-gray-900/85 !border-cyber-purple-500/40'
          }`}
          nodeColor={(node) => getMiniMapNodeColor((node as Node<MapBlockNodeData>).data?.block, theme)}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
