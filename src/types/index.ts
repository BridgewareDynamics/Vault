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

