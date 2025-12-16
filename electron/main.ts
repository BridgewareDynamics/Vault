import { app, BrowserWindow, ipcMain, dialog, crashReporter, protocol } from 'electron';
import { join } from 'path';
import { isValidPDFFile, isValidDirectory, isValidFolderName, isSafePath } from './utils/pathValidator';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import JSZip from 'jszip';
import { loadArchiveConfig, saveArchiveConfig, getArchiveDrive, setArchiveDrive } from './utils/archiveConfig';
import { generateFileThumbnail } from './utils/thumbnailGenerator';
import { createArchiveMarker, readArchiveMarker, isValidArchive, updateArchiveMarker } from './utils/archiveMarker';
import { logger } from './utils/logger';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

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
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
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

function createWindow() {
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

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#0f0f1e',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true, // Explicitly enable web security
    },
    titleBarStyle: 'hiddenInset',
    frame: true,
    show: false, // Don't show until ready
  });

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

app.whenReady().then(() => {
  // Set App User Model ID for Windows icon association
  // This helps Windows properly associate the icon with the application
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.vault.app');
  }
  
  // Register custom protocols before creating window
  registerVideoProtocol();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Renderer logging handler
ipcMain.handle('log-renderer', async (event, level: 'log' | 'info' | 'warn' | 'error' | 'debug', ...args: any[]) => {
  // Use the logger utility to log messages from renderer process
  logger[level](`[Renderer]`, ...args);
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
        const imageData = page.imageData.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(imageData, 'base64');
        folder.file(`page-${page.pageNumber}.png`, buffer);
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
    throw new Error(`Failed to read PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Read PDF file chunk for large files
ipcMain.handle('read-pdf-file-chunk', async (event, filePath: string, start: number, length: number) => {
  if (!isValidPDFFile(filePath) || !isSafePath(filePath)) {
    throw new Error('Invalid PDF file path');
  }

  try {
    const fileHandle = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(length);
    await fileHandle.read(buffer, 0, length, start);
    await fileHandle.close();
    
    // Return as base64 for IPC
    return buffer.toString('base64');
  } catch (error) {
    throw new Error(`Failed to read PDF file chunk: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Get PDF file size
ipcMain.handle('get-pdf-file-size', async (event, filePath: string) => {
  if (!isValidPDFFile(filePath) || !isSafePath(filePath)) {
    throw new Error('Invalid PDF file path');
  }

  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    throw new Error(`Failed to get PDF file size: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
ipcMain.handle('create-case-folder', async (event, caseName: string, description: string = '') => {
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
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Folder doesn't exist, create it
      await fs.mkdir(casePath, { recursive: true });
      
      // Save description if provided
      if (description.trim()) {
        const descriptionPath = path.join(casePath, '.case-description');
        await fs.writeFile(descriptionPath, description.trim(), 'utf8');
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
          
          return {
            name: entry.name,
            path: casePath,
            backgroundImage,
            description,
          };
        })
    );
    
    cases.sort((a, b) => a.name.localeCompare(b.name)); // Alphabetize
    return cases;
  } catch (error) {
    throw new Error(`Failed to list archive cases: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          
          return true;
        })
        .map(async (entry) => {
          const filePath = path.join(casePath, entry.name);
          const stats = await fs.stat(filePath);
          return {
            name: entry.name,
            path: filePath,
            size: stats.size,
            modified: stats.mtime.getTime(),
            isFolder: false,
          };
        })
    );

    // Process folders
    const folders = await Promise.all(
      entries
        .filter(entry => entry.isDirectory())
        .map(async (entry) => {
          const folderPath = path.join(casePath, entry.name);
          const stats = await fs.stat(folderPath);
          
          // Try to read parent PDF metadata
          let parentPdfName: string | null = null;
          try {
            const metadataPath = path.join(folderPath, '.parent-pdf');
            parentPdfName = await fs.readFile(metadataPath, 'utf8');
            parentPdfName = parentPdfName.trim();
          } catch (metadataError) {
            // Metadata file doesn't exist or can't be read - that's okay
            parentPdfName = null;
          }
          
          return {
            name: entry.name,
            path: folderPath,
            size: 0,
            modified: stats.mtime.getTime(),
            isFolder: true,
            folderType: 'extraction' as const,
            parentPdfName: parentPdfName || undefined,
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
      const parentPdfName = (folder as any).parentPdfName;
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
    try {
      await fs.rm(filePath, { recursive: true, force: true });
      logger.log('[Main] Folder deleted successfully');
      return true;
    } catch (error) {
      logger.error('[Main] Failed to delete folder:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete folder: ${errorMessage}`);
    }
  }

  // Only try unlink if we're CERTAIN it's a file (not a directory)
  logger.log('[Main] Deleting as file');
  try {
    await fs.unlink(filePath);
    logger.log('[Main] File deleted successfully');
    return true;
  } catch (unlinkError) {
    // If unlink fails with EPERM, EISDIR, or ENOTEMPTY, it's definitely a directory
    // Try recursive delete as fallback
    const errorMessage = unlinkError instanceof Error ? unlinkError.message : String(unlinkError);
    const errorCode = (unlinkError as any)?.code;
    
    logger.log('[Main] Unlink failed:', { errorMessage, errorCode });
    
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
    
    // Re-throw original error if it's not a directory error
    logger.error('[Main] File deletion failed:', unlinkError);
    throw new Error(`Failed to delete file: ${errorMessage}`);
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
      const errorCode = (error as any)?.code;
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
      const imageData = page.imageData.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(imageData, 'base64');
      const imagePath = path.join(extractionFolder, `page-${page.pageNumber}.png`);
      await fs.writeFile(imagePath, buffer);
      results.push(`Page ${page.pageNumber} saved: ${imagePath}`);
    }

    return { success: true, messages: results, extractionFolder };
  } catch (error) {
    throw new Error(`Failed to extract PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

