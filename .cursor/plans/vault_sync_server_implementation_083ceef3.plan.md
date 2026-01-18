---
name: Vault Sync Server Implementation
overview: Create a single, downloadable FastAPI server component that enables per-case and full-case synchronization between multiple Vault clients. The server runs locally and behaves exactly like the current offline mode, with added sync capabilities when clients connect. Includes GUI and config-file configuration options, sync status indicators, and Windows/Linux packaging support.
todos:
  - id: server-setup
    content: Create FastAPI server structure with main app, routes, and basic configuration
    status: pending
  - id: database-models
    content: Design and implement SQLite database schema with sync tracking fields
    status: pending
    dependencies:
      - server-setup
  - id: sync-engine
    content: Implement sync engine with delta detection, conflict resolution, and merge logic
    status: pending
    dependencies:
      - database-models
  - id: api-endpoints
    content: Create FastAPI endpoints for sync operations, case management, and file operations
    status: pending
    dependencies:
      - sync-engine
  - id: file-storage
    content: Implement file storage management with chunked upload/download support
    status: pending
    dependencies:
      - api-endpoints
  - id: client-ipc
    content: Add IPC handlers in electron/main.ts for sync operations
    status: pending
  - id: sync-ui-components
    content: Create React components for sync panel, status indicators, and case controls
    status: pending
    dependencies:
      - client-ipc
  - id: sync-service
    content: Implement HTTP client service for communicating with sync server
    status: pending
    dependencies:
      - sync-ui-components
  - id: config-management
    content: Add GUI configuration panel in Vault settings and config file support
    status: pending
    dependencies:
      - sync-service
  - id: ssl-configuration
    content: Implement SSL/TLS configuration support with certificate validation options
    status: pending
    dependencies:
      - config-management
  - id: packaging
    content: Create build scripts and packaging for Windows/Linux installers
    status: pending
    dependencies:
      - api-endpoints
      - file-storage
  - id: testing
    content: Write unit and integration tests for sync functionality
    status: pending
    dependencies:
      - sync-engine
      - api-endpoints
  - id: documentation
    content: Create user documentation for server setup and sync configuration
    status: pending
    dependencies:
      - config-management
      - packaging
---

# V

ault Sync Server Implementation Plan

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

- `server/main.py` - FastAPI app entry point with routes
- `server/models/` - Pydantic models for API requests/responses
- `server/database/` - SQLite database models and migrations
- `server/sync/` - Sync engine logic (delta sync, conflict resolution)
- `server/storage/` - File storage management
- `server/auth/` - Authentication and authorization
- `server/config/` - Configuration management
- `server/utils/` - Utility functions

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

- `sync-get-status` - Get sync status for cases
- `sync-case` - Sync a specific case
- `sync-all-cases` - Sync all cases (with warning)
- `sync-get-config` - Get sync server configuration
- `sync-set-config` - Set sync server configuration
- `sync-check-connection` - Test server connection
- `sync-validate-ssl` - Validate SSL certificate (for HTTPS)

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

### 4. API Endpoints (FastAPI)

**Authentication:**

- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/refresh` - Refresh auth token
- `POST /api/auth/logout` - Logout

**Sync Operations:**

- `GET /api/sync/status` - Get sync status for all cases
- `POST /api/sync/case/{case_id}` - Sync specific case
- `POST /api/sync/all` - Sync all cases
- `GET /api/sync/changes?since={timestamp}` - Get changes since timestamp
- `POST /api/sync/upload` - Upload local changes

**Case Management:**

- `GET /api/cases` - List all cases
- `GET /api/cases/{case_id}` - Get case details
- `POST /api/cases` - Create case
- `PUT /api/cases/{case_id}` - Update case
- `DELETE /api/cases/{case_id}` - Delete case

**File Operations:**

- `GET /api/files/{file_id}` - Get file metadata
- `POST /api/files/upload` - Upload file (chunked)
- `GET /api/files/{file_id}/download` - Download file
- `DELETE /api/files/{file_id}` - Delete file

**Bookmarks:**

- `GET /api/bookmarks` - List bookmarks
- `POST /api/bookmarks` - Create bookmark
- `PUT /api/bookmarks/{bookmark_id}` - Update bookmark
- `DELETE /api/bookmarks/{bookmark_id}` - Delete bookmark

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

- Detect conflicts when both local and server modified
- Log conflicts for user review
- Apply resolution strategy (server wins by default)

### File Handling

- Large files: Chunked upload/download
- Thumbnails: Separate sync endpoint
- Metadata files: Sync alongside files
- Background images: Include in case sync

### Error Handling

- Network errors: Queue operations for retry
- Authentication errors: Prompt for re-auth
- Conflict errors: Log and notify user
- File errors: Skip and continue sync

## Testing Strategy

- Unit tests for sync logic
- Integration tests for API endpoints
- End-to-end tests for sync scenarios
- Offline/online transition tests
- Conflict resolution tests
- Large file sync tests

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

## User Experience

- **Sync Status Indicator**: Badge showing unsynced changes count
- **Per-Case Controls**: Enable/disable sync per case
- **Full Sync Warning**: Modal dialog before full sync
- **Progress Display**: Real-time sync progress