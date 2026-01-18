# Vault Sync Server Implementation Plan

## Architecture Overview

The sync server is a single, downloadable FastAPI application that runs locally on the user's machine. It maintains a local SQLite database mirroring the Vault structure and provides synchronization endpoints. The server behaves exactly like the current offline mode but adds the ability to sync data between multiple Vault clients when they connect to the same server instance.

### System Components

```javascript
┌─────────────────┐         ┌──────────────────┐
│   Vault Client  │◄───────►│  Sync Server     │
│   (Electron)    │ HTTP/   │  (FastAPI)       │
│                 │ HTTPS   │                  │
│ - UI Components │         │ - Local SQLite   │
│ - Sync Status   │         │ - File Storage   │
│ - Config UI     │         │ - Sync Engine    │
└─────────────────┘         └──────────────────┘
                                ▲
                                │ (optional)
                                │ HTTP/HTTPS
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────▼──────┐      ┌────────▼──────┐
            │ Vault Client │      │ Vault Client  │
            │  (other PC)  │      │  (other PC)   │
            └──────────────┘      └───────────────┘
```

**Key Points:**

- Single downloadable server component (FastAPI application)
- Server runs locally on user's machine (like current offline mode)
- Multiple Vault clients can connect to the same server instance for sync
- Server uses SQLite for local storage (no separate database server required)
- All operations work offline; sync happens when clients are connected

## Implementation Structure

### 1. Server Component (`server/` directory)

**FastAPI Application Structure:**

```
server/
├── main.py                 # FastAPI app entry point, route registration
├── config.py              # Application configuration
├── models/                # Pydantic models for API requests/responses
│   ├── __init__.py
│   ├── auth.py           # Authentication models
│   ├── cases.py          # Case models
│   ├── files.py          # File models
│   ├── bookmarks.py      # Bookmark models
│   ├── sync.py           # Sync operation models
│   └── common.py         # Common/shared models
├── database/             # SQLite database models and migrations
│   ├── __init__.py
│   ├── models.py         # SQLAlchemy ORM models
│   ├── connection.py    # Database connection management
│   ├── migrations/       # Alembic migrations
│   │   ├── versions/
│   │   └── env.py
│   └── seed.py          # Database seeding (if needed)
├── sync/                 # Sync engine logic
│   ├── __init__.py
│   ├── engine.py        # Main sync engine
│   ├── delta.py         # Delta detection logic
│   ├── conflict.py      # Conflict detection and resolution
│   ├── merge.py         # Three-way merge for text files
│   └── queue.py         # Sync queue management
├── storage/             # File storage management
│   ├── __init__.py
│   ├── manager.py       # File storage manager
│   ├── chunks.py        # Chunked file handling
│   └── checksum.py      # Checksum calculation and verification
├── auth/                # Authentication and authorization
│   ├── __init__.py
│   ├── jwt.py          # JWT token handling
│   ├── api_key.py      # API key authentication
│   └── middleware.py   # Auth middleware
├── api/                 # API route handlers
│   ├── __init__.py
│   ├── v1/             # Version 1 API routes
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── cases.py
│   │   ├── files.py
│   │   ├── bookmarks.py
│   │   ├── sync.py
│   │   └── health.py
│   └── dependencies.py # Shared dependencies (auth, db)
├── config/             # Configuration management
│   ├── __init__.py
│   ├── loader.py       # Config file loading
│   └── validator.py    # Config validation
├── utils/              # Utility functions
│   ├── __init__.py
│   ├── logging.py     # Logging setup
│   ├── validation.py  # Data validation
│   ├── path.py        # Path validation and sanitization
│   └── errors.py      # Error handling utilities
├── tests/              # Test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── pyproject.toml      # Python project configuration
├── requirements.txt    # Python dependencies
├── build.py           # Build script for executables
└── README.md           # Server documentation
```

**Key Features:**

- Local-first architecture: all operations work offline
- Delta sync: only sync changed items since last sync
- Per-case sync: track sync status per case
- Conflict resolution: last-write-wins with conflict logging
- File chunking: handle large files efficiently
- Background sync: automatic periodic sync when online

### 2. Client Integration (`src/` additions)

**New Components:**

- `src/components/Sync/` - Sync UI components
- `SyncPanel.tsx` - Main sync configuration panel
- `SyncStatusIndicator.tsx` - Visual indicator for unsynced changes
- `CaseSyncControls.tsx` - Per-case sync controls
- `SyncProgress.tsx` - Progress display during sync
- `src/hooks/useSync.ts` - Sync state management hook
- `src/services/syncService.ts` - HTTP client for sync API calls

**IPC Handlers (in `electron/main.ts`):**

**Configuration:**

- `sync-get-config` - Get sync server configuration
- `sync-set-config` - Set sync server configuration
- `sync-check-connection` - Test server connection
- `sync-validate-ssl` - Validate SSL certificate (for HTTPS)

