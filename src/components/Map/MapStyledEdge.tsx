import { BaseEdge, Edge, EdgeProps, getSmoothStepPath } from '@xyflow/react';

export interface MapStyledEdgeData extends Record<string, unknown> {
  strokeColor: string;
  glowColor: string;
  gradientStartColor?: string;
  gradientEndColor?: string;
  gradientMode: 'none' | 'linked-blocks';
}

export type MapStyledFlowEdge = Edge<MapStyledEdgeData, 'mapStyled'>;

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '-');
}

export function MapStyledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
  selected,
}: EdgeProps<MapStyledFlowEdge>) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 18,
    offset: 20,
  });

  const gradientId = `map-edge-gradient-${sanitizeId(id)}`;
  const glowGradientId = `map-edge-glow-${sanitizeId(id)}`;
  const strokeWidth = Number(style?.strokeWidth ?? 2) + (selected ? 0.4 : 0);
  const dashArray = style?.strokeDasharray;
  const stroke = data?.gradientMode === 'linked-blocks' ? `url(#${gradientId})` : data?.strokeColor;
  const glowStroke = data?.gradientMode === 'linked-blocks' ? `url(#${glowGradientId})` : data?.glowColor;

  return (
    <>
      {data?.gradientMode === 'linked-blocks' && data.gradientStartColor && data.gradientEndColor && (
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={sourceX}
            y1={sourceY}
            x2={targetX}
            y2={targetY}
          >
            <stop offset="0%" stopColor={data.gradientStartColor} />
            <stop offset="100%" stopColor={data.gradientEndColor} />
          </linearGradient>
          <linearGradient
            id={glowGradientId}
            gradientUnits="userSpaceOnUse"
            x1={sourceX}
            y1={sourceY}
            x2={targetX}
            y2={targetY}
          >
            <stop offset="0%" stopColor={data.gradientStartColor} stopOpacity="0.82" />
            <stop offset="100%" stopColor={data.gradientEndColor} stopOpacity="0.82" />
          </linearGradient>
        </defs>
      )}

      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: glowStroke,
          strokeWidth: strokeWidth + 5.5,
          strokeDasharray: dashArray,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          opacity: selected ? 0.42 : 0.28,
          filter: 'blur(6px)',
        }}
      />
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...(style ?? {}),
          stroke,
          strokeWidth,
          strokeDasharray: dashArray,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      />
    </>
  );
}
