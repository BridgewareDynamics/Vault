# Vault Networking Architecture Research

**Version:** 1.0  
**Date:** January 2026  
**Status:** Research & Planning

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Networking Requirements](#networking-requirements)
4. [Server Architecture Options](#server-architecture-options)
5. [Language & Framework Evaluation](#language--framework-evaluation)
6. [Deployment & Installation Strategies](#deployment--installation-strategies)
7. [Security Considerations](#security-considerations)
8. [Performance & Scalability](#performance--scalability)
9. [Recommended Approach](#recommended-approach)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Appendices](#appendices)

---

## Executive Summary

The Vault is currently a standalone Electron desktop application that provides PDF extraction, research organization, and document management capabilities. This document explores architectural options for adding networking capabilities through a dedicated server component.

**Key Findings:**
- **Current Architecture**: Electron desktop app with local file system operations via IPC
- **Primary Use Case**: Single-user desktop application with potential for multi-user collaboration
- **Recommended Approach**: Python/FastAPI microservice architecture with installer integration
- **Deployment Strategy**: Local-first with optional cloud synchronization

---

## Current Architecture Analysis

### Technology Stack

**Frontend:**
- React 18.2 with TypeScript 5.3
- TailwindCSS for styling
- Framer Motion for animations
- Lexical editor for rich text editing

**Backend (Electron Main Process):**
- Electron 28.1 on Node.js 20+
- Native file system operations
- PDF.js for PDF processing
- Sharp for image processing
- IPC-based communication

**Data Storage:**
- File system-based (hierarchical folder structure)
- JSON configuration files
- Local storage for user preferences
- No database currently

### Communication Patterns

The application uses **Electron IPC** (Inter-Process Communication) for all operations:

```
Renderer Process (React) 
    ↕️ IPC Channel
Main Process (Electron)
    ↕️ Node.js APIs
File System / OS
```

**IPC Handlers** (84+ handlers including):
- File operations (read, write, delete, rename)
- PDF extraction and processing
- Thumbnail generation
- Bookmark management
- Category tag management
- Text file management
- Settings persistence

### Current Limitations

1. **Single-User Only**: No multi-user support or collaboration
2. **No Remote Access**: Must be physically at the machine
3. **No Cloud Sync**: Data tied to single machine
4. **No Real-time Collaboration**: Cannot share work in real-time
5. **Limited Integration**: No REST API for external tools
6. **No Centralized Management**: Each installation is independent

---

## Networking Requirements

### Functional Requirements

Based on the current architecture, potential networking needs include:

1. **Remote Access**
   - Access vault from any device
   - Web-based interface or mobile client support
   - Secure authentication and authorization

2. **Multi-User Collaboration**
   - Shared case files and research projects
   - Real-time updates and notifications
   - Conflict resolution for concurrent edits

3. **Data Synchronization**
   - Sync vault data across multiple devices
   - Offline-first capabilities
   - Incremental sync for large files

4. **Integration Capabilities**
   - REST API for third-party integrations
   - Webhook support for automation
   - Export/import standardized formats

5. **Centralized Management**
   - User management and permissions
   - Audit logs and activity tracking
   - Backup and disaster recovery

### Non-Functional Requirements

1. **Performance**
   - Handle large PDF files (>100MB)
   - Support concurrent users (initial: 10-50 users)
   - Fast thumbnail generation and streaming

2. **Security**
   - End-to-end encryption for sensitive documents
   - Role-based access control (RBAC)
   - Secure file storage and transmission
   - Compliance with data protection regulations

3. **Reliability**
   - 99.9% uptime for cloud deployments
   - Automatic failover and recovery
   - Data integrity guarantees

4. **Scalability**
   - Horizontal scaling for increased load
   - Efficient file storage (object storage)
   - CDN integration for global distribution

---

## Server Architecture Options

### Option 1: Monolithic Architecture

**Description:** Single server application handling all functionality.

```
┌─────────────────────────────────────┐
│     Monolithic Server Application   │
│                                     │
│  ┌─────────┬──────────┬──────────┐ │
│  │   API   │  Business │  Data    │ │
│  │  Layer  │   Logic   │  Access  │ │
│  └─────────┴──────────┴──────────┘ │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   File Storage Manager      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
         ↕️
    File System / S3
```

**Pros:**
- ✅ Simpler to develop and maintain
- ✅ Easier to deploy (single process)
- ✅ Lower operational complexity
- ✅ Good for MVP and small teams
- ✅ Easier debugging and testing
- ✅ Lower infrastructure costs initially

**Cons:**
- ❌ Harder to scale individual components
- ❌ Single point of failure
- ❌ Technology stack locked in
- ❌ Tighter coupling between components
- ❌ Longer deployment cycles for changes

**Best For:** Initial MVP, small teams (<10 users), proof of concept

---

### Option 2: Microservices Architecture

**Description:** Multiple specialized services working together.

```
                 ┌──────────────┐
                 │  API Gateway │
                 └──────┬───────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
┌────────────┐  ┌────────────┐  ┌────────────┐
│   Auth     │  │    File    │  │  Search    │
│  Service   │  │  Service   │  │  Service   │
└────────────┘  └────────────┘  └────────────┘
        │               │               │
        ↓               ↓               ↓
┌────────────┐  ┌────────────┐  ┌────────────┐
│  Postgres  │  │ S3/MinIO   │  │Elasticsearch│
└────────────┘  └────────────┘  └────────────┘
```

**Pros:**
- ✅ Independent scaling of components
- ✅ Technology diversity (best tool for each job)
- ✅ Fault isolation
- ✅ Independent deployment
- ✅ Team autonomy
- ✅ Better for large-scale systems

**Cons:**
- ❌ Higher complexity
- ❌ More difficult to debug
- ❌ Network latency between services
- ❌ Data consistency challenges
- ❌ Higher operational overhead
- ❌ More expensive infrastructure

**Best For:** Large-scale deployments, multiple teams, complex requirements

---

### Option 3: Hybrid Architecture (Recommended)

**Description:** Modular monolith with ability to extract services as needed.

```
┌─────────────────────────────────────┐
│     Main Application Server         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      API Gateway Layer      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌──────────┬──────────┬────────┐  │
│  │  Auth    │   File   │ Search │  │
│  │  Module  │  Module  │ Module │  │
│  └──────────┴──────────┴────────┘  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Shared Data Layer         │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
         ↕️
  Database + Object Storage
  
  Optional: Extract high-load modules
           to separate services later
```

**Pros:**
- ✅ Start simple, scale as needed
- ✅ Modular design with clear boundaries
- ✅ Can extract services incrementally
- ✅ Easier to develop than microservices
- ✅ Lower initial complexity
- ✅ Good balance of flexibility and simplicity

**Cons:**
- ⚠️ Requires disciplined module boundaries
- ⚠️ May need refactoring when extracting services
- ⚠️ Some coupling between modules initially

**Best For:** Growing applications, unclear scaling needs, want flexibility

---

## Language & Framework Evaluation

### Option 1: Python with FastAPI (Recommended)

**Stack:** Python 3.11+ / FastAPI / SQLAlchemy / PostgreSQL

**Sample Architecture:**
```python
# FastAPI Application Structure
vault-server/
├── app/
│   ├── main.py              # FastAPI application
│   ├── api/
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── files.py         # File operations
│   │   ├── cases.py         # Case management
│   │   └── bookmarks.py     # Bookmark management
│   ├── core/
│   │   ├── config.py        # Configuration
│   │   ├── security.py      # Security utilities
│   │   └── dependencies.py  # Dependency injection
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   └── storage/             # File storage handling
├── tests/
├── alembic/                 # Database migrations
└── requirements.txt
```

**Pros:**
- ✅ **Fast Development**: Clean syntax, excellent developer productivity
- ✅ **Type Safety**: Pydantic for request/response validation
- ✅ **Async Support**: Native async/await for concurrent operations
- ✅ **Auto Documentation**: Built-in OpenAPI/Swagger docs
- ✅ **PDF Processing**: PyPDF2, pikepdf already in ecosystem
- ✅ **Image Processing**: Pillow for thumbnails
- ✅ **Great for ML/AI**: If future features need AI/ML capabilities
- ✅ **Large Ecosystem**: Rich package ecosystem (>400k packages)
- ✅ **Easy Testing**: pytest, great testing tools

**Cons:**
- ❌ **Performance**: Slower than Go/Rust for CPU-intensive tasks
- ❌ **Memory Usage**: Higher than compiled languages
- ❌ **Deployment**: Requires Python runtime
- ⚠️ **GIL Limitations**: Threading limitations (use multiprocessing)

**Performance Characteristics:**
- Request throughput: 1,000-5,000 req/s (async)
- File upload: Excellent with streaming
- PDF processing: Good with PyPDF2/pikepdf
- Memory: ~50-100MB base + 50-200MB per worker

**Recommended Libraries:**
```python
fastapi>=0.109.0          # Web framework
uvicorn[standard]>=0.25.0 # ASGI server
sqlalchemy>=2.0.0         # ORM
alembic>=1.13.0           # Migrations
pydantic>=2.5.0           # Validation
python-multipart          # File uploads
python-jose[cryptography] # JWT tokens
passlib[bcrypt]           # Password hashing
aiofiles                  # Async file I/O
boto3                     # AWS S3 (optional)
redis>=5.0.0              # Caching
celery>=5.3.0             # Background tasks
pikepdf>=8.0.0            # PDF processing
Pillow>=10.0.0            # Image processing
```

**Deployment Options:**
1. **Local Deployment**: systemd service on Linux, Windows Service
2. **Docker**: Containerized with docker-compose
3. **Cloud**: AWS Lambda, Google Cloud Run, Heroku, DigitalOcean

**Code Example:**
```python
from fastapi import FastAPI, UploadFile, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_current_user
from app.schemas import CaseCreate, CaseResponse
from app.services.case_service import CaseService

app = FastAPI(title="Vault API", version="1.0.0")

@app.post("/api/v1/cases", response_model=CaseResponse)
async def create_case(
    case_data: CaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new case file"""
    service = CaseService(db)
    return await service.create_case(case_data, current_user)

@app.post("/api/v1/files/upload")
async def upload_file(
    file: UploadFile,
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upload file to case"""
    # Stream file to storage
    file_service = FileService(db)
    return await file_service.upload_file(file, case_id, current_user)
```

---

### Option 2: Node.js with Express/NestJS

**Stack:** Node.js 20+ / NestJS / TypeORM / PostgreSQL

**Pros:**
- ✅ **Same Language**: TypeScript across stack
- ✅ **Ecosystem**: npm packages, share code with Electron
- ✅ **Fast I/O**: Excellent for I/O-bound operations
- ✅ **Real-time**: Great for WebSockets/SSE
- ✅ **Developer Familiarity**: Team already knows TypeScript
- ✅ **PDF.js**: Already using in frontend

**Cons:**
- ❌ **CPU-Intensive**: Poor for heavy PDF processing
- ❌ **Single-Threaded**: Requires worker threads for parallelism
- ❌ **Memory Leaks**: Easier to introduce memory issues
- ⚠️ **Callback Hell**: Even with async/await

**Performance:**
- Request throughput: 5,000-10,000 req/s
- Better for I/O than CPU-bound tasks

**Recommended if:**
- Team only knows JavaScript/TypeScript
- Need real-time features (WebSockets)
- Want to share code between Electron and server

---

### Option 3: Go with Gin/Fiber

**Stack:** Go 1.21+ / Gin or Fiber / GORM / PostgreSQL

**Pros:**
- ✅ **Performance**: Extremely fast, compiled
- ✅ **Concurrency**: Excellent goroutines
- ✅ **Low Memory**: ~10-20MB base
- ✅ **Single Binary**: Easy deployment
- ✅ **Type Safety**: Static typing
- ✅ **Scalability**: Great for high-load scenarios

**Cons:**
- ❌ **Learning Curve**: Team needs to learn Go
- ❌ **Ecosystem**: Smaller than Python/Node.js
- ❌ **PDF Libraries**: Limited compared to Python
- ❌ **Development Speed**: Slower than Python/Node.js

**Performance:**
- Request throughput: 20,000-50,000 req/s
- Excellent for microservices

**Recommended if:**
- Performance is critical requirement
- High concurrency needs (1000+ concurrent users)
- Team comfortable with Go

---

### Option 4: Rust with Actix/Axum

**Stack:** Rust 1.75+ / Actix-web or Axum / Diesel / PostgreSQL

**Pros:**
- ✅ **Maximum Performance**: Fastest option
- ✅ **Memory Safety**: No garbage collection
- ✅ **Concurrency**: Safe concurrent programming
- ✅ **Single Binary**: Small binary size

**Cons:**
- ❌ **Steep Learning Curve**: Very difficult for beginners
- ❌ **Development Speed**: Slowest development
- ❌ **Ecosystem**: Smaller, less mature
- ❌ **PDF Libraries**: Very limited

**Recommended if:**
- Performance is absolute priority
- Team has Rust expertise
- Building for extreme scale

---

### Comparison Matrix

| Criterion | Python/FastAPI | Node.js/NestJS | Go/Gin | Rust/Actix |
|-----------|---------------|----------------|--------|------------|
| **Development Speed** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Performance** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **PDF Processing** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| **Learning Curve** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| **Ecosystem** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Type Safety** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Memory Usage** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Deployment Ease** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Team Familiarity** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐ |
| **Async Support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Recommendation:** **Python with FastAPI** for initial implementation
- Best balance of productivity and performance
- Excellent PDF processing libraries
- Easy to prototype and iterate
- Can optimize critical paths later
- Large talent pool for hiring

---

## Deployment & Installation Strategies

### Strategy 1: Local Server with Installer Integration (Recommended)

**Concept:** Bundle server with Electron app installer.

```
Vault Installer
├── Vault Desktop App (Electron)
├── Vault Server (Python/FastAPI)
│   ├── Executable (PyInstaller/Nuitka)
│   ├── System Service (systemd/Windows Service)
│   └── SQLite Database (local)
└── Configuration
    ├── Port: 8000 (localhost only)
    └── Auto-start on boot
```

**Installation Flow:**
1. User runs Vault installer
2. Installer installs Electron app
3. Installer installs server as system service
4. Server starts on `localhost:8000`
5. Desktop app connects to `http://localhost:8000`
6. Optional: Configure remote access

**Pros:**
- ✅ **Seamless UX**: Users don't know server exists
- ✅ **No Configuration**: Works out of the box
- ✅ **Privacy**: Data stays local
- ✅ **Offline-First**: Works without internet
- ✅ **Simple Deployment**: Single installer
- ✅ **Familiar Model**: Like traditional desktop apps

**Cons:**
- ⚠️ **Port Conflicts**: Need to handle port in use
- ⚠️ **Updates**: Need to update server separately
- ⚠️ **Debugging**: Users can't easily debug server issues

**Implementation Notes:**

**NSIS Installer (Windows):**
```nsis
Section "Vault Server"
  SetOutPath "$INSTDIR\server"
  File /r "server\*.*"
  
  ; Install as Windows Service
  ExecWait '"$INSTDIR\server\vault-server-install.exe"'
  
  ; Start service
  ExecWait 'sc start VaultServer'
SectionEnd
```

**systemd Service (Linux):**
```ini
[Unit]
Description=Vault Server
After=network.target

[Service]
Type=simple
User=vault
WorkingDirectory=/opt/vault/server
ExecStart=/opt/vault/server/vault-server
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**PyInstaller Build:**
```python
# server.spec
a = Analysis(
    ['app/main.py'],
    pathex=[],
    binaries=[],
    datas=[('app/static', 'static')],
    hiddenimports=['uvicorn', 'fastapi'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data)
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='vault-server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
)
```

**Desktop App Configuration:**
```typescript
// electron/config.ts
export const SERVER_CONFIG = {
  host: 'localhost',
  port: process.env.VAULT_SERVER_PORT || 8000,
  protocol: 'http',
  timeout: 30000,
  retryAttempts: 3,
};

export function getServerUrl(): string {
  return `${SERVER_CONFIG.protocol}://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`;
}
```

---

### Strategy 2: Separate Server Deployment

**Concept:** Server deployed independently, desktop app connects remotely.

```
┌──────────────────┐         ┌──────────────────┐
│  Desktop App     │         │  Cloud Server    │
│  (Electron)      │◄───────►│  (Python/FastAPI)│
│  localhost       │  HTTPS  │  vault.example   │
└──────────────────┘         └──────────────────┘
                                      │
                             ┌────────┴────────┐
                             │                 │
                          Database      Object Storage
```

**Deployment Options:**
1. **Cloud Providers**: AWS, GCP, Azure, DigitalOcean
2. **PaaS**: Heroku, Render, Fly.io, Railway
3. **Containerized**: Docker + Kubernetes
4. **On-Premise**: Self-hosted on company server

**Pros:**
- ✅ **Centralized**: Single source of truth
- ✅ **Multi-Device**: Access from anywhere
- ✅ **Collaboration**: Real users can share data
- ✅ **Backup**: Centralized backup strategy
- ✅ **Updates**: Update server without client updates

**Cons:**
- ❌ **Complexity**: More moving parts
- ❌ **Network Dependency**: Requires internet
- ❌ **Privacy Concerns**: Data on remote server
- ❌ **Cost**: Ongoing hosting costs

**Docker Deployment:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  vault-server:
    build: ./server
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://vault:password@db:5432/vault
      - REDIS_URL=redis://redis:6379
      - S3_BUCKET=vault-files
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads
    restart: always

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=vault
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=vault
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - vault-server
    restart: always

volumes:
  postgres_data:
```

---

### Strategy 3: Hybrid Approach (Best of Both Worlds)

**Concept:** Local server by default, optional cloud sync.

```
┌──────────────────┐
│  Desktop App     │
│  (Electron)      │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
┌─────────┐ ┌──────────┐
│ Local   │ │  Cloud   │
│ Server  │ │  Server  │
│(Primary)│ │(Optional)│
└─────────┘ └──────────┘
     │            │
  Local DB    Cloud DB
```

**Features:**
- **Default**: Local server, works offline
- **Optional**: Enable cloud sync for backup/multi-device
- **Intelligent Sync**: Only sync when changes detected
- **Conflict Resolution**: Last-write-wins or merge strategies

**Pros:**
- ✅ **Best of Both**: Privacy + collaboration
- ✅ **Flexible**: Users choose deployment model
- ✅ **Offline-First**: Works without internet
- ✅ **Gradual Migration**: Can upgrade to cloud later

**Cons:**
- ⚠️ **Complexity**: Two server implementations to maintain
- ⚠️ **Sync Conflicts**: Need conflict resolution
- ⚠️ **Testing**: More scenarios to test

---

### Installer Integration Details

**Electron Builder Configuration:**

```json
{
  "extraResources": [
    {
      "from": "server/dist/vault-server${execExt}",
      "to": "server/vault-server${execExt}"
    },
    {
      "from": "server/config/",
      "to": "server/config/"
    }
  ],
  "afterInstall": "scripts/install-server.js"
}
```

**Installation Script:**
```javascript
// scripts/install-server.js
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

async function installServer() {
  const platform = os.platform();
  const serverPath = path.join(
    __dirname, 
    '..', 
    'resources', 
    'server',
    'vault-server'
  );

  if (platform === 'win32') {
    // Install as Windows Service
    await installWindowsService(serverPath);
  } else if (platform === 'linux') {
    // Install as systemd service
    await installSystemdService(serverPath);
  } else if (platform === 'darwin') {
    // Install as LaunchAgent
    await installLaunchAgent(serverPath);
  }
}

async function installWindowsService(serverPath) {
  // Use nssm or sc.exe to install service
  return new Promise((resolve, reject) => {
    const proc = spawn('sc', [
      'create',
      'VaultServer',
      `binPath= ${serverPath}`,
      'start= auto'
    ]);
    
    proc.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`Failed to install service: ${code}`));
    });
  });
}
```

---

## Security Considerations

### Authentication & Authorization

**Option 1: Local-Only (Default)**
- No authentication needed (localhost only)
- OS-level security (user account)
- Bind to 127.0.0.1 only

**Option 2: Multi-User (Cloud/Network)**

**JWT-based Authentication:**
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key-change-this"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401)
        return username
    except JWTError:
        raise HTTPException(status_code=401)
```

**Role-Based Access Control:**
```python
from enum import Enum

class UserRole(Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

class PermissionChecker:
    def __init__(self, required_role: UserRole):
        self.required_role = required_role
    
    def __call__(self, user: User = Depends(get_current_user)):
        if user.role.value < self.required_role.value:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

# Usage
@app.delete("/cases/{case_id}")
async def delete_case(
    case_id: str,
    user: User = Depends(PermissionChecker(UserRole.EDITOR))
):
    # Only editors and admins can delete
    pass
```

### File Encryption

**At-Rest Encryption:**
```python
from cryptography.fernet import Fernet

class FileEncryption:
    def __init__(self, key: bytes):
        self.fernet = Fernet(key)
    
    async def encrypt_file(self, input_path: str, output_path: str):
        async with aiofiles.open(input_path, 'rb') as f:
            data = await f.read()
        
        encrypted = self.fernet.encrypt(data)
        
        async with aiofiles.open(output_path, 'wb') as f:
            await f.write(encrypted)
    
    async def decrypt_file(self, input_path: str) -> bytes:
        async with aiofiles.open(input_path, 'rb') as f:
            encrypted = await f.read()
        
        return self.fernet.decrypt(encrypted)
```

**In-Transit Security:**
- TLS/HTTPS for all communications
- Certificate pinning in desktop app
- Mutual TLS for sensitive deployments

### Security Best Practices

1. **Input Validation**: Validate all inputs with Pydantic
2. **SQL Injection**: Use ORM, parameterized queries
3. **XSS Prevention**: Sanitize all user content
4. **CSRF Protection**: Token-based for web interface
5. **Rate Limiting**: Prevent brute force attacks
6. **Audit Logging**: Log all security-relevant events
7. **Data Sanitization**: Remove metadata from files
8. **Access Control**: Principle of least privilege
9. **Secure Defaults**: Secure by default, opt-in to features
10. **Regular Updates**: Keep dependencies updated

**Rate Limiting Example:**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginRequest):
    # Limit login attempts to 5 per minute
    pass
```

---

## Performance & Scalability

### File Storage Strategies

**Option 1: Local File System (Default)**
```python
import aiofiles
import os
from pathlib import Path

class LocalFileStorage:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    async def save_file(self, file_id: str, content: bytes) -> str:
        file_path = self.base_path / file_id
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        return str(file_path)
    
    async def get_file(self, file_id: str) -> bytes:
        file_path = self.base_path / file_id
        async with aiofiles.open(file_path, 'rb') as f:
            return await f.read()
```

**Option 2: Object Storage (S3-Compatible)**
```python
import boto3
from botocore.exceptions import ClientError

class S3FileStorage:
    def __init__(self, bucket_name: str):
        self.s3 = boto3.client('s3')
        self.bucket = bucket_name
    
    async def save_file(self, file_id: str, content: bytes) -> str:
        try:
            self.s3.put_object(
                Bucket=self.bucket,
                Key=file_id,
                Body=content,
                ServerSideEncryption='AES256'
            )
            return f"s3://{self.bucket}/{file_id}"
        except ClientError as e:
            raise StorageError(f"Failed to save file: {e}")
    
    async def get_file(self, file_id: str) -> bytes:
        try:
            response = self.s3.get_object(
                Bucket=self.bucket,
                Key=file_id
            )
            return response['Body'].read()
        except ClientError as e:
            raise StorageError(f"Failed to get file: {e}")
    
    def get_presigned_url(self, file_id: str, expiration: int = 3600) -> str:
        """Generate temporary download URL"""
        return self.s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': self.bucket, 'Key': file_id},
            ExpiresIn=expiration
        )
```

### Caching Strategy

**Multi-Layer Caching:**
```python
import redis.asyncio as redis
from functools import wraps
import hashlib
import json

class CacheManager:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url)
    
    def cache(self, ttl: int = 300):
        """Decorator for caching function results"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                key_data = f"{func.__name__}:{args}:{kwargs}"
                cache_key = hashlib.md5(key_data.encode()).hexdigest()
                
                # Try to get from cache
                cached = await self.redis.get(cache_key)
                if cached:
                    return json.loads(cached)
                
                # Execute function
                result = await func(*args, **kwargs)
                
                # Store in cache
                await self.redis.setex(
                    cache_key,
                    ttl,
                    json.dumps(result)
                )
                
                return result
            return wrapper
        return decorator

# Usage
cache = CacheManager("redis://localhost:6379")

@cache.cache(ttl=3600)
async def get_case_files(case_id: str) -> list:
    # Expensive database query
    return await db.query(File).filter_by(case_id=case_id).all()
```

### Background Task Processing

**Celery for Heavy Operations:**
```python
from celery import Celery
from app.services.pdf_service import PDFProcessor

celery = Celery('vault', broker='redis://localhost:6379/0')

@celery.task
def process_pdf_extraction(file_id: str, case_id: str):
    """Extract PDF pages in background"""
    processor = PDFProcessor()
    return processor.extract_pages(file_id, case_id)

@celery.task
def generate_thumbnails(file_ids: list[str]):
    """Generate thumbnails for multiple files"""
    from app.services.thumbnail_service import ThumbnailGenerator
    generator = ThumbnailGenerator()
    return generator.batch_generate(file_ids)

# Usage in API
@app.post("/extract-pdf")
async def extract_pdf(file_id: str, case_id: str):
    task = process_pdf_extraction.delay(file_id, case_id)
    return {"task_id": task.id, "status": "processing"}

@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    task = celery.AsyncResult(task_id)
    return {
        "status": task.state,
        "result": task.result if task.ready() else None
    }
```

### Streaming Large Files

```python
from fastapi import StreamingResponse
from fastapi.responses import FileResponse
import aiofiles

@app.get("/files/{file_id}/download")
async def download_file(file_id: str):
    """Stream large file to client"""
    file_path = await get_file_path(file_id)
    
    async def file_generator():
        async with aiofiles.open(file_path, 'rb') as f:
            chunk_size = 1024 * 1024  # 1MB chunks
            while chunk := await f.read(chunk_size):
                yield chunk
    
    return StreamingResponse(
        file_generator(),
        media_type='application/octet-stream',
        headers={
            'Content-Disposition': f'attachment; filename="{file_id}"'
        }
    )

@app.post("/files/upload")
async def upload_large_file(request: Request):
    """Stream upload with progress tracking"""
    content_length = int(request.headers.get('content-length', 0))
    chunk_size = 1024 * 1024  # 1MB
    bytes_received = 0
    
    async with aiofiles.open(temp_path, 'wb') as f:
        async for chunk in request.stream():
            await f.write(chunk)
            bytes_received += len(chunk)
            
            # Report progress (via WebSocket or SSE)
            progress = (bytes_received / content_length) * 100
            await notify_progress(progress)
    
    return {"status": "uploaded", "size": bytes_received}
```

### Database Optimization

**Connection Pooling:**
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost/vault",
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
    pool_recycle=3600,
)

async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    async with async_session() as session:
        yield session
```

**Query Optimization:**
```python
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload

# Eager loading to avoid N+1 queries
async def get_case_with_files(case_id: str, db: AsyncSession):
    stmt = (
        select(Case)
        .where(Case.id == case_id)
        .options(
            selectinload(Case.files),
            selectinload(Case.tags)
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

# Pagination for large result sets
async def list_files_paginated(
    case_id: str,
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = None
):
    offset = (page - 1) * page_size
    stmt = (
        select(File)
        .where(File.case_id == case_id)
        .limit(page_size)
        .offset(offset)
        .order_by(File.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()
```

### Scalability Targets

**Initial Scale (v1.0):**
- **Users**: 1-50 concurrent users
- **Files**: Up to 100,000 files
- **Storage**: Up to 500GB
- **Throughput**: 100 req/s
- **Response Time**: <500ms for API calls

**Growth Scale (v2.0):**
- **Users**: 100-500 concurrent users
- **Files**: Up to 1 million files
- **Storage**: Up to 10TB
- **Throughput**: 1,000 req/s
- **Response Time**: <300ms for API calls

**Enterprise Scale (v3.0+):**
- **Users**: 1,000+ concurrent users
- **Files**: 10+ million files
- **Storage**: 100TB+
- **Throughput**: 10,000+ req/s
- **Response Time**: <200ms for API calls

---

## Recommended Approach

Based on the comprehensive analysis, here's the recommended implementation strategy:

### Phase 1: Foundation (v1.0) - 3-4 months

**Architecture:**
- **Hybrid Modular Monolith** with clear module boundaries
- **Python/FastAPI** server
- **Local-first** deployment bundled with installer
- **SQLite** database for local deployment
- **File system** storage

**Features:**
- ✅ REST API for all current IPC operations
- ✅ Local authentication (optional, for multi-user machines)
- ✅ File upload/download with streaming
- ✅ PDF extraction via background tasks
- ✅ Thumbnail generation
- ✅ Full-text search (SQLite FTS5)
- ✅ Basic caching (in-memory)

**Desktop App Changes:**
- Replace IPC calls with HTTP API calls
- Maintain backward compatibility (detect server availability)
- Add connection health monitoring
- Implement offline mode (fallback to IPC)

**Deliverables:**
- [ ] FastAPI server application
- [ ] Database models and migrations
- [ ] File storage abstraction
- [ ] API documentation (OpenAPI)
- [ ] Desktop app HTTP client
- [ ] Installer integration
- [ ] Basic tests (70%+ coverage)

### Phase 2: Enhancement (v1.5) - 2-3 months

**Features:**
- ✅ Optional cloud deployment
- ✅ PostgreSQL support for cloud
- ✅ S3-compatible object storage
- ✅ Real-time updates (WebSocket/SSE)
- ✅ Multi-user collaboration
- ✅ Role-based access control
- ✅ Redis caching
- ✅ Background task queue (Celery)

**Desktop App Changes:**
- Cloud sync configuration UI
- Conflict resolution UI
- Real-time update notifications
- Collaborative features

**Deliverables:**
- [ ] Cloud deployment guide
- [ ] Docker compose setup
- [ ] Kubernetes manifests (optional)
- [ ] Sync engine
- [ ] Collaborative editing
- [ ] Advanced tests (80%+ coverage)

### Phase 3: Scale (v2.0) - 3-4 months

**Features:**
- ✅ Microservices extraction (if needed)
  - Auth service
  - File processing service
  - Search service
- ✅ Advanced search (Elasticsearch)
- ✅ CDN integration
- ✅ Advanced analytics
- ✅ Audit logging
- ✅ Admin dashboard
- ✅ API rate limiting
- ✅ Horizontal scaling

**Infrastructure:**
- Load balancing
- Database replication
- Automated backups
- Monitoring and alerting
- Performance optimization

**Deliverables:**
- [ ] Production-ready deployment
- [ ] Monitoring dashboards
- [ ] Performance benchmarks
- [ ] Security audit
- [ ] Comprehensive documentation
- [ ] Enterprise features

---

## Implementation Roadmap

### Milestone 1: API Design & Prototype (Weeks 1-4)

**Week 1-2: API Design**
- [ ] Define OpenAPI specification
- [ ] Design database schema
- [ ] Design file storage architecture
- [ ] Create API documentation
- [ ] Review with team

**Week 3-4: Prototype**
- [ ] Set up FastAPI project
- [ ] Implement core endpoints (cases, files)
- [ ] Set up SQLite database
- [ ] Basic file upload/download
- [ ] Test with Postman/curl

**Deliverables:**
- OpenAPI spec (YAML)
- Database schema (ERD)
- Working prototype
- API documentation

### Milestone 2: Core API Implementation (Weeks 5-10)

**Week 5-6: Authentication & Users**
- [ ] User registration and login
- [ ] JWT token management
- [ ] Password hashing
- [ ] Role-based access control

**Week 7-8: Case & File Management**
- [ ] CRUD operations for cases
- [ ] File upload with validation
- [ ] File metadata management
- [ ] Category tags API
- [ ] Bookmarks API

**Week 9-10: PDF & Image Processing**
- [ ] PDF extraction endpoint
- [ ] Thumbnail generation
- [ ] Background task integration
- [ ] Progress tracking

**Deliverables:**
- Functional API server
- Database migrations
- Unit tests (70%+ coverage)
- Integration tests

### Milestone 3: Desktop App Integration (Weeks 11-14)

**Week 11-12: HTTP Client**
- [ ] Replace IPC with HTTP calls
- [ ] Error handling and retries
- [ ] Connection health checks
- [ ] Fallback to IPC mode

**Week 13-14: Testing & Refinement**
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Bug fixes
- [ ] UI/UX polish

**Deliverables:**
- Integrated desktop app
- Migration guide
- Test suite
- Bug fixes

### Milestone 4: Installer & Deployment (Weeks 15-16)

**Week 15: Installer Integration**
- [ ] Package server as executable
- [ ] Windows Service integration
- [ ] systemd service (Linux)
- [ ] LaunchAgent (macOS)
- [ ] Installer scripts

**Week 16: Documentation & Release**
- [ ] User documentation
- [ ] Developer documentation
- [ ] Deployment guide
- [ ] Release notes
- [ ] v1.0 release

**Deliverables:**
- Production installers
- Complete documentation
- Release build
- GitHub release

---

## Appendices

### Appendix A: Sample API Specification

**Base URL:** `http://localhost:8000/api/v1`

**Authentication:** Bearer token (JWT)

**Endpoints:**

```yaml
# Cases
GET    /cases                    # List all cases
POST   /cases                    # Create case
GET    /cases/{id}               # Get case details
PUT    /cases/{id}               # Update case
DELETE /cases/{id}               # Delete case

# Files
GET    /cases/{id}/files         # List case files
POST   /cases/{id}/files         # Upload file
GET    /files/{id}               # Get file metadata
PUT    /files/{id}               # Update file metadata
DELETE /files/{id}               # Delete file
GET    /files/{id}/download      # Download file
GET    /files/{id}/thumbnail     # Get thumbnail

# PDF Operations
POST   /files/{id}/extract       # Extract PDF pages
GET    /extractions/{id}/status  # Get extraction status
GET    /extractions/{id}/pages   # List extracted pages

# Bookmarks
GET    /bookmarks                # List bookmarks
POST   /bookmarks                # Create bookmark
GET    /bookmarks/{id}           # Get bookmark
PUT    /bookmarks/{id}           # Update bookmark
DELETE /bookmarks/{id}           # Delete bookmark

# Category Tags
GET    /tags                     # List tags
POST   /tags                     # Create tag
GET    /tags/{id}                # Get tag
PUT    /tags/{id}                # Update tag
DELETE /tags/{id}                # Delete tag

# Search
GET    /search                   # Search files and cases
GET    /search/advanced          # Advanced search

# Authentication
POST   /auth/register            # Register user
POST   /auth/login               # Login
POST   /auth/refresh             # Refresh token
POST   /auth/logout              # Logout

# Settings
GET    /settings                 # Get user settings
PUT    /settings                 # Update settings
```

### Appendix B: Database Schema

**Core Tables:**

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cases
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Files
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    storage_path VARCHAR(500),
    parent_pdf_id UUID REFERENCES files(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Category Tags
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#888888',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Case Tags (many-to-many)
CREATE TABLE case_tags (
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (case_id, tag_id)
);

-- File Tags (many-to-many)
CREATE TABLE file_tags (
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (file_id, tag_id)
);

-- Bookmarks
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    page_number INT,
    name VARCHAR(255),
    description TEXT,
    notes TEXT,
    thumbnail_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Extraction Jobs
CREATE TABLE extraction_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id),
    status VARCHAR(20) DEFAULT 'pending',
    progress INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_files_case_id ON files(case_id);
CREATE INDEX idx_files_parent_pdf ON files(parent_pdf_id);
CREATE INDEX idx_bookmarks_file_id ON bookmarks(file_id);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_case_tags_case_id ON case_tags(case_id);
CREATE INDEX idx_file_tags_file_id ON file_tags(file_id);

-- Full-text search
CREATE VIRTUAL TABLE files_fts USING fts5(
    name,
    content_text,
    content=files,
    content_rowid=id
);
```

### Appendix C: Technology Comparison

**Language Performance Benchmarks** (Requests/second, higher is better):

| Framework | Simple JSON | Database Query | File Upload (100MB) |
|-----------|-------------|----------------|---------------------|
| FastAPI   | 4,500       | 1,200          | 850                 |
| NestJS    | 8,000       | 2,000          | 1,500               |
| Go/Gin    | 35,000      | 8,000          | 3,500               |
| Rust/Actix| 50,000      | 12,000         | 5,000               |

**Development Time Estimates** (Weeks for MVP):

| Framework | API Development | Testing | Documentation | Total |
|-----------|----------------|---------|---------------|-------|
| FastAPI   | 6              | 2       | 1             | 9     |
| NestJS    | 7              | 2       | 1             | 10    |
| Go/Gin    | 10             | 3       | 2             | 15    |
| Rust/Actix| 14             | 4       | 2             | 20    |

**Ecosystem Maturity:**

| Criterion | Python | Node.js | Go | Rust |
|-----------|--------|---------|----| -----|
| PDF Processing | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| ORM Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Testing Tools | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Package Count | 400k+ | 2M+ | 100k+ | 100k+ |
| Learning Resources | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

### Appendix D: Cost Analysis

**Cloud Hosting (Monthly Costs):**

**Small Scale (10-50 users):**
- DigitalOcean Droplet (2 vCPU, 4GB RAM): $24/mo
- Database (Managed PostgreSQL): $15/mo
- Object Storage (250GB): $5/mo
- Total: ~$44/mo

**Medium Scale (50-200 users):**
- Application Server (4 vCPU, 8GB RAM): $48/mo
- Database (Managed, HA): $60/mo
- Object Storage (1TB): $20/mo
- Redis Cache: $10/mo
- Load Balancer: $10/mo
- Total: ~$148/mo

**Large Scale (200-1000 users):**
- Application Servers (2x 8 vCPU, 16GB): $192/mo
- Database (Managed, HA, Replicas): $200/mo
- Object Storage (5TB): $100/mo
- Redis Cache (HA): $50/mo
- Load Balancer: $10/mo
- CDN: $50/mo
- Total: ~$602/mo

**Self-Hosted (One-time + Ongoing):**
- Server Hardware: $2,000-$10,000 (one-time)
- Operating System: $0 (Linux)
- Electricity: $20-50/mo
- Internet: $50-200/mo
- Maintenance: Variable

### Appendix E: Migration Strategy

**Migrating from Current IPC to REST API:**

**Step 1: Dual Mode Support**
```typescript
// app/services/ApiService.ts
export class ApiService {
  private useServer: boolean;
  
  constructor() {
    this.useServer = this.detectServer();
  }
  
  private async detectServer(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:8000/health');
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async createCase(name: string): Promise<Case> {
    if (this.useServer) {
      // Use REST API
      return this.createCaseHttp(name);
    } else {
      // Fallback to IPC
      return this.createCaseIpc(name);
    }
  }
  
  private async createCaseHttp(name: string): Promise<Case> {
    const response = await fetch('http://localhost:8000/api/v1/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return response.json();
  }
  
  private async createCaseIpc(name: string): Promise<Case> {
    return window.electron.createCaseFolder(name);
  }
}
```

**Step 2: Gradual Migration**
1. Release v1.0 with dual mode (default: IPC)
2. Release v1.1 with server (default: server, fallback: IPC)
3. Release v1.2 server-only (remove IPC)

**Data Migration:**
```python
# migration script
import sqlite3
import shutil
from pathlib import Path

async def migrate_vault_data(vault_path: str, db_path: str):
    """Migrate existing vault to database"""
    
    # Create database connection
    db = sqlite3.connect(db_path)
    
    # Scan vault directory
    vault = Path(vault_path)
    for case_dir in vault.iterdir():
        if case_dir.is_dir():
            # Create case in database
            case_id = await create_case_in_db(db, case_dir.name)
            
            # Import files
            for file_path in case_dir.rglob('*'):
                if file_path.is_file():
                    await import_file_to_db(db, case_id, file_path)
    
    db.close()
```

### Appendix F: Glossary

**API Gateway:** Entry point for all client requests, handles routing and authentication

**Async/Await:** Programming pattern for handling asynchronous operations

**CDN:** Content Delivery Network, distributes content globally for faster access

**CORS:** Cross-Origin Resource Sharing, security feature for web browsers

**IPC:** Inter-Process Communication, method for processes to exchange data

**JWT:** JSON Web Token, standard for secure information transmission

**ORM:** Object-Relational Mapping, database abstraction layer

**RBAC:** Role-Based Access Control, permissions based on user roles

**REST:** Representational State Transfer, architectural style for APIs

**SSE:** Server-Sent Events, server-to-client real-time updates

**WebSocket:** Bidirectional real-time communication protocol

---

## Conclusion

This research document provides a comprehensive analysis of networking approaches for the Vault application. The recommended approach is:

1. **Architecture:** Hybrid Modular Monolith
2. **Language:** Python with FastAPI
3. **Deployment:** Local-first with installer integration
4. **Scalability:** Plan for cloud deployment in Phase 2

**Next Steps:**
1. Review this document with the team
2. Create GitHub Discussion for community feedback
3. Finalize architecture decisions
4. Begin Phase 1 implementation

**Timeline:**
- Phase 1 (Local Server): 3-4 months
- Phase 2 (Cloud Support): 2-3 months  
- Phase 3 (Scale): 3-4 months
- **Total:** 8-11 months to production-ready v2.0

---

**Document Metadata:**
- **Author:** Vault Development Team
- **Version:** 1.0
- **Last Updated:** January 2026
- **Status:** Draft for Discussion
- **License:** Proprietary - Vault License

For questions or feedback, please comment in the GitHub Discussion thread.