**Status and Monitoring:**

- `sync-get-status` - Get sync status for cases
- `sync-get-case-status` - Get sync status for specific case
- `sync-get-progress` - Get progress for active sync operation
- `sync-get-conflicts` - Get list of conflicts requiring resolution

**Sync Operations:**

- `sync-case` - Sync a specific case
- `sync-all-cases` - Sync all cases (with warning)
- `sync-pause` - Pause active sync operation
- `sync-resume` - Resume paused sync operation
- `sync-cancel` - Cancel active sync operation

**Conflict Resolution:**

- `sync-resolve-conflict` - Resolve a specific conflict
- `sync-resolve-conflicts-batch` - Batch resolve multiple conflicts

**File Operations:**

- `sync-upload-file` - Upload file to sync server
- `sync-download-file` - Download file from sync server
- `sync-verify-file` - Verify file integrity (checksum)

**Logging and History:**

- `sync-get-log` - Get sync operation history
- `sync-clear-log` - Clear sync log (admin)

### 3. Data Models

**Server Database Schema (SQLite):**

- `cases` - Case metadata with sync tracking
- `files` - File metadata with sync tracking
- `bookmarks` - Bookmark data
- `word_editor_files` - Word editor file content
- `category_tags` - Category tag definitions
- `sync_log` - Sync operation history
- `sync_queue` - Pending sync operations

**Sync Metadata Fields:**

- `sync_status` - 'synced', 'pending', 'conflict', 'error'
- `last_synced_at` - Timestamp of last successful sync
- `local_modified_at` - Local modification timestamp
- `server_modified_at` - Server modification timestamp
- `sync_version` - Version number for conflict detection

**Detailed Database Schema:**

