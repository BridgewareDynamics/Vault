import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArchiveCase, ArchiveFile, ArchiveConfig } from '../types';
import { useToast } from '../components/Toast/ToastContext';
import { logger } from '../utils/logger';
import { getUserFriendlyError } from '../utils/errorMessages';
import { useCategoryTags } from './useCategoryTags';
import { isMemoryHigh, requestGarbageCollection, formatBytes, getMemoryInfo } from '../utils/memoryMonitor';
import {
  getThumbnailMemoryCache,
  hasThumbnailInCache,
  getThumbnailFromCache,
  requestThumbnail,
} from '../utils/thumbnailService';
import {
  generatePdfThumbnailInRenderer,
  isPdfPlaceholderThumbnail,
} from '../utils/generatePdfThumbnail';
import {
  getCachedArchiveCases,
  getCachedArchiveConfig,
  invalidateArchiveCasesCache,
  prefetchArchiveCases,
  prefetchArchiveConfig,
} from '../utils/archivePrefetch';
import { getMemoryManager } from '../utils/memoryManager';

// Shared in-memory thumbnail cache (see thumbnailService)
const thumbnailMemoryCache = getThumbnailMemoryCache();

const SEARCH_DEBOUNCE_MS = 200;

function applyMemoryThumbnails(files: ArchiveFile[]): ArchiveFile[] {
  return files.map((file) => {
    if (file.isFolder) {
      return file;
    }
    const cached = getThumbnailFromCache(file.path);
    if (cached) {
      return { ...file, thumbnail: cached };
    }
    return file;
  });
}

