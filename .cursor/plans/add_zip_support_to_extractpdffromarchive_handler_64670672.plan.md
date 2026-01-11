---
name: Add ZIP support to extractPDFFromArchive handler
overview: The `extractPDFFromArchive` handler currently only saves individual files, but when users select "Save to ZIP Folder" from the archive, it should create a ZIP file. We need to add `saveToZip` parameter support to `extractPDFFromArchive` and implement ZIP creation logic similar to the `save-files` handler.
todos:
  - id: update-extract-zip-types
    content: Update electronAPI.d.ts to add saveToZip parameter to extractPDFFromArchive options
    status: pending
  - id: update-extract-zip-backend
    content: Update electron/main.ts extract-pdf-from-archive handler to support ZIP creation when saveToZip is true
    status: pending
    dependencies:
      - update-extract-zip-types
  - id: update-modal-zip-option
    content: Update PDFExtractionModal.tsx to pass saveToZip option to extractPDFFromArchive
    status: pending
    dependencies:
      - update-extract-zip-types
  - id: update-detached-zip-option
    content: Update DetachedPDFExtraction.tsx to pass saveToZip option to extractPDFFromArchive
    status: pending
    dependencies:
      - update-extract-zip-types
---

# Add ZIP Support to extractPDFFromArchive Handler

## Problem Analysis

When saving from PDFExtractionModal with `caseFolderPath` (archive case), the code always uses `extractPDFFromArchive`, regardless of the `saveToZip` option. However, `extractPDFFromArchive` doesn't support ZIP files - it only saves individual files. This causes:

- When user checks "Save to ZIP Folder" in archive, files are saved as loose files instead of in a ZIP
- The `saveToZip` option is ignored when saving to archive

## Solution

### 1. Update Type Definitions

- Modify [`src/types/electronAPI.d.ts`](src/types/electronAPI.d.ts) to add `saveToZip` parameter to `extractPDFFromArchive` options

### 2. Update Backend Handler

- Modify [`electron/main.ts`](electron/main.ts) `extract-pdf-from-archive` handler:
- Accept `saveToZip` parameter in options
- When `saveToZip` is true, create a ZIP file instead of saving individual files
- Use JSZip to create the ZIP archive (similar to `save-files` handler)
- Save the ZIP file in the case folder with the folder name
- Still create the `.parent-pdf` metadata file for folder positioning
- When `saveToZip` is false, save individual files as before

### 3. Update Frontend Components

- Modify [`src/components/PDFExtractionModal.tsx`](src/components/PDFExtractionModal.tsx) `handleSave`:
- Pass `saveToZip` option to `extractPDFFromArchive` when `caseFolderPath` exists

- Modify [`src/components/DetachedPDFExtraction.tsx`](src/components/DetachedPDFExtraction.tsx) `handleSave`:
- Pass `saveToZip` option to `extractPDFFromArchive` when `caseFolderPath` exists

## Implementation Details

### Backend Changes

The `extract-pdf-from-archive` handler should:

1. Accept `saveToZip: boolean` in options
2. When `saveToZip` is true:

- Create a ZIP file using JSZip
- Add all extracted pages to the ZIP using the provided file names
- Save the ZIP file as `${folderName}.zip` in the case folder
- Create the `.parent-pdf` metadata file to link the ZIP to the parent PDF
- Optionally save parent PDF inside the ZIP if `saveParentFile` is true

3. When `saveToZip` is false:

- Save individual files as before (existing behavior)

### Frontend Changes

1. Pass `saveToZip` in the options when calling `extractPDFFromArchive`
2. No other changes needed - the logic already determines when to use `extractPDFFromArchive`

## Files to Modify

1. [`src/types/electronAPI.d.ts`](src/types/electronAPI.d.ts) - Add saveToZip parameter
2. [`electron/main.ts`](electron/main.ts) - Add ZIP support to extract-pdf-from-archive handler
3. [`src/components/PDFExtractionModal.tsx`](src/components/PDFExtractionModal.tsx) - Pass saveToZip option
4. [`src/components/DetachedPDFExtraction.tsx`](src/components/DetachedPDFExtraction.tsx) - Pass saveToZip option