```sql
-- Cases table
CREATE TABLE cases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT UNIQUE NOT NULL,
    background_image TEXT,
    description TEXT,
    category_tag_id TEXT,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('synced', 'pending', 'conflict', 'error')),
    last_synced_at INTEGER,
    local_modified_at INTEGER NOT NULL,
    server_modified_at INTEGER,
    sync_version INTEGER NOT NULL DEFAULT 1,
    checksum TEXT, -- SHA-256 hash of case metadata
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER, -- Soft delete support
    FOREIGN KEY (category_tag_id) REFERENCES category_tags(id)
);
CREATE INDEX idx_cases_sync_status ON cases(sync_status);
CREATE INDEX idx_cases_last_synced ON cases(last_synced_at);
CREATE INDEX idx_cases_path ON cases(path);

-- Files table
CREATE TABLE files (
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
    parent_folder_id TEXT, -- For nested folder structure
    sync_status TEXT NOT NULL DEFAULT 'pending',
    last_synced_at INTEGER,
    local_modified_at INTEGER NOT NULL,
    server_modified_at INTEGER,
    sync_version INTEGER NOT NULL DEFAULT 1,
    checksum TEXT NOT NULL, -- SHA-256 hash of file content
    chunk_count INTEGER DEFAULT 1, -- For large file chunking
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (category_tag_id) REFERENCES category_tags(id),
    FOREIGN KEY (parent_folder_id) REFERENCES files(id)
);
CREATE INDEX idx_files_case_id ON files(case_id);
CREATE INDEX idx_files_sync_status ON files(sync_status);
CREATE INDEX idx_files_checksum ON files(checksum);
CREATE INDEX idx_files_path ON files(path);

-- Bookmarks table
CREATE TABLE bookmarks (
    id TEXT PRIMARY KEY,
    pdf_path TEXT NOT NULL,
    page_number INTEGER NOT NULL CHECK(page_number >= 1),
    name TEXT NOT NULL,
    description TEXT,
    note TEXT,
    thumbnail TEXT,
    folder_id TEXT,
    tags TEXT, -- JSON array of tag IDs
    sync_status TEXT NOT NULL DEFAULT 'pending',
    last_synced_at INTEGER,
    local_modified_at INTEGER NOT NULL,
    server_modified_at INTEGER,
    sync_version INTEGER NOT NULL DEFAULT 1,
    checksum TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    FOREIGN KEY (folder_id) REFERENCES bookmark_folders(id)
);
CREATE INDEX idx_bookmarks_sync_status ON bookmarks(sync_status);
CREATE INDEX idx_bookmarks_pdf_path ON bookmarks(pdf_path);

-- Bookmark folders table
CREATE TABLE bookmark_folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pdf_path TEXT NOT NULL,
    thumbnail TEXT,
    sync_status TEXT NOT NULL DEFAULT 'pending',
    last_synced_at INTEGER,
    local_modified_at INTEGER NOT NULL,
    server_modified_at INTEGER,
    sync_version INTEGER NOT NULL DEFAULT 1,
    checksum TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER
);
CREATE INDEX idx_bookmark_folders_sync_status ON bookmark_folders(sync_status);

-- Word editor files table
CREATE TABLE word_editor_files (
    id TEXT PRIMARY KEY,
    case_id TEXT, -- Optional: associate with case
    name TEXT NOT NULL,
    path TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL, -- HTML content from Lexical
    size INTEGER NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'pending',
    last_synced_at INTEGER,
    local_modified_at INTEGER NOT NULL,
    server_modified_at INTEGER,
    sync_version INTEGER NOT NULL DEFAULT 1,
    checksum TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    FOREIGN KEY (case_id) REFERENCES cases(id)
);
CREATE INDEX idx_word_editor_files_sync_status ON word_editor_files(sync_status);
CREATE INDEX idx_word_editor_files_path ON word_editor_files(path);

-- Category tags table
CREATE TABLE category_tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    sync_status TEXT NOT NULL DEFAULT 'pending',
    last_synced_at INTEGER,
    local_modified_at INTEGER NOT NULL,
    server_modified_at INTEGER,
    sync_version INTEGER NOT NULL DEFAULT 1,
    checksum TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER
);
CREATE INDEX idx_category_tags_sync_status ON category_tags(sync_status);

-- Sync log table (audit trail)
CREATE TABLE sync_log (
    id TEXT PRIMARY KEY,
    operation_type TEXT NOT NULL CHECK(operation_type IN ('upload', 'download', 'delete', 'conflict')),
    entity_type TEXT NOT NULL CHECK(entity_type IN ('case', 'file', 'bookmark', 'bookmark_folder', 'word_editor_file', 'category_tag')),
    entity_id TEXT NOT NULL,
    client_id TEXT, -- Identifier for the client that performed the operation
    status TEXT NOT NULL CHECK(status IN ('success', 'error', 'conflict')),
    error_message TEXT,
    bytes_transferred INTEGER,
    duration_ms INTEGER,
    created_at INTEGER NOT NULL
);
CREATE INDEX idx_sync_log_entity ON sync_log(entity_type, entity_id);
CREATE INDEX idx_sync_log_created_at ON sync_log(created_at);
CREATE INDEX idx_sync_log_client_id ON sync_log(client_id);

-- Sync queue table (for retry logic)
CREATE TABLE sync_queue (
    id TEXT PRIMARY KEY,
    operation_type TEXT NOT NULL CHECK(operation_type IN ('upload', 'download')),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 5, -- 1-10, higher = more important
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    error_message TEXT,
    payload TEXT, -- JSON data for the operation
    scheduled_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX idx_sync_queue_scheduled ON sync_queue(scheduled_at, priority);
CREATE INDEX idx_sync_queue_entity ON sync_queue(entity_type, entity_id);

-- Client registry (track connected clients)
CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    client_name TEXT,
    last_seen_at INTEGER NOT NULL,
    sync_version TEXT, -- Client's sync protocol version
    created_at INTEGER NOT NULL
);
CREATE INDEX idx_clients_last_seen ON clients(last_seen_at);
```

**Migration Strategy:**

- Use Alembic for database migrations
- Initial migration creates all tables with indexes
- Support for schema versioning and rollback
- Migration scripts in `server/database/migrations/`
- Automatic migration on server startup (with backup)

### 4. API Endpoints (FastAPI)

**Base URL:** `/api/v1/` (versioned API)

**Health & Diagnostics:**

- `GET /api/health` - Server health check
- `GET /api/version` - Get API version information
- `GET /api/diagnostics` - Detailed diagnostic info (admin only)

**Authentication:**

- `POST /api/v1/auth/login` - Authenticate user (returns JWT token)
- `POST /api/v1/auth/refresh` - Refresh auth token
- `POST /api/v1/auth/logout` - Logout (invalidate token)
- `GET /api/v1/auth/me` - Get current user info

**Sync Operations:**

- `GET /api/v1/sync/status` - Get sync status for all cases
- `GET /api/v1/sync/status/{case_id}` - Get sync status for specific case
- `POST /api/v1/sync/case/{case_id}` - Sync specific case
- `POST /api/v1/sync/all` - Sync all cases (requires confirmation)
- `GET /api/v1/sync/changes?since={timestamp}&case_id={case_id}` - Get changes since timestamp
- `POST /api/v1/sync/upload` - Upload local changes (batch)
- `GET /api/v1/sync/progress/{sync_id}` - Get sync progress
- `POST /api/v1/sync/pause/{sync_id}` - Pause active sync
- `POST /api/v1/sync/resume/{sync_id}` - Resume paused sync
- `POST /api/v1/sync/cancel/{sync_id}` - Cancel active sync
- `GET /api/v1/sync/conflicts` - List all conflicts
- `POST /api/v1/sync/conflicts/{conflict_id}/resolve` - Resolve conflict

