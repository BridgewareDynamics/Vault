// Type definitions for Electron API exposed via preload script
// This file ensures TypeScript recognizes window.electronAPI in the renderer process

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';
type LogArgs = Parameters<typeof console.log>;

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
        extractedPages: Array<{ pageNumber: number; imageData: string; fileName: string }>;
      }) => Promise<{ success: boolean; messages: string[] }>;
      validatePath: (filePath: string) => Promise<{ isValid: boolean; isPDF: boolean }>;
      readPDFFile: (filePath: string) => Promise<{ type: 'base64'; data: string } | { type: 'file-path'; path: string } | string | number[]>;
      readPDFFileChunk: (filePath: string, start: number, length: number) => Promise<ArrayBuffer>;
      closePDFFileHandle: (filePath: string) => Promise<void>;
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
        extractedPages: Array<{ pageNumber: number; imageData: string; fileName: string }>;
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
      // Settings API
      getSettings: () => Promise<{
        hardwareAcceleration: boolean;
        ramLimitMB: number;
        fullscreen: boolean;
        extractionQuality: 'high' | 'medium' | 'low';
        thumbnailSize: number;
        performanceMode: 'auto' | 'high' | 'balanced' | 'low';
      }>;
      updateSettings: (updates: Partial<{
        hardwareAcceleration: boolean;
        ramLimitMB: number;
        fullscreen: boolean;
        extractionQuality: 'high' | 'medium' | 'low';
        thumbnailSize: number;
        performanceMode: 'auto' | 'high' | 'balanced' | 'low';
      }>) => Promise<{
        hardwareAcceleration: boolean;
        ramLimitMB: number;
        fullscreen: boolean;
        extractionQuality: 'high' | 'medium' | 'low';
        thumbnailSize: number;
        performanceMode: 'auto' | 'high' | 'balanced' | 'low';
      }>;
      toggleFullscreen: () => Promise<boolean>;
      // Word Editor API
      getVaultDirectory: () => Promise<string | null>;
      listTextFiles: () => Promise<Array<{
        name: string;
        path: string;
        size: number;
        modified: number;
        preview?: string;
      }>>;
      readTextFile: (filePath: string) => Promise<string>;
      createTextFile: (fileName: string, content: string) => Promise<string>;
      saveTextFile: (filePath: string, content: string) => Promise<{ success: boolean }>;
      deleteTextFile: (filePath: string) => Promise<{ success: boolean }>;
      // Case Notes API
      listCaseNotes: (casePath: string) => Promise<Array<{
        name: string;
        path: string;
        size: number;
        modified: number;
        preview?: string;
      }>>;
      createCaseNote: (casePath: string, fileName: string, content: string) => Promise<string>;
      exportTextFile: (options: {
        content: string;
        format: 'pdf' | 'docx' | 'rtf';
        filePath?: string;
      }) => Promise<{ success: boolean; filePath: string }>;
      createWordEditorWindow: (options: {
        content: string;
        filePath?: string | null;
        viewState?: 'editor' | 'library' | 'bookmarkLibrary';
        casePath?: string | null;
      }) => Promise<{ success: boolean }>;
      reattachWordEditor: (options: {
        content: string;
        filePath?: string | null;
        viewState?: 'editor' | 'library' | 'bookmarkLibrary';
        casePath?: string | null;
      }) => Promise<{ success: boolean }>;
      createPdfAuditWindow: (options: {
        pdfPath: string | null;
        settings: {
          blackThreshold: number;
          minOverlapArea: number;
          minHits: number;
          includeSecurityAudit: boolean;
        };
        showSettings: boolean;
        result: any | null;
        isAuditing: boolean;
        progressMessage: string;
      }) => Promise<{ success: boolean }>;
      reattachPdfAudit: (options: {
        pdfPath: string | null;
        settings: {
          blackThreshold: number;
          minOverlapArea: number;
          minHits: number;
          includeSecurityAudit: boolean;
        };
        showSettings: boolean;
        result: any | null;
        isAuditing: boolean;
        progressMessage: string;
      }) => Promise<{ success: boolean }>;
      createPdfExtractionWindow: (options: {
        pdfPath: string | null;
        settings: {
          dpi: number;
          quality: number;
          format: 'png' | 'jpeg';
          pageRange: 'all' | 'custom' | 'selected';
          customPageRange: string;
          colorSpace: 'rgb' | 'grayscale';
          compressionLevel: number;
        };
        showSettings: boolean;
        extractedPages: any[];
        selectedPages: number[];
        isExtracting: boolean;
        progress: any | null;
        error: string | null;
        statusMessage: string;
      }) => Promise<{ success: boolean }>;
      reattachPdfExtraction: (options: {
        pdfPath: string | null;
        settings: {
          dpi: number;
          quality: number;
          format: 'png' | 'jpeg';
          pageRange: 'all' | 'custom' | 'selected';
          customPageRange: string;
          colorSpace: 'rgb' | 'grayscale';
          compressionLevel: number;
        };
        showSettings: boolean;
        extractedPages: any[];
        selectedPages: number[];
        isExtracting: boolean;
        progress: any | null;
        error: string | null;
        statusMessage: string;
      }) => Promise<{ success: boolean }>;
      closeWindow: () => Promise<{ success: boolean }>;
      openBookmarkInMainWindow: (options: {
        pdfPath: string;
        pageNumber: number;
      }) => Promise<{ success: boolean }>;
      // Bookmark API
      getBookmarks: () => Promise<Array<any>>;
      createBookmark: (bookmark: any) => Promise<any>;
      updateBookmark: (id: string, updates: any) => Promise<any>;
      deleteBookmark: (id: string) => Promise<boolean>;
      getBookmarkFolders: () => Promise<Array<any>>;
      createBookmarkFolder: (folder: any) => Promise<any>;
      deleteBookmarkFolder: (id: string) => Promise<boolean>;
      getBookmarksByFolder: (folderId: string | null) => Promise<Array<any>>;
      saveBookmarkThumbnail: (bookmarkId: string, thumbnailData: string) => Promise<string>;
      getBookmarkThumbnail: (bookmarkId: string) => Promise<string | null>;
      // File Security Checker API
      auditPDFRedaction: (pdfPath: string, options?: {
        blackThreshold?: number;
        minOverlapArea?: number;
        minHits?: number;
        includeSecurityAudit?: boolean;
      }) => Promise<{
        filename: string;
        totalPages: number;
        flaggedPages: Array<{
          pageNumber: number;
          blackRectCount: number;
          overlapCount: number;
          confidenceScore: number;
        }>;
        security?: {
          has_metadata: boolean;
          metadata_keys: string[];
          has_attachments: boolean;
          attachment_count: number;
          has_annotations: boolean;
          annotation_count: number;
          has_forms: boolean;
          form_field_count: number;
          has_layers: boolean;
          layer_count: number;
          has_javascript: boolean;
          has_actions: boolean;
          has_thumbnails: boolean;
          incremental_updates_suspected: boolean;
          notes: string[];
        };
        error?: string;
      }>;
      onAuditProgress: (callback: (message: string) => void) => () => void;
      onAuditResult: (callback: (result: any) => void) => () => void;
      onAuditError: (callback: (error: string) => void) => () => void;
      generateAuditReport: (auditResult: any, outputPath: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      showSaveDialog: (options: {
        title: string;
        defaultPath: string;
        filters: Array<{ name: string; extensions: string[] }>;
      }) => Promise<{ canceled: boolean; filePath?: string }>;
    };
  }
}

export {};

