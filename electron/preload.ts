import { contextBridge, ipcRenderer } from 'electron';

// Type definitions for IPC
type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';
type LogArgs = Parameters<typeof console.log>;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectPDFFile: () => ipcRenderer.invoke('select-pdf-file'),
  selectImageFile: () => ipcRenderer.invoke('select-image-file'),
  selectSaveDirectory: () => ipcRenderer.invoke('select-save-directory'),
  validatePDFForExtraction: (pdfPath: string) => ipcRenderer.invoke('validate-pdf-for-extraction', pdfPath),
  saveFiles: (options: {
    saveDirectory: string;
    saveParentFile: boolean;
    saveToZip: boolean;
    folderName?: string;
    parentFilePath?: string;
    extractedPages: Array<{ pageNumber: number; imageData: string }>;
  }) => ipcRenderer.invoke('save-files', options),
  validatePath: (filePath: string) => ipcRenderer.invoke('validate-path', filePath),
  readPDFFile: (filePath: string) => ipcRenderer.invoke('read-pdf-file', filePath),
  readPDFFileChunk: (filePath: string, start: number, length: number) => ipcRenderer.invoke('read-pdf-file-chunk', filePath, start, length),
  closePDFFileHandle: (filePath: string) => ipcRenderer.invoke('close-pdf-file-handle', filePath),
  getPDFFileSize: (filePath: string) => ipcRenderer.invoke('get-pdf-file-size', filePath),
  // Archive APIs
  selectArchiveDrive: () => ipcRenderer.invoke('select-archive-drive'),
  getArchiveConfig: () => ipcRenderer.invoke('get-archive-config'),
  validateArchiveDirectory: (dirPath: string) => ipcRenderer.invoke('validate-archive-directory', dirPath),
      createCaseFolder: (caseName: string, description?: string, categoryTagId?: string) => ipcRenderer.invoke('create-case-folder', caseName, description, categoryTagId),
      getCategoryTags: () => ipcRenderer.invoke('get-category-tags'),
      createCategoryTag: (tag: { id: string; name: string; color: string }) => ipcRenderer.invoke('create-category-tag', tag),
      deleteCategoryTag: (tagId: string) => ipcRenderer.invoke('delete-category-tag', tagId),
      setCaseCategoryTag: (casePath: string, categoryTagId: string | null) => ipcRenderer.invoke('set-case-category-tag', casePath, categoryTagId),
      getCaseCategoryTag: (casePath: string) => ipcRenderer.invoke('get-case-category-tag', casePath),
      setFileCategoryTag: (filePath: string, categoryTagId: string | null) => ipcRenderer.invoke('set-file-category-tag', filePath, categoryTagId),
      getFileCategoryTag: (filePath: string) => ipcRenderer.invoke('get-file-category-tag', filePath),
  createFolder: (folderPath: string, folderName: string) => ipcRenderer.invoke('create-folder', folderPath, folderName),
  createExtractionFolder: (casePath: string, folderName: string, parentPdfPath?: string) => ipcRenderer.invoke('create-extraction-folder', casePath, folderName, parentPdfPath),
  moveFileToFolder: (filePath: string, folderPath: string) => ipcRenderer.invoke('move-file-to-folder', filePath, folderPath),
  listArchiveCases: () => ipcRenderer.invoke('list-archive-cases'),
  listCaseFiles: (casePath: string) => ipcRenderer.invoke('list-case-files', casePath),
  addFilesToCase: (casePath: string, filePaths?: string[]) => ipcRenderer.invoke('add-files-to-case', casePath, filePaths),
  deleteCase: (casePath: string) => ipcRenderer.invoke('delete-case', casePath),
  setCaseBackgroundImage: (casePath: string, imagePath: string) => ipcRenderer.invoke('set-case-background-image', casePath, imagePath),
  setFolderBackgroundImage: (folderPath: string, imagePath: string) => ipcRenderer.invoke('set-folder-background-image', folderPath, imagePath),
  deleteFile: (filePath: string, isFolder?: boolean) => ipcRenderer.invoke('delete-file', filePath, isFolder),
  renameFile: (filePath: string, newName: string) => ipcRenderer.invoke('rename-file', filePath, newName),
  getFileThumbnail: (filePath: string) => ipcRenderer.invoke('get-file-thumbnail', filePath),
  getPDFThumbnailPath: (filePath: string) => ipcRenderer.invoke('get-pdf-thumbnail-path', filePath),
  savePDFThumbnail: (filePath: string, thumbnailData: string) => ipcRenderer.invoke('save-pdf-thumbnail', filePath, thumbnailData),
  readPDFThumbnail: (filePath: string) => ipcRenderer.invoke('read-pdf-thumbnail', filePath),
  deletePDFThumbnail: (filePath: string) => ipcRenderer.invoke('delete-pdf-thumbnail', filePath),
  readFileData: (filePath: string) => ipcRenderer.invoke('read-file-data', filePath),
  extractPDFFromArchive: (options: {
    pdfPath: string;
    casePath: string;
    folderName: string;
    saveParentFile: boolean;
    extractedPages: Array<{ pageNumber: number; imageData: string }>;
  }) => ipcRenderer.invoke('extract-pdf-from-archive', options),
  // Logging API
  logToMain: (level: LogLevel, ...args: LogArgs) => ipcRenderer.invoke('log-renderer', level, ...args),
  // Debug logging API - writes NDJSON to debug.log
  debugLog: (logEntry: {
    location: string;
    message: string;
    data?: any;
    timestamp: number;
    sessionId: string;
    runId: string;
    hypothesisId: string;
  }) => ipcRenderer.invoke('debug-log', logEntry),
  // System information
  getSystemMemory: () => ipcRenderer.invoke('get-system-memory'),
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: {
      selectPDFFile: () => Promise<string | null>;
      selectImageFile: () => Promise<string | null>;
      selectSaveDirectory: () => Promise<string | null>;
      validatePDFForExtraction: (pdfPath: string) => Promise<{ valid: boolean; path: string }>;
      saveFiles: (options: {
        saveDirectory: string;
        saveParentFile: boolean;
        saveToZip: boolean;
        folderName?: string;
        parentFilePath?: string;
        extractedPages: Array<{ pageNumber: number; imageData: string }>;
      }) => Promise<{ success: boolean; messages: string[] }>;
      validatePath: (filePath: string) => Promise<{ isValid: boolean; isPDF: boolean }>;
      readPDFFile: (filePath: string) => Promise<{ type: 'base64'; data: string } | { type: 'file-path'; path: string } | string | number[]>; // Returns base64 string, file path object, or array for backward compatibility
      readPDFFileChunk: (filePath: string, start: number, length: number) => Promise<ArrayBuffer>; // Returns ArrayBuffer for efficient transfer
      closePDFFileHandle: (filePath: string) => Promise<void>; // Closes cached file handle
      getPDFFileSize: (filePath: string) => Promise<number>;
      // Archive APIs
      selectArchiveDrive: () => Promise<{ path: string; autoDetected: boolean } | null>;
      getArchiveConfig: () => Promise<{ archiveDrive: string | null }>;
      validateArchiveDirectory: (dirPath: string) => Promise<{ isValid: boolean; marker?: { version: string; createdAt: number; lastModified: number; caseCount?: number; archiveId: string } }>;
      createCaseFolder: (caseName: string, description?: string, categoryTagId?: string) => Promise<string>;
      getCategoryTags: () => Promise<Array<{ id: string; name: string; color: string }>>;
      createCategoryTag: (tag: { id: string; name: string; color: string }) => Promise<{ id: string; name: string; color: string }>;
      deleteCategoryTag: (tagId: string) => Promise<boolean>;
      setCaseCategoryTag: (casePath: string, categoryTagId: string | null) => Promise<boolean>;
      getCaseCategoryTag: (casePath: string) => Promise<string | null>;
      setFileCategoryTag: (filePath: string, categoryTagId: string | null) => Promise<boolean>;
      getFileCategoryTag: (filePath: string) => Promise<string | null>;
      createFolder: (folderPath: string, folderName: string) => Promise<string>;
      createExtractionFolder: (casePath: string, folderName: string, parentPdfPath?: string) => Promise<string>;
      moveFileToFolder: (filePath: string, folderPath: string) => Promise<{ success: boolean; error?: string; newPath?: string }>;
      listArchiveCases: () => Promise<Array<{ name: string; path: string; backgroundImage?: string; description?: string; categoryTagId?: string }>>;
      listCaseFiles: (casePath: string) => Promise<Array<{ name: string; path: string; size: number; modified: number; isFolder?: boolean; folderType?: 'extraction' | 'case'; parentPdfName?: string; categoryTagId?: string }>>;
      addFilesToCase: (casePath: string, filePaths?: string[]) => Promise<string[]>;
      deleteCase: (casePath: string) => Promise<boolean>;
      setCaseBackgroundImage: (casePath: string, imagePath: string) => Promise<string>;
      setFolderBackgroundImage: (folderPath: string, imagePath: string) => Promise<string>;
      deleteFile: (filePath: string, isFolder?: boolean) => Promise<boolean>;
      renameFile: (filePath: string, newName: string) => Promise<{ success: boolean; newPath: string }>;
      getFileThumbnail: (filePath: string) => Promise<string>;
      getPDFThumbnailPath: (filePath: string) => Promise<string>;
      savePDFThumbnail: (filePath: string, thumbnailData: string) => Promise<void>;
      readPDFThumbnail: (filePath: string) => Promise<string | null>;
      deletePDFThumbnail: (filePath: string) => Promise<void>;
      readFileData: (filePath: string) => Promise<{ data: string; mimeType: string; fileName: string }>;
      extractPDFFromArchive: (options: {
        pdfPath: string;
        casePath: string;
        folderName: string;
        saveParentFile: boolean;
        extractedPages: Array<{ pageNumber: number; imageData: string }>;
      }) => Promise<{ success: boolean; messages: string[]; extractionFolder: string }>;
      logToMain: (level: LogLevel, ...args: LogArgs) => Promise<void>;
      debugLog: (logEntry: {
        location: string;
        message: string;
        data?: any;
        timestamp: number;
        sessionId: string;
        runId: string;
        hypothesisId: string;
      }) => Promise<void>;
      getSystemMemory: () => Promise<{ totalMemory: number; freeMemory: number; usedMemory: number }>;
    };
  }
}