**Case Management:**

- `GET /api/v1/cases` - List all cases (paginated)
- `GET /api/v1/cases/{case_id}` - Get case details
- `POST /api/v1/cases` - Create case
- `PUT /api/v1/cases/{case_id}` - Update case
- `DELETE /api/v1/cases/{case_id}` - Delete case (soft delete)
- `GET /api/v1/cases/{case_id}/files` - List files in case
- `POST /api/v1/cases/batch` - Batch create/update cases

**File Operations:**

- `GET /api/v1/files/{file_id}` - Get file metadata
- `POST /api/v1/files/upload` - Upload file (chunked, supports resume)
- `POST /api/v1/files/upload/chunk` - Upload file chunk
- `GET /api/v1/files/{file_id}/download` - Download file
- `GET /api/v1/files/{file_id}/download/chunk/{chunk_number}` - Download file chunk
- `DELETE /api/v1/files/{file_id}` - Delete file (soft delete)
- `GET /api/v1/files/{file_id}/checksum` - Get file checksum
- `POST /api/v1/files/verify` - Verify file integrity
- `POST /api/v1/files/batch` - Batch file operations

**Bookmarks:**

- `GET /api/v1/bookmarks` - List bookmarks (filtered by case/pdf)
- `GET /api/v1/bookmarks/{bookmark_id}` - Get bookmark details
- `POST /api/v1/bookmarks` - Create bookmark
- `PUT /api/v1/bookmarks/{bookmark_id}` - Update bookmark
- `DELETE /api/v1/bookmarks/{bookmark_id}` - Delete bookmark
- `GET /api/v1/bookmark-folders` - List bookmark folders
- `POST /api/v1/bookmark-folders` - Create bookmark folder
- `PUT /api/v1/bookmark-folders/{folder_id}` - Update bookmark folder
- `DELETE /api/v1/bookmark-folders/{folder_id}` - Delete bookmark folder

**Word Editor Files:**

- `GET /api/v1/word-editor-files` - List word editor files
- `GET /api/v1/word-editor-files/{file_id}` - Get file content
- `POST /api/v1/word-editor-files` - Create/update word editor file
- `DELETE /api/v1/word-editor-files/{file_id}` - Delete file

**Category Tags:**

- `GET /api/v1/category-tags` - List category tags
- `POST /api/v1/category-tags` - Create category tag
- `PUT /api/v1/category-tags/{tag_id}` - Update category tag
- `DELETE /api/v1/category-tags/{tag_id}` - Delete category tag

**Sync Log:**

- `GET /api/v1/sync-log` - Get sync operation history (paginated)
- `GET /api/v1/sync-log/{log_id}` - Get specific log entry
- `GET /api/v1/sync-log/conflicts` - Get conflict history

**Client Management:**

- `GET /api/v1/clients` - List connected clients
- `GET /api/v1/clients/{client_id}` - Get client details
- `DELETE /api/v1/clients/{client_id}` - Disconnect client

### 5. Configuration Management

**GUI Configuration (in Vault Settings):**

- Server URL input (with protocol selector: HTTP/HTTPS)
- Security protocol selection (HTTP or HTTPS)
- SSL/TLS certificate settings (for HTTPS):
- Certificate file path (optional, for self-signed certs)
- Verify SSL toggle (enable/disable certificate verification)
- Certificate authority file path (optional)
- Authentication credentials:
- API key or username/password
- Authentication method selector
- Auto-sync toggle
- Sync interval settings
- Per-case sync enable/disable

**Config File (`server-config.json`):**

```json
{
  "server": {
    "url": "http://localhost:8000",
    "protocol": "http",
    "api_key": "optional-api-key",
    "ssl": {
      "enabled": false,
      "verify_cert": true,
      "cert_file": null,
      "ca_file": null
    }
  },
  "sync": {
    "auto_sync": false,
    "sync_interval_seconds": 300,
    "enabled_cases": []
  },
  "storage": {
    "data_dir": "./vault-sync-data"
  }
}
```

**Note:** Users can configure either HTTP (non-secure) or HTTPS (secure) connections based on their needs. For local networks or development, HTTP may be preferred. For production or sensitive data, HTTPS should be used.

### 6. Packaging & Distribution

**Build System:**

- `server/pyproject.toml` - Python project configuration
- `server/build.py` - Build script for creating executables
- Use PyInstaller or cx_Freeze for Windows/Linux executables
- Include SQLite, FastAPI, and all dependencies

**Installation Options:**

1. **Standalone Installer**: Separate `.exe` (Windows) / `.deb`/`.rpm` (Linux)
2. **Optional Module**: Include in main Vault installer as optional component
3. **Portable**: ZIP archive with run script

**Distribution Files:**

