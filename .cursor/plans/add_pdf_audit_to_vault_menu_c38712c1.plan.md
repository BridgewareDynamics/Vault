---
name: Add PDF Audit to Vault Menu
overview: Add PDF audit/redaction detection functionality to the vault's PDF options dropdown menu, allowing users to audit PDFs directly from their case files without leaving the vault interface.
todos:
  - id: "1"
    content: Modify SecurityCheckerModal to accept initialPdfPath prop and set PDF path on mount
    status: pending
  - id: "2"
    content: Update PDFOptionsDropdown to add 'PDF Audit' option with callback
    status: pending
  - id: "3"
    content: Update ArchiveFileItem to accept and pass onRunAudit prop
    status: pending
    dependencies:
      - "2"
  - id: "4"
    content: Add state management and handler in ArchivePage for PDF audit
    status: pending
  - id: "5"
    content: Wire up onRunAudit callback in all ArchiveFileItem render locations
    status: pending
    dependencies:
      - "3"
      - "4"
  - id: "6"
    content: Import and render SecurityCheckerModal in ArchivePage
    status: pending
    dependencies:
      - "1"
      - "4"
---

# Add PDF Audit Feature to Vault PDF Options Menu

## Overview

Currently, the PDF Redaction Detection feature is only accessible from the welcome screen via file selection. This plan extends the feature to the vault's PDF options dropdown menu, allowing users to audit PDFs directly from their case files.

## Implementation Plan

### 1. Modify SecurityCheckerModal to Accept Initial PDF Path

- **File**: `src/components/SecurityCheckerModal.tsx`
- **Changes**: 
- Add optional `initialPdfPath?: string | null` prop to `SecurityCheckerModalProps`
- Use `useEffect` to set the PDF path when modal opens with an initial path
- This allows the modal to be pre-populated with a PDF from the vault

### 2. Update PDFOptionsDropdown Component

- **File**: `src/components/Archive/PDFOptionsDropdown.tsx`
- **Changes**:
- Add `onRunAudit?: () => void` prop
- Add a new "PDF Audit" button option in the dropdown menu
- Use appropriate icon (Shield icon to match the audit feature)
- Place it below or above the "Start Page Extraction" option

### 3. Update ArchiveFileItem Component

- **File**: `src/components/Archive/ArchiveFileItem.tsx`
- **Changes**:
- Add `onRunAudit?: () => void` prop
- Pass this prop to `PDFOptionsDropdown`

### 4. Add State Management in ArchivePage

- **File**: `src/components/Archive/ArchivePage.tsx`
- **Changes**:
- Add state: `const [showSecurityChecker, setShowSecurityChecker] = useState(false)`
- Add state: `const [pdfPathForAudit, setPdfPathForAudit] = useState<string | null>(null)`
- Create handler: `handleRunPDFAudit(file: ArchiveFile)` that sets the PDF path and opens the modal
- Import `SecurityCheckerModal` component
- Render `SecurityCheckerModal` at the bottom of the component (similar to other dialogs)
- Pass `initialPdfPath={pdfPathForAudit}` to the modal
- Pass `onRunAudit` callback to `ArchiveFileItem` components

### 5. Wire Up Callbacks

- **File**: `src/components/Archive/ArchivePage.tsx`
- **Changes**:
- In all places where `ArchiveFileItem` is rendered with `onExtract`, also add `onRunAudit={() => handleRunPDFAudit(item)}`
- Ensure this is only added for PDF files (already handled by the component logic)

## Architecture

```javascript
ArchivePage
  ├── State: showSecurityChecker, pdfPathForAudit
  ├── Handler: handleRunPDFAudit(file)
  └── ArchiveFileItem (for PDFs)
      └── PDFOptionsDropdown
          ├── "Start Page Extraction" → handleExtractPDF
          └── "PDF Audit" → handleRunPDFAudit → opens SecurityCheckerModal
              └── SecurityCheckerModal (with initialPdfPath)
```



## Files to Modify

1. `src/components/SecurityCheckerModal.tsx` - Add initialPdfPath prop support
2. `src/components/Archive/PDFOptionsDropdown.tsx` - Add PDF Audit option
3. `src/components/Archive/ArchiveFileItem.tsx` - Pass onRunAudit callback
4. `src/components/Archive/ArchivePage.tsx` - Add state, handler, and modal rendering

## User Experience Flow

1. User opens vault and navigates to a case with PDFs
2. User clicks the chevron dropdown button on a PDF file
3. Dropdown shows two options:

- "Start Page Extraction" (existing)
- "PDF Audit" (new)

4. User clicks "PDF Audit"
5. SecurityCheckerModal opens with the PDF path already selected
6. User can immediately run the audit or adjust settings
7. Audit results are displayed in the modal (existing functionality)

## Testing Considerations

- Verify modal opens with correct PDF path pre-selected
- Verify audit runs successfully with vault PDFs
- Verify modal state resets when closed
- Verify dropdown closes when audit option is selected