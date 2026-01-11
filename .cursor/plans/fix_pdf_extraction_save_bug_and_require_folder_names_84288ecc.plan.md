---
name: Fix PDF extraction save bug and require folder names
overview: Fix the bug where saving individual image files (when both options are unchecked) doesn't work, and make folder names a requirement for all save operations. The backend `save-files` handler is missing the logic to save individual image files, and the UI needs to require folder names for both loose file and ZIP saves.
todos:
  - id: update-types
    content: Update electronAPI.d.ts to include fileName in extractedPages array items for save-files handler
    status: pending
  - id: update-backend-save
    content: Update electron/main.ts save-files handler to save individual image files when saveToZip is false, and always require folderName
    status: pending
    dependencies:
      - update-types
  - id: update-save-options-ui
    content: Update PDFExtractionSaveOptions.tsx to always show folder name field and require it for all save operations
    status: pending
  - id: update-modal-handler
    content: Update PDFExtractionModal.tsx handleSave to pass fileName in extractedPages array
    status: pending
    dependencies:
      - update-types
  - id: update-detached-handler
    content: Update DetachedPDFExtraction.tsx handleSave to pass fileName in extractedPages array
    status: pending
    dependencies:
      - update-types
---

# Fix PDF Extraction Save Bug and Require Folder Names

## Problem Analysis

1. **Bug**: In [`electron/main.ts`](electron/main.ts) (lines 542-626), the `save-files` handler only handles:

- Saving parent PDF when `saveParentFile` is true (lines 569-580)
- Saving to ZIP when `saveToZip && folderName` is true (lines 582-620)
- **Missing**: Logic to save individual image files when `saveToZip` is false

This causes the handler to return success with empty results when both options are unchecked.

2. **Missing file names**: The frontend components generate file names using the naming pattern, but only pass `pageNumber` and `imageData` to the backend. The backend needs file names to save individual files.

3. **Folder name requirement**: Currently, folder names are only required when `saveToZip` is true. The user wants folder names required for all save operations:

- When saving as loose files: create a subfolder with that name
- When saving as ZIP: use that name for the ZIP file (already works)

## Solution

### 1. Update Type Definitions

- Modify [`src/types/electronAPI.d.ts`](src/types/electronAPI.d.ts) to include `fileName` in `extractedPages` array items

### 2. Update Backend Handler

- Modify [`electron/main.ts`](electron/main.ts) `save-files` handler:
- Accept `fileName` in `extractedPages` array items (update type signature)
- When `saveToZip` is false, save individual image files to a subfolder (using `folderName`) in the save directory
- Use the provided file names from the frontend
- Handle image format detection (PNG/JPEG) from data URLs

### 3. Update Frontend Components

- Modify [`src/components/PDFExtractionModal.tsx`](src/components/PDFExtractionModal.tsx) `handleSave`:
- Pass `fileName` along with `pageNumber` and `imageData` to the backend

- Modify [`src/components/DetachedPDFExtraction.tsx`](src/components/DetachedPDFExtraction.tsx) `handleSave`:
- Pass `fileName` along with `pageNumber` and `imageData` to the backend

### 4. Update Save Options UI

- Modify [`src/components/PDFExtractionSaveOptions.tsx`](src/components/PDFExtractionSaveOptions.tsx):
- Always show the folder name input field (remove conditional rendering)
- Always require folder name (update validation in `handleConfirm`)
- Update button disabled condition to always require folder name
- Update error messages to reflect that folder name is always required
- Update the description text to indicate folder names are used for subfolders (loose files) or ZIP files

## Implementation Details

### Backend Changes

The `save-files` handler should:

1. Always require `folderName` (validate it's provided and not empty)
2. When `saveToZip` is false:

- Create a subfolder in `saveDirectory` using `folderName`
- Save each image file to that subfolder using the provided `fileName`
- Detect image format from data URL (PNG/JPEG)

3. When `saveToZip` is true (existing logic):

- Use `folderName` for the ZIP file name (already works)

### Frontend Changes

1. Pass `fileName` in the `extractedPages` array to the backend
2. Always show and require folder name input
3. Update validation to require folder name for all save operations

## Files to Modify

1. [`src/types/electronAPI.d.ts`](src/types/electronAPI.d.ts) - Update type definitions
2. [`electron/main.ts`](electron/main.ts) - Add logic to save individual files and require folder name
3. [`src/components/PDFExtractionSaveOptions.tsx`](src/components/PDFExtractionSaveOptions.tsx) - Always show and require folder name
4. [`src/components/PDFExtractionModal.tsx`](src/components/PDFExtractionModal.tsx) - Pass file names to backend
5. [`src/components/DetachedPDFExtraction.tsx`](src/components/DetachedPDFExtraction.tsx) - Pass file names to backend