- Windows: `vault-sync-server-setup.exe`
- Linux: `vault-sync-server.deb` / `vault-sync-server.rpm`
- Both: `vault-sync-server-portable.zip`

## Implementation Details

### Sync Algorithm

1. **Delta Detection:**

- Compare `local_modified_at` vs `last_synced_at`
- Track file checksums for change detection
- Maintain operation log for conflict resolution

2. **Sync Process:**

- Client pushes local changes to sync server
- Client pulls changes from sync server (from other clients)
- Merge conflicts using last-write-wins
- Update sync metadata
- Server acts as central hub for all connected clients

3. **Conflict Resolution:**

Enhanced conflict resolution with multiple strategies:

**Conflict Detection:**

- Detect conflicts when both local and server modified since last sync
- Compare `sync_version` numbers (increment on each modification)
- Use checksums to detect content changes even if timestamps match
- Track conflict type: content conflict, metadata conflict, or both

**Resolution Strategies:**

1. **Last-Write-Wins (Default for most entities):**

   - Server timestamp wins if server_modified_at > local_modified_at
   - Client timestamp wins if local_modified_at > server_modified_at
   - Log conflict for user review
   - Apply resolution automatically

2. **Three-Way Merge (For Word Editor files):**

   - Attempt automatic merge for text content
   - Use diff algorithms to merge non-conflicting changes
   - Create conflict markers for overlapping edits
   - Present merge preview to user for approval

3. **Manual Resolution (For critical conflicts):**

   - Detect conflicts that require user decision
   - Create conflict entries in `sync_log` table
   - Present conflict resolution UI to user
   - Options: Keep Local, Keep Server, Merge Manually, Keep Both (rename)

4. **Conflict Logging:**

   - All conflicts logged to `sync_log` table
   - Conflict details include: entity type, entity ID, local version, server version
   - User can review conflict history
   - Support for conflict resolution replay/undo

**Conflict Resolution UI:**

- Conflict notification badge in sync status indicator
- Conflict resolution dialog showing:
  - What changed locally
  - What changed on server
  - Diff view for text files
  - Preview of merged result (if applicable)
- Batch conflict resolution for multiple conflicts

### File Handling

- Large files: Chunked upload/download
- Thumbnails: Separate sync endpoint
- Metadata files: Sync alongside files
- Background images: Include in case sync

**Chunked File Transfer:**

- Chunk size: 5MB default (configurable)
- Resume interrupted transfers using chunk tracking
- Parallel chunk upload/download (up to 3 concurrent chunks)
- Chunk integrity verification using checksums
- Chunk metadata stored in database:
  - `file_chunks` table tracks chunk status
  - Chunk checksums for verification
  - Chunk upload/download progress

**File Integrity:**

- SHA-256 checksums for all files
- Checksum verification on upload/download
- Checksum stored in database for quick comparison
- Automatic re-sync if checksum mismatch detected
- Support for incremental file updates (rsync-like)

**Partial Sync and Resume:**

- Track sync progress in `sync_queue` table
- Resume interrupted syncs from last successful chunk
- Store partial sync state in database
- Client can query sync progress: `GET /api/sync/progress/{sync_id}`
- Automatic retry with exponential backoff
- Maximum retry attempts: 3 (configurable)

### Data Integrity and Validation

**Pre-Sync Validation:**

- Validate all file paths (prevent directory traversal)
- Verify file existence before sync
- Check file permissions
- Validate data structure (JSON schema validation for metadata)
- Verify checksums match before accepting changes
- Transaction support: All-or-nothing sync operations
- Rollback mechanism: If sync fails mid-operation, rollback to previous state

**Post-Sync Verification:**

- Verify all files transferred successfully
- Confirm checksums match
- Validate database consistency
- Check for orphaned records
- Verify foreign key constraints

**Data Corruption Prevention:**

- Atomic operations using SQLite transactions
- WAL (Write-Ahead Logging) mode for SQLite
- Regular integrity checks: `PRAGMA integrity_check`
- Backup before major sync operations
- Point-in-time recovery support

### Error Handling

**Error Categories:**

1. **Network Errors:**

   - Connection timeout: Retry with exponential backoff (1s, 2s, 4s, 8s)
   - Connection refused: Queue for retry, notify user
   - DNS resolution failure: Log error, disable auto-sync
   - SSL/TLS errors: Log, prompt for certificate acceptance

2. **Authentication Errors:**

   - Invalid credentials: Prompt for re-auth
   - Token expired: Auto-refresh if possible, else re-auth
   - Unauthorized: Clear credentials, require re-configuration

3. **Conflict Errors:**

   - Log to `sync_log` table with full details
   - Notify user via UI
   - Present resolution options
   - Track unresolved conflicts

4. **File Errors:**

   - File not found: Skip, log, continue sync
   - Permission denied: Log error, notify user
   - Disk full: Pause sync, notify user
   - File locked: Retry after delay, skip if persistent

