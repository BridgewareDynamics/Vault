export interface ExtractedPage {
  pageNumber: number;
  imagePath: string;
  imageData: string; // base64 or blob URL
}

export interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
}

export interface SaveOptions {
  saveParentFile: boolean;
  saveToZip: boolean;
  folderName?: string;
  saveDirectory?: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Archive Types
export interface ArchiveConfig {
  archiveDrive: string | null;
}

export interface ArchiveMarker {
  version: string;
  createdAt: number;
  lastModified: number;
  caseCount?: number;
  archiveId: string;
}

export interface ArchiveCase {
  name: string;
  path: string;
  backgroundImage?: string; // URL or path to background image
  description?: string; // Text explaining the case's purpose/contents
}

export interface ArchiveFile {
  name: string;
  path: string;
  size: number;
  modified: number;
  thumbnail?: string;
  type: 'image' | 'pdf' | 'video' | 'other';
  isFolder?: boolean;
  folderType?: 'extraction' | 'case';
  parentPdfName?: string; // Name of the parent PDF file this folder was created from
}

// Logger Types
export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';
export type LogArgs = Parameters<typeof console.log>;

// Error Types
export interface ErrorWithCode extends Error {
  code?: string;
}

// PDF.js Types
// Re-export PDFDocumentProxy from pdfjs-dist for use throughout the app
// This ensures type compatibility with the actual pdfjs-dist library
export type { PDFDocumentProxy as PDFDocument } from 'pdfjs-dist';

export interface PDFRenderTask {
  promise: Promise<void>;
  cancel: () => void;
}

export interface PDFPage {
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: PDFViewport }) => PDFRenderTask;
  getViewport: (options: { scale: number }) => PDFViewport;
}

export interface PDFViewport {
  width: number;
  height: number;
  transform: [number, number, number, number, number, number];
}

