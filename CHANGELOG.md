# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-prerelease.2] - 2025-12-18

**Note:** This is a prerelease version. Features and APIs may change before the stable 1.0.0 release.

### Added

#### Video Thumbnail Generation
- Video thumbnail generation using HTML5 Video API
- Automatic thumbnail generation for video files (MP4, AVI, MOV, MKV, WebM)
- Thumbnails captured at 10% of video duration or 1 second (whichever is smaller)
- Maintains video aspect ratio in thumbnails
- Cached thumbnails for improved performance
- Graceful error handling with placeholder fallback on failure
- No additional dependencies required (uses native HTML5 Video API)

### Fixed

#### File Deletion Improvements
- Fixed WebP file deletion issue where files were locked due to Sharp file handles
- Improved file deletion reliability by reading files into memory before Sharp processing
- Added WebP-specific delay to ensure file handles are released before deletion attempts
- Simplified retry logic for file deletion (reduced from aggressive 8 retries to 3 retries with reasonable delays)
- Close file viewer before deletion to release file handles
- Clear thumbnail cache before deletion to prevent file locks

#### Gallery Alignment
- Fixed alignment issue where non-PDF files (images, WebP, videos) appeared slightly above PDF files
- Added invisible spacer to non-PDF files to align with PDF files and folders
- All file types now align vertically in the gallery view

#### Image Viewer Drag-to-Pan
- Fixed drag-to-pan functionality when image is zoomed
- Prevented browser's default image drag behavior that was creating ghost image on cursor
- Fixed issue where drag events were not working properly on zoomed images
- Improved drag handling to enable smooth panning within container bounds

### Changed

- Simplified file deletion retry logic (reduced from 10 to 3 retries with delays: 200ms, 500ms, 1000ms)
- Improved error messages for locked files
- Video thumbnails now generated in renderer process (following same pattern as PDF thumbnails)
- **Image Viewer Improvements**:
  - Redesigned image viewer with professional zoom controls toolbar
  - Added zoom in/out buttons with live percentage display and reset button
  - Improved layout: file name moved to top-left, zoom controls centered, close button top-right
  - Added keyboard shortcuts for zoom control (+/=, -, 0, Escape)
  - Added double-click to zoom functionality
  - Enhanced animations and visual feedback
  - Better drag-to-pan when zoomed

### Deprecated

- None in this release

### Removed

- None in this release

### Security

- No security changes in this release

---

## [1.0.0-prerelease.1] - 2025-12-17

**Note:** This is a prerelease version. Features and APIs may change before the stable 1.0.0 release.

### Added

#### PDF Extraction Features
- High-quality PDF page extraction to PNG images
- Batch processing of entire PDF documents with real-time progress tracking
- Flexible output options: save to custom directories or ZIP archives
- Option to preserve original PDF file alongside extracted pages
- PDF file validation before extraction
- Support for various PDF formats and structures

#### The Vault - Research Organization System
- Case-based organization system for managing research projects
- Create and manage case files with custom names
- Automatic organization of PDF extractions within case folders
- Hierarchical folder structure with breadcrumb navigation
- Extraction folders for organizing PDF page extractions
- Vault directory selection with persistent storage location

#### File Management
- Rename files and folders with inline editing
- Delete files and folders with confirmation dialogs
- Search functionality across cases and files (case-sensitive)
- Drag and drop file uploads to cases
- File type detection and automatic categorization (images, PDFs, videos, other)
- Metadata tracking: file size, modification dates, and parent PDF relationships

#### File Viewing & Management
- Automatic thumbnail generation for images, PDFs, and videos
- Full-screen file viewer with navigation controls
- Keyboard navigation in file viewer (arrow keys, Escape to close)
- Support for viewing multiple file types (images, PDFs, videos)
- File viewer with previous/next navigation

#### User Interface
- Modern cyberpunk-themed interface design
- Smooth animations using Framer Motion
- Real-time toast notifications for user feedback
- Progress bars for long-running operations
- Responsive design that adapts to different screen sizes
- Keyboard shortcuts: Enter to confirm, Escape to cancel in dialogs
- Welcome screen with clear navigation options
- Breadcrumb navigation for vault hierarchy

#### Security & Production Features
- Path validation to prevent directory traversal attacks
- Context isolation enabled for renderer process
- Content Security Policy (CSP) implementation
- Secure IPC communication between processes
- Input sanitization for folder and file names
- Electron crash reporting integration
- Comprehensive error handling and logging
- Production-ready logging with `electron-log`
- Code signing configuration for Windows and macOS
- Platform-specific build configurations (Windows NSIS, macOS DMG, Linux AppImage)

#### Development & Testing
- Comprehensive test suite with Vitest
- Test coverage reporting with v8 provider
- CI/CD pipeline with GitHub Actions
- Multi-platform build automation
- ESLint configuration for code quality
- TypeScript strict mode enabled
- Path aliases for cleaner imports (`@/` and `@electron/`)

#### Documentation
- Comprehensive README with architecture diagrams
- Production readiness checklist
- Development setup instructions
- Usage guide with best practices
- Technical documentation of IPC handlers and components

### Changed

- Initial release - no previous versions to compare

### Deprecated

- None in this release

### Removed

- None in this release

### Fixed

- Initial release - no previous bugs to fix

### Security

- Implemented path validation for all file system operations
- Enabled context isolation and disabled node integration in renderer
- Added Content Security Policy to prevent XSS attacks
- Secure IPC handlers with input validation
- File name sanitization to prevent path injection
- Error handling to prevent information leakage

---

## Release Notes Format

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

[Unreleased]: https://github.com/yourusername/the-vault/compare/v1.0.0-prerelease.2...HEAD
[1.0.0-prerelease.2]: https://github.com/yourusername/the-vault/releases/tag/v1.0.0-prerelease.2
[1.0.0-prerelease.1]: https://github.com/yourusername/the-vault/releases/tag/v1.0.0-prerelease.1