5. **Data Errors:**

   - Invalid JSON: Log, skip entity, continue
   - Schema validation failure: Log, skip, notify user
   - Checksum mismatch: Re-download/re-upload, log

**Error Recovery:**

- Dead letter queue for failed operations after max retries
- Manual retry UI for failed syncs
- Error categorization and reporting
- Error notification system with severity levels
- Automatic error recovery where possible

### Performance and Scalability

**Optimization Strategies:**

1. **Batch Operations:**

   - Batch multiple case syncs in single request
   - Batch file metadata updates
   - Reduce HTTP overhead with batch endpoints
   - Example: `POST /api/sync/batch` accepts array of operations

2. **Compression:**

   - Gzip compression for API responses (JSON)
   - Optional compression for file transfers (configurable)
   - Compress metadata JSON payloads
   - Reduce bandwidth usage by 60-80%

3. **Caching:**

   - Cache file checksums locally (avoid re-computation)
   - Cache sync status (refresh every 30 seconds)
   - Cache authentication tokens
   - Client-side caching of file metadata

4. **Parallel Processing:**

   - Parallel file uploads/downloads (max 3 concurrent)
   - Parallel case syncs (max 2 concurrent)
   - Background sync thread doesn't block UI
   - Async/await throughout for non-blocking operations

5. **Database Optimization:**

   - Indexed queries for sync status lookups
   - Connection pooling (SQLite supports limited concurrency)
   - Query optimization for large datasets
   - Pagination for large result sets

**Performance Targets:**

- Sync 1000 files (10GB total): < 30 minutes on 100Mbps connection
- Sync status check: < 100ms
- Case metadata sync: < 1 second per case
- File chunk upload: 5MB chunks in < 2 seconds each
- Database queries: < 50ms for indexed lookups

**Resource Requirements:**

- Server RAM: Minimum 512MB, Recommended 1GB
- Server Disk: 2x vault size (for files + database)
- Network: Minimum 10Mbps for reasonable sync speed
- CPU: Minimal (SQLite is lightweight)

**Scalability Considerations:**

- Support for 10+ concurrent clients
- Handle vaults up to 1TB in size
- Support 10,000+ files per case
- Efficient handling of 100+ cases

### API Versioning

**Version Strategy:**

- API version in URL: `/api/v1/...`
- Version negotiation: Client sends `X-API-Version` header
- Server responds with `X-API-Version` header
- Backward compatibility: Support last 2 major versions
- Deprecation policy: 6 months notice before removing version

**Version Endpoints:**

- `GET /api/version` - Get supported API versions
- `GET /api/v1/...` - Version 1 endpoints (current)
- Future: `GET /api/v2/...` - Version 2 endpoints

**Client Version Detection:**

- Client sends version in `User-Agent` or custom header
- Server logs client versions for analytics
- Warn if client version is too old
- Block if client version is incompatible

### Monitoring and Observability

**Server-Side Logging:**

- Structured logging using Python `logging` module
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Log to file: `server/logs/vault-sync-server.log`
- Log rotation: Daily rotation, keep 30 days
- Log format: JSON for easy parsing

**Metrics Collection:**

- Sync operation counts (success/failure)
- Sync duration metrics
- File transfer speeds
- Error rates by category
- Active client connections
- Database size and growth
- API endpoint response times

**Health Check Endpoint:**

- `GET /api/health` - Server health status
- Returns: `{ "status": "healthy", "database": "ok", "storage": "ok", "uptime": 12345 }`
- Used for monitoring and load balancers
- Response time: < 10ms

**Diagnostic Endpoint:**

- `GET /api/diagnostics` - Detailed diagnostic info (admin only)
- Database statistics
- Storage usage
- Active sync operations
- Recent errors
- Performance metrics

**Client-Side Monitoring:**

- Sync success/failure tracking
- Sync duration tracking
- Error logging to local file
- Sync status UI updates
- Performance metrics display

## Testing Strategy

**Unit Tests:**

- Sync algorithm logic (delta detection, conflict resolution)
- Checksum calculation and verification
- File chunking and reassembly
- Database operations (CRUD)
- Data validation functions
- Error handling logic

**Integration Tests:**

- API endpoint testing (FastAPI TestClient)
- Database migration testing
- File upload/download workflows
- Authentication flow
- Conflict resolution scenarios

**End-to-End Tests:**

- Full sync workflow: Client A → Server → Client B
- Multiple client simultaneous sync
- Offline/online transition
- Large file sync (100MB+)
- Conflict resolution UI flow
- Error recovery scenarios

**Performance Tests:**

- Load testing: 10 concurrent clients
- Stress testing: 10,000 files sync
- Large file transfer: 1GB file
- Database query performance
- Memory usage under load

