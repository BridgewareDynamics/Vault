import { app, BrowserWindow, ipcMain, dialog, crashReporter, protocol, nativeImage, Menu } from 'electron';
import { join } from 'path';
import { isValidPDFFile, isValidDirectory, isValidFolderName, isSafePath } from './utils/pathValidator';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import * as os from 'os';
import JSZip from 'jszip';
import { loadArchiveConfig, saveArchiveConfig, getArchiveDrive, setArchiveDrive } from './utils/archiveConfig';
import { generateFileThumbnail } from './utils/thumbnailGenerator';
import { createArchiveMarker, readArchiveMarker, isValidArchive, updateArchiveMarker } from './utils/archiveMarker';
import { logger, type LogLevel, type LogArgs } from './utils/logger';
import { loadSettings } from './utils/settings';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Enable hardware acceleration command line switches
// These must be set before app is ready
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-hardware-acceleration');

// Type guard for errors with code property
interface ErrorWithCode extends Error {
  code?: string;
}

function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error instanceof Error || 'message' in error)
  );
}

// Initialize crash reporter before app ready
if (!isDev) {
  crashReporter.start({
    productName: 'Vault',
    companyName: 'Vault',
    submitURL: '', // Empty for now - can be configured later for crash reporting service
    uploadToServer: false, // Set to true when crash reporting service is configured
    compress: true,
  });
  logger.info('Crash reporter initialized');
}

// Handle uncaught exceptions in main process
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception in main process:', error);
  // Don't exit immediately - log and continue if possible
  // In production, you might want to show an error dialog to the user
});

// Handle unhandled promise rejections in main process
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection in main process:', reason, promise);
  // Log the rejection but don't crash the app
});

let mainWindow: BrowserWindow | null = null;

// Register custom protocol for video files (more efficient than data URLs)
function registerVideoProtocol() {
  protocol.registerFileProtocol('vault-video', (request, callback) => {
    try {
      // Extract file path from URL (vault-video://path/to/file.mp4)
      const url = request.url.replace('vault-video://', '');
      const filePath = decodeURIComponent(url);

      // Validate path
      if (!isSafePath(filePath)) {
        callback({ error: -2 }); // FAILED
        return;
      }

      if (!existsSync(filePath)) {
        callback({ error: -6 }); // FILE_NOT_FOUND
        return;
      }

      callback({ path: filePath });
    } catch (error) {
      logger.error('Video protocol error:', error);
      callback({ error: -2 }); // FAILED
    }
  });
}

