/**
 * TypeScript interfaces matching the database schema
 */

export interface Case {
  id: string;
  name: string;
  path: string;
  background_image: string | null;
  description: string | null;
  category_tag_id: string | null;
  local_modified_at: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  // Sync fields (nullable, for future sync server integration)
  sync_status: string | null;
  last_synced_at: number | null;
  server_modified_at: number | null;
  sync_version: number;
  checksum: string | null;
}

export interface File {
  id: string;
  case_id: string;
  name: string;
  path: string;
  size: number;
  type: 'image' | 'pdf' | 'video' | 'other';
  is_folder: number; // SQLite uses INTEGER for boolean
  folder_type: 'extraction' | 'case' | null;
  parent_pdf_name: string | null;
  thumbnail_path: string | null;
  background_image: string | null;
  category_tag_id: string | null;
  parent_folder_id: string | null;
  checksum: string;
  local_modified_at: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  // Sync fields (nullable, for future sync server integration)
  sync_status: string | null;
  last_synced_at: number | null;
  server_modified_at: number | null;
  sync_version: number;
}

export interface CategoryTag {
  id: string;
  name: string;
  color: string | null;
  local_modified_at: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface SyncMetadata {
  key: string;
  value: string;
  updated_at: number;
}

export interface CaseCreateData {
  id: string;
  name: string;
  path: string;
  background_image?: string | null;
  description?: string | null;
  category_tag_id?: string | null;
  local_modified_at: number;
  created_at: number;
}

export interface CaseUpdateData {
  background_image?: string | null;
  description?: string | null;
  category_tag_id?: string | null;
  local_modified_at?: number;
}

export interface FileCreateData {
  id: string;
  case_id: string;
  name: string;
  path: string;
  size: number;
  type: 'image' | 'pdf' | 'video' | 'other';
  is_folder?: number;
  folder_type?: 'extraction' | 'case' | null;
  parent_pdf_name?: string | null;
  thumbnail_path?: string | null;
  background_image?: string | null;
  category_tag_id?: string | null;
  parent_folder_id?: string | null;
  checksum: string;
  local_modified_at: number;
  created_at: number;
}

export interface FileUpdateData {
  name?: string;
  path?: string;
  size?: number;
  type?: 'image' | 'pdf' | 'video' | 'other';
  folder_type?: 'extraction' | 'case' | null;
  parent_pdf_name?: string | null;
  thumbnail_path?: string | null;
  background_image?: string | null;
  category_tag_id?: string | null;
  parent_folder_id?: string | null;
  checksum?: string;
  local_modified_at?: number;
  case_id?: string;
}

export interface MigrationResult {
  cases: number;
  files: number;
  errors: string[];
}