**Security Tests:**

- SQL injection prevention
- Path traversal prevention
- Authentication bypass attempts
- Rate limiting effectiveness
- SSL/TLS certificate validation

**Test Coverage Goals:**

- Unit tests: 80%+ coverage
- Integration tests: All API endpoints
- E2E tests: Critical user flows
- Performance tests: All performance targets

## Security Considerations

**User-Configurable Security:**

- **Protocol Selection**: Users can choose HTTP (non-secure) or HTTPS (secure) connections
- HTTP: Suitable for local networks, development, or trusted environments
- HTTPS: Required for production, sensitive data, or untrusted networks
- **SSL/TLS Configuration** (when HTTPS is selected):
- Support for self-signed certificates
- Optional certificate verification toggle
- Custom certificate authority file support
- Certificate file path configuration
- **Authentication Options**:
- API key authentication (simple, suitable for HTTP)
- JWT token authentication (recommended for HTTPS)
- Optional username/password authentication
- **Security Features**:
- Encrypted local storage for credentials (when HTTPS is used)
- Path validation (prevent directory traversal)
- File size limits
- Rate limiting on server (configurable)
- Optional CORS configuration for web clients

**Security Warnings:**

- Display warnings when HTTP is selected for remote servers
- Warn users about self-signed certificates
- Provide clear documentation on security implications
- Allow users to accept security risks for local/development setups

### Migration Strategy

**Enabling Sync on Existing Vault:**

1. **Initial Sync Setup:**

   - User configures sync server in Settings
   - Client performs initial inventory of all cases/files
   - Calculate checksums for all files (background process)
   - Create initial sync metadata in local database

2. **First Sync:**

   - Full sync mode: Upload all cases and files to server
   - Progress indicator shows sync progress
   - Estimated time calculation based on file sizes
   - Pause/resume capability for long initial syncs
   - Background sync: Continue even if user closes app

3. **Large Vault Handling:**

   - For vaults > 10GB: Warn user about initial sync time
   - Option to sync cases incrementally (one at a time)
   - Prioritize recently modified cases
   - Throttle sync speed to avoid system impact

4. **Data Migration:**

   - Preserve all existing metadata (descriptions, tags, etc.)
   - Maintain file structure exactly
   - Preserve timestamps where possible
   - Create backup before first sync

**Migration Checklist:**

- [ ] Backup existing vault
- [ ] Verify vault integrity
- [ ] Configure sync server
- [ ] Test connection
- [ ] Perform initial sync
- [ ] Verify sync completion
- [ ] Test sync from second client
- [ ] Verify data consistency

### Backup and Disaster Recovery

**Server-Side Backup:**

- Automatic daily backups of SQLite database
- Backup location: `server/backups/`
- Backup retention: 30 days
- Backup format: SQLite dump + file system snapshot
- Backup before major operations (migrations, bulk syncs)

**Client-Side Backup:**

- Local sync metadata backup before sync operations
- Backup location: User data directory
- Automatic backup on sync start
- Manual backup option in Settings

**Recovery Procedures:**

- Database corruption: Restore from latest backup
- File corruption: Re-sync from server
- Partial sync failure: Resume from last successful checkpoint
- Complete data loss: Restore from server (full re-sync)

**Point-in-Time Recovery:**

- Sync log provides audit trail
- Can replay sync operations from log
- Support for rolling back to specific timestamp
- Requires backup + sync log

### Multi-Client Scenarios

**Concurrent Client Handling:**

- Support 5+ clients syncing simultaneously
- Event ordering: Server timestamps determine order
- No locking: Optimistic concurrency control
- Conflict detection: Compare sync_version numbers
- Eventual consistency: All clients converge to same state

**Client Identification:**

- Each client generates unique client ID on first sync
- Client ID stored in `clients` table
- Client name: User-configurable (e.g., "Office PC", "Laptop")
- Last seen timestamp: Track active clients

**Sync Coordination:**

- Server acts as central authority
- All changes flow through server
- Clients pull changes from server
- No direct client-to-client communication

**Conflict Scenarios:**

- Two clients edit same case simultaneously: Last-write-wins
- Two clients edit same file: Conflict detected, user resolution
- Two clients create case with same name: Server generates unique name
- Client deletes while other modifies: Deletion wins (with warning)

### Deployment and Operations

**Server Installation:**

