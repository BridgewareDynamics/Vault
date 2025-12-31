# The Vault

**A Professional Research Organization Tool**

**Version**: 1.0.0-prerelease.3

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-28.1-blue.svg)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

The Vault is a powerful desktop application designed for researchers, investigators, and professionals who need to organize, extract, and manage PDF documents systematically. Built with Electron and React, it provides a modern, intuitive interface for converting PDF pages to PNG images and organizing them within a structured case-based filing system with advanced categorization and tagging capabilities.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [Technical Details](#technical-details)
- [Development](#development)
- [License](#license)

## Features

### PDF Extraction
- **High-Quality Conversion**: Extract individual pages from PDF documents as PNG images
- **Batch Processing**: Process entire PDFs with real-time progress tracking
- **Flexible Output**: Save extracted pages to custom directories or ZIP archives
- **Parent File Preservation**: Option to save the original PDF alongside extracted pages

### The Vault - Research Organization System
- **Case-Based Organization**: Create and manage case files for organizing research projects
- **Category Tags**: Organize cases and files with custom color-coded category tags
  - Create custom tags with names and colors
  - Assign tags to cases and individual files
  - Filter and search by category tags
  - Visual tag indicators in the interface
- **Extraction Folders**: Automatically organize PDF extractions within case folders
- **Hierarchical Structure**: Navigate through nested folders with breadcrumb navigation
- **File Management**: 
  - Rename files and folders with inline editing
  - Delete files and folders with confirmation dialogs
  - Search across cases and files (with tag filtering)
  - Drag and drop file uploads

### File Viewing & Management
- **Thumbnail Generation**: Automatic thumbnail generation for images, PDFs, and videos
  - Image thumbnails using Sharp library
  - PDF page thumbnails (first page)
  - Video thumbnails captured at 10% duration or 1 second (whichever is smaller)
  - Cached thumbnails for improved performance
- **Enhanced Image Viewer**: Professional file viewer with advanced zoom controls
  - Zoom in/out with buttons and keyboard shortcuts (+/=, -, 0)
  - Live zoom percentage display
  - Double-click to zoom functionality
  - Drag-to-pan when zoomed
  - Reset zoom button
  - Smooth animations and visual feedback
- **Full-Screen Viewer**: View files in a dedicated viewer with navigation controls
- **File Type Detection**: Automatic categorization of files (images, PDFs, videos, other)
- **Metadata Tracking**: File size, modification dates, and parent PDF relationships

### User Experience
- **Modern UI**: Cyberpunk-themed interface with smooth animations
- **Real-Time Feedback**: Toast notifications and progress bars
- **Responsive Design**: Adapts to different screen sizes
- **Keyboard Shortcuts**: 
  - Enter to confirm, Escape to cancel in dialogs
  - Arrow keys to navigate between files in viewer
  - Zoom controls: +/= (zoom in), - (zoom out), 0 (reset)
  - Escape to close viewers and dialogs

## Architecture

### Tech Stack

- **Frontend**: React 18.2, TypeScript 5.3, TailwindCSS, Framer Motion
- **Backend**: Electron 28.1, Node.js 20+
- **PDF Processing**: PDF.js 3.11.174
- **Image Processing**: Sharp 0.33.2
- **Testing**: Vitest 1.1.0, Testing Library
- **Build Tools**: Vite 5.0, Electron Builder 24.9


## Installation & Setup

### Prerequisites

- **Node.js**: Version 20.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: For cloning the repository

### Node.js Version Management

This project requires Node.js 20.x. To ensure consistent dependency resolution:

- **Using nvm (Node Version Manager)**: 
  ```bash
  nvm use
  ```
  This will automatically use the version specified in `.nvmrc` (Node.js 20.x)

- **Manual version check**:
  ```bash
  node --version  # Should show v20.x.x
  ```

The project enforces Node.js and npm versions via `package.json` engines field to ensure consistent `package-lock.json` files across all developers.

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd the-vault
   ```
   Note: Repository access is subject to license terms. See [LICENSE](LICENSE) for details.

2. **Install dependencies**
   ```bash
   npm ci
   ```
   **Note**: We use `npm ci` instead of `npm install` for reproducible, clean installs. It installs dependencies directly from `package-lock.json`, ensuring consistent dependency versions across all environments. If `package-lock.json` is missing or outdated, you may need to run `npm install` first to generate/update it.

3. **Run in development mode**
   ```bash
   npm run electron:dev
   ```
   This command will:
   - Build the Electron main process
   - Start the Vite dev server
   - Launch the Electron application

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

1. **Build for all platforms**
   ```bash
   npm run electron:build
   ```

2. **Platform-specific builds**
   - **Windows**: Creates an NSIS installer in `release/`
   - **macOS**: Creates a DMG file in `release/`
   - **Linux**: Creates an AppImage in `release/`

3. **Build output**
   - Compiled files: `dist/` (frontend) and `dist-electron/` (main process)
   - Installers: `release/`

### Project Structure

```
the-vault/
├── electron/                 # Electron main process
│   ├── main.ts              # Main entry point
│   ├── preload.ts           # Preload script (IPC bridge)
│   └── utils/               # Utility modules
│       ├── archiveConfig.ts # Vault configuration
│       ├── pathValidator.ts # Path validation
│       ├── pdfExtractor.ts  # PDF processing
│       └── thumbnailGenerator.ts # Thumbnail generation
├── src/                      # React application
│   ├── components/          # React components
│   │   ├── Archive/        # Vault-specific components
│   │   ├── Toast/          # Toast notification system
│   │   └── ...             # Other UI components
│   ├── hooks/              # Custom React hooks
│   │   ├── useArchive.ts   # Vault management
│   │   ├── useArchiveExtraction.ts # Vault PDF extraction
│   │   ├── usePDFExtraction.ts # Standard PDF extraction
│   │   └── useCategoryTags.ts # Category tag management
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── test-utils/         # Testing utilities and mocks
├── dist/                    # Built frontend (generated)
├── dist-electron/          # Built Electron main (generated)
└── release/                 # Production installers (generated)
```

## Usage Guide

### Getting Started

1. **Launch The Vault**
   - Run the application from your desktop or command line
   - You'll see the welcome screen with two options:
     - **Select file**: Extract pages from a PDF
     - **The Vault**: Access your research organization system

### PDF Extraction Workflow

1. **Select a PDF File**
   - Click "Select file" on the welcome screen
   - Choose a PDF file from your file system
   - Extraction begins automatically

2. **Monitor Progress**
   - Watch the progress bar for extraction status
   - View real-time status messages
   - See extracted pages appear in the gallery

3. **Save Extracted Pages**
   - Select a save directory
   - Choose save options:
     - **Save parent file**: Include the original PDF
     - **Save to ZIP**: Package everything in a ZIP archive
     - **Folder name**: Organize in a named folder
   - Click "Save" to export

### The Vault - Research Organization

#### Setting Up Your Vault

1. **Select Vault Drive**
   - Click "The Vault" from the welcome screen
   - First time: Select a directory to store your vault
   - This location is remembered for future sessions

2. **Create a Case File**
   - Click "Start Case File" button
   - Enter a case name (e.g., "Research Project 2024")
   - The case folder is created in your vault directory

#### Organizing Research Materials

1. **Add Files to a Case**
   - Open a case by clicking on it
   - Click "Add Files" or drag and drop files
   - Files are copied into the case folder

2. **Extract PDFs Within Cases**
   - Click on a PDF file in your case
   - Click the play button or PDF options dropdown
   - Choose extraction settings:
     - Create new extraction folder
     - Name the folder
     - Option to save parent PDF
   - Extraction runs and pages are saved to the folder

3. **Navigate Your Vault**
   - Use breadcrumb navigation to move between folders
   - Click folders to open them
   - Use "Back" buttons to navigate up the hierarchy

#### File Management

1. **Rename Files/Folders**
   - Hover over a file or folder
   - Click the pencil icon
   - Enter new name and press Enter or click Confirm

2. **Delete Files/Folders**
   - Hover over a file or folder
   - Click the trash icon
   - Confirm deletion in the dialog

3. **Search & Filter**
   - Use the search bar to find files or cases
   - Search works across case names and file names
   - Filter by category tags using the tag selector
   - Results update in real-time

4. **Category Tags**
   - Create custom category tags with names and colors
   - Assign tags to cases or individual files
   - Use tags to organize and filter your research materials
   - Tags are visually displayed on cases and files

5. **View Files**
   - Click on any file to open the viewer
   - Use arrow keys or buttons to navigate between files
   - Zoom controls: +/= (zoom in), - (zoom out), 0 (reset), double-click to zoom
   - Drag to pan when zoomed in
   - Press Escape to close the viewer

### Best Practices for Research Organization

1. **Case Structure**
   - Create separate cases for different research projects
   - Use descriptive case names
   - Keep related materials together

2. **Extraction Folders**
   - Name extraction folders descriptively
   - Group related PDF extractions
   - Use consistent naming conventions

3. **File Organization**
   - Keep original PDFs alongside extractions
   - Use folders to separate different document types
   - Regularly review and organize your vault

## Technical Details

### Key Components

#### Main Process (`electron/main.ts`)
- Handles all file system operations
- Manages IPC communication
- Validates paths and file operations
- Processes PDF extractions
- Generates thumbnails

#### Preload Script (`electron/preload.ts`)
- Bridges renderer and main processes
- Exposes safe Electron APIs to React
- Type-safe IPC communication

#### React Application (`src/App.tsx`)
- Main application component
- Manages routing between views
- Coordinates PDF extraction and Vault access

#### Custom Hooks

**`usePDFExtraction`** (`src/hooks/usePDFExtraction.ts`)
- Manages PDF extraction state
- Handles PDF.js integration
- Provides progress updates
- Returns extracted pages

**`useArchive`** (`src/hooks/useArchive.ts`)
- Manages Vault state and operations
- Handles case and file management
- Provides search functionality
- Manages thumbnail caching

**`useArchiveExtraction`** (`src/hooks/useArchiveExtraction.ts`)
- Specialized PDF extraction for Vault
- Integrates with case folder structure
- Saves directly to extraction folders

**`useCategoryTags`** (`src/hooks/useCategoryTags.ts`)
- Manages category tag creation and assignment
- Handles tag-to-case and tag-to-file relationships
- Provides tag lookup and filtering capabilities

### IPC Handlers

The application uses Electron IPC for secure communication between processes:

- `select-pdf-file`: Open file dialog for PDF selection
- `select-save-directory`: Open directory selection dialog
- `validate-pdf-for-extraction`: Validate PDF file integrity
- `read-pdf-file`: Read PDF file data
- `save-files`: Save extracted pages to disk
- `select-archive-drive`: Select Vault storage location
- `create-case-folder`: Create a new case folder
- `create-extraction-folder`: Create extraction folder within case
- `list-archive-cases`: List all case folders
- `list-case-files`: List files in a case or folder
- `add-files-to-case`: Copy files into a case
- `delete-case`: Delete a case folder
- `delete-file`: Delete a file or folder
- `rename-file`: Rename a file or folder
- `get-file-thumbnail`: Generate thumbnail for a file (images, PDFs, videos)
- `read-file-data`: Read file data for viewing
- `extract-pdf-from-archive`: Extract PDF pages to Vault folder
- `get-category-tags`: Get all category tags
- `create-category-tag`: Create a new category tag
- `set-case-category-tag`: Assign/remove category tag from a case
- `set-file-category-tag`: Assign/remove category tag from a file
- `get-case-category-tag`: Get category tag for a case
- `get-file-category-tag`: Get category tag for a file

### State Management

The application uses React hooks for state management:
- **Local State**: `useState` for component-specific state
- **Custom Hooks**: Encapsulate complex state logic
- **Context API**: Toast notifications via `ToastContext`
- **Refs**: Store mutable values and avoid re-renders

### File Organization System

The Vault uses a hierarchical file structure:

```
vault-directory/
├── Case-Name-1/
│   ├── document1.pdf
│   ├── image1.jpg
│   ├── Extraction-Folder-1/
│   │   ├── .parent-pdf (metadata)
│   │   ├── document1.pdf (optional)
│   │   ├── page-1.png
│   │   ├── page-2.png
│   │   └── ...
│   └── Extraction-Folder-2/
│       └── ...
├── Case-Name-2/
│   └── ...
└── ...
```

### Security Features

- **Path Validation**: All file paths are validated before operations
- **Context Isolation**: Renderer process cannot access Node.js directly
- **Safe IPC**: Only whitelisted operations are exposed
- **Input Sanitization**: Folder and file names are validated

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
  - Batch PDF extraction (multiple PDFs at once)
  - PDF password support
  - Custom thumbnail sizes
  - Export vault to different formats
  - Cloud storage integration
  - Multi-user support
  - Tag editing and deletion (tags can be created and assigned, but not yet edited or deleted)

## Troubleshooting

### Build Issues

**Problem**: `npm ci` fails with dependency errors
- **Solution**: 
  - Delete `node_modules` and `package-lock.json`
  - Run `npm install` to regenerate `package-lock.json`, then use `npm ci` for future installs
  - Ensure Node.js version is 20.x or higher (check with `node --version`)
  - If using nvm, run `nvm use` to switch to the correct Node.js version
  - Verify npm version: `npm --version` (should be 9.x or higher)

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
  - Check Node.js version: `node --version` (must be 20.x+)
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
  - Run `npm ci` to ensure all dependencies are installed with correct versions
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

The Vault includes a comprehensive test suite using Vitest and Testing Library:

### Running Tests

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


