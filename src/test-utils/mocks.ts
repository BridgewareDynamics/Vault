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
  updateCaseDescription: vi.fn(),
  getCategoryTags: vi.fn(),
  createCategoryTag: vi.fn(),
  deleteCategoryTag: vi.fn(),
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
  saveAudioRecordingToCase: vi.fn().mockResolvedValue('/mock/case/recording.webm'),
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
  openDevToolsInDev: vi.fn(),
  debugLog: vi.fn(),
  getSystemMemory: vi.fn(),
  getSystemFonts: vi.fn(),
  // Settings API
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  toggleFullscreen: vi.fn(),
  // Map APIs
  listMaps: vi.fn(),
  listCaseMaps: vi.fn(),
  createMap: vi.fn(),
  readMap: vi.fn(),
  saveMap: vi.fn(),
  deleteMap: vi.fn(),
  renameMap: vi.fn(),
  selectMapAttachments: vi.fn(),
  copyMapAttachmentToAssets: vi.fn(),
  exportMapToDirectory: vi.fn(),
  exportMapPng: vi.fn(),
  // Novel APIs
  listNovels: vi.fn(),
  listCaseNovels: vi.fn(),
  createNovel: vi.fn(),
  readNovel: vi.fn(),
  saveNovel: vi.fn(),
  deleteNovel: vi.fn(),
  moveNovelToCase: vi.fn(),
  moveNovelToLibrary: vi.fn(),
  copyNovelAssetToNovel: vi.fn(),
  writeNovelAssetFromDataUrl: vi.fn(),
  exportNovelPdf: vi.fn(),
  exportNovelHtml: vi.fn(),
  exportNovelDocx: vi.fn(),
  exportNovelEpub: vi.fn(),
  showSaveDialog: vi.fn(),
  // Transcription APIs
  getTranscriptionEngineStatus: vi.fn(),
  startTranscriptionEngine: vi.fn(),
  stopTranscriptionEngine: vi.fn(),
  listTranscriptionModels: vi.fn(),
  downloadTranscriptionModel: vi.fn(),
  selectTranscriptionMedia: vi.fn(),
  listTranscriptions: vi.fn(),
  listCaseTranscriptions: vi.fn(),
  createTranscription: vi.fn(),
  readTranscription: vi.fn(),
  saveTranscription: vi.fn(),
  deleteTranscription: vi.fn(),
  renameTranscription: vi.fn(),
  copyTranscriptionSourceToAssets: vi.fn(),
  runTranscription: vi.fn(),
  cancelTranscriptionJob: vi.fn(),
  // File Converter APIs
  getConverterCapabilities: vi.fn(),
  convertFile: vi.fn(),
  cancelFileConversion: vi.fn(),
  selectConverterFile: vi.fn(),
  saveConvertedFileToCase: vi.fn(),
  replaceVaultFileWithConversion: vi.fn(),
  onFileConverterProgress: vi.fn(() => () => {}),
  // Word Editor APIs
  readTextFile: vi.fn(),
  saveTextFile: vi.fn(),
  createTextFile: vi.fn(),
  exportTextFile: vi.fn(),
  listTextFiles: vi.fn(),
  listCaseNotes: vi.fn(),
  createCaseNote: vi.fn(),
  deleteTextFile: vi.fn(),
  createWordEditorWindow: vi.fn(),
  reattachWordEditor: vi.fn(),
  createMapWindow: vi.fn(),
  reattachMapModule: vi.fn(),
  createTranscriptionWindow: vi.fn(),
  reattachTranscriptionModule: vi.fn(),
  createFileConverterWindow: vi.fn(),
  reattachFileConverterModule: vi.fn(),
  createNovelWindow: vi.fn(),
  reattachNovelModule: vi.fn(),
  closeWindow: vi.fn(),
  getVaultDirectory: vi.fn(),
  // PDF audit / extraction detached windows
  createPdfAuditWindow: vi.fn(),
  reattachPdfAudit: vi.fn(),
  createPdfExtractionWindow: vi.fn(),
  reattachPdfExtraction: vi.fn(),
  // Bookmark APIs
  openBookmarkInMainWindow: vi.fn(),
  getBookmarks: vi.fn(),
  createBookmark: vi.fn(),
  updateBookmark: vi.fn(),
  deleteBookmark: vi.fn(),
  getBookmarkFolders: vi.fn(),
  createBookmarkFolder: vi.fn(),
  deleteBookmarkFolder: vi.fn(),
  getBookmarksByFolder: vi.fn(),
  saveBookmarkThumbnail: vi.fn(),
  getBookmarkThumbnail: vi.fn(),
  // Redaction audit APIs
  auditPDFRedaction: vi.fn(),
  onAuditProgress: vi.fn(() => () => {}),
  onAuditResult: vi.fn(() => () => {}),
  onAuditError: vi.fn(() => () => {}),
  generateAuditReport: vi.fn(),
};

// NOTE: We intentionally do NOT declare `Window.electronAPI` here. The canonical
// type lives in src/types/electronAPI.d.ts; redeclaring it as `typeof
// mockElectronAPI` conflicts with that (and the preload's) declaration when the
// test files are type-checked. Tests keep the `Mock` typings by importing
// `mockElectronAPI` directly; setup.ts assigns it onto `window` with a cast.