1. **Windows Installation:**

   - Installer: `vault-sync-server-setup.exe`
   - Installs as Windows Service (optional)
   - Default port: 8000 (configurable)
   - Data directory: `%APPDATA%\VaultSyncServer\`
   - Start menu shortcut for server management

2. **Linux Installation:**

   - DEB/RPM packages: `vault-sync-server.deb` / `vault-sync-server.rpm`
   - Systemd service file included
   - Default port: 8000 (configurable)
   - Data directory: `~/.vault-sync-server/` or `/var/lib/vault-sync-server/`
   - Command: `vault-sync-server start|stop|restart|status`

3. **Portable Installation:**

   - ZIP archive: `vault-sync-server-portable.zip`
   - Extract and run: `vault-sync-server.exe` (Windows) or `./vault-sync-server` (Linux)
   - No installation required
   - Data directory: `./vault-sync-data/`

**Server Configuration:**

- Configuration file: `server-config.json` in data directory
- Environment variables override config file
- Command-line arguments for quick setup
- Web UI for configuration (optional, future enhancement)

**Port Configuration:**

- Default: 8000
- Configurable via config file or command-line
- Port conflict detection on startup
- Firewall configuration instructions provided

**Service Management:**

- Windows: Service management via Services app or `sc` command
- Linux: Systemd service management
- Health check endpoint for monitoring
- Automatic restart on failure (configurable)

**Update Mechanism:**

- Server checks for updates on startup (optional)
- Manual update: Download new installer, run
- Database migration: Automatic on server startup
- Rollback: Keep previous version installer

**Troubleshooting:**

- Log files: `server/logs/vault-sync-server.log`
- Diagnostic endpoint: `GET /api/diagnostics`
- Common issues documentation
- Support contact information

## User Experience

**Sync Status Indicator:**

- Badge showing unsynced changes count
- Color coding: Green (synced), Yellow (pending), Red (error), Orange (conflict)
- Click to open sync panel
- Tooltip shows last sync time

**Per-Case Controls:**

- Enable/disable sync per case
- Visual indicator: Sync icon next to case name
- Quick sync button per case
- Sync status: Synced, Pending, Error, Conflict

**Full Sync Warning:**

- Modal dialog before full sync
- Shows estimated time and data size
- Option to sync in background
- Progress can be minimized to system tray

**Progress Display:**

- Real-time sync progress bar
- File-by-file progress for detailed view
- Transfer speed display
- Estimated time remaining
- Pause/resume controls
- Cancel option (with confirmation)

**Conflict Resolution UI:**

- Conflict notification badge
- Conflict list view showing all conflicts
- Side-by-side diff view for text files
- Resolution options: Keep Local, Keep Server, Merge, Keep Both
- Batch resolution for multiple conflicts

**Settings UI:**

- Sync configuration panel in Vault Settings
- Server connection settings
- Auto-sync toggle and interval
- Per-case sync enable/disable
- Sync history and logs view
- Manual sync trigger button

## Implementation Phases

**Phase 1: Foundation (Weeks 1-2)**

- Set up FastAPI project structure
- Implement database schema and migrations
- Create basic API endpoints (health, auth)
- Set up logging and error handling
- Create build and packaging system

**Phase 2: Core Sync (Weeks 3-4)**

- Implement sync engine (delta detection, conflict resolution)
- Create file upload/download with chunking
- Implement checksum verification
- Create sync queue and retry logic
- Basic client integration (IPC handlers)

**Phase 3: Data Models (Weeks 5-6)**

- Implement all API endpoints (cases, files, bookmarks, etc.)
- Create Pydantic models for all entities
- Implement soft delete support
- Add batch operations
- Client UI components (sync panel, status indicator)

**Phase 4: Advanced Features (Weeks 7-8)**

- Three-way merge for text files
- Conflict resolution UI
- Partial sync and resume
- Performance optimizations
- Monitoring and diagnostics

**Phase 5: Testing & Polish (Weeks 9-10)**

- Comprehensive testing (unit, integration, E2E)
- Performance testing and optimization
- Security audit
- Documentation
- User acceptance testing

**Phase 6: Deployment (Week 11)**

- Create installers (Windows, Linux)
- Deployment documentation
- Migration guides
- Troubleshooting guides
- Release preparation

## Summary

This comprehensive plan outlines a production-ready sync server implementation that:

1. **Maintains Local-First Architecture**: All operations work offline; sync is additive
2. **Ensures Data Integrity**: Checksums, transactions, validation, and rollback mechanisms
3. **Handles Conflicts Intelligently**: Multiple resolution strategies including three-way merge
4. **Scales Efficiently**: Batch operations, compression, caching, and parallel processing
5. **Provides Robust Error Handling**: Categorization, retry logic, and recovery mechanisms
6. **Offers Comprehensive Monitoring**: Logging, metrics, health checks, and diagnostics
7. **Supports Multiple Clients**: Concurrent sync with conflict detection
8. **Includes Migration Strategy**: Smooth onboarding for existing vaults
9. **Follows Industry Standards**: API versioning, security best practices, comprehensive testing
10. **Delivers Excellent UX**: Clear status indicators, progress tracking, conflict resolution UI

The implementation follows industry best practices for distributed systems, data synchronization, and API design, ensuring a reliable, scalable, and maintainable solution.