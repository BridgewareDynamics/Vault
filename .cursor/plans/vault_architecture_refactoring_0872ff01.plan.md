---
name: Vault Architecture Refactoring
overview: Refactor the Vault codebase to reduce complexity and improve maintainability by introducing better separation of concerns, modularizing IPC handlers, breaking down large hooks, and organizing code into a cleaner architecture while preserving all existing features.
todos:
  - id: phase1-ipc-structure
    content: Create electron/ipc/ directory structure and split IPC handlers into domain-specific modules (fileHandlers, archiveHandlers, pdfHandlers, etc.)
    status: pending
  - id: phase1-ipc-registration
    content: Create electron/ipc/index.ts to centralize IPC handler registration and update electron/main.ts to use it
    status: pending
    dependencies:
      - phase1-ipc-structure
  - id: phase2-service-layer
    content: Create electron/services/ directory and extract business logic from IPC handlers into service classes (ArchiveService, PDFService, etc.)
    status: pending
    dependencies:
      - phase1-ipc-structure
  - id: phase2-handler-refactor
    content: Refactor IPC handlers to delegate to services instead of containing business logic
    status: pending
    dependencies:
      - phase2-service-layer
  - id: phase3-hook-split
    content: "Split useArchive.ts into focused hooks: useArchiveConfig, useArchiveCases, useArchiveFiles, useArchiveNavigation, useArchiveThumbnails, useArchiveSearch"
    status: pending
  - id: phase3-hook-composition
    content: Refactor useArchive.ts to compose the smaller hooks and maintain the same external API
    status: pending
    dependencies:
      - phase3-hook-split
  - id: phase4-routing
    content: Create src/routing/ directory with AppRouter.tsx and extract routing logic from App.tsx
    status: pending
  - id: phase4-layouts
    content: Create src/components/layouts/ with MainLayout, ArchiveLayout, and EditorLayout components
    status: pending
    dependencies:
      - phase4-routing
  - id: phase4-app-simplify
    content: Simplify App.tsx to only handle provider composition, moving view logic to AppRouter
    status: pending
    dependencies:
      - phase4-routing
      - phase4-layouts
  - id: phase5-preload-split
    content: Split electron/preload.ts into electron/preload/api/ modules (fileAPI, archiveAPI, pdfAPI, etc.)
    status: pending
  - id: phase5-preload-compose
    content: Create electron/preload/index.ts to compose all API modules and update electron/main.ts to use it
    status: pending
    dependencies:
      - phase5-preload-split
  - id: phase6-context-review
    content: Review and optimize context usage, potentially merging ArchiveContext into useArchive hook
    status: pending
    dependencies:
      - phase3-hook-composition
  - id: phase7-utility-org
    content: Reorganize src/utils/ and electron/utils/ with better grouping and index files
    status: pending
  - id: testing-regression
    content: Run comprehensive regression tests after each phase to ensure all features work
    status: pending
---

# Vault Architecture Refactoring Plan

## Overview

This refactoring focuses on improving maintainability through better code organization, separation of concerns, and modularization. The goal is to make the codebase easier to understand, modify, and extend without removing any existing features.

## Current Architecture Issues

1. **Monolithic IPC Handlers**: All 50+ IPC handlers in single `electron/main.ts` file (3000+ lines)
2. **Large Hooks**: `useArchive.ts` is 1400+ lines with multiple responsibilities
3. **Complex App Component**: `App.tsx` contains routing logic, state management, and UI concerns
4. **Monolithic Preload**: `electron/preload.ts` has 400+ lines of API definitions
5. **Mixed Concerns**: Business logic mixed with IPC handlers and UI components
6. **No Service Layer**: Direct IPC-to-utility calls without abstraction

## Refactoring Strategy

### Phase 1: IPC Handler Modularization

**Goal**: Split IPC handlers into logical modules by domain**Changes**:

