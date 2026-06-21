import * as fs from 'fs/promises';
import * as path from 'path';
import { LocalDatabase } from './localDatabase';
import { MigrationResult, CaseCreateData, FileCreateData } from './models';
import { logger } from '../utils/logger';
import { readArchiveMarker } from '../utils/archiveMarker';

/**
 * One-time migration: Scan metadata files and populate database
 */
export async function migrateMetadataFilesToDatabase(
  archiveDrive: string,
  db: LocalDatabase
): Promise<MigrationResult> {
  const results: MigrationResult = {
    cases: 0,
    files: 0,
    errors: [],
  };

  try {
    logger.info('Starting migration from metadata files to database...');

    // Check if archive drive exists
    try {
      await fs.access(archiveDrive);
    } catch {
      results.errors.push(`Archive drive does not exist: ${archiveDrive}`);
      return results;
    }

    // Scan archive root for cases
    const entries = await fs.readdir(archiveDrive, { withFileTypes: true });
    const caseDirs = entries.filter(
      (entry) =>
        entry.isDirectory() &&
        !['.bookmark-thumbnails', 'textlibrary'].includes(entry.name.toLowerCase())
    );

    logger.debug(`Found ${caseDirs.length} cases to migrate from ${archiveDrive}`);
    
    if (caseDirs.length === 0) {
      logger.warn(`No case directories found in archive drive: ${archiveDrive}`);
      logger.warn('Make sure the archive drive is set correctly and contains case folders');
    }

    // Migrate each case
    for (const caseDir of caseDirs) {
      logger.debug(`Migrating case: ${caseDir.name}`);
      try {
        const casePath = path.join(archiveDrive, caseDir.name);
        await migrateCase(casePath, db, results);
      } catch (error) {
        const errorMsg = `Failed to migrate case ${caseDir.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    // Migrate archive marker
    try {
      const marker = await readArchiveMarker(archiveDrive);
      if (marker) {
        db.setSyncMetadata('archive_id', marker.archiveId);
        db.setSyncMetadata('archive_version', marker.version);
        db.setSyncMetadata('archive_case_count', String(marker.caseCount || results.cases));
        db.setSyncMetadata('archive_last_modified', String(marker.lastModified));
      }
    } catch (error) {
      logger.warn('Failed to migrate archive marker:', error);
      // Not critical, continue
    }

    // Only mark migration as completed if we actually found and migrated data
    // If we found 0 cases, something went wrong - don't mark as complete
    // Also check: if we have cases but 0 files, something went wrong with file migration
    if (results.cases > 0 && results.files === 0) {
      logger.warn(`Migration found ${results.cases} cases but 0 files - file migration may have failed`);
      logger.warn('Not marking migration as complete - files need to be migrated');
      results.errors.push('Cases migrated but no files found - file migration may have failed');
    } else if (results.cases > 0 || results.files > 0) {
      db.markMigrationCompleted();
      logger.info(`Migration completed: ${results.cases} cases, ${results.files} files`);
    } else {
      logger.warn('Migration found 0 cases and 0 files - not marking as completed. Archive drive may not be set or may be empty.');
      results.errors.push('Migration found no data - archive drive may not be configured or may be empty');
    }
    
    if (results.errors.length > 0) {
      logger.warn(`Migration had ${results.errors.length} errors`);
    }

    return results;
  } catch (error) {
    const errorMsg = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);
    results.errors.push(errorMsg);
    return results;
  }
}

/**
 * Migrate a single case and its files
 */
async function migrateCase(
  casePath: string,
  db: LocalDatabase,
  results: MigrationResult
): Promise<void> {
  try {
    // Read case metadata files
    const description = await readMetadataFile(casePath, '.case-description');
    const backgroundFile = await readMetadataFile(casePath, '.case-background');
    const categoryTag = await readMetadataFile(casePath, '.case-category-tag');

    // Get background image path if metadata exists
    let backgroundImage: string | null = null;
    if (backgroundFile) {
      const bgPath = path.join(casePath, backgroundFile.trim());
      try {
        await fs.access(bgPath);
        backgroundImage = bgPath;
      } catch {
        // File doesn't exist, ignore
      }
    }

    // Get case stats
    const stats = await fs.stat(casePath);
    const caseName = path.basename(casePath);
    let caseId = db.generateId(casePath);

    // Check if case already exists in database
    const existingCase = db.getCaseByPath(casePath);
    if (existingCase) {
      logger.debug(`Case already exists in database: ${caseName}`);
      // Update it with latest metadata
      db.updateCase(casePath, {
        description: description?.trim() || null,
        background_image: backgroundImage,
        category_tag_id: categoryTag?.trim() || null,
        local_modified_at: stats.mtime.getTime(),
      });
      // Use existing case ID for file migration
      caseId = existingCase.id;
    } else {
      // Create case record
      const caseData: CaseCreateData = {
        id: caseId,
        name: caseName,
        path: casePath,
        description: description?.trim() || null,
        background_image: backgroundImage,
        category_tag_id: categoryTag?.trim() || null,
        local_modified_at: stats.mtime.getTime(),
        created_at: stats.birthtime.getTime(),
      };

      db.createCase(caseData);
      results.cases++;
    }

    // Recursively migrate case files and folders (always migrate files, even if case exists)
    logger.debug(`Migrating files for case: ${caseName} (ID: ${caseId})`);
    await migrateCaseFiles(casePath, caseId, db, results);
  } catch (error) {
    throw new Error(`Failed to migrate case ${casePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Recursively migrate files and folders within a case
 */
async function migrateCaseFiles(
  casePath: string,
  caseId: string,
  db: LocalDatabase,
  results: MigrationResult,
  parentFolderId: string | null = null
): Promise<void> {
  try {
    const entries = await fs.readdir(casePath, { withFileTypes: true });

    // Separate files and folders
    const fileEntries: Array<{ name: string; path: string }> = [];
    const folderEntries: Array<{ name: string; path: string }> = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.')) {
        continue; // Skip metadata files
      }
      const entryPath = path.join(casePath, entry.name);
      if (entry.isDirectory()) {
        folderEntries.push({ name: entry.name, path: entryPath });
      } else if (entry.isFile()) {
        fileEntries.push({ name: entry.name, path: entryPath });
      }
    }

    // FIRST: Process folders (so they exist when we need to reference them)
    for (const folderEntry of folderEntries) {
      try {
        const entryPath = folderEntry.path;
        logger.debug(`  Migrating folder: ${folderEntry.name}`);
        const stats = await fs.stat(entryPath);

        // Read folder metadata
        const parentPdf = await readMetadataFile(entryPath, '.parent-pdf');
        const folderBackground = await readMetadataFile(entryPath, '.folder-background');

        let backgroundImage: string | null = null;
        if (folderBackground) {
          const bgPath = path.join(entryPath, folderBackground.trim());
          try {
            await fs.access(bgPath);
            backgroundImage = bgPath;
          } catch {
            // File doesn't exist, ignore
          }
        }

        const folderId = db.generateId(entryPath);

        // Check if folder already exists
        const existingFolder = db.getFileByPath(entryPath);
        if (existingFolder) {
          logger.debug(`Folder already exists in database: ${folderEntry.name}`);
          // Update it
          db.updateFile(entryPath, {
            folder_type: parentPdf ? 'extraction' : 'case',
            parent_pdf_name: parentPdf?.trim() || null,
            background_image: backgroundImage,
            local_modified_at: stats.mtime.getTime(),
          });
        } else {
          const folderData: FileCreateData = {
            id: folderId,
            case_id: caseId,
            name: folderEntry.name,
            path: entryPath,
            size: 0,
            type: 'other',
            is_folder: 1,
            folder_type: parentPdf ? 'extraction' : 'case',
            parent_pdf_name: parentPdf?.trim() || null,
            background_image: backgroundImage,
            checksum: '', // Folders don't have content checksums
            parent_folder_id: parentFolderId,
            local_modified_at: stats.mtime.getTime(),
            created_at: stats.birthtime.getTime(),
          };

          db.createFile(folderData);
          results.files++;
        }

        // Recursively migrate subfolders and files inside this folder
        await migrateCaseFiles(entryPath, caseId, db, results, folderId);
      } catch (error) {
        logger.warn(`Failed to migrate folder ${folderEntry.name}:`, error);
        // Continue with other entries
      }
    }

    // SECOND: Process files at this level (case root or folder root)
    for (const fileEntry of fileEntries) {
      try {
        const entryPath = fileEntry.path;
        // Migrate file
        const stats = await fs.stat(entryPath);
        const fileType = detectFileType(fileEntry.name);
        const checksum = await db.calculateChecksum(entryPath);
        const fileId = db.generateId(entryPath);
        logger.debug(`  Migrating file: ${fileEntry.name}`);

        // Check if file already exists
        const existingFile = db.getFileByPath(entryPath);
        if (existingFile) {
          logger.debug(`File already exists in database: ${fileEntry.name}`);
          // Update it - also fix parent_folder_id if it's wrong
          db.updateFile(entryPath, {
            size: stats.size,
            checksum,
            local_modified_at: stats.mtime.getTime(),
            parent_folder_id: parentFolderId, // Fix parent folder if it was wrong
          });
        } else {
            // Read category tag if exists
            let categoryTagId: string | null = null;
            try {
              const tagPath = path.join(casePath, `.${fileEntry.name}.tag`);
              const tagContent = await fs.readFile(tagPath, 'utf8');
              categoryTagId = tagContent.trim() || null;
            } catch {
              // No tag file, that's okay
            }

            const fileData: FileCreateData = {
              id: fileId,
              case_id: caseId,
              name: fileEntry.name,
              path: entryPath,
              size: stats.size,
              type: fileType,
              is_folder: 0,
              checksum,
              category_tag_id: categoryTagId,
              parent_folder_id: parentFolderId,
              local_modified_at: stats.mtime.getTime(),
              created_at: stats.birthtime.getTime(),
            };

            db.createFile(fileData);
            results.files++;
          }
      } catch (error) {
        logger.warn(`Failed to migrate file ${fileEntry.name}:`, error);
        // Continue with other entries
      }
    }
  } catch (error) {
    logger.warn(`Failed to read directory ${casePath}:`, error);
    // Continue with other cases
  }
}

/**
 * Helper: Read metadata file (returns null if doesn't exist)
 */
async function readMetadataFile(
  dirPath: string,
  filename: string
): Promise<string | null> {
  try {
    const filePath = path.join(dirPath, filename);
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch {
    return null; // File doesn't exist, that's okay
  }
}

/**
 * Detect file type from extension
 */
function detectFileType(filename: string): 'image' | 'pdf' | 'video' | 'other' {
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