async function createWindow() {
  // Determine preload path based on environment
  // In production: files are in app.asar/dist-electron/electron/
  // In development: files are in dist-electron/electron/
  let preloadPath: string;
  if (isDev) {
    preloadPath = join(__dirname, 'preload.cjs');
  } else {
    // In production, use app.getAppPath() which points to app.asar
    // Then navigate to dist-electron/electron/preload.cjs
    const appPath = app.getAppPath();
    preloadPath = join(appPath, 'dist-electron', 'electron', 'preload.cjs');
  }

  // Determine icon path based on environment and platform
  let iconPath: string | undefined;
  const iconExtension = process.platform === 'win32' ? 'ico' : 'png';
  const iconFileName = `icon.${iconExtension}`;
  
  if (isDev) {
    // In development, try multiple methods to find the project root
    const possibleRoots: string[] = [];
    
    // Method 1: Use process.cwd() (most reliable in dev)
    possibleRoots.push(process.cwd());
    
    // Method 2: Use app.getAppPath() if available
    try {
      const appPath = app.getAppPath();
      possibleRoots.push(appPath);
      // If it's in dist-electron, go up
      if (appPath.includes('dist-electron')) {
        possibleRoots.push(join(appPath, '..', '..'));
      }
    } catch {
      // app.getAppPath() not available, skip
    }
    
    // Method 3: Use __dirname-based resolution
    // __dirname in dev points to dist-electron/electron/, so go up 2 levels
    possibleRoots.push(join(__dirname, '..', '..'));
    
    // Find the first root that contains build/icon file
    for (const root of possibleRoots) {
      const testPath = join(root, 'build', iconFileName);
      if (existsSync(testPath)) {
        iconPath = path.resolve(testPath); // Use absolute path
        logger.info(`[Dev] Found icon at: ${iconPath}`);
        break;
      }
    }
    
    // If not found, log all attempted paths for debugging
    if (!iconPath) {
      logger.warn(`[Dev] Icon not found. Attempted paths:`);
      possibleRoots.forEach(root => {
        const testPath = join(root, 'build', iconFileName);
        logger.warn(`  - ${testPath} (exists: ${existsSync(testPath)})`);
      });
    }
  } else {
    // In production, try multiple possible locations
    // electron-builder may place icons in different locations depending on platform
    const possiblePaths: string[] = [];
    
    // Try resources path (common for packaged apps)
    if (process.resourcesPath) {
      possiblePaths.push(join(process.resourcesPath, 'build', iconFileName));
      possiblePaths.push(join(process.resourcesPath, '..', 'build', iconFileName));
    }
    
    // Try app path (app.asar location)
    const appPath = app.getAppPath();
    possiblePaths.push(join(appPath, 'build', iconFileName));
    possiblePaths.push(join(appPath, '..', 'build', iconFileName));
    possiblePaths.push(join(appPath, '..', '..', 'build', iconFileName));
    
    // Try executable directory (Windows unpacked apps)
    if (process.platform === 'win32' && process.execPath) {
      const execDir = path.dirname(process.execPath);
      possiblePaths.push(join(execDir, 'build', iconFileName));
      possiblePaths.push(join(execDir, 'resources', 'build', iconFileName));
    }
    
    // Find the first existing path
    for (const testPath of possiblePaths) {
      if (existsSync(testPath)) {
        iconPath = testPath;
        break;
      }
    }
  }

  // Convert icon path to nativeImage for better compatibility
  let windowIcon: Electron.NativeImage | undefined;
  if (iconPath && existsSync(iconPath)) {
    try {
      windowIcon = nativeImage.createFromPath(iconPath);
      // Verify the image was loaded successfully
      if (windowIcon.isEmpty()) {
        logger.warn(`Icon file at ${iconPath} is empty or invalid`);
        windowIcon = undefined;
      } else {
        logger.info(`Using window icon: ${iconPath}`);
      }
    } catch (error) {
      logger.warn(`Failed to load icon from ${iconPath}:`, error);
      windowIcon = undefined;
    }
  } else if (iconPath) {
    logger.warn(`Icon file not found at ${iconPath}, using default Electron icon`);
  }

  // Load settings to apply hardware acceleration and fullscreen
  let settings;
  try {
    settings = await loadSettings();
  } catch (error) {
    logger.warn('Failed to load settings, using defaults:', error);
    settings = null;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#0f0f1e',
    icon: windowIcon, // Set window icon using nativeImage
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true, // Explicitly enable web security
      devTools: isDev, // Only enable DevTools in development
      // Note: enableWebGPU is not available in Electron 28, hardware acceleration is enabled via command line switches
      offscreen: false, // Keep onscreen for better performance
    } as Electron.WebPreferences,
    titleBarStyle: 'hiddenInset',
    frame: true,
    show: false, // Don't show until ready
    fullscreen: settings?.fullscreen === true, // Apply fullscreen from settings
  });

  // Remove menu bar in production for a clean app experience
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  // Prevent DevTools from opening in production via keyboard shortcuts
  if (!isDev) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Block common DevTools keyboard shortcuts
      const isDevToolsShortcut = 
        (input.key === 'F12') ||
        (input.key === 'I' && input.control && input.shift) ||
        (input.key === 'J' && input.control && input.shift) ||
        (input.key === 'C' && input.control && input.shift) ||
        (input.key === 'K' && input.control && input.shift);
      
      if (isDevToolsShortcut) {
        event.preventDefault();
        logger.warn('DevTools shortcut blocked in production');
      }
    });

    // Additional safeguard: prevent DevTools from opening programmatically
    mainWindow.webContents.on('devtools-opened', () => {
      logger.warn('DevTools attempted to open in production - closing');
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle renderer process crashes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    logger.error('Renderer process crashed:', details);
    // Optionally show error dialog to user
    if (!isDev) {
      dialog.showErrorBox(
        'Application Error',
        'The application has encountered an error and needs to restart.'
      );
    }
  });

  // Handle unresponsive renderer
  mainWindow.webContents.on('unresponsive', () => {
    logger.warn('Renderer process became unresponsive');
  });

  mainWindow.webContents.on('responsive', () => {
    logger.info('Renderer process became responsive again');
  });

  // Handle page load errors (but ignore DevTools internal errors)
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // Ignore DevTools internal errors
    if (validatedURL && validatedURL.includes('devtools://')) {
      return;
    }
    logger.error('Failed to load:', validatedURL, errorDescription);
  });

  // Handle console messages from renderer (for debugging)
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (isDev) {
      // In development, log renderer console messages
      const levelMap: Record<number, 'log' | 'warn' | 'error'> = {
        0: 'log',
        1: 'warn',
        2: 'error',
      };
      const logLevel = levelMap[level] || 'log';
      logger[logLevel](`[Renderer] ${message}`, { line, sourceId });
    }
  });

  if (isDev) {
    // Skip dev server loading during tests
    if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
      // Wait for Vite to be ready, then load
      const loadDevServer = () => {
        if (!mainWindow) return; // Window was closed
        mainWindow.loadURL('http://localhost:5173').catch((err) => {
          logger.error('Failed to load Vite dev server, retrying...', err);
          // Retry after 1 second
          setTimeout(loadDevServer, 1000);
        });
      };
      
      // Wait a bit for Vite to start
      setTimeout(loadDevServer, 500);
      
      mainWindow.webContents.once('did-finish-load', () => {
        // Open DevTools after page loads (only in development)
        if (isDev) {
          setTimeout(() => {
            mainWindow?.webContents.openDevTools();
          }, 100);
        }
      });
    }
  } else {
    // In production, use app.getAppPath() which points to app.asar
    // Then navigate to dist/index.html
    const appPath = app.getAppPath();
    mainWindow.loadFile(join(appPath, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Set App User Model ID for Windows icon association
  // This helps Windows properly associate the icon with the application
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.vault.app');
  }
  
  // Register custom protocols before creating window
  registerVideoProtocol();
  
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup file handles on app exit
app.on('before-quit', async () => {
  await closeAllFileHandles();
});

// IPC Handlers

// Renderer logging handler
ipcMain.handle('log-renderer', async (event, level: LogLevel, ...args: LogArgs) => {
  // Use the logger utility to log messages from renderer process
  logger[level](`[Renderer]`, ...args);
});

// Debug logging handler - writes NDJSON to debug.log file
ipcMain.handle('debug-log', async (event, logEntry: {
  location: string;
  message: string;
  data?: any;
  timestamp: number;
  sessionId: string;
  runId: string;
  hypothesisId: string;
}) => {
  try {
    // Use workspace path: .cursor/debug.log relative to where the app is running
    // In development, this is typically the workspace root
    // In production, we'll use the app path
    const workspaceRoot = isDev ? process.cwd() : app.getAppPath();
    const logPath = join(workspaceRoot, '.cursor', 'debug.log');
    const logDir = path.dirname(logPath);
    
    // Ensure directory exists
    await fs.mkdir(logDir, { recursive: true });
    
    // Format as NDJSON (one JSON object per line)
    const ndjsonLine = JSON.stringify({
      id: `log_${logEntry.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      ...logEntry
    }) + '\n';
    
    // Append to file
    await fs.appendFile(logPath, ndjsonLine, 'utf8');
  } catch (error) {
    // Silently fail - don't break the app if logging fails
    logger.debug('Failed to write debug log:', error);
  }
});

// Get system memory information
ipcMain.handle('get-system-memory', async () => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  return {
    totalMemory,
    freeMemory,
    usedMemory,
  };
});

// Select PDF file
ipcMain.handle('select-pdf-file', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select PDF File',
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];

  // Validate PDF file
  if (!isValidPDFFile(filePath) || !isSafePath(filePath)) {
    throw new Error('Invalid PDF file selected');
  }

  // Check if file exists
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    throw new Error('PDF file does not exist');
  }
});

// Select image file
ipcMain.handle('select-image-file', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Background Image',
    filters: [
      { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];

  // Validate path
  if (!isSafePath(filePath)) {
    throw new Error('Invalid file path');
  }

  // Check if file exists
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    throw new Error('Image file does not exist');
  }
});

// Select save directory
ipcMain.handle('select-save-directory', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Save Directory',
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const dirPath = result.filePaths[0];

  // Validate directory
  if (!(await isValidDirectory(dirPath))) {
    throw new Error('Invalid directory selected');
  }

  return dirPath;
});

// Extract PDF pages - validation only, actual extraction happens in renderer
ipcMain.handle('validate-pdf-for-extraction', async (event, pdfPath: string) => {
  if (!isValidPDFFile(pdfPath) || !isSafePath(pdfPath)) {
    throw new Error('Invalid PDF file path');
  }

  // Check if file exists
  try {
    await fs.access(pdfPath);
    return { valid: true, path: pdfPath };
  } catch {
    throw new Error('PDF file does not exist');
  }
});

// Save files
ipcMain.handle('save-files', async (
  event,
  options: {
    saveDirectory: string;
    saveParentFile: boolean;
    saveToZip: boolean;
    folderName?: string;
    parentFilePath?: string;
    extractedPages: Array<{ pageNumber: number; imageData: string }>;
  }
) => {
  const { saveDirectory, saveParentFile, saveToZip, folderName, parentFilePath, extractedPages } = options;

  // Validate save directory
  if (!(await isValidDirectory(saveDirectory))) {
    throw new Error('Invalid save directory');
  }

  // Validate folder name if saving to ZIP
  if (saveToZip && folderName && !isValidFolderName(folderName)) {
    throw new Error('Invalid folder name');
  }

  const results: string[] = [];

  try {
    // Save parent PDF file if requested
    if (saveParentFile && parentFilePath) {
      if (!isValidPDFFile(parentFilePath) || !isSafePath(parentFilePath)) {
        throw new Error('Invalid parent PDF file path');
      }

      const parentFileName = path.basename(parentFilePath);
      const destPath = path.join(saveDirectory, parentFileName);

      await fs.copyFile(parentFilePath, destPath);
      results.push(`Parent PDF saved: ${destPath}`);
    }

    // Save to ZIP if requested
    if (saveToZip && folderName) {
      const zip = new JSZip();
      const folder = zip.folder(folderName);

      if (!folder) {
        throw new Error('Failed to create ZIP folder');
      }

      // Add all extracted pages to ZIP
      for (const page of extractedPages) {
        // Detect image format from data URL (supports both PNG and JPEG)
        const pngMatch = page.imageData.match(/^data:image\/png;base64,(.+)$/);
        const jpegMatch = page.imageData.match(/^data:image\/jpeg;base64,(.+)$/);
        
        let imageData: string;
        let extension: string;
        
        if (pngMatch) {
          imageData = pngMatch[1];
          extension = 'png';
        } else if (jpegMatch) {
          imageData = jpegMatch[1];
          extension = 'jpg';
        } else {
          // Fallback: try to strip any data URL prefix
          imageData = page.imageData.replace(/^data:image\/[^;]+;base64,/, '');
          extension = 'png'; // Default to PNG for backward compatibility
        }
        
        const buffer = Buffer.from(imageData, 'base64');
        folder.file(`page-${page.pageNumber}.${extension}`, buffer);
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      const zipPath = path.join(saveDirectory, `${folderName}.zip`);
      await fs.writeFile(zipPath, zipBuffer);
      results.push(`ZIP file saved: ${zipPath}`);
    }

    return { success: true, messages: results };
  } catch (error) {
    throw new Error(`Failed to save files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Validate path
ipcMain.handle('validate-path', async (event, filePath: string) => {
  return {
    isValid: isSafePath(filePath),
    isPDF: isValidPDFFile(filePath),
  };
});

// Read PDF file data
// For large files, returns file path instead of data to avoid string length limits
ipcMain.handle('read-pdf-file', async (event, filePath: string) => {
  if (!isValidPDFFile(filePath) || !isSafePath(filePath)) {
    throw new Error('Invalid PDF file path');
  }

  // Retry logic for EBUSY errors (file might be temporarily locked)
  const maxRetries = 5;
  const retryDelay = 100; // 100ms between retries
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Check file size - if larger than ~350MB, return path instead of data
      // JavaScript strings have a max length of ~512MB (0x1fffffe8 characters = ~536MB)
      // Base64 encoding increases size by ~33%, so limit to ~350MB raw file size for safety
      // This leaves ~50MB buffer to account for any overhead
      const MAX_FILE_SIZE_FOR_BASE64 = 350 * 1024 * 1024; // 350MB
      
      const stats = await fs.stat(filePath);
      
      if (stats.size > MAX_FILE_SIZE_FOR_BASE64) {
        // For large files, return a special marker indicating we should use file path
        // The renderer will need to use a custom PDF.js source
        return { type: 'file-path', path: filePath };
      }
      
      const data = await fs.readFile(filePath);
      // Use base64 encoding for smaller files
      const base64 = data.toString('base64');
      return { type: 'base64', data: base64 };
    } catch (error) {
      const errorCode = (error as NodeJS.ErrnoException)?.code;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // If it's an EBUSY error and we have retries left, wait and retry
      if (errorCode === 'EBUSY' && attempt < maxRetries - 1) {
        lastError = error instanceof Error ? error : new Error(errorMessage);
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      
      // For other errors or if we're out of retries, throw immediately
      if (errorCode === 'ENOENT') {
        throw new Error(`PDF file not found: ${filePath}`);
      }
      
      throw new Error(`Failed to read PDF file: ${errorMessage}`);
    }
  }
  
  // If we exhausted all retries, throw the last error
  throw new Error(`Failed to read PDF file after ${maxRetries} attempts: ${lastError?.message || 'File is busy or locked'}`);
});

// File handle manager for efficient PDF chunk reading
// Reuses file handles to avoid repeated open/close operations
interface FileHandleEntry {
  handle: fs.FileHandle;
  lastUsed: number;
  accessCount: number;
}

const fileHandleCache = new Map<string, FileHandleEntry>();
const MAX_CACHE_SIZE = 10; // Maximum number of cached file handles
const HANDLE_IDLE_TIMEOUT = 30000; // Close handles after 30 seconds of inactivity

// Cleanup function to close idle file handles
function cleanupIdleHandles() {
  const now = Date.now();
  const entriesToClose: string[] = [];
  
  for (const [filePath, entry] of fileHandleCache.entries()) {
    if (now - entry.lastUsed > HANDLE_IDLE_TIMEOUT) {
      entriesToClose.push(filePath);
    }
  }
  
  for (const filePath of entriesToClose) {
    const entry = fileHandleCache.get(filePath);
    if (entry) {
      entry.handle.close().catch(() => {
        // Ignore close errors
      });
      fileHandleCache.delete(filePath);
    }
  }
  
  // If cache is still too large, close least recently used handles
  if (fileHandleCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = Array.from(fileHandleCache.entries())
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    
    const toRemove = sortedEntries.slice(0, fileHandleCache.size - MAX_CACHE_SIZE);
    for (const [filePath, entry] of toRemove) {
      entry.handle.close().catch(() => {
        // Ignore close errors
      });
      fileHandleCache.delete(filePath);
    }
  }
}

// Get or create a file handle for a given file path
async function getFileHandle(filePath: string): Promise<fs.FileHandle> {
  // Cleanup idle handles periodically
  cleanupIdleHandles();
  
  const entry = fileHandleCache.get(filePath);
  if (entry) {
    entry.lastUsed = Date.now();
    entry.accessCount++;
    return entry.handle;
  }
  
  // Open new file handle
  const handle = await fs.open(filePath, 'r');
  fileHandleCache.set(filePath, {
    handle,
    lastUsed: Date.now(),
    accessCount: 1,
  });
  
  return handle;
}

// Close a specific file handle
export async function closeFileHandle(filePath: string): Promise<void> {
  const entry = fileHandleCache.get(filePath);
  if (entry) {
    await entry.handle.close().catch(() => {
      // Ignore close errors
    });
    fileHandleCache.delete(filePath);
  }
}

// Close all file handles (cleanup on app exit)
export async function closeAllFileHandles(): Promise<void> {
  const closePromises = Array.from(fileHandleCache.values()).map(entry =>
    entry.handle.close().catch(() => {
      // Ignore close errors
    })
  );
  await Promise.all(closePromises);
  fileHandleCache.clear();
}

// Read PDF file chunk for large files
// Returns ArrayBuffer directly for efficient transfer (no base64 encoding overhead)
ipcMain.handle('read-pdf-file-chunk', async (event, filePath: string, start: number, length: number) => {
  if (!isValidPDFFile(filePath) || !isSafePath(filePath)) {
    throw new Error('Invalid PDF file path');
  }

  // Check if file exists first
  try {
    await fs.access(filePath);
  } catch (error) {
    const errorCode = (error as NodeJS.ErrnoException)?.code;
    if (errorCode === 'ENOENT') {
      throw new Error(`PDF file not found: ${filePath}`);
    }
    throw error;
  }

  // Retry logic for EBUSY errors (file might be temporarily locked)
  const maxRetries = 5;
  const retryDelay = 100; // 100ms between retries
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get or create file handle (reused from cache)
      const fileHandle = await getFileHandle(filePath);
      
      const buffer = Buffer.alloc(length);
      const result = await fileHandle.read(buffer, 0, length, start);
      
      // Return only the bytes that were actually read
      const actualBuffer = result.bytesRead < length 
        ? buffer.slice(0, result.bytesRead)
        : buffer;
      
      // Convert Buffer to ArrayBuffer for efficient IPC transfer
      // Electron's structured clone supports ArrayBuffer transfer
      const arrayBuffer = actualBuffer.buffer.slice(
        actualBuffer.byteOffset,
        actualBuffer.byteOffset + actualBuffer.byteLength
      );
      
      return arrayBuffer;
    } catch (error) {
      const errorCode = (error as NodeJS.ErrnoException)?.code;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // If it's an EBUSY error and we have retries left, wait and retry
      if (errorCode === 'EBUSY' && attempt < maxRetries - 1) {
        lastError = error instanceof Error ? error : new Error(errorMessage);
        // Remove handle from cache if it's causing issues
        const entry = fileHandleCache.get(filePath);
        if (entry) {
          try {
            await entry.handle.close();
          } catch {
            // Ignore close errors
          }
          fileHandleCache.delete(filePath);
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      
      // For other errors or if we're out of retries, throw immediately
      if (errorCode === 'ENOENT') {
        throw new Error(`PDF file not found: ${filePath}`);
      }
      
      throw new Error(`Failed to read PDF file chunk: ${errorMessage}`);
    }
  }
  
  // If we exhausted all retries, throw the last error
  throw new Error(`Failed to read PDF file chunk after ${maxRetries} attempts: ${lastError?.message || 'File is busy or locked'}`);
});

// IPC handler to close a file handle when done with a PDF
ipcMain.handle('close-pdf-file-handle', async (event, filePath: string) => {
  await closeFileHandle(filePath);
});

// Get PDF file size
ipcMain.handle('get-pdf-file-size', async (event, filePath: string) => {
  if (!isValidPDFFile(filePath) || !isSafePath(filePath)) {
    throw new Error('Invalid PDF file path');
  }

  // Retry logic for EBUSY errors (file might be temporarily locked)
  const maxRetries = 5;
  const retryDelay = 100; // 100ms between retries
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      const errorCode = (error as NodeJS.ErrnoException)?.code;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // If it's an EBUSY error and we have retries left, wait and retry
      if (errorCode === 'EBUSY' && attempt < maxRetries - 1) {
        lastError = error instanceof Error ? error : new Error(errorMessage);
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      
      // For other errors or if we're out of retries, throw immediately
      if (errorCode === 'ENOENT') {
        throw new Error(`PDF file not found: ${filePath}`);
      }
      
      throw new Error(`Failed to get PDF file size: ${errorMessage}`);
    }
  }
  
  // If we exhausted all retries, throw the last error
  throw new Error(`Failed to get PDF file size after ${maxRetries} attempts: ${lastError?.message || 'File is busy or locked'}`);
});

// Archive IPC Handlers

// Select archive drive
ipcMain.handle('select-archive-drive', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Archive Drive',
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const dirPath = result.filePaths[0];

  // Validate directory
  if (!(await isValidDirectory(dirPath))) {
    throw new Error('Invalid directory selected');
  }

  // Check if this directory already has a marker file
  const hasMarker = await isValidArchive(dirPath);
  let autoDetected = false;

  if (hasMarker) {
    // Archive marker exists - validate it
    const marker = await readArchiveMarker(dirPath);
    if (marker) {
      autoDetected = true;
      // Archive is valid, just update lastModified
      await updateArchiveMarker(dirPath, { lastModified: Date.now() });
    }
  } else {
    // No marker file - create a new one
    await createArchiveMarker(dirPath);
  }

  // Save to config
  await setArchiveDrive(dirPath);
  
  return {
    path: dirPath,
    autoDetected,
  };
});

// Get archive config
ipcMain.handle('get-archive-config', async () => {
  const config = await loadArchiveConfig();
  
  // Validate the stored archive drive path
  if (config.archiveDrive) {
    try {
      // Check if path exists and has valid marker
      const isValid = await isValidArchive(config.archiveDrive);
      if (!isValid) {
        // Path is invalid, clear it
        config.archiveDrive = null;
        await saveArchiveConfig(config);
      }
    } catch (error) {
      // Path doesn't exist or is invalid, clear it
      config.archiveDrive = null;
      await saveArchiveConfig(config);
    }
  }
  
  return config;
});

// Validate archive directory
ipcMain.handle('validate-archive-directory', async (event, dirPath: string) => {
  if (!isSafePath(dirPath)) {
    return { isValid: false };
  }

  try {
    if (!(await isValidDirectory(dirPath))) {
      return { isValid: false };
    }

    const isValid = await isValidArchive(dirPath);
    if (isValid) {
      const marker = await readArchiveMarker(dirPath);
      return {
        isValid: true,
        marker: marker || undefined,
      };
    }

    return { isValid: false };
  } catch (error) {
    return { isValid: false };
  }
});

// Create case folder
ipcMain.handle('create-case-folder', async (event, caseName: string, description: string = '', categoryTagId?: string) => {
  if (!caseName || !isValidFolderName(caseName)) {
    throw new Error('Invalid case name');
  }

  const archiveDrive = await getArchiveDrive();
  if (!archiveDrive) {
    throw new Error('Archive drive not set');
  }

  const casePath = path.join(archiveDrive, caseName);

  // Check if folder already exists
  try {
    await fs.access(casePath);
    throw new Error('Case folder already exists');
  } catch (error: unknown) {
    if (isErrorWithCode(error) && error.code === 'ENOENT') {
      // Folder doesn't exist, create it
      await fs.mkdir(casePath, { recursive: true });
      
      // Save description if provided
      if (description.trim()) {
        const descriptionPath = path.join(casePath, '.case-description');
        await fs.writeFile(descriptionPath, description.trim(), 'utf8');
      }
      
      // Save category tag if provided
      if (categoryTagId && categoryTagId.trim()) {
        const tagPath = path.join(casePath, '.case-category-tag');
        await fs.writeFile(tagPath, categoryTagId.trim(), 'utf8');
      }
      
      // Update archive marker metadata
      try {
        const marker = await readArchiveMarker(archiveDrive);
        if (marker) {
          // Count existing cases to update caseCount
          const entries = await fs.readdir(archiveDrive, { withFileTypes: true });
          const caseCount = entries.filter(entry => entry.isDirectory()).length;
          await updateArchiveMarker(archiveDrive, { caseCount, lastModified: Date.now() });
        }
      } catch (error) {
        // If marker update fails, don't fail the case creation
        logger.error('Failed to update archive marker:', error);
      }
      
      return casePath;
    }
    throw error;
  }
});

// Create folder (regular folder for organizing files)
ipcMain.handle('create-folder', async (event, folderPath: string, folderName: string) => {
  logger.log('[Main] create-folder called:', { folderPath, folderName });
  
  if (!isSafePath(folderPath)) {
    logger.error('[Main] Invalid folder path:', folderPath);
    throw new Error('Invalid folder path');
  }

  if (!folderName || !isValidFolderName(folderName)) {
    logger.error('[Main] Invalid folder name:', folderName);
    throw new Error('Invalid folder name');
  }

  try {
    const newFolderPath = path.join(folderPath, folderName);
    
    // Check if folder already exists
    try {
      const stats = await fs.stat(newFolderPath);
      if (stats.isDirectory()) {
        throw new Error('Folder already exists');
      }
    } catch (error) {
      const errorCode = (error as NodeJS.ErrnoException)?.code;
      if (errorCode === 'ENOENT') {
        // Folder doesn't exist, which is what we want
      } else if (error instanceof Error && error.message === 'Folder already exists') {
        throw error;
      } else {
        // Some other error, log but continue
        logger.warn('[Main] Error checking folder existence:', error);
      }
    }
    
    logger.log('[Main] Creating folder at:', newFolderPath);
    await fs.mkdir(newFolderPath, { recursive: true });
    
    // Verify folder was created
    try {
      const stats = await fs.stat(newFolderPath);
      if (!stats.isDirectory()) {
        throw new Error('Created path is not a directory');
      }
      logger.log('[Main] Folder verified, isDirectory:', stats.isDirectory());
    } catch (statError) {
      logger.error('[Main] Failed to verify folder:', statError);
      throw new Error(`Failed to verify folder creation: ${statError instanceof Error ? statError.message : 'Unknown error'}`);
    }
    
    logger.log('[Main] Folder created successfully:', newFolderPath);
    return newFolderPath;
  } catch (error) {
    logger.error('[Main] Error creating folder:', error);
    throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Create extraction folder
ipcMain.handle('create-extraction-folder', async (event, casePath: string, folderName: string, parentPdfPath?: string) => {
  logger.log('[Main] create-extraction-folder called:', { casePath, folderName, parentPdfPath });
  
  if (!isSafePath(casePath)) {
    logger.error('[Main] Invalid case path:', casePath);
    throw new Error('Invalid case path');
  }

  if (!folderName || !isValidFolderName(folderName)) {
    logger.error('[Main] Invalid folder name:', folderName);
    throw new Error('Invalid folder name');
  }

  try {
    const extractionFolder = path.join(casePath, folderName);
    logger.log('[Main] Creating folder at:', extractionFolder);
    await fs.mkdir(extractionFolder, { recursive: true });
    
    // Store parent PDF path in a metadata file if provided
    if (parentPdfPath && isSafePath(parentPdfPath)) {
      const metadataPath = path.join(extractionFolder, '.parent-pdf');
      // Store just the filename of the parent PDF for easier matching
      const parentPdfName = path.basename(parentPdfPath);
      await fs.writeFile(metadataPath, parentPdfName, 'utf8');
      logger.log('[Main] Stored parent PDF metadata:', parentPdfName);
    }
    
    // Verify folder was created by checking if it exists
    try {
      const stats = await fs.stat(extractionFolder);
      if (!stats.isDirectory()) {
        throw new Error('Created path is not a directory');
      }
      logger.log('[Main] Folder verified, isDirectory:', stats.isDirectory());
    } catch (statError) {
      logger.error('[Main] Failed to verify folder:', statError);
      throw new Error(`Failed to verify folder creation: ${statError instanceof Error ? statError.message : 'Unknown error'}`);
    }
    
    logger.log('[Main] Folder created successfully:', extractionFolder);
    return extractionFolder;
  } catch (error) {
    logger.error('[Main] Error creating folder:', error);
    throw new Error(`Failed to create extraction folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// List archive cases
ipcMain.handle('list-archive-cases', async () => {
  const archiveDrive = await getArchiveDrive();
  if (!archiveDrive) {
    return [];
  }

  try {
    const entries = await fs.readdir(archiveDrive, { withFileTypes: true });
    const cases = await Promise.all(
      entries
        .filter(entry => entry.isDirectory())
        .map(async (entry) => {
          const casePath = path.join(archiveDrive, entry.name);
          
          // Try to read background image metadata
          let backgroundImage: string | undefined = undefined;
          try {
            const metadataPath = path.join(casePath, '.case-background');
            const backgroundFileName = await fs.readFile(metadataPath, 'utf8');
            const backgroundFileNameTrimmed = backgroundFileName.trim();
            if (backgroundFileNameTrimmed) {
              const backgroundImagePath = path.join(casePath, backgroundFileNameTrimmed);
              // Verify the file exists
              try {
                await fs.access(backgroundImagePath);
                backgroundImage = backgroundImagePath;
              } catch {
                // File doesn't exist, ignore
              }
            }
          } catch (metadataError) {
            // Metadata file doesn't exist or can't be read - that's okay
          }
          
          // Try to read description metadata
          let description: string | undefined = undefined;
          try {
            const descriptionPath = path.join(casePath, '.case-description');
            const descriptionContent = await fs.readFile(descriptionPath, 'utf8');
            const descriptionTrimmed = descriptionContent.trim();
            if (descriptionTrimmed) {
              description = descriptionTrimmed;
            }
          } catch (descriptionError) {
            // Description file doesn't exist or can't be read - that's okay
          }
          
          // Try to read category tag metadata
          let categoryTagId: string | undefined = undefined;
          try {
            const tagPath = path.join(casePath, '.case-category-tag');
            const tagContent = await fs.readFile(tagPath, 'utf8');
            const tagTrimmed = tagContent.trim();
            if (tagTrimmed) {
              categoryTagId = tagTrimmed;
            }
          } catch (tagError) {
            // Tag file doesn't exist or can't be read - that's okay
          }
          
          return {
            name: entry.name,
            path: casePath,
            backgroundImage,
            description,
            categoryTagId,
          };
        })
    );
    
    cases.sort((a, b) => a.name.localeCompare(b.name)); // Alphabetize
    return cases;
  } catch (error) {
    throw new Error(`Failed to list archive cases: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Category Tag Handlers

// Get all category tags
ipcMain.handle('get-category-tags', async () => {
  const archiveDrive = await getArchiveDrive();
  if (!archiveDrive) {
    return [];
  }

  try {
    const tagsPath = path.join(archiveDrive, '.category-tags.json');
    try {
      const tagsContent = await fs.readFile(tagsPath, 'utf8');
      const tags = JSON.parse(tagsContent);
      return Array.isArray(tags) ? tags : [];
    } catch (error: unknown) {
      if (isErrorWithCode(error) && error.code === 'ENOENT') {
        // File doesn't exist yet, return empty array
        return [];
      }
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to get category tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Create a new category tag
ipcMain.handle('create-category-tag', async (event, tag: { id: string; name: string; color: string }) => {
  const archiveDrive = await getArchiveDrive();
  if (!archiveDrive) {
    throw new Error('Archive drive not set');
  }

  if (!tag.id || !tag.name || !tag.color) {
    throw new Error('Invalid tag data');
  }

  try {
    const tagsPath = path.join(archiveDrive, '.category-tags.json');
    let tags: Array<{ id: string; name: string; color: string }> = [];

    // Try to read existing tags
    try {
      const tagsContent = await fs.readFile(tagsPath, 'utf8');
      tags = JSON.parse(tagsContent);
      if (!Array.isArray(tags)) {
        tags = [];
      }
    } catch (error: unknown) {
      if (isErrorWithCode(error) && error.code === 'ENOENT') {
        // File doesn't exist yet, start with empty array
        tags = [];
      } else {
        throw error;
      }
    }

    // Check for duplicate ID or name
    if (tags.some(t => t.id === tag.id || t.name.toLowerCase() === tag.name.toLowerCase())) {
      throw new Error('Tag with this ID or name already exists');
    }

    // Add new tag
    tags.push(tag);

    // Save tags
    await fs.writeFile(tagsPath, JSON.stringify(tags, null, 2), 'utf8');
    return tag;
  } catch (error) {
    throw new Error(`Failed to create category tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Set category tag for a case
ipcMain.handle('set-case-category-tag', async (event, casePath: string, categoryTagId: string | null) => {
  if (!isSafePath(casePath)) {
    throw new Error('Invalid case path');
  }

  try {
    const tagPath = path.join(casePath, '.case-category-tag');
    
    if (categoryTagId === null || categoryTagId.trim() === '') {
      // Remove tag by deleting the file
      try {
        await fs.unlink(tagPath);
      } catch (error: unknown) {
        if (isErrorWithCode(error) && error.code === 'ENOENT') {
          // File doesn't exist, that's fine
        } else {
          throw error;
        }
      }
    } else {
      // Write tag ID to file
      await fs.writeFile(tagPath, categoryTagId.trim(), 'utf8');
    }
    
    return true;
  } catch (error) {
    throw new Error(`Failed to set case category tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Get category tag for a case
ipcMain.handle('get-case-category-tag', async (event, casePath: string) => {
  if (!isSafePath(casePath)) {
    throw new Error('Invalid case path');
  }

  try {
    const tagPath = path.join(casePath, '.case-category-tag');
    try {
      const tagContent = await fs.readFile(tagPath, 'utf8');
      const tagId = tagContent.trim();
      return tagId || null;
    } catch (error: unknown) {
      if (isErrorWithCode(error) && error.code === 'ENOENT') {
        // File doesn't exist, return null
        return null;
      }
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to get case category tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Set category tag for a file
ipcMain.handle('set-file-category-tag', async (event, filePath: string, categoryTagId: string | null) => {
  if (!isSafePath(filePath)) {
    throw new Error('Invalid file path');
  }

  try {
    // Normalize the file path to ensure consistency
    const normalizedFilePath = path.normalize(filePath);
    // Create metadata file next to the file: .file-category-tag.{filename}
    const fileDir = path.dirname(normalizedFilePath);
    const fileName = path.basename(normalizedFilePath);
    const tagFileName = `.file-category-tag.${fileName}`;
    const tagPath = path.join(fileDir, tagFileName);
    
    logger.log('[Main] set-file-category-tag:', { filePath, normalizedFilePath, fileName, tagPath, categoryTagId });
    
    if (categoryTagId === null || categoryTagId.trim() === '') {
      // Remove tag by deleting the metadata file
      try {
        await fs.unlink(tagPath);
      } catch (error: unknown) {
        if (isErrorWithCode(error) && error.code === 'ENOENT') {
          // File doesn't exist, that's fine
        } else {
          throw error;
        }
      }
    } else {
      // Write tag ID to metadata file
      await fs.writeFile(tagPath, categoryTagId.trim(), 'utf8');
    }
    
    return true;
  } catch (error) {
    throw new Error(`Failed to set file category tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Get category tag for a file
ipcMain.handle('get-file-category-tag', async (event, filePath: string) => {
  if (!isSafePath(filePath)) {
    throw new Error('Invalid file path');
  }

  try {
    // Normalize the file path to ensure consistency
    const normalizedFilePath = path.normalize(filePath);
    const fileDir = path.dirname(normalizedFilePath);
    const fileName = path.basename(normalizedFilePath);
    const tagFileName = `.file-category-tag.${fileName}`;
    const tagPath = path.join(fileDir, tagFileName);
    
    logger.log('[Main] get-file-category-tag:', { filePath, normalizedFilePath, fileName, tagPath });
    
    try {
      const tagContent = await fs.readFile(tagPath, 'utf8');
      const tagId = tagContent.trim();
      return tagId || null;
    } catch (error: unknown) {
      if (isErrorWithCode(error) && error.code === 'ENOENT') {
        // File doesn't exist, return null
        return null;
      }
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to get file category tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Delete a category tag
ipcMain.handle('delete-category-tag', async (event, tagId: string) => {
  const archiveDrive = await getArchiveDrive();
  if (!archiveDrive) {
    throw new Error('Archive drive not set');
  }

  if (!tagId || !tagId.trim()) {
    throw new Error('Invalid tag ID');
  }

  try {
    const tagsPath = path.join(archiveDrive, '.category-tags.json');
    let tags: Array<{ id: string; name: string; color: string }> = [];

    // Try to read existing tags
    try {
      const tagsContent = await fs.readFile(tagsPath, 'utf8');
      tags = JSON.parse(tagsContent);
      if (!Array.isArray(tags)) {
        tags = [];
      }
    } catch (error: unknown) {
      if (isErrorWithCode(error) && error.code === 'ENOENT') {
        // File doesn't exist, nothing to delete
        throw new Error('Tag not found');
      } else {
        throw error;
      }
    }

    // Find and remove the tag
    const tagIndex = tags.findIndex(t => t.id === tagId.trim());
    if (tagIndex === -1) {
      throw new Error('Tag not found');
    }

    // Remove the tag
    tags.splice(tagIndex, 1);

    // Save updated tags
    await fs.writeFile(tagsPath, JSON.stringify(tags, null, 2), 'utf8');
    return true;
  } catch (error) {
    throw new Error(`Failed to delete category tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// List case files
ipcMain.handle('list-case-files', async (event, casePath: string) => {
  if (!isSafePath(casePath)) {
    throw new Error('Invalid case path');
  }

  try {
    const entries = await fs.readdir(casePath, { withFileTypes: true });
    logger.log('[Main] list-case-files: Found entries:', entries.length, entries.map(e => ({ name: e.name, isFile: e.isFile(), isDirectory: e.isDirectory() })));
    
    // Process files (exclude hidden metadata files like .parent-pdf, .case-background, etc.)
    const files = await Promise.all(
      entries
        .filter(entry => {
          // Only process files
          if (!entry.isFile()) {
            return false;
          }
          const fileName = entry.name.toLowerCase();
          
          // Exclude .parent-pdf metadata files
          if (fileName === '.parent-pdf' || fileName.startsWith('.parent-pdf')) {
            logger.log('[Main] Filtering out metadata file:', entry.name);
            return false;
          }
          
          // Exclude .case-background metadata file
          if (fileName === '.case-background') {
            logger.log('[Main] Filtering out case background metadata file:', entry.name);
            return false;
          }
          
          // Exclude .case-description metadata file
          if (fileName === '.case-description') {
            logger.log('[Main] Filtering out case description metadata file:', entry.name);
            return false;
          }
          
          // Exclude .case-category-tag metadata file
          if (fileName === '.case-category-tag') {
            logger.log('[Main] Filtering out case category tag metadata file:', entry.name);
            return false;
          }
          
          // Exclude .vault-archive.json marker file
          if (fileName === '.vault-archive.json') {
            logger.log('[Main] Filtering out vault archive marker file:', entry.name);
            return false;
          }
          
          // Exclude .case-background-image.* files
          if (fileName.startsWith('.case-background-image.')) {
            logger.log('[Main] Filtering out case background image file:', entry.name);
            return false;
          }
          
          // Exclude .file-category-tag.* metadata files
          if (fileName.startsWith('.file-category-tag.')) {
            logger.log('[Main] Filtering out file category tag metadata file:', entry.name);
            return false;
          }
          
          return true;
        })
        .map(async (entry) => {
          const filePath = path.normalize(path.join(casePath, entry.name));
          const stats = await fs.stat(filePath);
          
          // Try to read file category tag metadata
          let categoryTagId: string | undefined = undefined;
          try {
            const tagFileName = `.file-category-tag.${entry.name}`;
            const tagPath = path.normalize(path.join(casePath, tagFileName));
            logger.log('[Main] list-case-files: Reading tag for file:', { entryName: entry.name, filePath, tagFileName, tagPath });
            const tagContent = await fs.readFile(tagPath, 'utf8');
            const tagTrimmed = tagContent.trim();
            if (tagTrimmed) {
              categoryTagId = tagTrimmed;
              logger.log('[Main] list-case-files: Found tag for file:', { entryName: entry.name, categoryTagId });
            }
          } catch (tagError) {
            // Tag file doesn't exist or can't be read - that's okay
            logger.log('[Main] list-case-files: No tag found for file:', { entryName: entry.name, error: tagError instanceof Error ? tagError.message : 'Unknown' });
          }
          
          return {
            name: entry.name,
            path: filePath,
            size: stats.size,
            modified: stats.mtime.getTime(),
            isFolder: false,
            categoryTagId,
          };
        })
    );

    // Process folders
    const folders = await Promise.all(
      entries
        .filter(entry => {
          if (!entry.isDirectory()) {
            return false;
          }
          // Exclude .thumbnails folder
          const folderName = entry.name.toLowerCase();
          if (folderName === '.thumbnails') {
            logger.log('[Main] Filtering out .thumbnails folder:', entry.name);
            return false;
          }
          return true;
        })
        .map(async (entry) => {
          const folderPath = path.join(casePath, entry.name);
          const stats = await fs.stat(folderPath);
          
          // Try to read parent PDF metadata to determine folder type
          let parentPdfName: string | null = null;
          let folderType: 'extraction' | 'case' = 'case'; // Default to regular folder
          
          try {
            const metadataPath = path.join(folderPath, '.parent-pdf');
            parentPdfName = await fs.readFile(metadataPath, 'utf8');
            parentPdfName = parentPdfName.trim();
            // If .parent-pdf exists, it's an extraction folder
            if (parentPdfName) {
              folderType = 'extraction';
            }
          } catch (metadataError) {
            // Metadata file doesn't exist - it's a regular case folder
            folderType = 'case';
            parentPdfName = null;
          }
          
          // Try to read folder background image metadata
          let backgroundImage: string | undefined = undefined;
          try {
            const backgroundMetadataPath = path.join(folderPath, '.folder-background');
            const backgroundImageName = await fs.readFile(backgroundMetadataPath, 'utf8');
            const trimmedName = backgroundImageName.trim();
            if (trimmedName) {
              const backgroundImagePath = path.join(folderPath, trimmedName);
              // Verify the image file exists
              try {
                await fs.access(backgroundImagePath);
                backgroundImage = backgroundImagePath;
              } catch {
                // Image file doesn't exist, ignore
              }
            }
          } catch {
            // No background image metadata, ignore
          }
          
          return {
            name: entry.name,
            path: folderPath,
            size: 0,
            modified: stats.mtime.getTime(),
            isFolder: true,
            folderType: folderType,
            parentPdfName: parentPdfName || undefined,
            backgroundImage: backgroundImage,
          };
        })
    );

    logger.log('[Main] list-case-files: Processed - Files:', files.length, 'Folders:', folders.length);
    
    // Group folders with their parent PDFs and sort
    // Strategy: Create a map of PDFs to their folders, then build sorted list with folders above each PDF
    const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    const otherFiles = files.filter(f => !f.name.toLowerCase().endsWith('.pdf'));
    
    // Sort PDFs alphabetically first
    pdfFiles.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create a map: PDF name (case-insensitive) -> actual PDF name -> array of folders that belong to it
    // This allows case-insensitive matching while preserving the actual PDF name for display
    const pdfToFoldersMap = new Map<string, typeof folders>();
    const pdfNameLowerToActual = new Map<string, string>(); // lowercase -> actual name
    
    // Initialize map with all PDFs (using actual names, but also create lowercase lookup)
    pdfFiles.forEach(pdf => {
      pdfToFoldersMap.set(pdf.name, []);
      pdfNameLowerToActual.set(pdf.name.toLowerCase(), pdf.name);
    });
    
    // Assign folders to their parent PDFs
    folders.forEach(folder => {
      const parentPdfName = folder.parentPdfName;
      let matched = false;
      
      if (parentPdfName) {
        // Try exact match first (case-sensitive)
        if (pdfToFoldersMap.has(parentPdfName)) {
          pdfToFoldersMap.get(parentPdfName)!.push(folder);
          matched = true;
        } else {
          // Try case-insensitive match
          const parentPdfNameLower = parentPdfName.toLowerCase();
          const actualPdfName = pdfNameLowerToActual.get(parentPdfNameLower);
          if (actualPdfName) {
            pdfToFoldersMap.get(actualPdfName)!.push(folder);
            matched = true;
          }
        }
      }
      
      // If not matched by metadata, try fallback matching by name and time
      if (!matched) {
        const folderNameLower = folder.name.toLowerCase();
        const folderModified = folder.modified;
        
        // Find the best matching PDF
        let bestMatch: typeof pdfFiles[0] | null = null;
        let bestMatchScore = 0;
        
        for (const pdf of pdfFiles) {
          const pdfBaseName = pdf.name.replace(/\.pdf$/i, '').toLowerCase();
          const pdfModified = pdf.modified;
          
          // Calculate match score
          let score = 0;
          if (folderNameLower.includes(pdfBaseName) || pdfBaseName.includes(folderNameLower)) {
            score += 10; // Name match
          }
          // Time match: folder created after or near the time PDF was added
          if (folderModified >= pdfModified && (folderModified - pdfModified) < 3600000) {
            score += 5; // Time match (within 1 hour)
          }
          
          if (score > bestMatchScore) {
            bestMatchScore = score;
            bestMatch = pdf;
          }
        }
        
        if (bestMatch && bestMatchScore > 0) {
          pdfToFoldersMap.get(bestMatch.name)!.push(folder);
        }
      }
    });
    
    // Sort folders within each PDF group alphabetically
    pdfToFoldersMap.forEach((folderList, pdfName) => {
      folderList.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    // Track which folders have been assigned to PDFs
    const assignedFolders = new Set<string>();
    pdfToFoldersMap.forEach((folderList) => {
      folderList.forEach(folder => {
        assignedFolders.add(folder.path);
      });
    });
    
    // Find orphaned folders (folders without a matching PDF)
    const orphanedFolders = folders.filter(folder => !assignedFolders.has(folder.path));
    orphanedFolders.sort((a, b) => a.name.localeCompare(b.name));
    
    // Build the final sorted list: folders above their PDFs, PDFs in alphabetical order
    const groupedItems: Array<typeof files[0] | typeof folders[0]> = [];
    
    // Add folders and their PDFs in alphabetical PDF order
    // This ensures folders always appear above their associated PDFs
    for (const pdf of pdfFiles) {
      const relatedFolders = pdfToFoldersMap.get(pdf.name) || [];
      // Add folders above the PDF (folders are already sorted alphabetically)
      groupedItems.push(...relatedFolders);
      // Add the PDF
      groupedItems.push(pdf);
    }
    
    // Add orphaned folders (folders without a matching PDF) after all PDFs
    groupedItems.push(...orphanedFolders);
    
    // Add other non-PDF files at the end, sorted alphabetically
    otherFiles.sort((a, b) => a.name.localeCompare(b.name));
    groupedItems.push(...otherFiles);
    
    logger.log('[Main] list-case-files: Grouped items - PDFs:', pdfFiles.length, 'Total folders:', folders.length);
    logger.log('[Main] list-case-files: Returning total items:', groupedItems.length);
    return groupedItems;
  } catch (error) {
    logger.error('[Main] list-case-files: Error:', error);
    throw new Error(`Failed to list case files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Add files to case
ipcMain.handle('add-files-to-case', async (event, casePath: string, filePaths?: string[]) => {
  if (!isSafePath(casePath)) {
    throw new Error('Invalid case path');
  }

  // If filePaths provided, copy them. Otherwise, show file picker
  if (filePaths && filePaths.length > 0) {
    const results: string[] = [];
    for (const filePath of filePaths) {
      if (!isSafePath(filePath)) {
        continue;
      }

      try {
        const fileName = path.basename(filePath);
        const destPath = path.join(casePath, fileName);
        await fs.copyFile(filePath, destPath);
        results.push(destPath);
      } catch (error) {
        // Skip files that fail to copy
        logger.error(`Failed to copy file ${filePath}:`, error);
      }
    }
    return results;
  }

  // Show file picker
  if (!mainWindow) return [];

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Files to Add',
    properties: ['openFile', 'multiSelections'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return [];
  }

  const copiedFiles: string[] = [];
  for (const filePath of result.filePaths) {
    if (!isSafePath(filePath)) {
      continue;
    }

    try {
      const fileName = path.basename(filePath);
      const destPath = path.join(casePath, fileName);
      await fs.copyFile(filePath, destPath);
      copiedFiles.push(destPath);
    } catch (error) {
      logger.error(`Failed to copy file ${filePath}:`, error);
    }
  }

  return copiedFiles;
});

// Delete case
ipcMain.handle('delete-case', async (event, casePath: string) => {
  if (!isSafePath(casePath)) {
    throw new Error('Invalid case path');
  }

  try {
    await fs.rm(casePath, { recursive: true, force: true });
    return true;
  } catch (error) {
    throw new Error(`Failed to delete case: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Set case background image
ipcMain.handle('set-case-background-image', async (event, casePath: string, imagePath: string) => {
  if (!isSafePath(casePath) || !isSafePath(imagePath)) {
    throw new Error('Invalid path');
  }

  try {
    // Check if case path exists and is a directory
    const caseStats = await fs.stat(casePath);
    if (!caseStats.isDirectory()) {
      throw new Error('Case path is not a directory');
    }

    // Check if image file exists
    await fs.access(imagePath);

    // Copy image to case folder with a standard name
    const imageExt = path.extname(imagePath);
    const backgroundImageName = `.case-background-image${imageExt}`;
    const destPath = path.join(casePath, backgroundImageName);

    // Delete old background image if it exists
    try {
      const oldMetadataPath = path.join(casePath, '.case-background');
      const oldMetadata = await fs.readFile(oldMetadataPath, 'utf8');
      const oldImageName = oldMetadata.trim();
      if (oldImageName && oldImageName !== backgroundImageName) {
        const oldImagePath = path.join(casePath, oldImageName);
        try {
          await fs.unlink(oldImagePath);
        } catch {
          // Old image doesn't exist, ignore
        }
      }
    } catch {
      // No old metadata, ignore
    }

    // Copy the new image
    await fs.copyFile(imagePath, destPath);

    // Store the filename in metadata file
    const metadataPath = path.join(casePath, '.case-background');
    await fs.writeFile(metadataPath, backgroundImageName, 'utf8');

    return destPath;
  } catch (error) {
    throw new Error(`Failed to set case background image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Set folder background image
ipcMain.handle('set-folder-background-image', async (event, folderPath: string, imagePath: string) => {
  if (!isSafePath(folderPath) || !isSafePath(imagePath)) {
    throw new Error('Invalid path');
  }

  try {
    // Check if folder path exists and is a directory
    const folderStats = await fs.stat(folderPath);
    if (!folderStats.isDirectory()) {
      throw new Error('Folder path is not a directory');
    }

    // Check if image file exists
    await fs.access(imagePath);

    // Copy image to folder with a standard name
    const imageExt = path.extname(imagePath);
    const backgroundImageName = `.folder-background-image${imageExt}`;
    const destPath = path.join(folderPath, backgroundImageName);

    // Delete old background image if it exists
    try {
      const oldMetadataPath = path.join(folderPath, '.folder-background');
      const oldMetadata = await fs.readFile(oldMetadataPath, 'utf8');
      const oldImageName = oldMetadata.trim();
      if (oldImageName && oldImageName !== backgroundImageName) {
        const oldImagePath = path.join(folderPath, oldImageName);
        try {
          await fs.unlink(oldImagePath);
        } catch {
          // Old image doesn't exist, ignore
        }
      }
    } catch {
      // No old metadata, ignore
    }

    // Copy the new image
    await fs.copyFile(imagePath, destPath);

    // Store the filename in metadata file
    const metadataPath = path.join(folderPath, '.folder-background');
    await fs.writeFile(metadataPath, backgroundImageName, 'utf8');

    return destPath;
  } catch (error) {
    throw new Error(`Failed to set folder background image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Delete file or folder
ipcMain.handle('delete-file', async (event, filePath: string, isFolder: boolean = false) => {
  if (!isSafePath(filePath)) {
    throw new Error('Invalid file path');
  }

  logger.log('[Main] delete-file called:', { filePath, isFolder });

  // ALWAYS check if it's a directory first using fs.stat
  // This is the most reliable way to determine if we need recursive delete
  let isDirectory = false;
  try {
    const stats = await fs.stat(filePath);
    isDirectory = stats.isDirectory();
    logger.log('[Main] Path is directory:', isDirectory);
  } catch (statError) {
    logger.log('[Main] Stat failed:', statError);
    // If stat fails but isFolder parameter is true, treat as directory
    if (isFolder) {
      isDirectory = true;
      logger.log('[Main] Treating as directory based on isFolder parameter');
    }
  }

  // If it's a directory (detected OR explicitly marked as folder), ALWAYS use recursive delete
  if (isDirectory || isFolder) {
    logger.log('[Main] Using recursive delete for folder');
    
    // Small delay to allow any ongoing operations to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simple retry logic for folder deletion (handles occasional EBUSY errors)
    const maxRetries = 3;
    const retryDelays = [200, 500, 1000]; // milliseconds
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await fs.rm(filePath, { recursive: true, force: true });
        logger.log('[Main] Folder deleted successfully');
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorCode = isErrorWithCode(error) ? error.code : undefined;
        const isBusyError = errorCode === 'EBUSY' || errorMessage.includes('EBUSY') || errorMessage.includes('resource busy');
        
        if (isBusyError && attempt < maxRetries - 1) {
          const delay = retryDelays[attempt] || 1000;
          logger.log(`[Main] Folder contains locked files (EBUSY), retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        logger.error('[Main] Failed to delete folder:', error);
        if (isBusyError) {
          throw new Error(`Failed to delete folder: Some files are locked or in use. Please close any applications using files in this folder and try again.`);
        } else {
          throw new Error(`Failed to delete folder: ${errorMessage}`);
        }
      }
    }
  }

  // Only try unlink if we're CERTAIN it's a file (not a directory)
  logger.log('[Main] Deleting as file');
  
  // Initial delay to allow any ongoing operations (like thumbnail generation) to complete
  // WebP files need longer delay as Sharp may process them differently
  const fileExt = path.extname(filePath).toLowerCase();
  const isWebP = fileExt === '.webp';
  const initialDelay = isWebP ? 500 : 200; // WebP files need a bit more time
  await new Promise(resolve => setTimeout(resolve, initialDelay));
  
  // Simple retry logic for file deletion (handles occasional EBUSY errors)
  const maxRetries = 3;
  const retryDelays = [200, 500, 1000]; // milliseconds
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await fs.unlink(filePath);
      logger.log('[Main] File deleted successfully');
      return true;
    } catch (unlinkError) {
      const errorMessage = unlinkError instanceof Error ? unlinkError.message : String(unlinkError);
      const errorCode = isErrorWithCode(unlinkError) ? unlinkError.code : undefined;
      
      // Check if error indicates it's a directory
      const isDirectoryError = 
        errorMessage.includes('EISDIR') || 
        errorMessage.includes('EPERM') ||
        errorMessage.includes('ENOTEMPTY') ||
        errorCode === 'EISDIR' ||
        errorCode === 'EPERM' ||
        errorCode === 'ENOTEMPTY';
      
      if (isDirectoryError) {
        logger.log('[Main] Detected directory error, trying recursive delete as fallback');
        try {
          await fs.rm(filePath, { recursive: true, force: true });
          logger.log('[Main] Folder deleted successfully (fallback)');
          return true;
        } catch (rmError) {
          logger.error('[Main] Recursive delete also failed:', rmError);
          const rmErrorMessage = rmError instanceof Error ? rmError.message : 'Unknown error';
          throw new Error(`Failed to delete folder: ${rmErrorMessage}`);
        }
      }
      
      // Handle EBUSY (file locked) errors with retry
      const isBusyError = errorCode === 'EBUSY' || errorMessage.includes('EBUSY') || errorMessage.includes('resource busy');
      
      if (isBusyError && attempt < maxRetries - 1) {
        const delay = retryDelays[attempt] || 1000;
        logger.log(`[Main] File is locked (EBUSY), retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // Retry
      }
      
      // If it's the last attempt, throw with appropriate error message
      logger.error('[Main] File deletion failed:', unlinkError);
      if (isBusyError) {
        throw new Error(`Failed to delete file: File is locked or in use. Please close any applications using this file and try again.`);
      } else {
        throw new Error(`Failed to delete file: ${errorMessage}`);
      }
    }
  }
});

// Move file to folder
ipcMain.handle('move-file-to-folder', async (event, filePath: string, folderPath: string) => {
  logger.log('[Main] move-file-to-folder called:', { filePath, folderPath });
  
  if (!isSafePath(filePath)) {
    logger.error('[Main] Invalid file path:', filePath);
    return { success: false, error: 'Invalid file path' };
  }

  if (!isSafePath(folderPath)) {
    logger.error('[Main] Invalid folder path:', folderPath);
    return { success: false, error: 'Invalid folder path' };
  }

  try {
    // Verify file exists
    const fileStats = await fs.stat(filePath);
    if (fileStats.isDirectory()) {
      return { success: false, error: 'Cannot move folders using this handler' };
    }

    // Verify folder exists
    const folderStats = await fs.stat(folderPath);
    if (!folderStats.isDirectory()) {
      return { success: false, error: 'Target path is not a directory' };
    }

    // Get filename and construct destination path
    const fileName = path.basename(filePath);
    const destPath = path.join(folderPath, fileName);

    // Check if file already exists in destination
    try {
      await fs.access(destPath);
      return { success: false, error: 'File already exists in destination folder' };
    } catch {
      // File doesn't exist, which is what we want
    }

    // Move the file
    await fs.rename(filePath, destPath);
    logger.log('[Main] File moved successfully:', { from: filePath, to: destPath });

    // If it's a PDF, also move/update thumbnail
    if (filePath.toLowerCase().endsWith('.pdf')) {
      try {
        // Calculate thumbnail paths (same logic as get-pdf-thumbnail-path)
        const oldDir = path.dirname(filePath);
        const oldBaseName = path.basename(filePath, path.extname(filePath));
        const oldThumbnailsDir = path.join(oldDir, '.thumbnails');
        const oldThumbnailPath = path.join(oldThumbnailsDir, `${oldBaseName}.jpg`);
        
        const newDir = path.dirname(destPath);
        const newBaseName = path.basename(destPath, path.extname(destPath));
        const newThumbnailsDir = path.join(newDir, '.thumbnails');
        const newThumbnailPath = path.join(newThumbnailsDir, `${newBaseName}.jpg`);
        
        // Ensure new thumbnails directory exists
        try {
          await fs.access(newThumbnailsDir);
        } catch {
          await fs.mkdir(newThumbnailsDir, { recursive: true });
        }
        
        // Try to move the thumbnail
        try {
          await fs.rename(oldThumbnailPath, newThumbnailPath);
          logger.log('[Main] PDF thumbnail moved:', { from: oldThumbnailPath, to: newThumbnailPath });
        } catch (thumbnailError) {
          // Thumbnail might not exist, that's okay
          logger.debug('[Main] Thumbnail not found or already moved:', thumbnailError);
        }
      } catch (error) {
        logger.warn('[Main] Failed to move PDF thumbnail:', error);
      }
    }

    return { success: true, newPath: destPath };
  } catch (error) {
    logger.error('[Main] Error moving file:', error);
    return { 
      success: false, 
      error: `Failed to move file: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
});

// Rename file or folder
ipcMain.handle('rename-file', async (event, filePath: string, newName: string) => {
  if (!isSafePath(filePath)) {
    throw new Error('Invalid file path');
  }

  if (!newName || !newName.trim()) {
    throw new Error('New name cannot be empty');
  }

  // Validate folder name if it's a directory
  const stats = await fs.stat(filePath).catch(() => null);
  if (stats?.isDirectory() && !isValidFolderName(newName)) {
    throw new Error('Invalid folder name');
  }

  try {
    const dir = path.dirname(filePath);
    const newPath = path.join(dir, newName.trim());
    
    // Check if new path already exists
    try {
      await fs.access(newPath);
      throw new Error('A file or folder with this name already exists');
    } catch (error) {
      // If error is not ENOENT (file doesn't exist), re-throw it
      const errorCode = isErrorWithCode(error) ? error.code : undefined;
      // Re-throw if it's not ENOENT, or if it's our manually thrown error (no code property)
      if (!errorCode || errorCode !== 'ENOENT') {
        throw error;
      }
      // If it's ENOENT, the file doesn't exist, which is what we want - continue
    }

    await fs.rename(filePath, newPath);
    return { success: true, newPath };
  } catch (error) {
    throw new Error(`Failed to rename: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Get file thumbnail
ipcMain.handle('get-file-thumbnail', async (event, filePath: string) => {
  if (!isSafePath(filePath)) {
    throw new Error('Invalid file path');
  }

  try {
    const thumbnail = await generateFileThumbnail(filePath);
    return thumbnail;
  } catch (error) {
    throw new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Get PDF thumbnail file path (industry standard: .thumbnails folder next to PDF)
ipcMain.handle('get-pdf-thumbnail-path', async (event, filePath: string) => {
  if (!isValidPDFFile(filePath) || !isSafePath(filePath)) {
    throw new Error('Invalid PDF file path');
  }

  try {
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const thumbnailsDir = path.join(dir, '.thumbnails');
    
    // Ensure .thumbnails directory exists
    try {
      await fs.access(thumbnailsDir);
    } catch {
      await fs.mkdir(thumbnailsDir, { recursive: true });
    }
    
    // Use base64-encoded filename to handle special characters safely
    // Industry standard: use hash or safe filename encoding
    const safeName = Buffer.from(baseName).toString('base64').replace(/[/+=]/g, '_');
    return path.join(thumbnailsDir, `${safeName}.jpg`);
  } catch (error) {
    throw new Error(`Failed to get thumbnail path: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Save PDF thumbnail to disk
ipcMain.handle('save-pdf-thumbnail', async (event, filePath: string, thumbnailData: string) => {
  if (!isValidPDFFile(filePath) || !isSafePath(filePath)) {
    throw new Error('Invalid PDF file path');
  }

  try {
    // Calculate thumbnail path (same logic as get-pdf-thumbnail-path)
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const thumbnailsDir = path.join(dir, '.thumbnails');
    
    // Ensure .thumbnails directory exists
    try {
      await fs.access(thumbnailsDir);
    } catch {
      await fs.mkdir(thumbnailsDir, { recursive: true });
    }
    
    // Use base64-encoded filename to handle special characters safely
    const safeName = Buffer.from(baseName).toString('base64').replace(/[/+=]/g, '_');
    const thumbnailPath = path.join(thumbnailsDir, `${safeName}.jpg`);

    // Extract base64 data from data URL (format: data:image/jpeg;base64,...)
    const base64Match = thumbnailData.match(/^data:image\/[^;]+;base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid thumbnail data format');
    }

    const imageBuffer = Buffer.from(base64Match[1], 'base64');
    
    // Write thumbnail file atomically (industry standard: write to temp then rename)
    const tempPath = `${thumbnailPath}.tmp`;
    await fs.writeFile(tempPath, imageBuffer);
    await fs.rename(tempPath, thumbnailPath);
  } catch (error) {
    throw new Error(`Failed to save thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Read PDF thumbnail from disk
ipcMain.handle('read-pdf-thumbnail', async (event, filePath: string) => {
  if (!isValidPDFFile(filePath) || !isSafePath(filePath)) {
    throw new Error('Invalid PDF file path');
  }

  try {
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const thumbnailsDir = path.join(dir, '.thumbnails');
    const safeName = Buffer.from(baseName).toString('base64').replace(/[/+=]/g, '_');
    const thumbnailPath = path.join(thumbnailsDir, `${safeName}.jpg`);

    // Check if thumbnail exists
    try {
      await fs.access(thumbnailPath);
    } catch {
      return null; // Thumbnail doesn't exist
    }

    // Check if PDF file is newer than thumbnail (invalidate stale thumbnails)
    const pdfStats = await fs.stat(filePath);
    const thumbnailStats = await fs.stat(thumbnailPath);
    
    if (pdfStats.mtime > thumbnailStats.mtime) {
      // PDF is newer than thumbnail, delete stale thumbnail
      await fs.unlink(thumbnailPath).catch(() => {
        // Ignore errors if file is already deleted
      });
      return null;
    }

    // Read thumbnail file
    const thumbnailBuffer = await fs.readFile(thumbnailPath);
    const base64 = thumbnailBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    // Return null on error (thumbnail doesn't exist or can't be read)
    return null;
  }
});

// Delete PDF thumbnail from disk (industry standard: cleanup on file delete/rename)
ipcMain.handle('delete-pdf-thumbnail', async (event, filePath: string) => {
  if (!isValidPDFFile(filePath) || !isSafePath(filePath)) {
    throw new Error('Invalid PDF file path');
  }

  try {
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const thumbnailsDir = path.join(dir, '.thumbnails');
    const safeName = Buffer.from(baseName).toString('base64').replace(/[/+=]/g, '_');
    const thumbnailPath = path.join(thumbnailsDir, `${safeName}.jpg`);

    // Delete thumbnail file if it exists
    try {
      await fs.unlink(thumbnailPath);
    } catch (error) {
      // Ignore errors if file doesn't exist
      const errorCode = (error as NodeJS.ErrnoException)?.code;
      if (errorCode !== 'ENOENT') {
        // Log non-ENOENT errors but don't throw
        logger.warn(`Failed to delete thumbnail ${thumbnailPath}:`, error);
      }
    }
  } catch (error) {
    // Don't throw - thumbnail deletion is best-effort cleanup
    logger.warn(`Failed to delete thumbnail for ${filePath}:`, error);
  }
});

// Read file data (for viewing)
ipcMain.handle('read-file-data', async (event, filePath: string) => {
  if (!isSafePath(filePath)) {
    throw new Error('Invalid file path');
  }

  try {
    const data = await fs.readFile(filePath);
    const base64 = data.toString('base64');
    const ext = path.extname(filePath).toLowerCase();
    
    // Determine MIME type
    let mimeType = 'application/octet-stream';
    if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.pdf') mimeType = 'application/pdf';
    else if (['.mp4'].includes(ext)) mimeType = 'video/mp4';
    else if (['.webm'].includes(ext)) mimeType = 'video/webm';

    return {
      data: base64,
      mimeType,
      fileName: path.basename(filePath),
    };
  } catch (error) {
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Extract PDF from archive (similar to regular extraction but saves to archive)
ipcMain.handle('extract-pdf-from-archive', async (
  event,
  options: {
    pdfPath: string;
    casePath: string;
    folderName: string;
    saveParentFile: boolean;
    extractedPages: Array<{ pageNumber: number; imageData: string }>;
  }
) => {
  const { pdfPath, casePath, folderName, saveParentFile, extractedPages } = options;

  if (!isSafePath(pdfPath) || !isSafePath(casePath)) {
    throw new Error('Invalid path');
  }

  if (!isValidFolderName(folderName)) {
    throw new Error('Invalid folder name');
  }

  try {
    const extractionFolder = path.join(casePath, folderName);
    await fs.mkdir(extractionFolder, { recursive: true });

    const results: string[] = [];

    // Save parent PDF if requested
    if (saveParentFile) {
      const parentFileName = path.basename(pdfPath);
      const destPath = path.join(extractionFolder, parentFileName);
      await fs.copyFile(pdfPath, destPath);
      results.push(`Parent PDF saved: ${destPath}`);
    }

    // Save extracted pages
    for (const page of extractedPages) {
      // Detect image format from data URL (supports both PNG and JPEG)
      const pngMatch = page.imageData.match(/^data:image\/png;base64,(.+)$/);
      const jpegMatch = page.imageData.match(/^data:image\/jpeg;base64,(.+)$/);
      
      let imageData: string;
      let extension: string;
      
      if (pngMatch) {
        imageData = pngMatch[1];
        extension = 'png';
      } else if (jpegMatch) {
        imageData = jpegMatch[1];
        extension = 'jpg';
      } else {
        // Fallback: try to strip any data URL prefix
        imageData = page.imageData.replace(/^data:image\/[^;]+;base64,/, '');
        extension = 'png'; // Default to PNG for backward compatibility
      }
      
      const buffer = Buffer.from(imageData, 'base64');
      const imagePath = path.join(extractionFolder, `page-${page.pageNumber}.${extension}`);
      await fs.writeFile(imagePath, buffer);
      results.push(`Page ${page.pageNumber} saved: ${imagePath}`);
    }

    return { success: true, messages: results, extractionFolder };
  } catch (error) {
    throw new Error(`Failed to extract PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Settings IPC Handlers

// Get app settings
ipcMain.handle('get-settings', async () => {
  try {
    const settings = await loadSettings();
    return settings;
  } catch (error) {
    logger.error('Failed to get settings:', error);
    throw new Error(`Failed to get settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Update app settings
ipcMain.handle('update-settings', async (event, updates: Partial<import('./utils/settings').AppSettings>) => {
  try {
    const { updateSettings } = await import('./utils/settings');
    const updated = await updateSettings(updates);
    
    // Apply fullscreen change immediately if needed
    if (updates.fullscreen !== undefined && mainWindow) {
      mainWindow.setFullScreen(updates.fullscreen);
    }
    
    return updated;
  } catch (error) {
    logger.error('Failed to update settings:', error);
    throw new Error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Toggle fullscreen
ipcMain.handle('toggle-fullscreen', async () => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not available');
    }
    
    const isFullscreen = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFullscreen);
    
    // Update settings to persist the change
    const { updateSettings } = await import('./utils/settings');
    await updateSettings({ fullscreen: !isFullscreen });
    
    return !isFullscreen;
  } catch (error) {
    logger.error('Failed to toggle fullscreen:', error);
    throw new Error(`Failed to toggle fullscreen: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