- Create `electron/ipc/` directory structure:
- `electron/ipc/handlers/` - Individual handler modules
    - `fileHandlers.ts` - File operations (select, read, validate)
    - `archiveHandlers.ts` - Archive/case operations
    - `pdfHandlers.ts` - PDF extraction and processing
    - `thumbnailHandlers.ts` - Thumbnail generation
    - `bookmarkHandlers.ts` - Bookmark operations
    - `categoryTagHandlers.ts` - Category tag operations
    - `textFileHandlers.ts` - Word editor text file operations
    - `settingsHandlers.ts` - Settings management
    - `windowHandlers.ts` - Window management (detached editors, etc.)
    - `auditHandlers.ts` - PDF audit operations
    - `loggingHandlers.ts` - Logging operations
- `electron/ipc/index.ts` - Central registration point
- `electron/ipc/types.ts` - Shared IPC type definitions

**Files to modify**:

- `electron/main.ts` - Extract handlers, import from modules
- Create new handler modules in `electron/ipc/handlers/`

**Benefits**:

- Each handler file is 100-300 lines instead of 3000+
- Easy to locate specific functionality
- Better testability
- Clearer dependencies

### Phase 2: Service Layer Introduction

**Goal**: Extract business logic from IPC handlers into reusable services**Changes**:

- Create `electron/services/` directory:
- `ArchiveService.ts` - Archive/case management logic
- `PDFService.ts` - PDF processing logic
- `ThumbnailService.ts` - Thumbnail generation logic
- `BookmarkService.ts` - Bookmark management logic
- `CategoryTagService.ts` - Category tag management
- `TextFileService.ts` - Text file operations
- `AuditService.ts` - PDF audit operations

**Pattern**:

```typescript
// Before: Logic in IPC handler
ipcMain.handle('create-case-folder', async (event, caseName) => {
  // 50 lines of validation, file operations, etc.
});

// After: Logic in service, handler delegates
ipcMain.handle('create-case-folder', async (event, caseName) => {
  return await ArchiveService.createCaseFolder(caseName);
});
```

**Files to modify**:

- Extract logic from IPC handlers into services
- Update handlers to use services
- Update existing utilities to work with services

**Benefits**:

- Business logic reusable across handlers
- Easier to test business logic independently
- Clearer separation between IPC and business logic

### Phase 3: Hook Decomposition

**Goal**: Break down large hooks into smaller, focused hooks**Changes**:

- Split `useArchive.ts` (1400+ lines) into:
- `useArchiveConfig.ts` - Archive configuration management
- `useArchiveCases.ts` - Case listing and selection
- `useArchiveFiles.ts` - File listing and management
- `useArchiveNavigation.ts` - Folder navigation logic
- `useArchiveThumbnails.ts` - Thumbnail loading and caching
- `useArchiveSearch.ts` - Search functionality
- `useArchive.ts` - Main hook that composes others

**Pattern**:

```typescript
// useArchive.ts becomes a composition
export function useArchive() {
  const config = useArchiveConfig();
  const cases = useArchiveCases(config);
  const files = useArchiveFiles(cases);
  const navigation = useArchiveNavigation();
  // ... compose and return combined interface
}
```

**Files to modify**:

- `src/hooks/useArchive.ts` - Split into multiple files
- Update components using `useArchive` (should be transparent)

**Benefits**:

- Each hook has single responsibility
- Easier to test individual concerns
- Better code reuse
- Clearer dependencies

### Phase 4: Component Organization

**Goal**: Simplify App.tsx and improve component structure**Changes**:

- Create `src/routing/` directory:
- `AppRouter.tsx` - Central routing logic
- `routes.ts` - Route definitions
- `RouteGuard.tsx` - Route-level guards/checks
- Extract routing logic from `App.tsx`:
- Move view selection logic to `AppRouter`
- Keep App.tsx as provider composition only
- Create `src/components/layouts/`:
- `MainLayout.tsx` - Main application layout
- `ArchiveLayout.tsx` - Archive-specific layout
- `EditorLayout.tsx` - Editor split-pane layout

