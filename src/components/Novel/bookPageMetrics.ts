import { NovelDocument } from '../../types';
import { computeEditorContentHeightPx } from './engine/pageLayoutEngine';
import { formatFontFamilyCss } from './novelFontUtils';
import type { BookDisplayMetrics } from './engine/bookSizes';

/** @deprecated Use metrics from useBookDisplayMetrics instead */
export const BOOK_PAGE_DIMENSIONS = {
  width: 340,
  height: 440,
  padding: 28,
};

export function buildPageMeasureOptions(metrics: BookDisplayMetrics, document: NovelDocument) {
  return {
    contentWidthPx: metrics.contentWidthPx,
    contentHeightPx: computeEditorContentHeightPx(metrics, document.settings.showPageNumbers),
    fontFamily: formatFontFamilyCss(document.settings.fontFamily),
    fontSize: document.settings.fontSize,
  };
}
