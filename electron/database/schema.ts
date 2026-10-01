/**
 * SQL schema definitions for the local database
 */

export const SCHEMA = `
-- Cases table
CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT UNIQUE NOT NULL,
    background_image TEXT,
    description TEXT,
    category_tag_id TEXT,
    local_modified_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    -- Sync fields (nullable, for future sync server integration)
    sync_status TEXT,
    last_synced_at INTEGER,
    server_modified_at INTEGER,
    sync_version INTEGER NOT NULL DEFAULT 1,
    checksum TEXT
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    name TEXT NOT NULL,
    path TEXT UNIQUE NOT NULL,
    size INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('image', 'pdf', 'video', 'other')),
    is_folder INTEGER NOT NULL DEFAULT 0,
    folder_type TEXT CHECK(folder_type IN ('extraction', 'case')),
    parent_pdf_name TEXT,
    thumbnail_path TEXT,
    background_image TEXT,
    category_tag_id TEXT,
    parent_folder_id TEXT,
    checksum TEXT NOT NULL,
    local_modified_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    -- Sync fields (nullable, for future sync server integration)
    sync_status TEXT,
    last_synced_at INTEGER,
    server_modified_at INTEGER,
    sync_version INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_folder_id) REFERENCES files(id)
);

-- Category tags table
CREATE TABLE IF NOT EXISTS category_tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    local_modified_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER
);

-- Sync metadata table (tracks migration and sync state)
CREATE TABLE IF NOT EXISTS sync_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_path ON cases(path);
CREATE INDEX IF NOT EXISTS idx_cases_deleted ON cases(deleted_at);
CREATE INDEX IF NOT EXISTS idx_files_case_id ON files(case_id);
CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(deleted_at);
CREATE INDEX IF NOT EXISTS idx_category_tags_name ON category_tags(name);
`;
