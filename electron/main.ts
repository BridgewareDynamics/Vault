import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { isValidPDFFile, isValidDirectory, isValidFolderName, isSafePath } from './utils/pathValidator';
import * as fs from 'fs/promises';
import * as path from 'path';
import JSZip from 'jszip';
import { loadArchiveConfig, saveArchiveConfig, getArchiveDrive, setArchiveDrive } from './utils/archiveConfig';
import { generateFileThumbnail } from './utils/thumbnailGenerator';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const preloadPath = isDev
    ? join(__dirname, 'preload.cjs')
    : join(process.resourcesPath, 'dist-electron/preload.cjs');

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
    },
    titleBarStyle: 'hiddenInset',
    frame: true,
    show: false, // Don't show until ready
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle page load errors (but ignore DevTools internal errors)
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // Ignore DevTools internal errors
    if (validatedURL && validatedURL.includes('devtools://')) {
      return;
    }
    if (isDev) {
      console.error('Failed to load:', validatedURL, errorDescription);
    }
  });

  if (isDev) {
    // Wait for Vite to be ready, then load
    const loadDevServer = () => {
      mainWindow?.loadURL('http://localhost:5173').catch((err) => {
        console.error('Failed to load Vite dev server, retrying...', err);
        // Retry after 1 second
        setTimeout(loadDevServer, 1000);
      });
    };
    
    // Wait a bit for Vite to start
    setTimeout(loadDevServer, 500);
    
    mainWindow.webContents.once('did-finish-load', () => {
      // Open DevTools after page loads
      setTimeout(() => {
        mainWindow?.webContents.openDevTools();
      }, 100);
    });
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
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
ipcMain.handle('read-pdf-file', async (event, filePath: string) => {
  if (!isValidPDFFile(filePath) || !isSafePath(filePath)) {
    throw new Error('Invalid PDF file path');
  }

  try {
    const data = await fs.readFile(filePath);
    return Array.from(data); // Convert Buffer to array for IPC
  } catch (error) {
    throw new Error(`Failed to read PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Save to config
  await setArchiveDrive(dirPath);
  return dirPath;
});

// Get archive config
ipcMain.handle('get-archive-config', async () => {
  const config = await loadArchiveConfig();
  return config;
});

// Create case folder
ipcMain.handle('create-case-folder', async (event, caseName: string) => {
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
      return casePath;
    }
    throw error;
  }
});

// Create extraction folder
ipcMain.handle('create-extraction-folder', async (event, casePath: string, folderName: string, parentPdfPath?: string) => {
  console.log('[Main] create-extraction-folder called:', { casePath, folderName, parentPdfPath });
  
  if (!isSafePath(casePath)) {
    console.error('[Main] Invalid case path:', casePath);
    throw new Error('Invalid case path');
  }

  if (!folderName || !isValidFolderName(folderName)) {
    console.error('[Main] Invalid folder name:', folderName);
    throw new Error('Invalid folder name');
  }

  try {
    const extractionFolder = path.join(casePath, folderName);
    console.log('[Main] Creating folder at:', extractionFolder);
    await fs.mkdir(extractionFolder, { recursive: true });
    
    // Store parent PDF path in a metadata file if provided
    if (parentPdfPath && isSafePath(parentPdfPath)) {
      const metadataPath = path.join(extractionFolder, '.parent-pdf');
      // Store just the filename of the parent PDF for easier matching
      const parentPdfName = path.basename(parentPdfPath);
      await fs.writeFile(metadataPath, parentPdfName, 'utf8');
      console.log('[Main] Stored parent PDF metadata:', parentPdfName);
    }
    
    // Verify folder was created by checking if it exists
    try {
      const stats = await fs.stat(extractionFolder);
      if (!stats.isDirectory()) {
        throw new Error('Created path is not a directory');
      }
      console.log('[Main] Folder verified, isDirectory:', stats.isDirectory());
    } catch (statError) {
      console.error('[Main] Failed to verify folder:', statError);
      throw new Error(`Failed to verify folder creation: ${statError instanceof Error ? statError.message : 'Unknown error'}`);
    }
    
    console.log('[Main] Folder created successfully:', extractionFolder);
    return extractionFolder;
  } catch (error) {
    console.error('[Main] Error creating folder:', error);
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
    const cases = entries
      .filter(entry => entry.isDirectory())
      .map(entry => ({
        name: entry.name,
        path: path.join(archiveDrive, entry.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Alphabetize

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
    console.log('[Main] list-case-files: Found entries:', entries.length, entries.map(e => ({ name: e.name, isFile: e.isFile(), isDirectory: e.isDirectory() })));
    
    // Process files (exclude hidden metadata files like .parent-pdf)
    const files = await Promise.all(
      entries
        .filter(entry => {
          // Only process files
          if (!entry.isFile()) {
            return false;
          }
          // Exclude .parent-pdf metadata files (case-insensitive check)
          const fileName = entry.name;
          if (fileName === '.parent-pdf' || fileName.toLowerCase() === '.parent-pdf') {
            console.log('[Main] Filtering out metadata file:', fileName);
            return false;
          }
          // Also exclude any file starting with .parent-pdf (for safety)
          if (fileName.toLowerCase().startsWith('.parent-pdf')) {
            console.log('[Main] Filtering out metadata file (starts with):', fileName);
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

    console.log('[Main] list-case-files: Processed - Files:', files.length, 'Folders:', folders.length);
    
    // Group folders with their parent PDFs and sort
    // Strategy: Create a map of PDFs to their folders, then build sorted list with folders above each PDF
    const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    const otherFiles = files.filter(f => !f.name.toLowerCase().endsWith('.pdf'));
    
    // Sort PDFs alphabetically first
    pdfFiles.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create a map: PDF name -> array of folders that belong to it
    const pdfToFoldersMap = new Map<string, typeof folders>();
    
    // Initialize map with all PDFs
    pdfFiles.forEach(pdf => {
      pdfToFoldersMap.set(pdf.name, []);
    });
    
    // Assign folders to their parent PDFs
    folders.forEach(folder => {
      const parentPdfName = (folder as any).parentPdfName;
      
      if (parentPdfName && pdfToFoldersMap.has(parentPdfName)) {
        // Folder has metadata pointing to a PDF - assign it
        pdfToFoldersMap.get(parentPdfName)!.push(folder);
      } else {
        // Fallback: try to match by name and time for folders without metadata
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
          if (folderModified >= pdfModified && (folderModified - pdfModified) < 3600000) {
            score += 5; // Time match
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
    
    // Build the final sorted list: folders above their PDFs, PDFs in alphabetical order
    const groupedItems: Array<typeof files[0] | typeof folders[0]> = [];
    
    // Add folders and their PDFs in alphabetical PDF order
    for (const pdf of pdfFiles) {
      const relatedFolders = pdfToFoldersMap.get(pdf.name) || [];
      // Add folders above the PDF
      groupedItems.push(...relatedFolders);
      // Add the PDF
      groupedItems.push(pdf);
    }
    
    // Add other non-PDF files at the end, sorted alphabetically
    otherFiles.sort((a, b) => a.name.localeCompare(b.name));
    groupedItems.push(...otherFiles);
    
    console.log('[Main] list-case-files: Grouped items - PDFs:', pdfFiles.length, 'Total folders:', folders.length);
    console.log('[Main] list-case-files: Returning total items:', groupedItems.length);
    return groupedItems;
  } catch (error) {
    console.error('[Main] list-case-files: Error:', error);
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
        console.error(`Failed to copy file ${filePath}:`, error);
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
      console.error(`Failed to copy file ${filePath}:`, error);
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

// Delete file or folder
ipcMain.handle('delete-file', async (event, filePath: string, isFolder: boolean = false) => {
  if (!isSafePath(filePath)) {
    throw new Error('Invalid file path');
  }

  console.log('[Main] delete-file called:', { filePath, isFolder });

  // ALWAYS check if it's a directory first using fs.stat
  // This is the most reliable way to determine if we need recursive delete
  let isDirectory = false;
  try {
    const stats = await fs.stat(filePath);
    isDirectory = stats.isDirectory();
    console.log('[Main] Path is directory:', isDirectory);
  } catch (statError) {
    console.log('[Main] Stat failed:', statError);
    // If stat fails but isFolder parameter is true, treat as directory
    if (isFolder) {
      isDirectory = true;
      console.log('[Main] Treating as directory based on isFolder parameter');
    }
  }

  // If it's a directory (detected OR explicitly marked as folder), ALWAYS use recursive delete
  if (isDirectory || isFolder) {
    console.log('[Main] Using recursive delete for folder');
    try {
      await fs.rm(filePath, { recursive: true, force: true });
      console.log('[Main] Folder deleted successfully');
      return true;
    } catch (error) {
      console.error('[Main] Failed to delete folder:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete folder: ${errorMessage}`);
    }
  }

  // Only try unlink if we're CERTAIN it's a file (not a directory)
  console.log('[Main] Deleting as file');
  try {
    await fs.unlink(filePath);
    console.log('[Main] File deleted successfully');
    return true;
  } catch (unlinkError) {
    // If unlink fails with EPERM, EISDIR, or ENOTEMPTY, it's definitely a directory
    // Try recursive delete as fallback
    const errorMessage = unlinkError instanceof Error ? unlinkError.message : String(unlinkError);
    const errorCode = (unlinkError as any)?.code;
    
    console.log('[Main] Unlink failed:', { errorMessage, errorCode });
    
    // Check if error indicates it's a directory
    const isDirectoryError = 
      errorMessage.includes('EISDIR') || 
      errorMessage.includes('EPERM') ||
      errorMessage.includes('ENOTEMPTY') ||
      errorCode === 'EISDIR' ||
      errorCode === 'EPERM' ||
      errorCode === 'ENOTEMPTY';
    
    if (isDirectoryError) {
      console.log('[Main] Detected directory error, trying recursive delete as fallback');
      try {
        await fs.rm(filePath, { recursive: true, force: true });
        console.log('[Main] Folder deleted successfully (fallback)');
        return true;
      } catch (rmError) {
        console.error('[Main] Recursive delete also failed:', rmError);
        const rmErrorMessage = rmError instanceof Error ? rmError.message : 'Unknown error';
        throw new Error(`Failed to delete folder: ${rmErrorMessage}`);
      }
    }
    
    // Re-throw original error if it's not a directory error
    console.error('[Main] File deletion failed:', unlinkError);
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
      if (errorCode && errorCode !== 'ENOENT') {
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

