import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from './logger';
import { getArchiveDrive } from './archiveConfig';

// Define types locally to avoid cross-project imports
export interface Bookmark {
  id: string;
  pdfPath: string;
  pageNumber: number;
  name: string;
  description?: string;
  note?: string;
  thumbnail?: string;
  folderId?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  pdfPath: string;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

const BOOKMARKS_FILE_NAME = '.bookmarks.json';
const BOOKMARK_THUMBNAILS_DIR = '.bookmark-thumbnails';

interface BookmarkStorage {
  bookmarks: Bookmark[];
  folders: BookmarkFolder[];
}

const DEFAULT_STORAGE: BookmarkStorage = {
  bookmarks: [],
  folders: [],
};

let cachedStorage: BookmarkStorage | null = null;

/**
 * Get the path to the bookmarks file
 */
async function getBookmarksPath(): Promise<string> {
  const archiveDrive = await getArchiveDrive();
  if (!archiveDrive) {
    throw new Error('Archive drive not set');
  }
  return path.join(archiveDrive, BOOKMARKS_FILE_NAME);
}

/**
 * Get the path to the bookmark thumbnails directory
 */
export async function getBookmarkThumbnailsDir(): Promise<string> {
  const archiveDrive = await getArchiveDrive();
  if (!archiveDrive) {
    throw new Error('Archive drive not set');
  }
  const thumbnailsDir = path.join(archiveDrive, BOOKMARK_THUMBNAILS_DIR);
  // Ensure directory exists
  try {
    await fs.mkdir(thumbnailsDir, { recursive: true });
  } catch (error) {
    logger.error('Failed to create bookmark thumbnails directory:', error);
  }
  return thumbnailsDir;
}

/**
 * Validate bookmark data
 */
function validateBookmark(bookmark: Partial<Bookmark>): Bookmark {
  if (!bookmark.id || !bookmark.pdfPath || !bookmark.pageNumber || !bookmark.name) {
    throw new Error('Invalid bookmark data: missing required fields');
  }
  if (bookmark.pageNumber < 1) {
    throw new Error('Invalid bookmark data: pageNumber must be >= 1');
  }
  return {
    id: bookmark.id,
    pdfPath: bookmark.pdfPath,
    pageNumber: bookmark.pageNumber,
    name: bookmark.name,
    description: bookmark.description || '',
    note: bookmark.note || '',
    thumbnail: bookmark.thumbnail,
    folderId: bookmark.folderId,
    tags: Array.isArray(bookmark.tags) ? bookmark.tags : [],
    createdAt: bookmark.createdAt || Date.now(),
    updatedAt: bookmark.updatedAt || Date.now(),
  };
}

/**
 * Validate bookmark folder data
 */
function validateBookmarkFolder(folder: Partial<BookmarkFolder>): BookmarkFolder {
  if (!folder.id || !folder.name || !folder.pdfPath) {
    throw new Error('Invalid bookmark folder data: missing required fields');
  }
  return {
    id: folder.id,
    name: folder.name,
    pdfPath: folder.pdfPath,
    thumbnail: folder.thumbnail,
    createdAt: folder.createdAt || Date.now(),
    updatedAt: folder.updatedAt || Date.now(),
  };
}

/**
 * Load bookmarks from disk
 */
export async function loadBookmarks(): Promise<BookmarkStorage> {
  if (cachedStorage) {
    return cachedStorage;
  }

  try {
    const bookmarksPath = await getBookmarksPath();
    try {
      const content = await fs.readFile(bookmarksPath, 'utf8');
      const parsed = JSON.parse(content) as Partial<BookmarkStorage>;
      
      // Validate and normalize data
      const storage: BookmarkStorage = {
        bookmarks: Array.isArray(parsed.bookmarks)
          ? parsed.bookmarks.map(validateBookmark)
          : [],
        folders: Array.isArray(parsed.folders)
          ? parsed.folders.map(validateBookmarkFolder)
          : [],
      };

      cachedStorage = storage;
      return storage;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        // File doesn't exist yet, return defaults
        cachedStorage = { ...DEFAULT_STORAGE };
        return cachedStorage;
      }
      throw error;
    }
  } catch (error) {
    logger.error('Failed to load bookmarks:', error);
    cachedStorage = { ...DEFAULT_STORAGE };
    return cachedStorage;
  }
}

