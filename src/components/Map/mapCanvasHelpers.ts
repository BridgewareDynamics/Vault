import { MapBlock, MapBranchSide, Theme } from '../../types';
import { toEdgeAppearanceTheme } from '../../theme/themeSemantics';
import type { MapBlockNodeData } from './MapBlockNode';
import { getMapBlockMinimapColor } from './mapBlockColors';
import type { MapHandleSide } from '../../utils/mapEdgeRouting';

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

export function getMiniMapNodeColor(block: MapBlock | undefined, theme: Theme): string {
  return getMapBlockMinimapColor(
    {
      surfaceColor: block?.surfaceColor,
      borderColor: block?.borderColor,
      legacyColor: block?.color,
    },
    toEdgeAppearanceTheme(theme)
  );
}
