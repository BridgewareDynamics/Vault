---
name: Fix PDF Extraction Reattach State Loss
overview: Fix the bug where the PDF to Image Conversion modal loses all extracted pages and state when reattaching from a detached window. The issue is caused by a race condition in state restoration and missing caseFolderPath prop handling.
todos: []
---

# Fix PDF Extraction Reattach State Loss

## Problem Analysis

When reattaching a detached PDF extraction window after completion, the modal opens but all extracted pages and state are lost. The issue stems from:

1. **Missing `caseFolderPath` prop**: When App.tsx opens the modal for reattach, it doesn't pass the `caseFolderPath` prop that the modal needs
2. **Race condition in state restoration**: The reattach data listener only checks stored data once when `isOpen` changes, which may miss the data if timing is off
3. **State reset timing**: The useEffect that manages initial state may interfere with reattach restoration

## Solution

### 1. Update App.tsx to pass `caseFolderPath` during reattach

- Store `caseFolderPath` in the reattach data flow
- Pass it as a prop to `PDFExtractionModal` when opening for reattach
- Modify the reattach event handler to extract and store the case folder path

### 2. Improve state restoration in PDFExtractionModal

- Add a more robust check for stored reattach data that runs on modal open
- Ensure the reattach listener runs regardless of timing
- Add a useEffect that specifically watches for stored data when the modal opens
- Prevent the initial state useEffect from interfering with reattach restoration

### 3. Ensure data persistence

- Verify that `caseFolderPath` is included in the reattach data sent from DetachedPDFExtraction
- Ensure the modal properly restores `caseFolderPath` from reattach data

## Files to Modify

1. **[src/App.tsx](src/App.tsx)**: 

- Update reattach event handler to extract and store `caseFolderPath` from reattach data
- Pass `caseFolderPath` prop to `PDFExtractionModal` component

2. **[src/components/PDFExtractionModal.tsx](src/components/PDFExtractionModal.tsx)**:

- Improve reattach data listener to check stored data more reliably
- Add useEffect to check for stored data when modal becomes open
- Ensure state restoration includes `caseFolderPath`
- Prevent state reset from interfering with reattach restoration

3. **[src/components/DetachedPDFExtraction.tsx](src/components/DetachedPDFExtraction.tsx)**:

- Verify `caseFolderPath` is included in reattach state (already appears to be there)