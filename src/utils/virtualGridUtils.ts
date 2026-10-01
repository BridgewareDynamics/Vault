export const VIRTUALIZATION_THRESHOLD = 50;

export function getResponsiveColumnCount(width: number): number {
  if (width >= 1280) return 6;
  if (width >= 1024) return 5;
  if (width >= 768) return 4;
  if (width >= 640) return 3;
  return 2;
}

export function getVaultBrowserColumnCount(width: number): number {
  if (width >= 1536) return 3;
  if (width >= 640) return 2;
  return 2;
}

export function getExtractionGridColumnCount(width: number): number {
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
}

export function calculateVirtualGridDimensions(
  containerWidth: number,
  columnCount: number,
  gap = 16,
  aspectRatio = 4 / 3,
  footerHeight = 40,
): { columnWidth: number; rowHeight: number } {
  const availableWidth = Math.max(containerWidth - gap * 2, columnCount * 80);
  const columnWidth = Math.floor((availableWidth - gap * (columnCount - 1)) / columnCount);
  const rowHeight = Math.floor(columnWidth * aspectRatio) + footerHeight;
  return { columnWidth, rowHeight };
}

export function shouldVirtualizeGrid(itemCount: number, threshold = VIRTUALIZATION_THRESHOLD): boolean {
  return itemCount >= threshold;
}