function listingsMatch(a: ArchiveFile[], b: ArchiveFile[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every(
    (file, index) =>
      file.path === b[index].path &&
      file.modified === b[index].modified &&
      file.isFolder === b[index].isFolder,
  );
}

function thumbnailsChanged(a: ArchiveFile[], b: ArchiveFile[]): boolean {
  return a.some((file, index) => file.thumbnail !== b[index]?.thumbnail);
}

function invalidateFolderListings(
  cache: Map<string, ArchiveFile[]>,
  ...paths: string[]
): void {
  for (const folderPath of paths) {
    cache.delete(folderPath);
  }
}

export function useArchive() {
  const [archiveConfig, setArchiveConfig] = useState<ArchiveConfig | null>(() => getCachedArchiveConfig());
  const [cases, setCases] = useState<ArchiveCase[]>(() => getCachedArchiveCases() ?? []);
  const [currentCase, setCurrentCase] = useState<ArchiveCase | null>(null);
  const [currentFolderPath, setCurrentFolderPath] = useState<string | null>(null);
  const [folderNavigationStack, setFolderNavigationStack] = useState<string[]>([]);
  const [files, setFiles] = useState<ArchiveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isRefreshingFolder, setIsRefreshingFolder] = useState(false);
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(new Set());
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const toast = useToast();
  const { tags, getTagById } = useCategoryTags();

  // Debounce search for filter recomputation; clear immediately when query is empty
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDebouncedSearchQuery('');
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

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
  const loadFilesGenerationRef = useRef(0);
  const lastLoadedPathRef = useRef<string | null>(null);
  const folderListingCacheRef = useRef(new Map<string, ArchiveFile[]>());
  const loadingThumbnailsRef = useRef(new Set<string>());
  const pendingThumbnailUpdatesRef = useRef(new Map<string, string>());
  const thumbnailFlushRafRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const videoThumbnailAbortControllersRef = useRef(new Map<string, AbortController>());
  const pdfThumbnailAbortControllersRef = useRef(new Map<string, AbortController>());

  const abortInFlightThumbnails = useCallback(() => {
    pdfThumbnailAbortControllersRef.current.forEach((controller) => controller.abort());
    pdfThumbnailAbortControllersRef.current.clear();
    videoThumbnailAbortControllersRef.current.forEach((controller) => controller.abort());
    videoThumbnailAbortControllersRef.current.clear();
    loadingThumbnailsRef.current.clear();
  }, []);

  useEffect(() => {
    const memoryManager = getMemoryManager();
    return memoryManager.registerCleanupCallback(abortInFlightThumbnails);
  }, [abortInFlightThumbnails]);

  const flushThumbnailUpdates = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }
    thumbnailFlushRafRef.current = null;
    const updates = pendingThumbnailUpdatesRef.current;
    if (updates.size === 0) {
      return;
    }

    const snapshot = new Map(updates);
    updates.clear();

    setFiles((prev) => {
      const updated = prev.map((file) => {
        const thumbnail = snapshot.get(file.path);
        return thumbnail ? { ...file, thumbnail } : file;
      });
      filesRef.current = updated;
      return updated;
    });
  }, []);

  const scheduleThumbnailUpdate = useCallback(
    (filePath: string, thumbnail: string) => {
      if (!isMountedRef.current) {
        return;
      }
      pendingThumbnailUpdatesRef.current.set(filePath, thumbnail);
      if (import.meta.env.VITEST) {
        flushThumbnailUpdates();
        return;
      }
      if (thumbnailFlushRafRef.current === null) {
        thumbnailFlushRafRef.current = window.requestAnimationFrame(flushThumbnailUpdates);
      }
    },
    [flushThumbnailUpdates],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (thumbnailFlushRafRef.current !== null) {
        window.cancelAnimationFrame(thumbnailFlushRafRef.current);
        thumbnailFlushRafRef.current = null;
      }
      pendingThumbnailUpdatesRef.current.clear();
      abortInFlightThumbnails();
    };
  }, [abortInFlightThumbnails]);

  // Load files when current case or folder changes
  useEffect(() => {
    if (currentCase && loadFilesRef.current) {
      const path = currentFolderPath ?? currentCase.path;
      // Preserve in-memory thumbnails when drilling into/out of subfolders
      const preserveThumbnails = currentFolderPath !== null || filesRef.current.length > 0;
      loadFilesRef.current(path, preserveThumbnails);
    } else if (!currentCase) {
      // Cleanup when navigating away from archive
      setFiles([]);
      filesRef.current = [];
      setCurrentFolderPath(null);
      setFolderNavigationStack([]);
      lastLoadedPathRef.current = null;
      folderListingCacheRef.current.clear();
      loadingThumbnailsRef.current.clear();
      // Clear thumbnails for files that are no longer visible to free memory
      // Keep cache but let LRU handle eviction naturally
    }
  }, [currentCase, currentFolderPath]);

  // Clear per-case folder listing cache when switching cases
  useEffect(() => {
    folderListingCacheRef.current.clear();
    lastLoadedPathRef.current = null;
  }, [currentCase?.path]);

  // Cleanup thumbnails when leaving a case (not on every folder navigation)
  useEffect(() => {
    if (!currentCase) {
      return;
    }

    return () => {
      // Skip cleanup while folder navigation has temporarily cleared the file list
      if (filesRef.current.length === 0) {
        return;
      }

      const currentFilePaths = new Set(filesRef.current.map(f => f.path));
      const deleted = thumbnailMemoryCache.deleteIf((key) => !currentFilePaths.has(key));
      if (deleted > 0) {
        logger.debug(`Cleaned up ${deleted} thumbnail(s) from cache`);
      }
    };
  }, [currentCase?.path]);

  // Automatic memory cleanup when memory usage is high
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // Check memory usage every 30 seconds
      if (isMemoryHigh(85)) {
        const memoryInfo = getMemoryInfo();
        logger.warn(`High memory usage detected: ${memoryInfo ? formatBytes(memoryInfo.usedJSHeapSize) : 'unknown'}. Triggering cleanup...`);

        // Never purge the entire cache during in-flight folder navigation
        if (filesRef.current.length === 0) {
          requestGarbageCollection();
          return;
        }
        
        // Clean up thumbnails for files not in current view
        const currentFilePaths = new Set(filesRef.current.map(f => f.path));
        const deleted = thumbnailMemoryCache.deleteIf((key) => !currentFilePaths.has(key));
        
        if (deleted > 0) {
          logger.info(`Auto-cleanup: Removed ${deleted} thumbnail(s) from cache`);
        }
        
        // Reduce cache size by 25% if still high
        if (thumbnailMemoryCache.size() > 150) {
          const targetSize = Math.floor(thumbnailMemoryCache.size() * 0.75);
          const keys = thumbnailMemoryCache.keys();
          const keysToDelete = keys.slice(0, thumbnailMemoryCache.size() - targetSize);
          keysToDelete.forEach(key => {
            if (!currentFilePaths.has(key)) {
              thumbnailMemoryCache.delete(key);
            }
          });
          logger.info(`Auto-cleanup: Reduced cache size to ${thumbnailMemoryCache.size()}`);
        }
        
        // Request garbage collection if available
        requestGarbageCollection();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  const loadArchiveConfig = useCallback(async () => {
    try {
      if (!window.electronAPI) {
        return;
      }

      const cachedConfig = getCachedArchiveConfig();
      if (cachedConfig) {
        setArchiveConfig(cachedConfig);
      }

      const config = await prefetchArchiveConfig({ force: !cachedConfig });
      if (config) {
        setArchiveConfig(config);
      }
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

  const loadCases = useCallback(async (options?: { force?: boolean }): Promise<ArchiveCase[]> => {
    if (!archiveConfig?.archiveDrive || !window.electronAPI) {
      return [];
    }

    if (options?.force) {
      invalidateArchiveCasesCache();
    }

    const cachedCases = options?.force ? null : getCachedArchiveCases();

    try {
      if (!cachedCases?.length) {
        setLoading(true);
      } else {
        setCases(cachedCases);
      }

      const casesList =
        (await prefetchArchiveCases({ force: options?.force || !cachedCases?.length })) ??
        cachedCases ??
        [];
      setCases(casesList);
      return casesList;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'load cases' }));
      return cachedCases ?? [];
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
      await loadCases({ force: true }); // Reload cases (will auto-alphabetize)
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
      await loadCases({ force: true });
      
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

  const updateCaseDescription = useCallback(async (casePath: string, description: string): Promise<boolean> => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return false;
      }

      await window.electronAPI.updateCaseDescription(casePath, description);
      
      // Reload cases to update the UI and get fresh data
      const updatedCases = await loadCases({ force: true });
      
      // If this is the current case, find the updated case from the newly loaded cases
      // This ensures we have fresh data from the backend, not stale data from closure
      if (currentCase?.path === casePath) {
        const updatedCase = updatedCases.find(c => c.path === casePath);
        if (updatedCase) {
          setCurrentCase(updatedCase);
        }
      }
      
      toast.success('Description updated');
      return true;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'update description', path: casePath }));
      return false;
    }
  }, [toast, loadCases, currentCase]);

  // Generate video thumbnail in renderer using HTML5 Video API
  const generateVideoThumbnailInRenderer = useCallback(async (filePath: string, signal?: AbortSignal): Promise<string> => {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let cleanupResources: () => void = () => {};

      const settle = (action: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanupResources();
        action();
      };

      try {
        if (!window.electronAPI) {
          throw new Error('Electron API not available');
        }

        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        const videoUrl = filePath.startsWith('http')
          ? filePath
          : `vault-video://${encodeURIComponent(filePath)}`;
        video.src = videoUrl;

        const canvas = document.createElement('canvas');
        const THUMBNAIL_SIZE = 200;
        canvas.width = THUMBNAIL_SIZE;
        canvas.height = THUMBNAIL_SIZE;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Failed to get canvas context');
        }

        cleanupResources = () => {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          signal?.removeEventListener('abort', onAbort);
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onError);
          video.src = '';
          video.load();
        };

        const onAbort = () => {
          settle(() => reject(new DOMException('Aborted', 'AbortError')));
        };

        const onError = () => {
          settle(() => reject(new Error('Failed to load video for thumbnail generation')));
        };

        const onLoadedMetadata = () => {
          try {
            if (!video.duration || isNaN(video.duration) || video.duration === 0) {
              video.currentTime = 0.1;
              return;
            }

            const seekTime = Math.min(video.duration * 0.1, 1.0);
            video.currentTime = seekTime;
          } catch (_error) {
            settle(() => reject(new Error('Failed to seek video')));
          }
        };

        const onSeeked = () => {
          try {
            if (!video.videoWidth || !video.videoHeight || video.videoWidth === 0 || video.videoHeight === 0) {
              settle(() => reject(new Error('Video has invalid dimensions')));
              return;
            }

            const videoAspectRatio = video.videoWidth / video.videoHeight;
            let width = THUMBNAIL_SIZE;
            let height = THUMBNAIL_SIZE;

            if (videoAspectRatio > 1) {
              height = THUMBNAIL_SIZE / videoAspectRatio;
            } else {
              width = THUMBNAIL_SIZE * videoAspectRatio;
            }

            canvas.width = width;
            canvas.height = height;
            context.fillStyle = '#1a1a2e';
            context.fillRect(0, 0, width, height);
            context.drawImage(video, 0, 0, width, height);

            const thumbnail = canvas.toDataURL('image/png');
            settle(() => resolve(thumbnail));
          } catch (_error) {
            settle(() => reject(new Error('Failed to capture video frame')));
          }
        };

        signal?.addEventListener('abort', onAbort, { once: true });
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('error', onError);

        timeoutId = setTimeout(() => {
          settle(() => reject(new Error('Video thumbnail generation timeout')));
        }, 10000);

        video.load();
      } catch (error) {
        settle(() => reject(error instanceof Error ? error : new Error('Unknown error generating video thumbnail')));
      }
    });
  }, []);

  const loadFileThumbnail = useCallback(async (filePath: string, fileType: 'image' | 'pdf' | 'video' | 'audio' | 'other') => {
    if (hasThumbnailInCache(filePath)) {
      const cachedThumbnail = getThumbnailFromCache(filePath)!;
      const existing = filesRef.current.find((file) => file.path === filePath);
      if (existing?.thumbnail === cachedThumbnail) {
        return;
      }
      scheduleThumbnailUpdate(filePath, cachedThumbnail);
      return;
    }

    if (loadingThumbnailsRef.current.has(filePath) || !window.electronAPI) {
      return;
    }

    try {
      loadingThumbnailsRef.current.add(filePath);
      setLoadingThumbnails((prev) => new Set(prev).add(filePath));

      if (fileType === 'pdf') {
        const existingController = pdfThumbnailAbortControllersRef.current.get(filePath);
        existingController?.abort();
        const controller = new AbortController();
        pdfThumbnailAbortControllersRef.current.set(filePath, controller);

        const thumbnail = await requestThumbnail(filePath, async () => {
          if (window.electronAPI.readPDFThumbnail) {
            try {
              const cached = await window.electronAPI.readPDFThumbnail(filePath);
              if (cached && !isPdfPlaceholderThumbnail(cached)) {
                return cached;
              }
            } catch {
              // generate below
            }
          }

          const rendered = await generatePdfThumbnailInRenderer(filePath, {
            signal: controller.signal,
          });
          if (!isPdfPlaceholderThumbnail(rendered) && window.electronAPI.savePDFThumbnail) {
            try {
              await window.electronAPI.savePDFThumbnail(filePath, rendered);
            } catch (saveError) {
              logger.warn(`Failed to save PDF thumbnail to disk for ${filePath}:`, saveError);
            }
          }

          return rendered;
        });
        scheduleThumbnailUpdate(filePath, thumbnail);
        return;
      }

      const thumbnail = await requestThumbnail(filePath, async () => {
        if (fileType === 'video') {
          const existingController = videoThumbnailAbortControllersRef.current.get(filePath);
          existingController?.abort();
          const controller = new AbortController();
          videoThumbnailAbortControllersRef.current.set(filePath, controller);
          try {
            return await generateVideoThumbnailInRenderer(filePath, controller.signal);
          } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
              throw error;
            }
            logger.error(`Failed to generate video thumbnail for ${filePath}:`, error);
            const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#1a1a2e"/>
            <text x="50%" y="50%" font-size="64" text-anchor="middle" dominant-baseline="middle" fill="#8b5cf6">🎬</text>
          </svg>`;
            return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
          } finally {
            if (videoThumbnailAbortControllersRef.current.get(filePath) === controller) {
              videoThumbnailAbortControllersRef.current.delete(filePath);
            }
          }
        }

        return window.electronAPI.getFileThumbnail(filePath);
      });

      scheduleThumbnailUpdate(filePath, thumbnail);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      logger.error(`Failed to load thumbnail for ${filePath}:`, error);
    } finally {
      if (fileType === 'pdf') {
        pdfThumbnailAbortControllersRef.current.delete(filePath);
      }
      loadingThumbnailsRef.current.delete(filePath);
      if (isMountedRef.current) {
        setLoadingThumbnails((prev) => {
          const next = new Set(prev);
          next.delete(filePath);
          return next;
        });
      }
    }
  }, [generateVideoThumbnailInRenderer, scheduleThumbnailUpdate]);

  const ensureThumbnailForFile = useCallback((
    filePath: string,
    fileType: 'image' | 'pdf' | 'video' | 'audio' | 'other',
  ) => {
    if (hasThumbnailInCache(filePath) || loadingThumbnailsRef.current.has(filePath)) {
      return;
    }
    void loadFileThumbnail(filePath, fileType);
  }, [loadFileThumbnail]);

  const loadFiles = useCallback(async (path: string, preserveThumbnails: boolean = false) => {
    const generation = ++loadFilesGenerationRef.current;
    const pathChanged = lastLoadedPathRef.current !== path;
    lastLoadedPathRef.current = path;
    const showFullPageLoading = filesRef.current.length === 0;
    const cachedListing = folderListingCacheRef.current.get(path);

    try {
      if (!window.electronAPI) {
        return;
      }

      if (showFullPageLoading) {
        setLoading(true);
      } else if (pathChanged) {
        if (cachedListing) {
          const hydratedListing = applyMemoryThumbnails(cachedListing);
          setFiles(hydratedListing);
          filesRef.current = hydratedListing;
        } else {
          setIsRefreshingFolder(true);
          setFiles([]);
          filesRef.current = [];
        }
      }

      const itemsList = await window.electronAPI.listCaseFiles(path);
      if (generation !== loadFilesGenerationRef.current) {
        return;
      }
      
      // Always check global cache first for thumbnails
      const thumbnailCache = new Map<string, string>();
      // Use global cache for all files
      itemsList.forEach((item: Awaited<ReturnType<typeof window.electronAPI.listCaseFiles>>[number]) => {
        if (!item.isFolder && thumbnailMemoryCache.has(item.path)) {
          thumbnailCache.set(item.path, thumbnailMemoryCache.get(item.path)!);
        }
      });
      
      // If preserving thumbnails, also check current files state
      if (preserveThumbnails) {
        filesRef.current.forEach(file => {
          if (file.thumbnail && !thumbnailCache.has(file.path)) {
            thumbnailCache.set(file.path, file.thumbnail);
            // Also update global cache
            thumbnailMemoryCache.set(file.path, file.thumbnail);
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
        
        // Exclude .bookmark-thumbnails folder
        if (item.isFolder && itemName === '.bookmark-thumbnails') {
          return false;
        }
        
        // Exclude .notes folder (used for case notes, should be hidden from file listing)
        if (item.isFolder && itemName === '.notes') {
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
        let type: 'image' | 'pdf' | 'video' | 'audio' | 'other' = 'other';
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
          type = 'image';
        } else if (ext === 'pdf') {
          type = 'pdf';
        } else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) {
          type = 'video';
        } else if (['aac', 'amr', 'flac', 'm4a', 'mp3', 'ogg', 'opus', 'wav', 'wma'].includes(ext)) {
          type = 'audio';
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

      folderListingCacheRef.current.set(path, itemsWithTypes);

      const displayedFiles = filesRef.current;
      const shouldUpdateState =
        !listingsMatch(itemsWithTypes, displayedFiles) ||
        thumbnailsChanged(itemsWithTypes, displayedFiles);

      if (shouldUpdateState) {
        setFiles(itemsWithTypes);
        filesRef.current = itemsWithTypes;
      } else {
        filesRef.current = itemsWithTypes;
      }
    } catch (error) {
      if (generation !== loadFilesGenerationRef.current) {
        return;
      }
      logger.error('Error loading files:', error);
      toast.error(getUserFriendlyError(error, { operation: 'load files', path: path }));
    } finally {
      if (showFullPageLoading && generation === loadFilesGenerationRef.current) {
        setLoading(false);
      }
      if (pathChanged && !showFullPageLoading && generation === loadFilesGenerationRef.current) {
        setIsRefreshingFolder(false);
      }
    }
  }, [toast]);

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
          invalidateFolderListings(
            folderListingCacheRef.current,
            currentFolderPath ?? casePath,
          );
          await loadFiles(currentFolderPath ?? casePath, true);
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
        invalidateFolderListings(folderListingCacheRef.current, parentPath);
        await loadFiles(parentPath, true);
        return true;
      }
      return false;
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'create folder' }));
      return false;
    }
  }, [toast, currentCase, currentFolderPath, loadFiles]);

  const moveFileToFolder = useCallback(async (filePath: string, folderPath: string): Promise<boolean> => {try {
      if (!window.electronAPI) {toast.error('Electron API not available');
        return false;
      }const result = await window.electronAPI.moveFileToFolder(filePath, folderPath);if (result.success) {
        toast.success('File moved to folder');
        
        // Reload files to reflect the move, preserving existing thumbnails
        const parentPath = currentFolderPath || currentCase?.path;if (parentPath) {
          invalidateFolderListings(folderListingCacheRef.current, parentPath, folderPath);
          await loadFiles(parentPath, true);}
        return true;
      } else {toast.error(result.error || 'Failed to move file');
        return false;
      }
    } catch (error) {toast.error(getUserFriendlyError(error, { operation: 'move file' }));
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
      
      await loadCases({ force: true });
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
      if (thumbnailMemoryCache.has(filePath)) {
        thumbnailMemoryCache.delete(filePath);
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

        const parentPath = currentFolderPath || currentCase?.path;
        if (parentPath) {
          folderListingCacheRef.current.set(parentPath, filesRef.current);
        }
        
        // Remove from thumbnail cache and loading set
        thumbnailMemoryCache.delete(filePath);
        loadingThumbnailsRef.current.delete(filePath);
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
      if (thumbnailMemoryCache.has(filePath)) {
        const thumbnail = thumbnailMemoryCache.get(filePath);
        thumbnailMemoryCache.delete(filePath);
        if (thumbnail) {
          thumbnailMemoryCache.set(optimisticNewPath, thumbnail);
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
          if (thumbnailMemoryCache.has(optimisticNewPath)) {
            const thumbnail = thumbnailMemoryCache.get(optimisticNewPath);
            thumbnailMemoryCache.delete(optimisticNewPath);
            if (thumbnail) {
              thumbnailMemoryCache.set(result.newPath, thumbnail);
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
      if (thumbnailMemoryCache.has(optimisticNewPath)) {
        const thumbnail = thumbnailMemoryCache.get(optimisticNewPath);
        thumbnailMemoryCache.delete(optimisticNewPath);
        if (thumbnail) {
          thumbnailMemoryCache.set(oldPath, thumbnail);
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
      if (thumbnailMemoryCache.has(optimisticNewPath)) {
        const thumbnail = thumbnailMemoryCache.get(optimisticNewPath);
        thumbnailMemoryCache.delete(optimisticNewPath);
        if (thumbnail) {
          thumbnailMemoryCache.set(filePath, thumbnail);
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

    // Exclude system folders (safety check - backend should already filter these)
    filtered = filtered.filter(caseItem => {
      const caseName = caseItem.name.toLowerCase();
      // Exclude .bookmark-thumbnails folder and TextLibrary
      if (caseName === '.bookmark-thumbnails' || caseName === 'textlibrary') {
        return false;
      }
      return true;
    });

    // Filter by tag if selected
    if (selectedTagId) {
      filtered = filtered.filter(caseItem => caseItem.categoryTagId === selectedTagId);
    }

    // Filter by search query (includes tag name matching)
    if (debouncedSearchQuery.trim()) {
      const queryLower = debouncedSearchQuery.toLowerCase();
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
  }, [cases, debouncedSearchQuery, selectedTagId, getTagById]);

  // Filter files while preserving folder-PDF relationships
  // If a PDF matches, include its associated folders (and vice versa)
  // Also filters by selectedTagId when set
  const filteredFiles = useMemo(() => {
    // If no search query and no tag filter, return all files in backend order
    if (!debouncedSearchQuery.trim() && !selectedTagId) {
      return files;
    }

    const queryLower = debouncedSearchQuery.trim().toLowerCase();
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
      }
    });

    // After finding all direct matches, include related items (folders <-> PDFs)
    // This ensures that when searching, related items are included even if they don't match the search
    const relatedPaths = new Set<string>();
    matchingPaths.forEach(path => {
      const file = files.find(f => f.path === path);
      if (!file) return;
      
      // If it's a PDF that matches, also include its folders
      if (!file.isFolder && file.type === 'pdf') {
        const folders = pdfToFolders.get(file.path) || [];
        folders.forEach(folderPath => {
          const folder = files.find(f => f.path === folderPath);
          // Include folder if there's no tag filter, or if folder's associated PDF matches tag
          if (!selectedTagId || (folder && folderToPdf.get(folderPath) && file.categoryTagId === selectedTagId)) {
            relatedPaths.add(folderPath);
          }
        });
      }
      
      // If it's a folder that matches, also include its associated PDF
      if (file.isFolder) {
        const pdfPath = folderToPdf.get(file.path);
        if (pdfPath) {
          const associatedPdf = files.find(f => f.path === pdfPath);
          // Include PDF if there's no tag filter, or if PDF matches the tag filter
          if (!selectedTagId || associatedPdf?.categoryTagId === selectedTagId) {
            relatedPaths.add(pdfPath);
          }
        }
      }
    });
    
    // Add related paths to matching paths
    relatedPaths.forEach(path => matchingPaths.add(path));
    
    // Return files in original order, but only those that match (or are related to matches)
    return files.filter(file => matchingPaths.has(file.path));
  }, [files, debouncedSearchQuery, selectedTagId]);

  const openFolder = useCallback((folderPath: string) => {
    if (!currentCase) return;
    
    // Add current folder to navigation stack if we're already in a folder
    // If we're at case root (currentFolderPath is null), add the case path to track that we came from root
    if (currentFolderPath) {
      setFolderNavigationStack(prev => [...prev, currentFolderPath]);
    } else {
      // We're at case root, add case path to stack so we can navigate back
      setFolderNavigationStack(prev => [...prev, currentCase.path]);
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
      // If parent path is the case path, we're going back to case root
      if (currentCase && parentPath === currentCase.path) {
        setCurrentFolderPath(null);
      } else {
        setCurrentFolderPath(parentPath);
      }
    } else {
      // If no parent in stack, go back to case root
      setCurrentFolderPath(null);
    }
  }, [folderNavigationStack, currentCase]);

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

  // Find a file across all cases in the archive
  // Returns the case path, folder path (if in subfolder), and file info
  const findFileInArchive = useCallback(async (pdfPath: string): Promise<{
    casePath: string;
    folderPath: string | null;
    file: ArchiveFile;
  } | null> => {
    if (!window.electronAPI || !archiveConfig?.archiveDrive) {
      return null;
    }

    const electronAPI = window.electronAPI; // Store reference for use in nested function

    // Normalize paths for comparison (handle different path separators)
    const normalizePath = (path: string) => path.replace(/\\/g, '/').toLowerCase();

    const normalizedTargetPath = normalizePath(pdfPath);

    // Helper function to recursively search a directory
    const searchDirectory = async (dirPath: string, casePath: string): Promise<{
      casePath: string;
      folderPath: string | null;
      file: ArchiveFile;
    } | null> => {
      try {
        const items = await electronAPI.listCaseFiles(dirPath);

        // Check files first
        for (const item of items) {
          if (!item.isFolder) {
            const normalizedItemPath = normalizePath(item.path);
            if (normalizedItemPath === normalizedTargetPath) {
              // Found the file!
              const ext = item.name.toLowerCase().split('.').pop() || '';
              let type: 'image' | 'pdf' | 'video' | 'audio' | 'other' = 'other';
              
              if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
                type = 'image';
              } else if (ext === 'pdf') {
                type = 'pdf';
              } else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) {
                type = 'video';
              } else if (['aac', 'amr', 'flac', 'm4a', 'mp3', 'ogg', 'opus', 'wav', 'wma'].includes(ext)) {
                type = 'audio';
              }

              const archiveFile: ArchiveFile = {
                ...item,
                type,
                isFolder: false,
              };

              // Determine if this is in a subfolder (not directly in case root)
              const folderPath = dirPath !== casePath ? dirPath : null;

              return {
                casePath,
                folderPath,
                file: archiveFile,
              };
            }
          }
        }

        // If not found in files, search subfolders recursively
        for (const item of items) {
          if (item.isFolder) {
            const result = await searchDirectory(item.path, casePath);
            if (result) {
              return result;
            }
          }
        }

        return null;
      } catch (error) {
        logger.error(`Error searching directory ${dirPath}:`, error);
        return null;
      }
    };

    // Load all cases if not already loaded
    let casesToSearch = cases;
    if (casesToSearch.length === 0) {
      try {
        casesToSearch = await electronAPI.listArchiveCases();
      } catch (error) {
        logger.error('Failed to load cases for file search:', error);
        return null;
      }
    }

    // Search each case
    for (const caseItem of casesToSearch) {
      const result = await searchDirectory(caseItem.path, caseItem.path);
      if (result) {
        return result;
      }
    }

    return null;
  }, [archiveConfig?.archiveDrive, cases]);

  return {
    archiveConfig,
    cases: filteredCases,
    currentCase,
    currentFolderPath,
    folderNavigationStack,
    files: filteredFiles,
    searchQuery,
    loading,
    isRefreshingFolder,
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
    updateCaseDescription,
    refreshCases: () => loadCases({ force: true }),
    refreshFiles: () => {
      const path = currentFolderPath || currentCase?.path;
      return path ? loadFiles(path, true) : Promise.resolve(); // Preserve thumbnails on refresh
    },
    selectedTagId,
    setSelectedTagId,
    tags,
    getTagById,
    findFileInArchive,
    ensureThumbnailForFile,
  };
}

