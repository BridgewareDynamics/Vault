// PDF extraction will be handled in the renderer process
// This file is kept for type definitions and future use if needed

export interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
}

