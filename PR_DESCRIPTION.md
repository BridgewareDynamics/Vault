# Commit Message

```
fix: improve PDF viewer side panel integration and drag performance

- Fix PDF viewer closing when word editor panel opens
- Preserve panel width when switching between library/bookmarks views
- Improve drag/pan responsiveness when side panel is open
- Add overlay mode tracking to prevent component remounting
- Optimize drag constraints calculation with multiple update checkpoints
```

---

# Summary

Fixes critical issues with PDF viewer and word editor side panel integration:
- **State Management**: PDF viewer no longer closes when opening word editor panel
- **Width Persistence**: Panel width is preserved when switching views
- **Drag Performance**: Smooth, responsive drag/pan when side panel is open

---

# PR Description

## Fix: PDF Viewer Side Panel Integration - Drag Performance and State Management

### Summary
Fixes multiple issues when opening the word editor side panel from the PDF viewer:
1. PDF viewer closing instead of staying open
2. Panel width resetting when switching between library/bookmarks views  
3. Clunky drag/pan behavior when the side panel is open

### Problem
- Clicking the word editor button in the PDF viewer was closing the viewer and returning to the case folder view
- Switching between text library and bookmarks views was resetting the panel width to minimum
- PDF drag/pan was unresponsive and clunky when the side panel was open

### Solution
- **State Management**: Added overlay mode tracking to prevent layout switches that caused component remounting
- **Panel Width Persistence**: Removed width resets when switching views, preserving user-resized width
- **Drag Performance**: Improved constraint calculation and added multiple update checkpoints for responsive drag when panel opens

### Changes Made

#### 1. State Management (`App.tsx`, `ArchiveFileViewer.tsx`, `SettingsPanel.tsx`)
- Added `shouldUseOverlayMode` state to track when word editor is opened from PDF viewer
- Added event listeners for `'open-word-editor-from-viewer'` and `'close-word-editor'` events
- Modified layout logic to use overlay mode when PDF viewer is open, preventing `ArchivePage` remounting
- Added refs to prevent accidental closes when word editor is open
- Synced `SettingsPanel` local state with `WordEditorContext` state

#### 2. Panel Width Persistence (`WordEditorPanel.tsx`)
- Removed `setPanelWidth(MIN_WIDTH)` from library button click handler
- Added `hasSetWidthFromOpenLibraryRef` to only set minimum width on initial open with `openLibrary` prop
- Preserves manually resized width when switching between editor/library/bookmarks views

#### 3. Drag Performance Improvements (`ArchiveFileViewer.tsx`)
- Improved drag constraints calculation using actual canvas/container dimensions
- Added multiple constraint update checkpoints (0ms, 16ms, 50ms, 100ms) when panel opens
- Added constraint recalculation at drag start/end
- Added `ResizeObserver` for real-time constraint updates during panel resize
- Added `dragPropagation={false}` to prevent event interference
- Optimized with `requestAnimationFrame` for smooth updates

### Testing Instructions

1. **PDF Viewer with Side Panel:**
   - Open a PDF in the archive viewer
   - Click the word editor button (FileText icon) in the PDF toolbar
   - ✅ Verify: PDF viewer stays open, side panel opens on the right, both are visible

2. **Panel Width Persistence:**
   - Open word editor from PDF viewer
   - Resize the panel by dragging the edge
   - Switch to text library view
   - Switch to bookmarks view
   - Switch back to editor
   - ✅ Verify: Panel width remains at your resized width

3. **Drag Performance:**
   - Open PDF viewer with side panel open
   - Zoom in on the PDF (scale > 100%)
   - Drag/pan around the PDF
   - ✅ Verify: Drag is smooth and responsive, no lag or clunkiness
   - Resize the side panel while dragging
   - ✅ Verify: Drag continues smoothly with updated constraints

4. **Edge Cases:**
   - Open word editor, then close it - verify PDF viewer remains open
   - Open word editor, resize panel, close and reopen - verify width is preserved
   - Drag PDF while panel is resizing - verify smooth interaction

### Files Changed
- `src/App.tsx` - Overlay mode tracking and layout logic
- `src/components/Archive/ArchiveFileViewer.tsx` - Drag improvements and close prevention
- `src/components/Settings/SettingsPanel.tsx` - State synchronization
- `src/components/WordEditor/WordEditorPanel.tsx` - Width persistence

### Migration Notes
- No breaking changes to existing functionality
- No database migrations required
- No configuration changes needed

### Rollback Plan
If issues arise, revert this PR. All changes are additive and don't modify existing APIs.

---

**Type**: `fix`  
**Priority**: High  
**Breaking Changes**: None
