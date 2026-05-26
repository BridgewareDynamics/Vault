# The Vault

**A Professional Research Organization Tool**

**Version**: 1.0.0-prerelease.6

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-28.1-blue.svg)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

The Vault is a desktop research workspace for investigators, researchers, and professionals who need to extract, organize, map, and audit document-driven work. Built with Electron and React, it now brings four connected workflows into one application: `PDF to PNG` for page extraction, `The Vault` for case-based organization, `Map` for visual research timelines, and `PDF Audit` for security and redaction review. Recent updates also add case-linkable maps, smarter audit report saving, and case-aware note browsing alongside bookmarks, thumbnails, and rich text editing.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [Technical Details](#technical-details)
- [Development](#development)
- [License](#license)

## Features

### Connected Research Workspace
- **Four Launch Surfaces**: Start from `PDF to PNG`, `The Vault`, `PDF Audit`, or `Map` directly from the welcome screen
- **Connected Workflow**: Onboarding and home navigation now frame the app as a single `Extract -> Archive -> Map -> Audit` workflow
- **Unified Experience**: Shared theming, detached windows, toast feedback, and keyboard-friendly dialogs across the app

### PDF to PNG
- **High-Quality Conversion**: Extract PDF pages into PNG or JPEG outputs
- **Whole-Document Processing**: Run extraction with real-time progress feedback and gallery previews
- **Flexible Saving**: Export to custom folders or ZIP archives
- **Parent File Preservation**: Optionally keep the original PDF alongside extracted pages

### The Vault
- **Case-Based Organization**: Create and manage case folders for investigations and research projects
- **Category Tags**: Apply custom color-coded tags to cases and individual files
- **Archive Search & Navigation**: Browse nested folders with breadcrumbs, search, tag filtering, and inline file actions
- **Integrated File Workflows**: Drag files into a case, extract PDFs inside a case, and keep related evidence together

### Research Maps
- **Map Workspace**: Create blank maps from a dedicated `Map` area and reopen work from the `Map Library`
- **Visual Chronology Builder**: Build timelines with dated blocks and branch cards for side threads, related evidence, or alternate paths
- **Block-Level Context**: Add notes and file attachments directly to map blocks
- **Case Linking**: Assign a map to a case or move it back to the Vault library later
- **Library Controls**: Search maps, filter by `All maps`, `Vault`, or `Case linked`, and sort by recency, title, or block count
- **Export Options**: Export a map as a PNG poster, native JSON, or copy the full map folder to another destination

### PDF Audit
- **Security & Redaction Analysis**: Review PDFs for redaction overlap issues and document security concerns
- **Report Generation**: Generate audit reports from findings inside the app
- **Smarter Save Placement**: Save reports with `Save Loose`, `Make PDF Folder`, `Add to PDF Folder`, or `Make Subfolder Within PDF Folder`
- **Case-Friendly Output**: Audit reports can now be placed alongside extracted PDF material more cleanly

### Notes, Bookmarks, and Writing
- **Rich Text Editing**: Lexical-based editor with formatting, keyboard shortcuts, detached windows, and unsaved-change protection
- **Case-Aware Notes**: Browse notes with a `Case Notes Gallery`, switch to `View All Cases`, and create a `New Note` in the current case context
- **Global Text Library**: Keep reusable notes outside of any single case in the root `TextLibrary`
- **Bookmark System**: Save PDF page bookmarks with thumbnails, folders, metadata, and cross-window open support

### File Viewing & Management
- **Thumbnail Generation**: Automatic thumbnails for images, PDFs, and videos with caching for performance
- **Enhanced Viewer**: Zoom, reset, double-click zoom, keyboard navigation, and drag-to-pan support
- **File Type Detection**: Automatic categorization of images, PDFs, videos, and other assets
- **Metadata Tracking**: File size, modification dates, and parent PDF relationships for extraction folders

## Architecture

### Tech Stack

- **Frontend**: React 18.2, TypeScript 5.3, TailwindCSS, Framer Motion, `@xyflow/react`
- **Backend**: Electron 28.1, Node.js 22.15.1, `better-sqlite3`
- **PDF Processing**: PDF.js 3.11.174
- **Image & Export Utilities**: Sharp 0.33.2, `html-to-image`, JSZip
- **Testing**: Vitest 1.1.0, Testing Library
- **Build Tools**: Vite 5.0, Electron Builder 24.9


## Installation & Setup

### Prerequisites

- **Node.js**: Version `22.15.1`
- **npm**: Version `11.6.2` or higher
- **Git**: For cloning the repository

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/BridgewareDynamics/Vault.git
   cd Vault
   ```
   Note: Repository access is subject to license terms. See [LICENSE](LICENSE) for details.

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Run in development mode**
   ```bash
   npm run electron:dev
   ```
   This command will:
   - Build the Electron main process
   - Start the Vite dev server
   - Launch the Electron application
   
   **Note**: For development, you can also run just the frontend dev server:
   ```bash
   npm run dev
   ```
   This starts only the Vite dev server (useful for frontend-only development).

4. **Development scripts**
   ```bash
   # Build Electron main process only
   npm run build:electron
   
   # Build React frontend only
   npm run build
   
   # Build both
   npm run build:all
   
   # Preview production build
   npm run preview
   
   # Run tests
   npm run test
   npm run test:watch
   npm run test:ui
   npm run test:coverage
   
   # Linting
   npm run lint
   ```

### Production Build

1. **Build the executable/installer**
   ```bash
   npm run electron:build
   ```
   This command will:
   - Clean previous release builds
   - Build both frontend and Electron main process
   - Create platform-specific installers:
     - **Windows**: Creates an NSIS installer (`.exe`) in `release/`
     - **macOS**: Creates a DMG file in `release/`
     - **Linux**: Creates an AppImage in `release/`

2. **Build output locations**
   - Compiled files: `dist/` (frontend) and `dist-electron/` (main process)
   - Installers/Executables: `release/`
   - Windows installer: `release/Vault Setup X.X.X.exe`

3. **Individual build steps** (if needed)
   ```bash
   # Build frontend only
   npm run build
   
   # Build Electron main process only
   npm run build:electron
   
   # Build both (frontend + Electron)
   npm run build:all
   ```

### Project Structure

```text
Vault/
├── electron/                    # Electron main process
│   ├── main.ts                  # IPC handlers and app orchestration
│   ├── preload.ts               # Typed renderer bridge
│   ├── database/                # Database integration and file watching
│   └── utils/
│       ├── archiveConfig.ts     # Vault configuration
│       ├── mapStorage.ts        # Map persistence, exports, and storage layout
│       ├── pathValidator.ts     # Safe path validation
│       ├── pdfExtractor.ts      # PDF processing
│       └── thumbnailGenerator.ts
├── src/                         # React application
│   ├── components/
│   │   ├── Archive/             # Case archive UI
│   │   ├── Map/                 # Map landing, library, canvas, dialogs
│   │   ├── Onboarding/          # First-run workflow guidance
│   │   ├── WordEditor/          # Notes and writing tools
│   │   └── Toast/               # Toast notification system
│   ├── contexts/                # Archive and editor providers
│   ├── hooks/
│   │   ├── useArchive.ts
│   │   ├── useArchiveExtraction.ts
│   │   ├── useMapDocument.ts
│   │   └── usePDFExtraction.ts
│   ├── types/                   # Shared TypeScript definitions
│   ├── utils/                   # Utility modules, including map layout/routing helpers
│   └── test-utils/              # Test helpers and mocks
├── dist/                        # Built frontend (generated)
├── dist-electron/               # Built Electron main process (generated)
└── release/                     # Installers and packaged builds (generated)
```

## Usage Guide

### Getting Started

1. **Launch The Vault**
   - Start the desktop app and choose one of four workspaces from the home screen:
     - **PDF to PNG**
     - **The Vault**
     - **PDF Audit**
     - **Map**

2. **Configure Your Vault Directory**
   - The first time you open `The Vault` or `Map`, select the directory that will store your archive
   - This location is reused in later sessions

3. **Follow the Built-In Onboarding**
   - First-run onboarding now walks through the full `Extract -> Archive -> Map -> Audit` workflow

### PDF to PNG Workflow

1. **Open `PDF to PNG`**
   - Choose a PDF from the home screen
   - Extraction starts immediately

2. **Monitor Progress**
   - Watch real-time extraction updates
   - Review page thumbnails as they are generated

3. **Save Output**
   - Pick a destination folder
   - Optionally save the original PDF
   - Optionally export everything to ZIP

### The Vault Workflow

1. **Create a Case**
   - Open `The Vault`
   - Create a case folder for the matter, project, or investigation you are working on

2. **Organize Source Material**
   - Drag files into a case or add them through the file picker
   - Create extraction folders from PDFs inside a case
   - Use category tags, search, and breadcrumbs to keep navigation manageable

3. **Work with Files**
   - Open images, PDFs, and videos with thumbnail-backed previews
   - Rename or delete files and folders with inline actions and confirmation dialogs

4. **Capture Notes and Bookmarks**
   - Open the text editor for case notes or global notes
   - Create PDF page bookmarks for quick return points in source documents

### Research Maps Workflow

1. **Open `Map`**
   - Choose `Create Blank Map` to start fresh
   - Or open `Map Library` to resume saved work

2. **Build Your Timeline**
   - Add dated timeline blocks for major events
   - Add branch cards for side threads, alternate explanations, or related evidence
   - Attach files and notes directly to each block

3. **Link Maps to Case Work**
   - Use `Assign case` to move a map into a case
   - Use `Move to Vault Library` to return it to global storage later

4. **Search and Export**
   - In `Map Library`, search maps, filter by storage scope, and sort by recency, title, or block count
   - Export maps as PNG, native JSON, or a copied map folder

### PDF Audit Workflow

1. **Open `PDF Audit`**
   - Select a PDF and run the security/redaction audit

2. **Review Findings**
   - Inspect flagged pages and redaction overlap warnings
   - Review document-level security findings such as metadata, attachments, annotations, forms, layers, or suspicious updates when present

3. **Save the Audit Report**
   - Choose the save strategy that fits the case:
     - **Save Loose**
     - **Make PDF Folder**
     - **Add to PDF Folder**
     - **Make Subfolder Within PDF Folder**

### Notes and Bookmarks

1. **Case Notes Gallery**
   - If you are not already inside a case, open the notes flow and browse all cases from `Case Notes Gallery`
   - Use `View All Cases` to switch back from a case-specific notes view

2. **Create Notes in Context**
   - `New Note` creates a note inside the active case when you are working in case context
   - Otherwise, notes are saved into the global `TextLibrary`

3. **Use Bookmarks for Fast Navigation**
   - Save important PDF pages with thumbnails and metadata
   - Open bookmarks back into the main window from detached views

### Best Practices for Research Organization

1. **Keep Related Work Together**
   - Store the case, extracted pages, notes, map, and audit output in the same Vault workflow whenever possible

2. **Use Maps for Chronology**
   - Build a map when folders alone stop being enough to explain sequence, causality, or branching events

3. **Save Audits Beside Their Source**
   - Prefer saving audit reports inside the PDF folder or a subfolder within it so the report stays attached to the document history

4. **Use Global Libraries Intentionally**
   - Keep reusable references in `Map Library` or `TextLibrary`
   - Link work back to a case once it becomes investigation-specific

## Technical Details

### Key Components

#### Main Process (`electron/main.ts`)
- Handles secure file system operations, PDF extraction, archive workflows, audit reporting, map persistence, and exports
- Owns the IPC surface used by the renderer
- Validates paths before touching the file system

#### Preload Script (`electron/preload.ts`)
- Bridges renderer and main processes
- Exposes typed APIs for extraction, archive, notes, bookmarks, audit, and map features
- Preserves Electron security boundaries with context isolation

#### React Application (`src/App.tsx`)
- Routes between the four top-level workspaces: `PDF to PNG`, `The Vault`, `PDF Audit`, and `Map`
- Hosts onboarding, settings, toasts, and detached-window reattachment flows

#### Map Workspace (`src/components/Map/`)
- Contains the map landing page, library, editor, export dialog, and React Flow canvas
- Supports autosaving documents, chronology relayout, case linking, and attachment-backed blocks

#### Writing & Notes (`src/components/WordEditor/`)
- Provides the Lexical editor, text library, detached editor support, and case-aware note browsing

#### Custom Hooks

**`usePDFExtraction`** (`src/hooks/usePDFExtraction.ts`)
- Manages PDF extraction state, progress updates, and extracted page data

**`useArchive`** (`src/hooks/useArchive.ts`)
- Manages archive drive setup, case loading, search, file actions, and thumbnails

**`useArchiveExtraction`** (`src/hooks/useArchiveExtraction.ts`)
- Handles case-scoped PDF extraction and extraction-folder workflows

**`useMapDocument`** (`src/hooks/useMapDocument.ts`)
- Loads, autosaves, and updates map documents
- Persists viewport and layout changes while keeping the editor responsive

**`useCategoryTags`** (`src/hooks/useCategoryTags.ts`)
- Manages category tag creation, assignment, lookup, and filtering

### IPC Handlers

The application uses Electron IPC for secure communication between processes. Major handler groups include:

- **Extraction**: `select-pdf-file`, `validate-pdf-for-extraction`, `read-pdf-file`, `save-files`, `extract-pdf-from-archive`
- **Archive**: `select-archive-drive`, `create-case-folder`, `list-archive-cases`, `list-case-files`, `add-files-to-case`, `create-extraction-folder`, `rename-file`, `delete-file`
- **Tags and metadata**: `get-category-tags`, `create-category-tag`, `delete-category-tag`, `set-case-category-tag`, `set-file-category-tag`
- **Notes and bookmarks**: `list-text-files`, `create-text-file`, `save-text-file`, `delete-text-file`, `list-case-notes`, `create-case-note`, `create-bookmark`, `get-bookmarks`, `update-bookmark`, `delete-bookmark`
- **Audit**: `audit-pdf-redaction`, `generate-audit-report`
- **Maps**: `list-maps`, `list-case-maps`, `create-map`, `read-map`, `save-map`, `rename-map`, `delete-map`, `select-map-attachments`, `export-map-to-directory`, `export-map-png`

### State Management

The application uses React hooks and context providers for state management:
- **Local State**: `useState` for view-specific UI state
- **Custom Hooks**: Feature-specific state and side effects
- **Context API**: Toast, settings, archive, and word editor state
- **Refs**: Used for viewport persistence, focus management, and avoiding unnecessary re-renders

### File Organization System

The Vault stores case work, maps, and notes in a structured on-disk layout:

```text
vault-directory/
├── Case-Name-1/
│   ├── .maps/
│   │   └── <map-id>/
│   │       ├── map.vault-map.json
│   │       └── assets/
│   ├── .notes/
│   │   └── interview-summary.txt
│   ├── document1.pdf
│   ├── image1.jpg
│   └── Extraction-Folder-1/
│       ├── .parent-pdf
│       ├── document1.pdf
│       ├── page-1.png
│       └── ...
├── MapLibrary/
│   └── <map-id>/
│       ├── map.vault-map.json
│       └── assets/
├── TextLibrary/
│   └── general-notes.txt
└── ...
```

### Security Features

- **Path Validation**: All file and folder paths are validated before operations
- **Context Isolation**: Renderer code cannot access Node.js directly
- **Safe IPC Surface**: Only whitelisted, typed operations are exposed through the preload bridge
- **Input Sanitization**: Case names, folder names, and file actions are validated before use

## Development

### Code Structure

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Component-Based**: Modular React components
- **Separation of Concerns**: Clear separation between UI and business logic
- **Testing**: Comprehensive test suite with Vitest
  - Unit tests for hooks and utilities
  - Component tests with Testing Library
  - Coverage reporting with v8 provider
  - Test UI for interactive debugging

### Building

The build process consists of two stages:

1. **TypeScript Compilation**
   - Frontend: `tsc` (via Vite)
   - Main Process: `tsc -p tsconfig.node.json`

2. **Bundling**
   - Frontend: Vite bundles React app
   - Main Process: Electron Builder packages application

### Development Workflow

1. Make changes to source files
2. Development server auto-reloads (HMR for React)
3. Electron window reloads automatically
4. Test changes in real-time

### Contributing

**Note**: This is a proprietary software project. Contributions and modifications are subject to the license terms.

If you wish to contribute:
1. Review the [LICENSE](LICENSE) file to understand the terms
2. Ensure your contributions comply with the license
3. Contact Bridgeware Dynamics for guidance on contribution processes
4. Any contributions must maintain all copyright notices and attribution requirements

For questions about contributing, contact: **Bridgeware Dynamics** at Bridgewarefreelance@gmail.com

### Code Style

- Use TypeScript for all new code
- Follow React best practices
- Use functional components with hooks
- Maintain consistent naming conventions
- Add comments for complex logic

## Known Limitations

### Production Requirements

Before deploying to production, please review [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for important setup requirements:

- **Code Signing Certificates**: Required for Windows and macOS installers to avoid security warnings
  - Windows: Requires a code signing certificate from a trusted CA
  - macOS: Requires Apple Developer account ($99/year)
  - See PRODUCTION_READINESS.md for detailed setup instructions

- **Application Icons**: Platform-specific icons need to be generated
  - Windows: `build/icon.ico` (multi-resolution ICO)
  - macOS: `build/icon.icns` (ICNS format)
  - Linux: `build/icon.png` (512x512 or larger)
  - See `build/ICONS_README.md` for instructions

### Functional Limitations

- **PDF Compatibility**: Some complex PDFs with advanced features may not extract perfectly
  - Encrypted PDFs require password input (not currently supported)
  - PDFs with embedded multimedia may not render correctly
  - Very large PDFs (>100MB) may take significant time to process

- **File System**: 
  - Vault directory must be on a local drive (network drives may have performance issues)
  - Very large files (>500MB) may cause performance degradation
  - File operations are synchronous and may block UI for large operations

- **Platform-Specific**:
  - macOS: Gatekeeper may require manual approval for unsigned builds
  - Windows: Windows Defender may flag unsigned executables
  - Linux: AppImage requires FUSE to be installed

- **Performance**:
  - Thumbnail generation for large image files may be slow
  - PDF extraction of very large documents (>1000 pages) may take several minutes
  - Video thumbnail generation may take a moment for large video files
  - Search functionality is case-sensitive

- **Features Not Yet Implemented**:
  - Batch PDF extraction across multiple source PDFs at once
  - PDF password support
  - Custom thumbnail sizes
  - Export vault contents to additional formats
  - Cloud storage integration
  - Multi-user support
  - Category tag editing (creation, assignment, and deletion are supported)

## Troubleshooting

### Build Issues

**Problem**: `npm install` fails with dependency errors
- **Solution**: 
  - Delete `node_modules` and `package-lock.json`
  - Run `npm install` again
  - Ensure Node.js version matches the project requirement (`22.15.1`)

**Problem**: TypeScript compilation errors
- **Solution**:
  - Run `npm run lint` to see specific errors
  - Ensure all imports use correct path aliases (`@/` or `@electron/`)
  - Check that all types are properly defined

**Problem**: Electron app doesn't launch
- **Solution**:
  - Ensure both frontend and Electron main process are built: `npm run build:all`
  - Check that `dist-electron/` directory exists
  - Verify `package.json` main field points to correct path

### Runtime Issues

**Problem**: PDF extraction fails or produces blank images
- **Solution**:
  - Verify PDF file is not corrupted
  - Check that PDF.js worker file exists in `public/pdf.worker.min.js`
  - Ensure PDF file is not password-protected
  - Try with a simpler PDF file to isolate the issue

**Problem**: Vault directory selection fails
- **Solution**:
  - Ensure you have write permissions to the selected directory
  - Avoid selecting system directories or protected folders
  - On Windows, avoid Program Files or Windows directories
  - Try selecting a directory in your user folder

**Problem**: Files not appearing in vault
- **Solution**:
  - Refresh the vault view (navigate away and back)
  - Check that files were actually copied (verify in file explorer)
  - Ensure files are not hidden or system files
  - Check application logs (see Logging section below)

**Problem**: Thumbnails not generating
- **Solution**:
  - Ensure Sharp library is properly installed: `npm install sharp`
  - Check file permissions for the vault directory
  - Verify file types are supported (images, PDFs, videos)
  - Large files may take time - wait a few moments
  - For videos: Ensure HTML5 Video API is supported (modern browsers/Electron)
  - WebP files may require additional processing time

**Problem**: Application crashes on startup
- **Solution**:
  - Check Node.js version: `node --version` (must match the project requirement, currently `22.15.1`)
  - Clear application data (location varies by OS)
  - Check for conflicting Electron processes: close all Electron windows
  - Review error logs (see Logging section)

### Development Issues

**Problem**: Hot reload not working
- **Solution**:
  - Restart the dev server: `npm run electron:dev`
  - Clear Vite cache: delete `.vite` directory
  - Ensure no port conflicts (default is 5173)

**Problem**: Tests failing
- **Solution**:
  - Run `npm install` to ensure all dependencies are installed
  - Clear test cache: delete `node_modules/.vite` and `.vitest` directories
  - Ensure test environment is set up: `npm run test` should work
  - Check that mocks are properly configured in `src/test-utils/`
  - For coverage issues: Run `npm run test:coverage` to see detailed reports
  - Use `npm run test:ui` for interactive test debugging

**Problem**: Linting errors
- **Solution**:
  - Run `npm run lint` to see all errors
  - Auto-fix what you can: `npm run lint -- --fix`
  - Review ESLint configuration in `package.json`
  - Ensure TypeScript strict mode compliance

### Logging

The application uses `electron-log` for logging:

- **Development**: Logs appear in the console
- **Production**: Logs are written to platform-specific directories:
  - **Windows**: `%USERPROFILE%\AppData\Roaming\pdftract\logs\`
  - **macOS**: `~/Library/Logs/pdftract/`
  - **Linux**: `~/.config/pdftract/logs/`

To access logs:
1. Navigate to the log directory for your platform
2. Open the most recent log file
3. Search for error messages or timestamps

### Getting Help

If you continue to experience issues:

1. **Check existing issues**: Search GitHub issues for similar problems
2. **Review documentation**: Check README.md and PRODUCTION_READINESS.md
3. **Create an issue**: Include:
   - Operating system and version
   - Node.js version
   - Steps to reproduce
   - Error messages or logs
   - Screenshots (if applicable)

## License

This project is licensed under **The Vault Proprietary License** - see the [LICENSE](LICENSE) file for details.

### License Summary

**Personal Use**: Free for personal, non-commercial use. You can:
- Use The Vault for personal projects and research
- View and study the source code for educational purposes
- Modify the software for your own personal use (but keep modifications private)

**Commercial Use**: Requires explicit written permission from Bridgeware Dynamics. Commercial use includes:
- Use by businesses or corporations
- Use in client projects or work-for-hire
- Any revenue-generating activity

**Restrictions**:
- No redistribution or sharing of the software
- No hosting on public repositories without permission
- No selling or licensing of the software
- Must maintain all copyright notices

For commercial use inquiries or license questions, contact: **Bridgeware Dynamics** at Bridgewarefreelance@gmail.com

## Testing

The Vault includes a comprehensive test suite using Vitest and Testing Library.

### 📖 Testing Documentation

For complete testing procedures, see **[TESTING_PROCEDURES.md](TESTING_PROCEDURES.md)**.

This comprehensive guide includes:
- **Manual Testing Procedures**: Step-by-step test cases for all features
- **Automated Testing**: How to run and interpret automated tests
- **Performance Testing**: Benchmarks and performance test procedures
- **Build Testing**: Verification of production builds and installers
- **Test Checklists**: Quick reference checklists for common testing scenarios

### Running Automated Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests with coverage for CI
npm run test:coverage:ci
```

### Test Coverage

- **Unit Tests**: Hooks, utilities, and business logic
- **Component Tests**: React components with user interaction testing
- **Integration Tests**: IPC handlers and file system operations
- **Coverage Reports**: Generated with v8 provider, viewable in `coverage/` directory

### Test Structure

- Test files are co-located with source files (`.test.ts`, `.test.tsx`)
- Test utilities and mocks in `src/test-utils/`
- Electron main process tests in `electron/__tests__/`

## Acknowledgments

- **PDF.js**: Mozilla's PDF rendering library
- **Electron**: Cross-platform desktop application framework
- **React**: UI library
- **Framer Motion**: Animation library
- **Lucide Icons**: Icon library
- **Vitest**: Fast unit test framework
- **Testing Library**: Simple and complete testing utilities

---

**The Vault** - Organize your research, extract your insights.