/**
 * Save bookmarks to disk (atomic write)
 */
export async function saveBookmarks(storage: BookmarkStorage): Promise<void> {
  try {
    const bookmarksPath = await getBookmarksPath();
    const validated: BookmarkStorage = {
      bookmarks: storage.bookmarks.map(validateBookmark),
      folders: storage.folders.map(validateBookmarkFolder),
    };

    // Atomic write: write to temp file then rename
    const tempPath = `${bookmarksPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(validated, null, 2), 'utf8');
    await fs.rename(tempPath, bookmarksPath);
    
    cachedStorage = validated;
  } catch (error) {
    logger.error('Failed to save bookmarks:', error);
    throw new Error(`Failed to save bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all bookmarks
 */
export async function getBookmarks(): Promise<Bookmark[]> {
  const storage = await loadBookmarks();
  return storage.bookmarks;
}

/**
 * Get all bookmark folders
 */
export async function getBookmarkFolders(): Promise<BookmarkFolder[]> {
  const storage = await loadBookmarks();
  return storage.folders;
}

/**
 * Create a new bookmark
 */
export async function createBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bookmark> {
  const storage = await loadBookmarks();
  
  // Generate unique ID
  const id = `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  
  const newBookmark: Bookmark = {
    ...bookmark,
    id,
    createdAt: now,
    updatedAt: now,
  };

  storage.bookmarks.push(validateBookmark(newBookmark));
  await saveBookmarks(storage);
  
  return newBookmark;
}

/**
 * Update an existing bookmark
 */
export async function updateBookmark(id: string, updates: Partial<Omit<Bookmark, 'id' | 'createdAt'>>): Promise<Bookmark> {
  const storage = await loadBookmarks();
  const index = storage.bookmarks.findIndex(b => b.id === id);
  
  if (index === -1) {
    throw new Error(`Bookmark with id ${id} not found`);
  }

  const updated: Bookmark = {
    ...storage.bookmarks[index],
    ...updates,
    updatedAt: Date.now(),
  };

  storage.bookmarks[index] = validateBookmark(updated);
  await saveBookmarks(storage);
  
  return updated;
}

/**
 * Delete a bookmark
 */
export async function deleteBookmark(id: string): Promise<boolean> {
  const storage = await loadBookmarks();
  const index = storage.bookmarks.findIndex(b => b.id === id);
  
  if (index === -1) {
    return false;
  }

  storage.bookmarks.splice(index, 1);
  await saveBookmarks(storage);
  
  return true;
}

/**
 * Create a new bookmark folder
 */
export async function createBookmarkFolder(folder: Omit<BookmarkFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<BookmarkFolder> {
  const storage = await loadBookmarks();
  
  // Generate unique ID
  const id = `bookmark-folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  
  const newFolder: BookmarkFolder = {
    ...folder,
    id,
    createdAt: now,
    updatedAt: now,
  };

  storage.folders.push(validateBookmarkFolder(newFolder));
  await saveBookmarks(storage);
  
  return newFolder;
}

/**
 * Delete a bookmark folder
 */
export async function deleteBookmarkFolder(id: string): Promise<boolean> {
  const storage = await loadBookmarks();
  const index = storage.folders.findIndex(f => f.id === id);
  
  if (index === -1) {
    return false;
  }

  // Remove folder and move its bookmarks to root (remove folderId)
  const folderBookmarks = storage.bookmarks.filter(b => b.folderId === id);
  folderBookmarks.forEach(bookmark => {
    const bookmarkIndex = storage.bookmarks.findIndex(b => b.id === bookmark.id);
    if (bookmarkIndex !== -1) {
      storage.bookmarks[bookmarkIndex].folderId = undefined;
    }
  });

  storage.folders.splice(index, 1);
  await saveBookmarks(storage);
  
  return true;
}

/**
 * Get bookmarks by folder ID
 */
export async function getBookmarksByFolder(folderId: string | null): Promise<Bookmark[]> {
  const storage = await loadBookmarks();
  if (folderId === null) {
    // Return bookmarks without a folder
    return storage.bookmarks.filter(b => !b.folderId);
  }
  return storage.bookmarks.filter(b => b.folderId === folderId);
}

/**
 * Clear cache (useful for testing or forced reload)
 */
export function clearBookmarkCache(): void {
  cachedStorage = null;
}

