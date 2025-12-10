import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectPDFFile: () => ipcRenderer.invoke('select-pdf-file'),
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
  // Archive APIs
  selectArchiveDrive: () => ipcRenderer.invoke('select-archive-drive'),
  getArchiveConfig: () => ipcRenderer.invoke('get-archive-config'),
  createCaseFolder: (caseName: string) => ipcRenderer.invoke('create-case-folder', caseName),
  createExtractionFolder: (casePath: string, folderName: string, parentPdfPath?: string) => ipcRenderer.invoke('create-extraction-folder', casePath, folderName, parentPdfPath),
  listArchiveCases: () => ipcRenderer.invoke('list-archive-cases'),
  listCaseFiles: (casePath: string) => ipcRenderer.invoke('list-case-files', casePath),
  addFilesToCase: (casePath: string, filePaths?: string[]) => ipcRenderer.invoke('add-files-to-case', casePath, filePaths),
  deleteCase: (casePath: string) => ipcRenderer.invoke('delete-case', casePath),
  deleteFile: (filePath: string, isFolder?: boolean) => ipcRenderer.invoke('delete-file', filePath, isFolder),
  renameFile: (filePath: string, newName: string) => ipcRenderer.invoke('rename-file', filePath, newName),
  getFileThumbnail: (filePath: string) => ipcRenderer.invoke('get-file-thumbnail', filePath),
  readFileData: (filePath: string) => ipcRenderer.invoke('read-file-data', filePath),
  extractPDFFromArchive: (options: {
    pdfPath: string;
    casePath: string;
    folderName: string;
    saveParentFile: boolean;
    extractedPages: Array<{ pageNumber: number; imageData: string }>;
  }) => ipcRenderer.invoke('extract-pdf-from-archive', options),
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: {
      selectPDFFile: () => Promise<string | null>;
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
      readPDFFile: (filePath: string) => Promise<number[]>;
      // Archive APIs
      selectArchiveDrive: () => Promise<string | null>;
      getArchiveConfig: () => Promise<{ archiveDrive: string | null }>;
      createCaseFolder: (caseName: string) => Promise<string>;
      createExtractionFolder: (casePath: string, folderName: string, parentPdfPath?: string) => Promise<string>;
      listArchiveCases: () => Promise<Array<{ name: string; path: string }>>;
      listCaseFiles: (casePath: string) => Promise<Array<{ name: string; path: string; size: number; modified: number; isFolder?: boolean; folderType?: 'extraction' | 'case'; parentPdfName?: string }>>;
      addFilesToCase: (casePath: string, filePaths?: string[]) => Promise<string[]>;
      deleteCase: (casePath: string) => Promise<boolean>;
      deleteFile: (filePath: string, isFolder?: boolean) => Promise<boolean>;
      renameFile: (filePath: string, newName: string) => Promise<{ success: boolean; newPath: string }>;
      getFileThumbnail: (filePath: string) => Promise<string>;
      readFileData: (filePath: string) => Promise<{ data: string; mimeType: string; fileName: string }>;
      extractPDFFromArchive: (options: {
        pdfPath: string;
        casePath: string;
        folderName: string;
        saveParentFile: boolean;
        extractedPages: Array<{ pageNumber: number; imageData: string }>;
      }) => Promise<{ success: boolean; messages: string[]; extractionFolder: string }>;
    };
  }
}

