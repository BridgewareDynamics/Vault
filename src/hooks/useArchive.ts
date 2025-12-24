import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArchiveCase, ArchiveFile, ArchiveConfig } from '../types';
import { useToast } from '../components/Toast/ToastContext';
import { logger } from '../utils/logger';
import { setupPDFWorker } from '../utils/pdfWorker';
import { getUserFriendlyError } from '../utils/errorMessages';
import { useCategoryTags } from './useCategoryTags';

// Global thumbnail cache that persists across navigation
const globalThumbnailCache = new Map<string, string>();

export function useArchive() {
  const [archiveConfig, setArchiveConfig] = useState<ArchiveConfig | null>(null);
  const [cases, setCases] = useState<ArchiveCase[]>([]);
  const [currentCase, setCurrentCase] = useState<ArchiveCase | null>(null);
  const [currentFolderPath, setCurrentFolderPath] = useState<string | null>(null);
  const [folderNavigationStack, setFolderNavigationStack] = useState<string[]>([]);
  const [files, setFiles] = useState<ArchiveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(new Set());
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const toast = useToast();
  const { tags, getTagById } = useCategoryTags();

  // Load archive config on mount
  useEffect(() => {
    loadArchiveConfig();
  }, []);

  // Load cases when archive drive is set
  useEffect(() => {
    if (archiveConfig?.archiveDrive) {
      loadCases();
    }
  }, [archiveConfig?.archiveDrive]);

  // Refs to store functions and state to avoid circular dependencies
  const loadFilesRef = useRef<((path: string, preserveThumbnails?: boolean) => Promise<void>) | null>(null);
  const filesRef = useRef<ArchiveFile[]>([]);

  // Load files when current case or folder changes
  useEffect(() => {
    if (currentCase && loadFilesRef.current) {
      if (currentFolderPath) {
        // Load files from the current folder
        loadFilesRef.current(currentFolderPath);
      } else {
        // Load files from the case root
        loadFilesRef.current(currentCase.path);
      }
    } else if (!currentCase) {
      setFiles([]);
      filesRef.current = [];
      setCurrentFolderPath(null);
      setFolderNavigationStack([]);
    }
  }, [currentCase, currentFolderPath]);

  const loadArchiveConfig = useCallback(async () => {
    try {
      if (!window.electronAPI) {
        return;
      }

      const config = await window.electronAPI.getArchiveConfig();
      setArchiveConfig(config);
    } catch (error) {
      logger.error('Failed to load archive config:', error);
    }
  }, []);

  const selectArchiveDrive = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return false;
      }

      const result = await window.electronAPI.selectArchiveDrive();
      if (result) {
        const config = await window.electronAPI.getArchiveConfig();
        setArchiveConfig(config);
        
        if (result.autoDetected) {
          toast.success('Vault archive detected and loaded');
        } else {
          toast.success('Vault drive selected');
        }
        return true;
      }
      return false;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'select vault drive' }));
      return false;
    }
  }, [toast]);

  const loadCases = useCallback(async () => {
    if (!archiveConfig?.archiveDrive || !window.electronAPI) {
      return;
    }

    try {
      setLoading(true);
      const casesList = await window.electronAPI.listArchiveCases();
      setCases(casesList);
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'load cases' }));
    } finally {
      setLoading(false);
    }
  }, [archiveConfig?.archiveDrive, toast]);

  const createCase = useCallback(async (caseName: string, description: string = '', categoryTagId?: string): Promise<boolean> => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return false;
      }

      await window.electronAPI.createCaseFolder(caseName, description, categoryTagId);
      toast.success(`Case "${caseName}" created`);
      await loadCases(); // Reload cases (will auto-alphabetize)
      return true;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'create case', fileName: caseName }));
      return false;
    }
  }, [toast, loadCases]);

  const updateCaseBackgroundImage = useCallback(async (casePath: string): Promise<boolean> => {
    let imagePath: string | null = null;
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return false;
      }

      // Open file picker to select image
      imagePath = await window.electronAPI.selectImageFile();
      if (!imagePath) {
        return false; // User cancelled
      }

      // Set the background image
      await window.electronAPI.setCaseBackgroundImage(casePath, imagePath);
      
      // Reload cases to update the UI
      await loadCases();
      
      toast.success('Background image updated');
      return true;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'update background image', path: imagePath || 'unknown' }));
      return false;
    }
  }, [toast, loadCases]);

  const updateFolderBackgroundImage = useCallback(async (folderPath: string): Promise<boolean> => {
    let imagePath: string | null = null;
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return false;
      }

      // Open file picker to select image
      imagePath = await window.electronAPI.selectImageFile();
      if (!imagePath) {
        return false; // User cancelled
      }

      // Set the background image
      await window.electronAPI.setFolderBackgroundImage(folderPath, imagePath);
      
      // Reload files to update the UI
      const parentPath = currentFolderPath || currentCase?.path;
      if (parentPath && loadFilesRef.current) {
        await loadFilesRef.current(parentPath, true);
      }
      
      toast.success('Background image updated');
      return true;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'update folder background image', path: imagePath || 'unknown' }));
      return false;
    }
  }, [toast, currentCase, currentFolderPath]);

  // Generate PDF thumbnail in renderer using optimized chunk loading
  // This works for files of any size by only loading the first page
  const generatePDFThumbnailInRenderer = useCallback(async (filePath: string): Promise<string> => {
    let pdf: any = null;
    let page: any = null;
    let canvas: HTMLCanvasElement | null = null;
    
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      // Import pdfjs-dist and setup worker
      const pdfjsLib = await import('pdfjs-dist');
      await setupPDFWorker();
      
      // Use optimized chunked source for all PDFs (handles both small and large files efficiently)
      // This uses ArrayBuffer transfer and parallel loading we just implemented
      const { createChunkedPDFSource, cleanupPDFBlobUrl } = await import('../utils/pdfSource');
      
      // Load PDF using optimized chunked source (no progress callback needed for thumbnails)
      pdf = await createChunkedPDFSource(filePath, pdfjsLib);
      
      // Only load the first page for thumbnail generation
      page = await pdf.getPage(1);
      
      // Get viewport at minimal scale to reduce memory usage
      const baseViewport = page.getViewport({ scale: 1.0 });
      
      // Calculate thumbnail size (200px max dimension)
      const THUMBNAIL_SIZE = 200;
      const aspectRatio = baseViewport.width / baseViewport.height;
      let width = THUMBNAIL_SIZE;
      let height = THUMBNAIL_SIZE;
      
      if (aspectRatio > 1) {
        height = THUMBNAIL_SIZE / aspectRatio;
      } else {
        width = THUMBNAIL_SIZE * aspectRatio;
      }
      
      // Create canvas with minimal size to reduce memory footprint
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Use 2D context with memory optimizations
      const context = canvas.getContext('2d', {
        willReadFrequently: false,
        alpha: false, // Disable alpha channel to save memory
      });
      
      if (!context) {
        throw new Error('Failed to get canvas context');
      }
      
      // Fill background
      context.fillStyle = '#1a1a2e';
      context.fillRect(0, 0, width, height);
      
      // Calculate scale for rendering (very small to minimize memory)
      const renderScale = width / baseViewport.width;
      const renderViewport = page.getViewport({ scale: renderScale });
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: renderViewport,
      }).promise;
      
      // Convert to JPEG with compression to reduce memory (JPEG is more efficient than PNG)
      // Use 0.85 quality for good balance between size and quality
      const thumbnail = canvas.toDataURL('image/jpeg', 0.85);
      
      // Immediate cleanup to free memory
      if (page) {
        try {
          page.cleanup();
        } catch (e) {
          // Ignore cleanup errors
        }
        page = null;
      }
      
      if (pdf) {
        try {
          cleanupPDFBlobUrl(pdf);
          await pdf.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
        pdf = null;
      }
      
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
        canvas = null;
      }
      
      // Close file handle if it was a streaming source
      try {
        await window.electronAPI.closePDFFileHandle(filePath);
      } catch (e) {
        // Ignore errors - handle might not be cached or already closed
      }
      
      // Force garbage collection hint if available
      if (typeof globalThis !== 'undefined' && (globalThis as any).gc) {
        (globalThis as any).gc();
      }
      
      return thumbnail;
    } catch (error) {
      // Cleanup on error
      if (page) {
        try {
          page.cleanup();
        } catch (e) {
          // Ignore cleanup errors
        }
        page = null;
      }
      
      if (pdf) {
        try {
          const { cleanupPDFBlobUrl } = await import('../utils/pdfSource');
          cleanupPDFBlobUrl(pdf);
          await pdf.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
        pdf = null;
      }
      
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
        canvas = null;
      }
      
      // Close file handle on error
      try {
        if (window.electronAPI) {
          await window.electronAPI.closePDFFileHandle(filePath);
        }
      } catch (e) {
        // Ignore errors
      }
      
      logger.error('Failed to generate PDF thumbnail:', error);
      
      // Return placeholder on error
      const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1a1a2e"/>
        <text x="50%" y="50%" font-size="64" text-anchor="middle" dominant-baseline="middle" fill="#8b5cf6">📄</text>
      </svg>`;
      // Properly encode SVG for base64 (handles Unicode characters like emojis)
      return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    }
  }, []);

  // Generate video thumbnail in renderer using HTML5 Video API
  const generateVideoThumbnailInRenderer = useCallback(async (filePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        if (!window.electronAPI) {
          throw new Error('Electron API not available');
        }

        // Create a video element
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';
        video.muted = true; // Muted videos can autoplay
        video.playsInline = true;

        // Use vault-video protocol for efficient file access
        const videoUrl = filePath.startsWith('http') 
          ? filePath 
          : `vault-video://${encodeURIComponent(filePath)}`;
        video.src = videoUrl;

        // Create canvas for capturing frame
        const canvas = document.createElement('canvas');
        const THUMBNAIL_SIZE = 200;
        canvas.width = THUMBNAIL_SIZE;
        canvas.height = THUMBNAIL_SIZE;
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('Failed to get canvas context');
        }

        // Set up error handlers
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onError);
          video.src = '';
          video.load();
        };

        const onError = (_error: Event) => {
          cleanup();
          reject(new Error('Failed to load video for thumbnail generation'));
        };

        const onLoadedMetadata = () => {
          try {
            // Check if video has valid duration
            if (!video.duration || isNaN(video.duration) || video.duration === 0) {
              // If no duration, try to seek to a small time (0.1s) or just capture first frame
              video.currentTime = 0.1;
              return;
            }
            
            // Seek to 10% of video duration or 1 second, whichever is smaller
            const seekTime = Math.min(video.duration * 0.1, 1.0);
            video.currentTime = seekTime;
          } catch (_error) {
            cleanup();
            reject(new Error('Failed to seek video'));
          }
        };

        const onSeeked = () => {
          try {
            // Check if video has valid dimensions
            if (!video.videoWidth || !video.videoHeight || video.videoWidth === 0 || video.videoHeight === 0) {
              cleanup();
              reject(new Error('Video has invalid dimensions'));
              return;
            }

            // Calculate thumbnail dimensions maintaining aspect ratio
            const videoAspectRatio = video.videoWidth / video.videoHeight;
            let width = THUMBNAIL_SIZE;
            let height = THUMBNAIL_SIZE;

            if (videoAspectRatio > 1) {
              // Landscape: width is larger
              height = THUMBNAIL_SIZE / videoAspectRatio;
            } else {
              // Portrait or square: height is larger or equal
              width = THUMBNAIL_SIZE * videoAspectRatio;
            }

            // Set canvas size
            canvas.width = width;
            canvas.height = height;

            // Fill background
            context.fillStyle = '#1a1a2e';
            context.fillRect(0, 0, width, height);

            // Draw video frame
            context.drawImage(video, 0, 0, width, height);

            // Convert to base64
            const thumbnail = canvas.toDataURL('image/png');
            cleanup();
            resolve(thumbnail);
          } catch (_error) {
            cleanup();
            reject(new Error('Failed to capture video frame'));
          }
        };

        // Set up event listeners
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('error', onError);

        // Timeout after 10 seconds
        setTimeout(() => {
          cleanup();
          reject(new Error('Video thumbnail generation timeout'));
        }, 10000);

        // Start loading
        video.load();
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Unknown error generating video thumbnail'));
      }
    });
  }, []);

  const loadFileThumbnail = useCallback(async (filePath: string, fileType: 'image' | 'pdf' | 'video' | 'other') => {
    // Check global cache first - if thumbnail exists, use it immediately
    if (globalThumbnailCache.has(filePath)) {
      const cachedThumbnail = globalThumbnailCache.get(filePath)!;
      setFiles(prev => {
        const updated = prev.map(f => 
          f.path === filePath ? { ...f, thumbnail: cachedThumbnail } : f
        );
        filesRef.current = updated;
        return updated;
      });
      return;
    }
    
    // If already loading or API unavailable, skip
    if (loadingThumbnails.has(filePath) || !window.electronAPI) {
      return;
    }

    try {
      setLoadingThumbnails(prev => new Set(prev).add(filePath));
      
      let thumbnail: string;
      
      // For PDFs, check disk cache first (industry standard: disk cache before generation)
      if (fileType === 'pdf') {
        // Try to load from disk cache first
        const cachedThumbnail = await window.electronAPI.readPDFThumbnail(filePath);
        
        if (cachedThumbnail) {
          // Thumbnail exists on disk and is valid
          thumbnail = cachedThumbnail;
        } else {
          // Generate thumbnail using optimized chunk loading (prevents OOM)
          thumbnail = await generatePDFThumbnailInRenderer(filePath);
          
          // Save to disk cache for future use (industry standard: persist after generation)
          try {
            await window.electronAPI.savePDFThumbnail(filePath, thumbnail);
          } catch (saveError) {
            // Log but don't fail - thumbnail is still usable from memory cache
            logger.warn(`Failed to save PDF thumbnail to disk for ${filePath}:`, saveError);
          }
        }
      } else if (fileType === 'video') {
        // For videos, generate thumbnail in renderer using HTML5 Video API
        try {
          thumbnail = await generateVideoThumbnailInRenderer(filePath);
        } catch (error) {
          logger.error(`Failed to generate video thumbnail for ${filePath}:`, error);
          // Fallback to placeholder on error
          const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#1a1a2e"/>
            <text x="50%" y="50%" font-size="64" text-anchor="middle" dominant-baseline="middle" fill="#8b5cf6">🎬</text>
          </svg>`;
          thumbnail = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
        }
      } else {
        // Use Electron API for other file types (images, etc.)
        thumbnail = await window.electronAPI.getFileThumbnail(filePath);
      }
      
      // Store in global cache for future use (in-memory cache for fast access)
      globalThumbnailCache.set(filePath, thumbnail);
      
      setFiles(prev => {
        const updated = prev.map(f => 
          f.path === filePath ? { ...f, thumbnail } : f
        );
        filesRef.current = updated; // Keep ref in sync
        return updated;
      });
    } catch (error) {
      logger.error(`Failed to load thumbnail for ${filePath}:`, error);
    } finally {
      setLoadingThumbnails(prev => {
        const next = new Set(prev);
        next.delete(filePath);
        return next;
      });
    }
  }, [loadingThumbnails, generatePDFThumbnailInRenderer, generateVideoThumbnailInRenderer]);

  const loadFiles = useCallback(async (path: string, preserveThumbnails: boolean = false) => {
    try {
      if (!window.electronAPI) {
        return;
      }

      setLoading(true);
      const itemsList = await window.electronAPI.listCaseFiles(path);
      
      // Always check global cache first for thumbnails
      const thumbnailCache = new Map<string, string>();
      // Use global cache for all files
      itemsList.forEach((item: Awaited<ReturnType<typeof window.electronAPI.listCaseFiles>>[number]) => {
        if (!item.isFolder && globalThumbnailCache.has(item.path)) {
          thumbnailCache.set(item.path, globalThumbnailCache.get(item.path)!);
        }
      });
      
      // If preserving thumbnails, also check current files state
      if (preserveThumbnails) {
        filesRef.current.forEach(file => {
          if (file.thumbnail && !thumbnailCache.has(file.path)) {
            thumbnailCache.set(file.path, file.thumbnail);
            // Also update global cache
            globalThumbnailCache.set(file.path, file.thumbnail);
          }
        });
      }
      
      // Process items (files and folders)
      // Filter out hidden metadata files as a safety measure (backend should already filter, but double-check)
      const filteredItems = itemsList.filter((item: Awaited<ReturnType<typeof window.electronAPI.listCaseFiles>>[number]) => {
        const itemName = item.name.toLowerCase();
        
        // Exclude .thumbnails folder
        if (item.isFolder && itemName === '.thumbnails') {
          return false;
        }
        
        // Exclude .parent-pdf metadata files
        if (!item.isFolder) {
          const fileName = itemName;
          if (fileName === '.parent-pdf' || fileName.startsWith('.parent-pdf')) {
            return false;
          }
          // Exclude .case-background metadata file
          if (fileName === '.case-background') {
            return false;
          }
          // Exclude .case-description metadata file
          if (fileName === '.case-description') {
            return false;
          }
          // Exclude .vault-archive.json marker file
          if (fileName === '.vault-archive.json') {
            return false;
          }
          // Exclude .case-background-image.* files
          if (fileName.startsWith('.case-background-image.')) {
            return false;
          }
        }
        return true;
      });
      
      const itemsWithTypes: ArchiveFile[] = filteredItems.map((item: Awaited<ReturnType<typeof window.electronAPI.listCaseFiles>>[number]) => {
        // If it's a folder, return it as-is with folder properties
        if (item.isFolder) {
          return {
            ...item,
            type: 'other' as const,
            isFolder: true,
            folderType: item.folderType || 'extraction',
            parentPdfName: item.parentPdfName,
          };
        }

        // For files, determine type
        const ext = item.name.toLowerCase().split('.').pop() || '';
        let type: 'image' | 'pdf' | 'video' | 'other' = 'other';
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
          type = 'image';
        } else if (ext === 'pdf') {
          type = 'pdf';
        } else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) {
          type = 'video';
        }

        // Preserve thumbnail if available in cache
        const cachedThumbnail = thumbnailCache.get(item.path);
        
        return {
          ...item,
          type,
          isFolder: false,
          thumbnail: cachedThumbnail,
        };
      });

      setFiles(itemsWithTypes);
      filesRef.current = itemsWithTypes; // Update ref for thumbnail preservation

      // Load thumbnails only for files that don't already have them (check both item.thumbnail and global cache)
      for (const item of itemsWithTypes) {
        if (!item.isFolder && !item.thumbnail && !globalThumbnailCache.has(item.path)) {
          loadFileThumbnail(item.path, item.type);
        } else if (!item.isFolder && !item.thumbnail && globalThumbnailCache.has(item.path)) {
          // Thumbnail exists in cache but wasn't applied - apply it now
          const cachedThumbnail = globalThumbnailCache.get(item.path)!;
          setFiles(prev => {
            const updated = prev.map(f => 
              f.path === item.path ? { ...f, thumbnail: cachedThumbnail } : f
            );
            filesRef.current = updated;
            return updated;
          });
        }
      }
    } catch (error) {
      logger.error('Error loading files:', error);
      toast.error(getUserFriendlyError(error, { operation: 'load files', path: path }));
    } finally {
      setLoading(false);
    }
  }, [toast, loadFileThumbnail]);

  // Update ref when loadFiles changes
  useEffect(() => {
    loadFilesRef.current = loadFiles;
  }, [loadFiles]);

  const addFilesToCase = useCallback(async (casePath: string, filePaths?: string[]): Promise<boolean> => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return false;
      }

      const addedFiles = await window.electronAPI.addFilesToCase(casePath, filePaths);
      if (addedFiles.length > 0) {
        toast.success(`Added ${addedFiles.length} file${addedFiles.length !== 1 ? 's' : ''}`);
        
        // Reload files if this is the current case, preserving existing thumbnails
        if (currentCase && currentCase.path === casePath) {
          await loadFiles(casePath, true);
        }
        return true;
      }
      return false;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'add files' }));
      return false;
    }
  }, [toast, currentCase, loadFiles]);

  const createFolder = useCallback(async (folderName: string): Promise<boolean> => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return false;
      }

      // Determine the path where folder should be created
      const parentPath = currentFolderPath || currentCase?.path;
      if (!parentPath) {
        toast.error('No case or folder selected');
        return false;
      }

      const folderPath = await window.electronAPI.createFolder(parentPath, folderName);
      if (folderPath) {
        toast.success('Folder created');
        
        // Reload files to show the new folder, preserving existing thumbnails
        await loadFiles(parentPath, true);
        return true;
      }
      return false;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'create folder' }));
      return false;
    }
  }, [toast, currentCase, currentFolderPath, loadFiles]);

  const moveFileToFolder = useCallback(async (filePath: string, folderPath: string): Promise<boolean> => {
    // #region agent log
    if (window.electronAPI?.debugLog) window.electronAPI.debugLog({location:'useArchive.ts:713',message:'moveFileToFolder: Entry',data:{filePath,folderPath,hasElectronAPI:!!window.electronAPI,currentFolderPath,currentCasePath:currentCase?.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'}).catch(()=>{});
    // #endregion
    try {
      if (!window.electronAPI) {
        // #region agent log
        // Note: Can't use debugLog here since electronAPI is not available
        // #endregion
        toast.error('Electron API not available');
        return false;
      }

      // #region agent log
      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({location:'useArchive.ts:720',message:'moveFileToFolder: Calling electronAPI.moveFileToFolder',data:{filePath,folderPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'}).catch(()=>{});
      // #endregion
      const result = await window.electronAPI.moveFileToFolder(filePath, folderPath);
      // #region agent log
      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({location:'useArchive.ts:721',message:'moveFileToFolder: Electron API result received',data:{filePath,folderPath,success:result.success,error:result.error,newPath:result.newPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'}).catch(()=>{});
      // #endregion
      if (result.success) {
        toast.success('File moved to folder');
        
        // Reload files to reflect the move, preserving existing thumbnails
        const parentPath = currentFolderPath || currentCase?.path;
        // #region agent log
        if (window.electronAPI?.debugLog) window.electronAPI.debugLog({location:'useArchive.ts:725',message:'moveFileToFolder: Reloading files',data:{filePath,folderPath,parentPath,hasParentPath:!!parentPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'}).catch(()=>{});
        // #endregion
        if (parentPath) {
          await loadFiles(parentPath, true);
          // #region agent log
          if (window.electronAPI?.debugLog) window.electronAPI.debugLog({location:'useArchive.ts:727',message:'moveFileToFolder: Files reloaded',data:{filePath,folderPath,parentPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'}).catch(()=>{});
          // #endregion
        }
        return true;
      } else {
        // #region agent log
        if (window.electronAPI?.debugLog) window.electronAPI.debugLog({location:'useArchive.ts:730',message:'moveFileToFolder: Move failed',data:{filePath,folderPath,error:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'}).catch(()=>{});
        // #endregion
        toast.error(result.error || 'Failed to move file');
        return false;
      }
    } catch (error) {
      // #region agent log
      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({location:'useArchive.ts:733',message:'moveFileToFolder: Exception caught',data:{filePath,folderPath,error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'}).catch(()=>{});
      // #endregion
      toast.error(getUserFriendlyError(error, { operation: 'move file' }));
      return false;
    }
  }, [toast, currentCase, currentFolderPath, loadFiles]);

  const deleteCase = useCallback(async (casePath: string): Promise<boolean> => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return false;
      }

      await window.electronAPI.deleteCase(casePath);
      toast.success('Case deleted');
      
      // Clear current case if it was deleted
      if (currentCase && currentCase.path === casePath) {
        setCurrentCase(null);
      }
      
      await loadCases();
      return true;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'delete case', path: casePath }));
      return false;
    }
  }, [toast, currentCase, loadCases]);

  const deleteFile = useCallback(async (filePath: string, isFolder: boolean = false): Promise<boolean> => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return false;
      }

      // Clear thumbnail cache for this file to release any references
      if (globalThumbnailCache.has(filePath)) {
        globalThumbnailCache.delete(filePath);
      }
      
      // Also clear from loading thumbnails set
      setLoadingThumbnails(prev => {
        const next = new Set(prev);
        next.delete(filePath);
        return next;
      });

      // Delete thumbnail from disk if it's a PDF (industry standard: cleanup on delete)
      if (!isFolder && filePath.toLowerCase().endsWith('.pdf')) {
        try {
          await window.electronAPI.deletePDFThumbnail(filePath);
        } catch (error) {
          // Log but don't fail - thumbnail deletion is best-effort cleanup
          logger.warn(`Failed to delete thumbnail for ${filePath}:`, error);
        }
      }

      await window.electronAPI.deleteFile(filePath, isFolder);
      toast.success(isFolder ? 'Folder deleted' : 'File deleted');
      
      // If we deleted the current folder we're viewing, navigate back
      if (isFolder && currentFolderPath === filePath) {
        if (folderNavigationStack.length > 0) {
          const parentPath = folderNavigationStack[folderNavigationStack.length - 1];
          setFolderNavigationStack(prev => prev.slice(0, -1));
          setCurrentFolderPath(parentPath);
          // Load files from parent folder (necessary since we're changing directories)
          await loadFiles(parentPath);
        } else {
          // Go back to case root
          setCurrentFolderPath(null);
          setFolderNavigationStack([]);
          if (currentCase) {
            await loadFiles(currentCase.path);
          }
        }
      } else {
        // Optimize: Just remove the deleted item from state instead of reloading everything
        // This preserves thumbnails and avoids unnecessary disk I/O
        setFiles(prev => {
          const updated = prev.filter(file => file.path !== filePath);
          filesRef.current = updated; // Keep ref in sync
          return updated;
        });
        
        // Remove from thumbnail cache and loading set
        globalThumbnailCache.delete(filePath);
        setLoadingThumbnails(prev => {
          const next = new Set(prev);
          next.delete(filePath);
          return next;
        });
      }
      return true;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: `delete ${isFolder ? 'folder' : 'file'}`, path: filePath }));
      return false;
    }
  }, [toast, currentCase, currentFolderPath, folderNavigationStack]);

  const renameFile = useCallback(async (filePath: string, newName: string): Promise<boolean> => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return false;
      }

      // Store original values for potential rollback
      const oldPath = filePath;
      const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
      const dir = lastSlash >= 0 ? filePath.substring(0, lastSlash + 1) : '';
      const optimisticNewPath = dir + newName;
      
      // Optimistically update the UI immediately for better perceived performance
      let updatedFile: ArchiveFile | null = null;
      setFiles(prev => {
        const updated = prev.map(file => {
          if (file.path === filePath) {
            updatedFile = {
              ...file,
              name: newName,
              path: optimisticNewPath,
            };
            return updatedFile;
          }
          return file;
        });
        filesRef.current = updated;
        return updated;
      });

      // Update thumbnail cache key optimistically
      if (globalThumbnailCache.has(filePath)) {
        const thumbnail = globalThumbnailCache.get(filePath);
        globalThumbnailCache.delete(filePath);
        if (thumbnail) {
          globalThumbnailCache.set(optimisticNewPath, thumbnail);
        }
      }

      // Delete old thumbnail from disk if it's a PDF (industry standard: cleanup on rename)
      if (filePath.toLowerCase().endsWith('.pdf')) {
        try {
          await window.electronAPI.deletePDFThumbnail(filePath);
        } catch (error) {
          // Log but don't fail - thumbnail deletion is best-effort cleanup
          logger.warn(`Failed to delete old thumbnail for ${filePath}:`, error);
        }
      }

      // Update folder path optimistically if needed
      if (currentFolderPath === filePath) {
        setCurrentFolderPath(optimisticNewPath);
        setFolderNavigationStack(prev => 
          prev.map(p => p === filePath ? optimisticNewPath : p)
        );
      }

      // Perform the actual rename operation
      const result = await window.electronAPI.renameFile(filePath, newName);
      if (result.success) {
        // Update with actual path returned from the system (in case of any normalization)
        if (result.newPath !== optimisticNewPath) {
          setFiles(prev => {
            const updated = prev.map(file => {
              if (file.path === optimisticNewPath) {
                return {
                  ...file,
                  path: result.newPath,
                };
              }
              return file;
            });
            filesRef.current = updated;
            return updated;
          });

          // Update thumbnail cache with actual path
          if (globalThumbnailCache.has(optimisticNewPath)) {
            const thumbnail = globalThumbnailCache.get(optimisticNewPath);
            globalThumbnailCache.delete(optimisticNewPath);
            if (thumbnail) {
              globalThumbnailCache.set(result.newPath, thumbnail);
            }
          }

          // Update folder path if it changed
          if (currentFolderPath === optimisticNewPath) {
            setCurrentFolderPath(result.newPath);
            setFolderNavigationStack(prev => 
              prev.map(p => p === optimisticNewPath ? result.newPath : p)
            );
          }
        }
        
        toast.success('File renamed successfully');
        return true;
      }
      
      // If rename failed, revert optimistic update
      setFiles(prev => {
        const updated = prev.map(file => {
          if (file.path === optimisticNewPath) {
            return {
              ...file,
              name: oldPath.substring(lastSlash + 1),
              path: oldPath,
            };
          }
          return file;
        });
        filesRef.current = updated;
        return updated;
      });
      
      // Revert thumbnail cache
      if (globalThumbnailCache.has(optimisticNewPath)) {
        const thumbnail = globalThumbnailCache.get(optimisticNewPath);
        globalThumbnailCache.delete(optimisticNewPath);
        if (thumbnail) {
          globalThumbnailCache.set(oldPath, thumbnail);
        }
      }
      
      // Revert folder path if needed
      if (currentFolderPath === optimisticNewPath) {
        setCurrentFolderPath(oldPath);
        setFolderNavigationStack(prev => 
          prev.map(p => p === optimisticNewPath ? oldPath : p)
        );
      }
      
      return false;
    } catch (error) {
      // Revert optimistic update on error
      const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
      const dir = lastSlash >= 0 ? filePath.substring(0, lastSlash + 1) : '';
      const optimisticNewPath = dir + newName;
      
      setFiles(prev => {
        const updated = prev.map(file => {
          if (file.path === optimisticNewPath) {
            return {
              ...file,
              name: filePath.substring(lastSlash + 1),
              path: filePath,
            };
          }
          return file;
        });
        filesRef.current = updated;
        return updated;
      });
      
      // Revert thumbnail cache
      if (globalThumbnailCache.has(optimisticNewPath)) {
        const thumbnail = globalThumbnailCache.get(optimisticNewPath);
        globalThumbnailCache.delete(optimisticNewPath);
        if (thumbnail) {
          globalThumbnailCache.set(filePath, thumbnail);
        }
      }
      
      // Revert folder path if needed
      if (currentFolderPath === optimisticNewPath) {
        setCurrentFolderPath(filePath);
        setFolderNavigationStack(prev => 
          prev.map(p => p === optimisticNewPath ? filePath : p)
        );
      }
      
      toast.error(getUserFriendlyError(error, { operation: 'rename file', fileName: filePath }));
      return false;
    }
  }, [toast, currentFolderPath]);

  // Filter cases based on search query and selected tag
  const filteredCases = useMemo(() => {
    let filtered = cases;

    // Filter by tag if selected
    if (selectedTagId) {
      filtered = filtered.filter(caseItem => caseItem.categoryTagId === selectedTagId);
    }

    // Filter by search query (includes tag name matching)
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      filtered = filtered.filter(caseItem => {
        // Match case name
        if (caseItem.name.toLowerCase().includes(queryLower)) {
          return true;
        }
        // Match tag name if case has a tag
        if (caseItem.categoryTagId) {
          const tag = getTagById(caseItem.categoryTagId);
          if (tag && tag.name.toLowerCase().includes(queryLower)) {
            return true;
          }
        }
        return false;
      });
    }

    return filtered;
  }, [cases, searchQuery, selectedTagId, getTagById]);

  // Filter files while preserving folder-PDF relationships
  // If a PDF matches, include its associated folders (and vice versa)
  // Also filters by selectedTagId when set
  const filteredFiles = useMemo(() => {
    // If no search query and no tag filter, return all files in backend order
    if (!searchQuery.trim() && !selectedTagId) {
      return files;
    }

    const queryLower = searchQuery.trim().toLowerCase();
    const hasSearchQuery = queryLower.length > 0;
    const matchingPaths = new Set<string>();
    const pdfToFolders = new Map<string, string[]>(); // PDF path -> folder paths
    const folderToPdf = new Map<string, string>(); // Folder path -> PDF path

    // Build relationships between folders and PDFs
    files.forEach(file => {
      if (file.isFolder && file.parentPdfName) {
        // Find the PDF this folder is associated with
        const associatedPdf = files.find(f => 
          !f.isFolder && 
          f.type === 'pdf' && 
          f.name === file.parentPdfName
        );
        if (associatedPdf) {
          if (!pdfToFolders.has(associatedPdf.path)) {
            pdfToFolders.set(associatedPdf.path, []);
          }
          pdfToFolders.get(associatedPdf.path)!.push(file.path);
          folderToPdf.set(file.path, associatedPdf.path);
        }
      }
    });

    // Find all matching items based on search query and/or tag filter
    files.forEach(file => {
      let matchesSearch = !hasSearchQuery; // If no search query, consider it matching
      let matchesTag = !selectedTagId; // If no tag filter, consider it matching

      // Check search query match
      if (hasSearchQuery) {
        matchesSearch = file.name.toLowerCase().includes(queryLower);
      }

      // Check tag filter match (only files can have tags, not folders)
      if (selectedTagId) {
        if (file.isFolder) {
          // Folders don't have tags, but check if their associated PDF matches the tag
          const pdfPath = folderToPdf.get(file.path);
          if (pdfPath) {
            const associatedPdf = files.find(f => f.path === pdfPath);
            matchesTag = associatedPdf?.categoryTagId === selectedTagId;
          } else {
            // Folder without associated PDF can't match tag filter
            matchesTag = false;
          }
        } else {
          // Files can have tags
          matchesTag = file.categoryTagId === selectedTagId;
        }
      }

      // Item matches if it passes both filters
      if (matchesSearch && matchesTag) {
        matchingPaths.add(file.path);
        
        // If it's a PDF, also include its folders (folders inherit PDF's tag match)
        if (!file.isFolder && file.type === 'pdf') {
          const folders = pdfToFolders.get(file.path) || [];
          folders.forEach(folderPath => matchingPaths.add(folderPath));
        }
        
        // If it's a folder that matches search, also include its associated PDF if PDF matches tag
        // (This handles the case where folder matches search but we need to check if PDF matches tag)
        if (file.isFolder && hasSearchQuery && selectedTagId) {
          const pdfPath = folderToPdf.get(file.path);
          if (pdfPath) {
            const associatedPdf = files.find(f => f.path === pdfPath);
            if (associatedPdf?.categoryTagId === selectedTagId) {
              matchingPaths.add(pdfPath);
            }
          }
        }
      }
    });

    // Return files in original order, but only those that match (or are related to matches)
    return files.filter(file => matchingPaths.has(file.path));
  }, [files, searchQuery, selectedTagId]);

  const openFolder = useCallback((folderPath: string) => {
    if (!currentCase) return;
    
    // Add current folder to navigation stack if we're already in a folder
    if (currentFolderPath) {
      setFolderNavigationStack(prev => [...prev, currentFolderPath]);
    }
    setCurrentFolderPath(folderPath);
  }, [currentCase, currentFolderPath]);

  const goBackToCase = useCallback(() => {
    setCurrentFolderPath(null);
    setFolderNavigationStack([]);
  }, []);

  const goBackToParentFolder = useCallback(() => {
    if (folderNavigationStack.length > 0) {
      const parentPath = folderNavigationStack[folderNavigationStack.length - 1];
      setFolderNavigationStack(prev => prev.slice(0, -1));
      setCurrentFolderPath(parentPath);
    } else {
      // If no parent in stack, go back to case root
      setCurrentFolderPath(null);
    }
  }, [folderNavigationStack]);

  const navigateToFolder = useCallback((targetPath: string) => {
    // If navigating to case root
    if (!targetPath || (currentCase && targetPath === currentCase.path)) {
      setCurrentFolderPath(null);
      setFolderNavigationStack([]);
      return;
    }
    
    // Find the index of the target path in the navigation stack
    const targetIndex = folderNavigationStack.findIndex(path => path === targetPath);
    if (targetIndex >= 0) {
      // Navigate to this folder and truncate the stack
      setFolderNavigationStack(prev => prev.slice(0, targetIndex));
      setCurrentFolderPath(targetPath);
    } else if (currentFolderPath === targetPath) {
      // Already at this folder, do nothing
      return;
    } else {
      // Path not in stack, might be a direct navigation - just set it
      // This shouldn't normally happen, but handle it gracefully
      setCurrentFolderPath(targetPath);
    }
  }, [folderNavigationStack, currentCase, currentFolderPath]);

  const getCurrentPath = useCallback(() => {
    return currentFolderPath || currentCase?.path || null;
  }, [currentFolderPath, currentCase]);

  return {
    archiveConfig,
    cases: filteredCases,
    currentCase,
    currentFolderPath,
    folderNavigationStack,
    files: filteredFiles,
    searchQuery,
    loading,
    loadingThumbnails,
    setCurrentCase,
    setSearchQuery,
    selectArchiveDrive,
    createCase,
    createFolder,
    addFilesToCase,
    deleteCase,
    deleteFile,
    renameFile,
    moveFileToFolder,
    openFolder,
    goBackToCase,
    goBackToParentFolder,
    navigateToFolder,
    getCurrentPath,
    updateCaseBackgroundImage,
    updateFolderBackgroundImage,
    refreshCases: loadCases,
    refreshFiles: () => {
      const path = currentFolderPath || currentCase?.path;
      return path ? loadFiles(path, true) : Promise.resolve(); // Preserve thumbnails on refresh
    },
    selectedTagId,
    setSelectedTagId,
    tags,
    getTagById,
  };
}

