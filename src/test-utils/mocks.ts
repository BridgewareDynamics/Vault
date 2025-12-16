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
  // Archive APIs
  selectArchiveDrive: vi.fn(),
  getArchiveConfig: vi.fn(),
  validateArchiveDirectory: vi.fn(),
  createCaseFolder: vi.fn(),
  createExtractionFolder: vi.fn(),
  listArchiveCases: vi.fn(),
  listCaseFiles: vi.fn(),
  addFilesToCase: vi.fn(),
  deleteCase: vi.fn(),
  setCaseBackgroundImage: vi.fn(),
  deleteFile: vi.fn(),
  renameFile: vi.fn(),
  getFileThumbnail: vi.fn(),
  readFileData: vi.fn(),
  extractPDFFromArchive: vi.fn(),
};

// Type declaration for the mock
declare global {
  interface Window {
    electronAPI: typeof mockElectronAPI;
  }
}











