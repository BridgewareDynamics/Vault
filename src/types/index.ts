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
  type: 'image' | 'pdf' | 'video' | 'audio' | 'other';
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
export type Theme = 'brideware-purple' | 'pastel';

export interface AppSettings {
  hardwareAcceleration: boolean;
  ramLimitMB: number;
  fullscreen: boolean;
  extractionQuality: ExtractionQuality;
  thumbnailSize: number;
  performanceMode: PerformanceMode;
  showOnboarding: boolean;
  theme: Theme;
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

// Map (Research Timeline) Types
export type MapDateTier = 'era' | 'phase' | 'year' | 'month' | 'day';
export type MapBlockKind = 'timeline' | 'branch';
export type MapBranchSide = 'left' | 'right';
export type MapEdgeKind = 'chronology' | 'branch';
export type MapEdgeStyle = 'solid' | 'dotted';
export type MapEdgeColorMode = 'theme' | 'custom' | 'linked-blocks';
export type MapCanvasSide = 'top' | 'right' | 'bottom' | 'left';

export interface MapBlockChronology {
  tier: MapDateTier;
  eraLabel?: string;
  phaseLabel?: string;
  year?: number;
  month?: number;
  day?: number;
  sortKey: string;
}

export interface MapAttachment {
  id: string;
  fileName: string;
  relativePath: string;
  vaultPath: string;
  type: 'image' | 'pdf' | 'video' | 'other';
  thumbnailPath?: string;
}

export interface MapBlock {
  id: string;
  kind?: MapBlockKind;
  title?: string;
  color?: string;
  surfaceColor?: string;
  borderColor?: string;
  chronology?: MapBlockChronology;
  notesHtml: string;
  attachments: MapAttachment[];
  position: { x: number; y: number };
  size: { width: number; height: number };
  positionLocked?: boolean;
  branchParentBlockId?: string;
  branchSide?: MapBranchSide;
  branchSourceSide?: MapCanvasSide;
  branchOrder?: number;
}

export interface MapEdgeAppearance {
  colorMode: MapEdgeColorMode;
  strokeColor?: string;
  glowColor?: string;
}

export interface MapEdge {
  id: string;
  kind?: MapEdgeKind;
  sourceBlockId: string;
  targetBlockId: string;
  style: MapEdgeStyle;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface MapDocument {
  id: string;
  title: string;
  version: 1;
  createdAt: number;
  updatedAt: number;
  casePath: string | null;
  mapFolderPath: string;
  blocks: MapBlock[];
  edges: MapEdge[];
  viewport: { x: number; y: number; zoom: number };
  layoutMode: 'timeline-vertical';
  defaultEdgeStyle: MapEdgeStyle;
  defaultEdgeAppearance?: MapEdgeAppearance;
}

export interface MapListEntry {
  id: string;
  title: string;
  mapFolderPath: string;
  casePath: string | null;
  caseName?: string;
  modified: number;
  blockCount: number;
}

// Transcription Types
export type TranscriptionDocumentStatus =
  | 'draft'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type TranscriptionMediaType = 'audio' | 'video';
export type TranscriptionOutputFormat = 'txt' | 'srt' | 'vtt' | 'json';

export interface TranscriptionMediaSelection {
  sourceId: string;
  startSeconds: number;
  endSeconds: number;
  totalDurationSeconds: number;
}

export interface TranscriptionEngineSettings {
  model: string;
  precision: string;
  device: 'cpu' | 'cuda';
  outputFormat: TranscriptionOutputFormat;
  includeTimestamps: boolean;
  segmentLength: number;
  segmentDuration: number;
  curateText: boolean;
  batchRecursive: boolean;
  mediaSelection?: TranscriptionMediaSelection | null;
}

export interface TranscriptionProgress {
  stage: 'idle' | 'booting' | 'queued' | 'processing' | 'saving' | 'completed' | 'failed' | 'cancelled';
  current: number;
  total: number;
  percentage: number;
  statusMessage?: string;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionSource {
  id: string;
  fileName: string;
  originalPath: string;
  storedPath?: string;
  relativePath?: string;
  mediaType: TranscriptionMediaType;
  origin: 'vault' | 'local';
  casePath?: string | null;
}

export interface TranscriptionDocument {
  id: string;
  title: string;
  version: 1;
  createdAt: number;
  updatedAt: number;
  casePath: string | null;
  transcriptionFolderPath: string;
  status: TranscriptionDocumentStatus;
  progress: TranscriptionProgress;
  settings: TranscriptionEngineSettings;
  sources: TranscriptionSource[];
  transcriptText: string;
  transcriptFilePath?: string;
  segments: TranscriptionSegment[];
  segmentsFilePath?: string;
  summary?: string;
  lastError?: string;
}

export interface TranscriptionListEntry {
  id: string;
  title: string;
  transcriptionFolderPath: string;
  casePath: string | null;
  caseName?: string;
  modified: number;
  sourceCount: number;
  status: TranscriptionDocumentStatus;
  excerpt?: string;
}

export interface TranscriptionEngineModel {
  key: string;
  name: string;
  modelId: string;
  precision: string;
  modelType: string;
  averageVramUsage?: string;
  defaultSegmentLength: number;
  supportsTimestamps: boolean;
  bundled?: boolean;
  bundledPath?: string;
  cached?: boolean;
  cachePath?: string;
  installable?: boolean;
}

export interface TranscriptionModelDownloadResult {
  modelId: string;
  path: string;
  bundled: boolean;
  cached: boolean;
  cachePath?: string;
  bundledPath?: string;
}

export interface TranscriptionEngineStatus {
  available: boolean;
  running: boolean;
  port?: number;
  serverUrl?: string;
  pythonCommand?: string;
  pythonExecutable?: string;
  scriptPath?: string;
  contextRoot?: string;
  bundledModelsDirectory?: string;
  userModelsDirectory?: string;
  deviceDefault?: 'cpu' | 'cuda';
  cudaBuilt?: boolean;
  cudaAvailable?: boolean;
  runtimeMode?: 'source' | 'bundled' | 'packaged';
  localOnlyResolution?: boolean;
  defaultModelKey?: string;
  defaultModelReady?: boolean;
  error?: string;
}

