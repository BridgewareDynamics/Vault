import { vi } from 'vitest';

export const mockElectronAPI = {
  selectPDFFile: vi.fn(),
  selectImageFile: vi.fn(),
  selectSaveDirectory: vi.fn(),
  validatePDFForExtraction: vi.fn(),
  saveFiles: vi.fn(),
  validatePath: vi.fn(),
  readPDFFile: vi.fn(),
  getPDFFileSize: vi.fn(),
  readPDFFileChunk: vi.fn(),
  closePDFFileHandle: vi.fn(),
  // Archive APIs
  selectArchiveDrive: vi.fn(),
  getArchiveConfig: vi.fn(),
  validateArchiveDirectory: vi.fn(),
  createCaseFolder: vi.fn(),
  getCategoryTags: vi.fn(),
  createCategoryTag: vi.fn(),
  setCaseCategoryTag: vi.fn(),
  getCaseCategoryTag: vi.fn(),
  setFileCategoryTag: vi.fn(),
  getFileCategoryTag: vi.fn(),
  createFolder: vi.fn(),
  createExtractionFolder: vi.fn(),
  moveFileToFolder: vi.fn(),
  listArchiveCases: vi.fn(),
  listCaseFiles: vi.fn(),
  addFilesToCase: vi.fn(),
  deleteCase: vi.fn(),
  setCaseBackgroundImage: vi.fn(),
  setFolderBackgroundImage: vi.fn(),
  deleteFile: vi.fn(),
  renameFile: vi.fn(),
  getFileThumbnail: vi.fn(),
  getPDFThumbnailPath: vi.fn(),
  savePDFThumbnail: vi.fn(),
  readPDFThumbnail: vi.fn(),
  deletePDFThumbnail: vi.fn(),
  readFileData: vi.fn(),
  extractPDFFromArchive: vi.fn(),
  logToMain: vi.fn(),
  debugLog: vi.fn(),
  getSystemMemory: vi.fn(),
};

// Type declaration for the mock
declare global {
  interface Window {
    electronAPI: typeof mockElectronAPI;
  }
}














