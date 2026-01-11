---
name: ""
overview: ""
todos: []
---

# Fix PDF Extraction Image Saving Bug

## Problem

The `save-files` IPC handler in [`electron/main.ts`](electron/main.ts) (lines 543-626) does not properly handle both save modes based on the `saveToZip` flag. Currently:

- **When `saveToZip` is true**: Images are saved inside a ZIP file ✅ (lines 582-620)
- **When `saveToZip` is false**: Only the parent PDF is saved (if requested), but **extracted page images are NOT saved** ❌

The handler has no `else` branch or separate code block for the non-ZIP case. This is a missing integration of the `saveToZip` flag - the code doesn't handle both branches properly.

This bug affects PDF extraction from both:

- The home screen (`DetachedPDFExtraction`, `PDFExtractionModal`)
- Within the Vault on PDFs in case files (when using `saveFiles` API)

Note: The `extract-pdf-from-archive` handler (lines 2683-2748) correctly saves individual images, but the `save-files` handler is missing this logic.

## Solution

Add an `else` branch (or separate conditional block) after the ZIP saving block to save individual image files when `saveToZip` is false. The implementation should match the pattern used in the `extract-pdf-from-archive` handler (lines 2717-2742).

## Changes Required

### File: `electron/main.ts`

**Location:** After line 620 (after the `if (saveToZip && folderName)` block), add an `else` branch for when `saveToZip` is false.

**Implementation details:**

- Check if `saveToZip` is false (or use an `else` block)
- Iterate through `extractedPages` array
- For each page:
  - Parse the image format from the base64 data URL (PNG/JPEG) - same pattern as lines 594-610
  - Convert base64 string to Buffer
  - Write each image file to `saveDirectory` with filename pattern: `page-${pageNumber}.${extension}`
  - Add success message to `results` array: `Page ${pageNumber} saved: ${imagePath}`

This should mirror the implementation in `extract-pdf-from-archive` handler (lines 2718-2742), which correctly saves individual image files.

**Code structure should become:**

```typescript
// Save parent PDF file if requested
if (saveParentFile && parentFilePath) {
  // ... existing code ...
}

// Save to ZIP if requested
if (saveToZip && folderName) {
  // ... existing ZIP code ...
} else {
  // NEW: Save individual image files when NOT saving to ZIP
  for (const page of extractedPages) {
    // ... save individual image files ...
  }
}
```