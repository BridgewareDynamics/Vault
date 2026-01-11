---
name: Fix archive folder refresh and positioning after PDF extraction
overview: "Fix two issues: (1) When saving individual image files (not ZIP) from PDFExtractionModal with a case folder, use extractPDFFromArchive instead of saveFiles so the folder appears in the archive and is properly linked to the parent PDF. (2) Call onExtractionComplete after saving completes to refresh the case files list immediately. The extractPDFFromArchive handler also needs to be updated to accept fileName to support custom file naming patterns."
todos:
  - id: update-extract-types
    content: Update electronAPI.d.ts to include fileName in extractedPages array items for extractPDFFromArchive
    status: pending
  - id: update-extract-backend
    content: Update electron/main.ts extract-pdf-from-archive handler to accept and use fileName
    status: pending
    dependencies:
      - update-extract-types
  - id: update-modal-save-logic
    content: Update PDFExtractionModal.tsx to use extractPDFFromArchive when caseFolderPath exists (for individual files), pass fileName, and call onExtractionComplete after save
    status: pending
    dependencies:
      - update-extract-types
  - id: update-detached-save-logic
    content: Update DetachedPDFExtraction.tsx to use extractPDFFromArchive when caseFolderPath exists (for individual files) and pass fileName
    status: pending
    dependencies:
      - update-extract-types
---

# Fix Archive Folder Refresh and Positioning After PDF Extraction

## Problem Analysis

1. **Folder not appearing**: When saving individual image files (not ZIP) from PDFExtractionModal with `caseFolderPath`, the code uses `saveFiles` instead of `extractPDFFromArchive`. This means:

- The folder isn't created in the archive case folder
- The `.parent-pdf` metadata file isn't created
- The folder won't appear in the case file listing
- The folder won't be positioned above the PDF card

2. **No refresh after save**: After saving completes, `onExtractionComplete` is not called, so the files list isn't refreshed and the user must back out and reopen the case to see the new folder.

3. **File naming**: The `extractPDFFromArchive` handler generates file names like `page-${pageNumber}.${extension}`, but we need it to accept custom file names from the frontend to support file naming patterns.

## Solution

### 1. Update Type Definitions

- Modify [`src/types/electronAPI.d.ts`](src/types/electronAPI.d.ts) to include `fileName` in `extractedPages` array items for `extractPDFFromArchive`

### 2. Update Backend Handler

- Modify [`electron/main.ts`](electron/main.ts) `extract-pdf-from-archive` handler:
- Accept `fileName` in `extractedPages` array items
- Use the provided `fileName` instead of generating it
- Ensure the `.parent-pdf` metadata file is created (already done, but verify)

### 3. Update Frontend Components

- Modify [`src/components/PDFExtractionModal.tsx`](src/components/PDFExtractionModal.tsx) `handleSave`:
- When `caseFolderPath` exists, use `extractPDFFromArchive` for both ZIP and individual files (currently only used for ZIP)
- Pass `fileName` in the `extractedPages` array
- Call `onExtractionComplete` after saving completes successfully

- Modify [`src/components/DetachedPDFExtraction.tsx`](src/components/DetachedPDFExtraction.tsx) `handleSave`:
- When `caseFolderPath` exists, use `extractPDFFromArchive` for individual files
- Pass `fileName` in the `extractedPages` array (already done for `saveFiles`)

## Implementation Details

### Logic Flow

When saving from PDFExtractionModal with `caseFolderPath`:

1. If `caseFolderPath` exists:

- Always use `extractPDFFromArchive` (regardless of saveToZip)
- This ensures the folder appears in the archive and is linked to the parent PDF
- Note: Currently `extractPDFFromArchive` only saves individual files. ZIP support may need to be added later, but for now we focus on individual files.

2. If `caseFolderPath` doesn't exist:

- Use `saveFiles` as before (for both ZIP and individual files)

3. After save completes:

- Call `onExtractionComplete()` to refresh the files list

### Files to Modify

1. [`src/types/electronAPI.d.ts`](src/types/electronAPI.d.ts) - Update type definitions for extractPDFFromArchive
2. [`electron/main.ts`](electron/main.ts) - Update extract-pdf-from-archive handler to accept fileName
3. [`src/components/PDFExtractionModal.tsx`](src/components/PDFExtractionModal.tsx) - Use extractPDFFromArchive when caseFolderPath exists, call onExtractionComplete
4. [`src/components/DetachedPDFExtraction.tsx`](src/components/DetachedPDFExtraction.tsx) - Use extractPDFFromArchive when caseFolderPath exists

## Notes

- The folder positioning (above PDF card) should work automatically once we use `extractPDFFromArchive` because it creates the `.parent-pdf` metadata file
- ZIP support in `extractPDFFromArchive` is out of scope for this fix - focus on individual files