// Typed augmentations for the app's custom `window` CustomEvents and the
// transient `window.__*` handoff globals used by the detach/reattach flows.
//
// These let call sites use `window.addEventListener('reattach-...', handler)`
// and `window.__pdfAuditInitialData` with full type-safety, replacing the
// scattered `addEventListener('x' as any, handler as EventListener)` and
// `(window as any).__x` casts. This is a type-only file with no runtime effect.

import type { RedactionAuditResult } from '../hooks/useRedactionAudit';
import type { ConversionSettings, ExtractedPage, ExtractionProgress } from './index';

/** Payload for `word-editor-data` / `reattach-word-editor-data`. */
export interface WordEditorEventDetail {
  content: string;
  filePath?: string | null;
  viewState?: 'editor' | 'library' | 'bookmarkLibrary';
  casePath?: string | null;
}

/** Payload for `pdf-audit-data` / `reattach-pdf-audit-data`. */
export interface PdfAuditEventDetail {
  pdfPath: string | null;
  settings: {
    blackThreshold: number;
    minOverlapArea: number;
    minHits: number;
    includeSecurityAudit: boolean;
  };
  showSettings: boolean;
  result: RedactionAuditResult | null;
  isAuditing: boolean;
  progressMessage: string;
}

/** Payload for `reattach-pdf-extraction-data`. */
export interface PdfExtractionEventDetail {
  pdfPath: string | null;
  settings: ConversionSettings;
  showSettings: boolean;
  extractedPages: ExtractedPage[];
  selectedPages: number[];
  previewPage: ExtractedPage | null;
  isExtracting: boolean;
  progress: ExtractionProgress | null;
  error: string | null;
  statusMessage: string;
  caseFolderPath?: string | null;
}

declare global {
  interface WindowEventMap {
    'open-bookmark': CustomEvent<{ pdfPath: string; pageNumber: number; keepPanelOpen?: boolean }>;
    'navigate-to-case-folder': CustomEvent<{ casePath: string }>;
    'open-word-editor-from-viewer': CustomEvent<void>;
    'close-word-editor': CustomEvent<void>;
    'bookmark-folder-created': CustomEvent<{ folderId: string }>;
    'word-editor-data': CustomEvent<WordEditorEventDetail>;
    'reattach-word-editor-data': CustomEvent<WordEditorEventDetail>;
    'pdf-audit-data': CustomEvent<PdfAuditEventDetail>;
    'reattach-pdf-audit-data': CustomEvent<PdfAuditEventDetail>;
    'reattach-pdf-extraction-data': CustomEvent<PdfExtractionEventDetail>;
  }

  interface Window {
    __reattachPdfExtractionData?: PdfExtractionEventDetail;
    __pdfExtractionInitialData?: PdfExtractionEventDetail;
    __wordEditorInitialData?: WordEditorEventDetail;
    __pdfAuditInitialData?: PdfAuditEventDetail;
  }
}
