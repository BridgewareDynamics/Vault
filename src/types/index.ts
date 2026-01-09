export interface ExtractedPage {
  pageNumber: number;
  imagePath: string;
  imageData: string; // base64 or blob URL
}

export interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
  currentPageProgress?: number; // 0-100 for current page
  estimatedTimeRemaining?: number; // seconds
  memoryUsage?: number; // MB
  statusMessage?: string;
}

export interface ConversionSettings {
  dpi: number; // 72, 150, 300, 600
  quality: number; // 1-100 (for JPEG)
  format: 'png' | 'jpeg';
  pageRange?: 'all' | 'custom' | 'selected'; // All pages, custom range, or selected pages
  customPageRange?: string; // e.g., "1-5, 8, 10-12"
  colorSpace: 'rgb' | 'grayscale';
  compressionLevel?: number; // PNG compression (0-9)
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

export interface CategoryTag {
  id: string;
  name: string;
  color: string; // Hex color code (e.g., "#FF5733")
}

export interface ArchiveCase {
  name: string;
  path: string;
  backgroundImage?: string; // URL or path to background image
  description?: string; // Text explaining the case's purpose/contents
  categoryTagId?: string; // ID of the category tag assigned to this case
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
  backgroundImage?: string; // Path to background image for folders
  categoryTagId?: string; // ID of the category tag assigned to this file
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

// Settings Types
export type ExtractionQuality = 'high' | 'medium' | 'low';
export type PerformanceMode = 'auto' | 'high' | 'balanced' | 'low';

export interface AppSettings {
  hardwareAcceleration: boolean;
  ramLimitMB: number;
  fullscreen: boolean;
  extractionQuality: ExtractionQuality;
  thumbnailSize: number;
  performanceMode: PerformanceMode;
}

// Bookmark Types
export interface Bookmark {
  id: string;
  pdfPath: string;
  pageNumber: number;
  name: string;
  description?: string;
  note?: string;
  thumbnail?: string; // Base64 or path to thumbnail
  folderId?: string;
  tags: string[]; // Array of tag IDs
  createdAt: number;
  updatedAt: number;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  pdfPath: string; // PDF this folder is associated with
  thumbnail?: string; // Base64 or path to thumbnail
  createdAt: number;
  updatedAt: number;
}