**Files to modify**:

- `src/App.tsx` - Simplify to provider composition
- Create routing and layout components
- Update components to use new layout structure

**Benefits**:

- Clearer separation of routing and UI
- Easier to add new views
- Better layout reusability

### Phase 5: Preload Script Modularization

**Goal**: Organize preload API definitions**Changes**:

- Create `electron/preload/` directory:
- `electron/preload/api/` - API definition modules
    - `fileAPI.ts` - File operation APIs
    - `archiveAPI.ts` - Archive APIs
    - `pdfAPI.ts` - PDF APIs
    - `bookmarkAPI.ts` - Bookmark APIs
    - `settingsAPI.ts` - Settings APIs
    - `windowAPI.ts` - Window management APIs
    - `auditAPI.ts` - Audit APIs
- `electron/preload/index.ts` - Main preload that composes APIs
- `electron/preload/types.ts` - TypeScript type definitions

**Files to modify**:

- `electron/preload.ts` - Split into modules
- Update type definitions

**Benefits**:

- Easier to find specific APIs
- Better organization
- Reduced file size per module

### Phase 6: Context Consolidation

**Goal**: Review and optimize context usage**Changes**:

- Review existing contexts:
- `ToastContext` - Keep as is (well-structured)
- `SettingsContext` - Keep as is (well-structured)
- `WordEditorContext` - Review for potential simplification
- `ArchiveContext` - Consider if it can be merged with `useArchive` hook
- Create `src/contexts/index.ts` - Central context exports
- Document context usage patterns

**Files to modify**:

- Review `src/contexts/` files
- Potentially merge `ArchiveContext` into `useArchive` hook state
- Update components if context structure changes

**Benefits**:

- Clearer context responsibilities
- Reduced context nesting
- Better performance (fewer re-renders)

### Phase 7: Utility Organization

**Goal**: Better organize utility functions**Changes**:

- Review `src/utils/` and `electron/utils/`:
- Group related utilities
- Create index files for easier imports
- Document utility purposes
- Create `src/utils/constants/` for constants
- Create `src/utils/helpers/` for pure helper functions
- Create `src/utils/validators/` for validation functions

**Files to modify**:

- Organize existing utilities
- Create index files
- Update imports across codebase

**Benefits**:

- Easier to find utilities
- Clearer utility purposes
- Better import paths

## Implementation Order

1. **Phase 1** (IPC Handler Modularization) - Foundation for other changes
2. **Phase 2** (Service Layer) - Enables cleaner handlers
3. **Phase 5** (Preload Modularization) - Parallel with Phase 1
4. **Phase 3** (Hook Decomposition) - Can work independently
5. **Phase 4** (Component Organization) - Depends on hooks being stable
6. **Phase 6** (Context Consolidation) - Review after other changes
7. **Phase 7** (Utility Organization) - Final cleanup

## Testing Strategy

- **Incremental Testing**: Test after each phase
- **Regression Testing**: Ensure all existing features work
- **Integration Testing**: Test IPC handlers with new service layer
- **Component Testing**: Update tests for refactored components

## Migration Notes

- All changes maintain backward compatibility at the API level
- Components using hooks should not need changes (internal refactoring)
- IPC channel names remain the same
- No breaking changes to user-facing features

## Success Criteria

- ✅ `electron/main.ts` reduced from 3000+ to <500 lines
- ✅ `useArchive.ts` split into 5-7 focused hooks
- ✅ `App.tsx` reduced from 540 to <200 lines
- ✅ Each IPC handler module <300 lines
- ✅ Clear separation: IPC → Service → Utility
- ✅ All existing features working
- ✅ No performance regressions
- ✅ Improved code organization and discoverability

## Risk Mitigation

- **Feature Breakage**: Comprehensive testing after each phase
- **Performance**: Monitor bundle size and runtime performance