import * as fs from 'fs';
import * as path from 'path';
import { LocalDatabase } from './localDatabase';
import { logger } from '../utils/logger';
import { getArchiveDrive } from '../utils/archiveConfig';

/**
 * File system watcher to keep database synchronized with file system changes
 */
export class FileSystemWatcher {
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private db: LocalDatabase;
  private archiveDrive: string | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_MS = 500; // Debounce rapid changes

  constructor(db: LocalDatabase) {
    this.db = db;
  }

  /**
   * Start watching the archive directory
   */
  public async start(): Promise<void> {
    try {
      this.archiveDrive = await getArchiveDrive();
      if (!this.archiveDrive) {
        logger.debug('No archive drive set, file watcher not started');
        return;
      }

      // Watch the archive root
      this.watchDirectory(this.archiveDrive);

      logger.info('File system watcher started');
    } catch (error) {
      logger.error('Failed to start file system watcher:', error);
    }
  }

  /**
   * Stop all watchers
   */
  public stop(): void {
    for (const [dirPath, watcher] of this.watchers) {
      watcher.close();
      logger.debug(`Stopped watching: ${dirPath}`);
    }
    this.watchers.clear();

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    logger.info('File system watcher stopped');
  }

  /**
   * Watch a directory for changes
   */
  private watchDirectory(dirPath: string): void {
    if (this.watchers.has(dirPath)) {
      return; // Already watching
    }

    try {
      const watcher = fs.watch(
        dirPath,
        { recursive: false },
        (eventType, filename) => {
          if (!filename) return;

          // Skip metadata files
          if (filename.startsWith('.')) {
            return;
          }

          const fullPath = path.join(dirPath, filename);

          // Debounce rapid changes
          const timerKey = fullPath;
          const existingTimer = this.debounceTimers.get(timerKey);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }

          const timer = setTimeout(() => {
            this.handleFileSystemChange(eventType, fullPath, dirPath);
            this.debounceTimers.delete(timerKey);
          }, this.DEBOUNCE_MS);

          this.debounceTimers.set(timerKey, timer);
        }
      );

      this.watchers.set(dirPath, watcher);
      logger.debug(`Started watching: ${dirPath}`);
    } catch (error) {
      logger.warn(`Failed to watch directory ${dirPath}:`, error);
    }
  }

  /**
   * Handle file system change event
   */
  private async handleFileSystemChange(
    eventType: string,
    filePath: string,
    parentDir: string
  ): Promise<void> {
    try {
      // Check if it's a case directory or file
      const isCaseDir = parentDir === this.archiveDrive;
      
      if (isCaseDir) {
        // This is a case directory
        await this.handleCaseChange(eventType, filePath);
      } else {
        // This is a file or subfolder within a case
        await this.handleFileChange(eventType, filePath, parentDir);
      }
    } catch (error) {
      logger.warn(`Failed to handle file system change for ${filePath}:`, error);
    }
  }

  /**
   * Handle case directory changes
   */
  private async handleCaseChange(eventType: string, casePath: string): Promise<void> {
    try {
      const stats = await fs.promises.stat(casePath).catch(() => null);
      
      if (eventType === 'rename' && !stats) {
        // Case was deleted
        const existingCase = this.db.getCaseByPath(casePath);
        if (existingCase) {
          this.db.deleteCase(casePath);
          logger.debug(`Case deleted from database: ${casePath}`);
        }
        return;
      }

      if (!stats || !stats.isDirectory()) {
        return;
      }

      // Case was created or modified
      const caseName = path.basename(casePath);
      const existingCase = this.db.getCaseByPath(casePath);

      if (!existingCase) {
        // New case - read metadata and create
        await this.syncCaseToDatabase(casePath);
        logger.debug(`Case added to database: ${caseName}`);
      } else {
        // Existing case - update metadata
        await this.syncCaseToDatabase(casePath);
        logger.debug(`Case updated in database: ${caseName}`);
      }

      // Start watching the case directory
      this.watchDirectory(casePath);
    } catch (error) {
      logger.warn(`Failed to handle case change for ${casePath}:`, error);
    }
  }

  /**
   * Handle file/folder changes within a case
   */
  private async handleFileChange(
    eventType: string,
    filePath: string,
    parentDir: string
  ): Promise<void> {
    try {
      const stats = await fs.promises.stat(filePath).catch(() => null);

      if (eventType === 'rename' && !stats) {
        // File/folder was deleted
        const existingFile = this.db.getFileByPath(filePath);
        if (existingFile) {
          this.db.deleteFile(filePath);
          logger.debug(`File deleted from database: ${filePath}`);
        }
        // Stop watching if it was a directory
        if (this.watchers.has(filePath)) {
          this.watchers.get(filePath)?.close();
          this.watchers.delete(filePath);
        }
        return;
      }

      if (!stats) {
        return;
      }

      const existingFile = this.db.getFileByPath(filePath);

      if (stats.isDirectory()) {
        // Folder was created or modified
        if (!existingFile) {
          await this.syncFolderToDatabase(filePath, parentDir);
          logger.debug(`Folder added to database: ${filePath}`);
        } else {
          await this.syncFolderToDatabase(filePath, parentDir);
          logger.debug(`Folder updated in database: ${filePath}`);
        }
        // Start watching the folder
        this.watchDirectory(filePath);
      } else {
        // File was created or modified
        if (!existingFile) {
          await this.syncFileToDatabase(filePath, parentDir);
          logger.debug(`File added to database: ${filePath}`);
        } else {
          await this.syncFileToDatabase(filePath, parentDir);
          logger.debug(`File updated in database: ${filePath}`);
        }
      }
    } catch (error) {
      logger.warn(`Failed to handle file change for ${filePath}:`, error);
    }
  }

  /**
   * Sync case metadata to database
   */
  private async syncCaseToDatabase(casePath: string): Promise<void> {
    try {
      const stats = await fs.promises.stat(casePath);
      const caseName = path.basename(casePath);
      const caseId = this.db.generateId(casePath);

      // Read metadata files
      const description = await this.readMetadataFile(casePath, '.case-description');
      const backgroundFile = await this.readMetadataFile(casePath, '.case-background');
      const categoryTag = await this.readMetadataFile(casePath, '.case-category-tag');

      let backgroundImage: string | null = null;
      if (backgroundFile) {
        const bgPath = path.join(casePath, backgroundFile.trim());
        try {
          await fs.promises.access(bgPath);
          backgroundImage = bgPath;
        } catch {
          // File doesn't exist
        }
      }

      const existingCase = this.db.getCaseByPath(casePath);
      if (existingCase) {
        // Update existing case
        this.db.updateCase(casePath, {
          description: description?.trim() || null,
          background_image: backgroundImage,
          category_tag_id: categoryTag?.trim() || null,
          local_modified_at: stats.mtime.getTime(),
        });
      } else {
        // Create new case
        this.db.createCase({
          id: caseId,
          name: caseName,
          path: casePath,
          description: description?.trim() || null,
          background_image: backgroundImage,
          category_tag_id: categoryTag?.trim() || null,
          local_modified_at: stats.mtime.getTime(),
          created_at: stats.birthtime.getTime(),
        });
      }
    } catch (error) {
      logger.warn(`Failed to sync case to database: ${casePath}`, error);
    }
  }

  /**
   * Sync file to database
   */
  private async syncFileToDatabase(filePath: string, parentDir: string): Promise<void> {
    try {
      const stats = await fs.promises.stat(filePath);
      const fileName = path.basename(filePath);
      const fileType = this.detectFileType(fileName);
      const checksum = await this.db.calculateChecksum(filePath);
      const fileId = this.db.generateId(filePath);

      // Find case ID from parent directory
      const caseRecord = this.db.getCaseByPath(parentDir);
      if (!caseRecord) {
        logger.warn(`Case not found for file: ${filePath}`);
        return;
      }

      const existingFile = this.db.getFileByPath(filePath);
      if (existingFile) {
        // Update existing file
        this.db.updateFile(filePath, {
          size: stats.size,
          checksum,
          local_modified_at: stats.mtime.getTime(),
        });
      } else {
        // Create new file
        this.db.createFile({
          id: fileId,
          case_id: caseRecord.id,
          name: fileName,
          path: filePath,
          size: stats.size,
          type: fileType,
          is_folder: 0,
          checksum,
          local_modified_at: stats.mtime.getTime(),
          created_at: stats.birthtime.getTime(),
        });
      }
    } catch (error) {
      logger.warn(`Failed to sync file to database: ${filePath}`, error);
    }
  }

  /**
   * Sync folder to database
   */
  private async syncFolderToDatabase(folderPath: string, parentDir: string): Promise<void> {
    try {
      const stats = await fs.promises.stat(folderPath);
      const folderName = path.basename(folderPath);
      const folderId = this.db.generateId(folderPath);

      // Read folder metadata
      const parentPdf = await this.readMetadataFile(folderPath, '.parent-pdf');
      const folderBackground = await this.readMetadataFile(folderPath, '.folder-background');

      let backgroundImage: string | null = null;
      if (folderBackground) {
        const bgPath = path.join(folderPath, folderBackground.trim());
        try {
          await fs.promises.access(bgPath);
          backgroundImage = bgPath;
        } catch {
          // File doesn't exist
        }
      }

      // Find case ID from parent directory
      const caseRecord = this.db.getCaseByPath(parentDir);
      if (!caseRecord) {
        logger.warn(`Case not found for folder: ${folderPath}`);
        return;
      }

      const existingFolder = this.db.getFileByPath(folderPath);
      if (existingFolder) {
        // Update existing folder
        this.db.updateFile(folderPath, {
          folder_type: parentPdf ? 'extraction' : 'case',
          parent_pdf_name: parentPdf?.trim() || null,
          background_image: backgroundImage,
          local_modified_at: stats.mtime.getTime(),
        });
      } else {
        // Create new folder
        this.db.createFile({
          id: folderId,
          case_id: caseRecord.id,
          name: folderName,
          path: folderPath,
          size: 0,
          type: 'other',
          is_folder: 1,
          folder_type: parentPdf ? 'extraction' : 'case',
          parent_pdf_name: parentPdf?.trim() || null,
          background_image: backgroundImage,
          checksum: '',
          local_modified_at: stats.mtime.getTime(),
          created_at: stats.birthtime.getTime(),
        });
      }
    } catch (error) {
      logger.warn(`Failed to sync folder to database: ${folderPath}`, error);
    }
  }

  /**
   * Read metadata file
   */
  private async readMetadataFile(dirPath: string, filename: string): Promise<string | null> {
    try {
      const filePath = path.join(dirPath, filename);
      const content = await fs.promises.readFile(filePath, 'utf8');
      return content;
    } catch {
      return null;
    }
  }

  /**
   * Detect file type from extension
   */
  private detectFileType(filename: string): 'image' | 'pdf' | 'video' | 'other' {
    const ext = path.extname(filename).toLowerCase();
    
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
    
    if (ext === '.pdf') {
      return 'pdf';
    } else if (imageExts.includes(ext)) {
      return 'image';
    } else if (videoExts.includes(ext)) {
      return 'video';
    } else {
      return 'other';
    }
  }
}
