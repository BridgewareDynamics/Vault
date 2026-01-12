# Fix Detached Window Case Folder Path Memory

## Problem Analysis

When detaching the PDF extraction window from an archive case, the `caseFolderPath` is not being passed through the detach/reattach flow. This causes:
- The detached window doesn't remember which case it came from
- When saving from the detached window, `caseFolderPath` is null, so it can't save to the archive case folder
- The detached window can't use `extractPDFFromArchive` because it doesn't know the case path

## Solution

### 1. Update Type Definitions
- Modify [`src/types/electronAPI.d.ts`](src/types/electronAPI.d.ts) to add `caseFolderPath` parameter to both `createPdfExtractionWindow` and `reattachPdfExtraction` options

### 2. Update Frontend Modal
- Modify [`src/components/PDFExtractionModal.tsx`](src/components/PDFExtractionModal.tsx) `handleDetach`:
  - Include `caseFolderPath` in the state object passed to `createPdfExtractionWindow`

### 3. Update Backend Handlers
- Modify [`electron/main.ts`](electron/main.ts) `create-pdf-extraction-window` handler:
  - Accept `caseFolderPath` parameter in options
  - Pass `caseFolderPath` to the detached window in the initial data

- Modify [`electron/main.ts`](electron/main.ts) `reattach-pdf-extraction` handler:
  - Accept `caseFolderPath` parameter in options
  - Pass `caseFolderPath` to the main window in the reattach data

### 4. Update Detached Window
- Modify [`src/components/DetachedPDFExtraction.tsx`](src/components/DetachedPDFExtraction.tsx):
  - Change `caseFolderPath` from hardcoded `null` to state that can be set
  - Receive `caseFolderPath` from initial data when window loads
  - Include `caseFolderPath` in the state when reattaching

## Implementation Details

The flow should be:
1. Modal detaches → includes `caseFolderPath` in state → backend stores it → detached window receives it
2. Detached window saves → uses `caseFolderPath` for archive saves
3. Detached window reattaches → includes `caseFolderPath` in reattach state → backend passes it to main window

## Files to Modify

1. [`src/types/electronAPI.d.ts`](src/types/electronAPI.d.ts) - Add caseFolderPath parameter
2. [`src/components/PDFExtractionModal.tsx`](src/components/PDFExtractionModal.tsx) - Include caseFolderPath when detaching
3. [`electron/main.ts`](electron/main.ts) - Pass caseFolderPath through detach/reattach handlers
4. [`src/components/DetachedPDFExtraction.tsx`](src/components/DetachedPDFExtraction.tsx) - Store and use caseFolderPath
