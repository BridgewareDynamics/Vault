import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { calculateStreamingSha256 } from '../utils/streamChecksum';
import { SCHEMA } from './schema';
import {
  Case,
  File,
  CategoryTag,
  SyncMetadata,
  CaseCreateData,
  CaseUpdateData,
  FileCreateData,
  FileUpdateData,
} from './models';
import { logger } from '../utils/logger';

/**
 * Local SQLite database service
 * Singleton pattern for database connection
 */
export class LocalDatabase {
  private static instance: LocalDatabase | null = null;
  private db: Database.Database | null = null;
  private dbPath: string;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    if (!app.isReady()) {
      throw new Error('App is not ready yet');
    }
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'vault.db');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): LocalDatabase {
    if (!LocalDatabase.instance) {
      LocalDatabase.instance = new LocalDatabase();
    }
    return LocalDatabase.instance;
  }

  /**
   * Initialize database - create tables if they don't exist
   */
  public async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this._doInitialize();
    try {
      await this.initializationPromise;
    } catch (error) {
      this.initializationPromise = null; // Reset on error so it can be retried
      throw error;
    }
  }

  /**
   * Internal initialization method
   */
  private async _doInitialize(): Promise<void> {
    try {
      // Open database connection
      this.db = new Database(this.dbPath);
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Create tables
      this.db.exec(SCHEMA);
      
      this.initialized = true;
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Check if database is initialized
   */
  public isInitialized(): boolean {
    return this.initialized && this.db !== null;
  }

  /**
   * Wait for database to be initialized (useful for IPC handlers)
   */
  public async waitForInitialization(): Promise<void> {
    if (this.initialized) {
      return;
    }
    if (this.initializationPromise) {
      await this.initializationPromise;
    } else {
      throw new Error('Database initialization not started');
    }
  }

  /**
   * Close database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('Database connection closed');
    }
  }

  /**
   * Get database instance (for internal use)
   */
  private getDb(): Database.Database {
    if (!this.initialized || !this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // ==================== Case Operations ====================

  /**
   * Get all cases (excluding deleted)
   */
  public getCases(): Case[] {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM cases 
      WHERE deleted_at IS NULL 
      ORDER BY name
    `);
    return stmt.all() as Case[];
  }

  /**
   * Get case by path
   */
  public getCaseByPath(casePath: string): Case | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM cases WHERE path = ? AND deleted_at IS NULL');
    return (stmt.get(casePath) as Case) || null;
  }

  /**
   * Get case by ID
   */
  public getCaseById(id: string): Case | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM cases WHERE id = ? AND deleted_at IS NULL');
    return (stmt.get(id) as Case) || null;
  }

  /**
   * Create new case
   */
  public createCase(data: CaseCreateData): Case {
    const db = this.getDb();
    const now = Date.now();
    const stmt = db.prepare(`
      INSERT INTO cases (
        id, name, path, background_image, description, category_tag_id,
        local_modified_at, created_at, updated_at, sync_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    
    stmt.run(
      data.id,
      data.name,
      data.path,
      data.background_image || null,
      data.description || null,
      data.category_tag_id || null,
      data.local_modified_at,
      data.created_at,
      now
    );

    return this.getCaseById(data.id)!;
  }

  /**
   * Update case
   */
  public updateCase(casePath: string, updates: CaseUpdateData): void {
    const db = this.getDb();
    const now = Date.now();
    
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.background_image !== undefined) {
      fields.push('background_image = ?');
      values.push(updates.background_image);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.category_tag_id !== undefined) {
      fields.push('category_tag_id = ?');
      values.push(updates.category_tag_id);
    }
    if (updates.local_modified_at !== undefined) {
      fields.push('local_modified_at = ?');
      values.push(updates.local_modified_at);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(casePath);

    const stmt = db.prepare(`
      UPDATE cases 
      SET ${fields.join(', ')} 
      WHERE path = ? AND deleted_at IS NULL
    `);
    
    stmt.run(...values);
  }

  /**
   * Soft delete case
   */
  public deleteCase(casePath: string): void {
    const db = this.getDb();
    const now = Date.now();
    const stmt = db.prepare(`
      UPDATE cases 
      SET deleted_at = ?, updated_at = ? 
      WHERE path = ?
    `);
    stmt.run(now, now, casePath);
  }

  // ==================== File Operations ====================

  /**
   * Get files in a case (excluding deleted)
   */
  public getFiles(casePath: string): File[] {
    const db = this.getDb();
    // First get the case to find its ID
    const caseRecord = this.getCaseByPath(casePath);
    if (!caseRecord) {
      logger.warn(`getFiles: Case not found for path: ${casePath}`);
      return [];
    }

    // Only return root-level files (files at case root, not inside folders)
    const stmt = db.prepare(`
      SELECT * FROM files 
      WHERE case_id = ? AND deleted_at IS NULL AND (parent_folder_id IS NULL OR parent_folder_id = '')
      ORDER BY is_folder DESC, name
    `);
    const files = stmt.all(caseRecord.id) as File[];
    logger.debug(`getFiles: Found ${files.length} root-level files for case: ${casePath} (case_id: ${caseRecord.id})`);
    return files;
  }

  /**
   * Get file by path
   */
  public getFileByPath(filePath: string): File | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM files WHERE path = ? AND deleted_at IS NULL');
    return (stmt.get(filePath) as File) || null;
  }

  /**
   * Get file by ID
   */
  public getFileById(id: string): File | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM files WHERE id = ? AND deleted_at IS NULL');
    return (stmt.get(id) as File) || null;
  }

  /**
   * Create new file
   */
  public createFile(data: FileCreateData): File {
    const db = this.getDb();
    const now = Date.now();
    const stmt = db.prepare(`
      INSERT INTO files (
        id, case_id, name, path, size, type, is_folder, folder_type,
        parent_pdf_name, thumbnail_path, background_image, category_tag_id,
        parent_folder_id, checksum, local_modified_at, created_at, updated_at, sync_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      data.id,
      data.case_id,
      data.name,
      data.path,
      data.size,
      data.type,
      data.is_folder || 0,
      data.folder_type || null,
      data.parent_pdf_name || null,
      data.thumbnail_path || null,
      data.background_image || null,
      data.category_tag_id || null,
      data.parent_folder_id || null,
      data.checksum,
      data.local_modified_at,
      data.created_at,
      now,
      1 // sync_version
    );

    return this.getFileById(data.id)!;
  }

  /**
   * Update file
   */
  public updateFile(filePath: string, updates: FileUpdateData): void {
    const db = this.getDb();
    const now = Date.now();
    
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.path !== undefined) {
      fields.push('path = ?');
      values.push(updates.path);
    }
    if (updates.size !== undefined) {
      fields.push('size = ?');
      values.push(updates.size);
    }
    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.folder_type !== undefined) {
      fields.push('folder_type = ?');
      values.push(updates.folder_type);
    }
    if (updates.parent_pdf_name !== undefined) {
      fields.push('parent_pdf_name = ?');
      values.push(updates.parent_pdf_name);
    }
    if (updates.thumbnail_path !== undefined) {
      fields.push('thumbnail_path = ?');
      values.push(updates.thumbnail_path);
    }
    if (updates.background_image !== undefined) {
      fields.push('background_image = ?');
      values.push(updates.background_image);
    }
    if (updates.category_tag_id !== undefined) {
      fields.push('category_tag_id = ?');
      values.push(updates.category_tag_id);
    }
    if (updates.parent_folder_id !== undefined) {
      fields.push('parent_folder_id = ?');
      values.push(updates.parent_folder_id);
    }
    if (updates.checksum !== undefined) {
      fields.push('checksum = ?');
      values.push(updates.checksum);
    }
    if (updates.local_modified_at !== undefined) {
      fields.push('local_modified_at = ?');
      values.push(updates.local_modified_at);
    }
    if (updates.case_id !== undefined) {
      fields.push('case_id = ?');
      values.push(updates.case_id);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(filePath);

    const stmt = db.prepare(`
      UPDATE files 
      SET ${fields.join(', ')} 
      WHERE path = ? AND deleted_at IS NULL
    `);
    
    stmt.run(...values);
  }

  /**
   * Soft delete file
   */
  public deleteFile(filePath: string): void {
    const db = this.getDb();
    const now = Date.now();
    const stmt = db.prepare(`
      UPDATE files 
      SET deleted_at = ?, updated_at = ? 
      WHERE path = ?
    `);
    stmt.run(now, now, filePath);
  }

  // ==================== Category Tag Operations ====================

  /**
   * Get all category tags (excluding deleted)
   */
  public getCategoryTags(): CategoryTag[] {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM category_tags 
      WHERE deleted_at IS NULL 
      ORDER BY name
    `);
    return stmt.all() as CategoryTag[];
  }

  /**
   * Create category tag
   */
  public createCategoryTag(tag: { id: string; name: string; color: string | null }): CategoryTag {
    const db = this.getDb();
    const now = Date.now();
    const stmt = db.prepare(`
      INSERT INTO category_tags (id, name, color, local_modified_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(tag.id, tag.name, tag.color, now, now, now);
    
    const getStmt = db.prepare('SELECT * FROM category_tags WHERE id = ?');
    return getStmt.get(tag.id) as CategoryTag;
  }

  /**
   * Delete category tag (soft delete)
   */
  public deleteCategoryTag(tagId: string): void {
    const db = this.getDb();
    const now = Date.now();
    const stmt = db.prepare(`
      UPDATE category_tags 
      SET deleted_at = ?, updated_at = ? 
      WHERE id = ?
    `);
    stmt.run(now, now, tagId);
  }

  // ==================== Sync Metadata Operations ====================

  /**
   * Get sync metadata value
   */
  public getSyncMetadata(key: string): string | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT value FROM sync_metadata WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result?.value || null;
  }

  /**
   * Set sync metadata value
   */
  public setSyncMetadata(key: string, value: string): void {
    const db = this.getDb();
    const now = Date.now();
    const stmt = db.prepare(`
      INSERT INTO sync_metadata (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `);
    stmt.run(key, value, now, value, now);
  }

  // ==================== Utility Operations ====================

  /**
   * Calculate SHA-256 checksum of a file
   */
  public async calculateChecksum(filePath: string): Promise<string> {
    try {
      const checksum = await calculateStreamingSha256(filePath);
      if (!checksum) {
        logger.error(`Failed to calculate checksum for ${filePath}: empty digest`);
      }
      return checksum;
    } catch (error) {
      logger.error(`Failed to calculate checksum for ${filePath}:`, error);
      return '';
    }
  }

  /**
   * Generate ID from path (deterministic)
   */
  public generateId(path: string): string {
    return crypto.createHash('sha256').update(path).digest('hex').substring(0, 32);
  }

  /**
   * Check if migration has been completed
   */
  public isMigrationCompleted(): boolean {
    const value = this.getSyncMetadata('migration_completed');
    return value === 'true';
  }

  /**
   * Mark migration as completed
   */
  public markMigrationCompleted(): void {
    this.setSyncMetadata('migration_completed', 'true');
  }

  /**
   * Clear migration flag (force re-migration)
   */
  public clearMigrationFlag(): void {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM sync_metadata WHERE key = ?');
    stmt.run('migration_completed');
    logger.info('Migration flag cleared - migration will run on next startup');
  }

  /**
   * Get database path (for testing/debugging)
   */
  public getDatabasePath(): string {
    return this.dbPath;
  }
}
