# The Vault - Comprehensive Testing Procedures

**Version**: 1.0  
**Last Updated**: 2026-01-07  
**Application Version**: 1.0.0-prerelease.4

---

## Table of Contents

1. [Introduction](#introduction)
2. [Testing Prerequisites](#testing-prerequisites)
3. [Environment Setup](#environment-setup)
4. [Manual Testing Procedures](#manual-testing-procedures)
   - [PDF Extraction](#pdf-extraction-testing)
   - [The Vault - Archive System](#vault-archive-system-testing)
   - [Bookmark System](#bookmark-system-testing)
   - [Word Editor](#word-editor-testing)
   - [Category Tags](#category-tags-testing)
   - [File Management](#file-management-testing)
   - [Security Features](#security-features-testing)
   - [UI/UX Components](#ui-ux-testing)
5. [Automated Testing](#automated-testing)
6. [Performance Testing](#performance-testing)
7. [Build and Deployment Testing](#build-and-deployment-testing)
8. [Test Checklists](#test-checklists)
9. [Reporting Issues](#reporting-issues)
10. [Appendix](#appendix)

---

## Introduction

This document provides comprehensive testing procedures for The Vault application. It is designed to ensure that all features work correctly, maintain quality standards, and provide a reliable user experience. 

### Purpose

- **Ensure Quality**: Validate all features function as expected
- **Prevent Regressions**: Catch bugs before they reach users
- **Document Expected Behavior**: Serve as a reference for correct functionality
- **Enable Repeatable Testing**: Provide clear, step-by-step procedures

### Testing Types Covered

- **Functional Testing**: Verify features work as designed
- **UI/UX Testing**: Ensure interface is intuitive and responsive
- **Integration Testing**: Validate component interactions
- **Performance Testing**: Confirm acceptable speed and resource usage
- **Security Testing**: Verify security features and data protection
- **Build Testing**: Validate production builds and installers

---

## Testing Prerequisites

### Required Tools and Resources

#### 1. Development Environment
- **Node.js**: Version 20.x or higher
- **npm**: Version 9.x or higher
- **Git**: For version control
- **Code Editor**: VS Code recommended

#### 2. Test Data Preparation

Create a test data folder with the following files:

**PDF Files (Various Sizes)**
- Small PDF: 1-5 pages (~500KB)
- Medium PDF: 10-50 pages (~5MB)
- Large PDF: 100-500 pages (~50MB)
- Very Large PDF: 500+ pages (>100MB) - for performance testing

**PDF Files (Various Types)**
- Simple text PDF
- PDF with images
- PDF with complex formatting
- PDF with forms
- Scanned PDF
- Password-protected PDF (for negative testing)
- Corrupted PDF (for error handling testing)

**Image Files**
- JPEG images (various sizes)
- PNG images (various sizes)
- WebP images
- Very large images (>10MB)

**Video Files**
- MP4 video (small, ~5MB)
- MP4 video (large, ~50MB)

**Text Files**
- Simple text files (.txt)
- Rich text documents

#### 3. Storage Requirements

- **Vault Directory**: At least 1GB free space for testing
- **Temporary Directory**: 500MB for extraction testing
- **Multiple Drives**: If possible, test on different drive types (SSD, HDD, external)

#### 4. Testing Checklist Template

Prepare a checklist document or spreadsheet to track:
- Test case ID
- Feature/component tested
- Expected result
- Actual result
- Pass/Fail status
- Notes/screenshots
- Date tested
- Tester name

---

## Environment Setup

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/BridgewareDynamics/Vault.git
cd Vault

# Install dependencies
npm ci

# Verify installation
npm run lint
```

### 2. Development Mode Setup

```bash
# Start in development mode
npm run electron:dev
```

**Verification**:
- Application window opens
- No console errors
- DevTools are available (in development)

### 3. Production Build Setup

```bash
# Build the application
npm run build:all

# Create installer/executable
npm run electron:build
```

**Verification**:
- Build completes without errors
- Installer created in `release/` directory
- Installer runs and installs successfully

### 4. Test Environment Preparation

**Before Each Testing Session**:
1. Clear application data (settings, cache)
   - Windows: `%USERPROFILE%\AppData\Roaming\pdftract\`
   - macOS: `~/Library/Application Support/pdftract/`
   - Linux: `~/.config/pdftract/`
2. Create fresh test vault directory
3. Prepare test files in accessible location
4. Note system specifications (OS, RAM, CPU) for performance testing

---

## Manual Testing Procedures

### PDF Extraction Testing

#### Test Case 1.1: Basic PDF Extraction

**Objective**: Verify successful extraction of a simple PDF

**Prerequisites**: 
- Application running
- Simple PDF file ready (5-10 pages)

**Steps**:
1. Click "Select file" on welcome screen
2. Select a simple PDF file (5-10 pages)
3. Wait for extraction to complete
4. Observe progress bar and status messages

**Expected Results**:
- ✅ File dialog opens
- ✅ PDF file loads successfully
- ✅ Progress bar shows from 0% to 100%
- ✅ Status messages update (e.g., "Extracting page 1 of 10")
- ✅ Extracted pages appear in gallery
- ✅ All pages extracted correctly
- ✅ Images are clear and readable
- ✅ No console errors

**Pass Criteria**: All expected results met

---

#### Test Case 1.2: Large PDF Extraction

**Objective**: Test extraction of large PDFs and performance

**Prerequisites**: 
- Large PDF file (100+ pages, >20MB)

**Steps**:
1. Click "Select file"
2. Select large PDF file
3. Observe warning dialog (if applicable)
4. Proceed with extraction
5. Monitor progress and system resources

**Expected Results**:
- ✅ Warning dialog appears for large PDFs (if >100 pages or >20MB)
- ✅ Progress updates smoothly
- ✅ Application remains responsive
- ✅ Memory usage stays reasonable (<2GB)
- ✅ Extraction completes successfully
- ✅ All pages extracted correctly

**Notes**: 
- Record extraction time
- Monitor memory usage during extraction
- Test cancellation if feature available

---

#### Test Case 1.3: Save Extracted Pages - Directory

**Objective**: Verify saving extracted pages to a directory

**Prerequisites**: 
- PDF extracted (from Test Case 1.1)

**Steps**:
1. After extraction, click "Save to directory" button
2. Select save location
3. Enter folder name "test-extraction"
4. Check "Save parent file" option
5. Uncheck "Save to ZIP" option
6. Click "Save"
7. Navigate to save location in file explorer

**Expected Results**:
- ✅ Directory selection dialog opens
- ✅ Folder name field accepts input
- ✅ Save options are selectable
- ✅ Save completes with success message
- ✅ Folder created with correct name
- ✅ All PNG files present and numbered correctly (page-1.png, page-2.png, etc.)
- ✅ Original PDF file present (if "Save parent file" checked)
- ✅ Files are accessible and viewable

---

#### Test Case 1.4: Save Extracted Pages - ZIP Archive

**Objective**: Verify saving extracted pages to ZIP archive

**Prerequisites**: 
- PDF extracted

**Steps**:
1. After extraction, click "Save"
2. Select save location
3. Enter folder name "test-zip"
4. Check both "Save parent file" and "Save to ZIP"
5. Click "Save"
6. Navigate to save location
7. Extract and inspect ZIP file contents

**Expected Results**:
- ✅ ZIP file created with correct name
- ✅ ZIP contains all extracted PNG files
- ✅ ZIP contains original PDF (if selected)
- ✅ ZIP file is valid and can be extracted
- ✅ Extracted files are correct and viewable

---

#### Test Case 1.5: Error Handling - Invalid PDF

**Objective**: Test error handling for corrupted/invalid PDFs

**Prerequisites**: 
- Corrupted or invalid PDF file

**Steps**:
1. Click "Select file"
2. Select corrupted/invalid PDF
3. Observe error handling

**Expected Results**:
- ✅ Error message displays clearly
- ✅ Error message is user-friendly (not technical)
- ✅ Application doesn't crash
- ✅ User can dismiss error and try again
- ✅ Error logged to console/log file

---

#### Test Case 1.6: Error Handling - Password Protected PDF

**Objective**: Verify handling of password-protected PDFs

**Prerequisites**: 
- Password-protected PDF

**Steps**:
1. Click "Select file"
2. Select password-protected PDF
3. Observe behavior

**Expected Results**:
- ✅ Error message indicates PDF is password-protected
- ✅ Application handles gracefully (doesn't crash)
- ✅ User can select different file

**Notes**: Password input feature not currently supported

---

#### Test Case 1.7: Gallery Interaction

**Objective**: Test gallery view and navigation

**Prerequisites**: 
- PDF with 10+ pages extracted

**Steps**:
1. After extraction, observe gallery
2. Scroll through gallery
3. Click on different page thumbnails
4. Use keyboard arrows (if applicable)

**Expected Results**:
- ✅ All pages visible in gallery
- ✅ Thumbnails load correctly
- ✅ Scrolling is smooth
- ✅ Clicking thumbnail opens full view
- ✅ Navigation between pages works
- ✅ Page numbers displayed correctly

---

#### Test Case 1.8: Image Viewer Functionality

**Objective**: Test full-screen image viewer

**Prerequisites**: 
- Extracted pages available

**Steps**:
1. Click on an extracted page thumbnail
2. Use zoom controls (+, -, reset)
3. Use keyboard shortcuts (=, -, 0)
4. Double-click to zoom
5. Drag to pan when zoomed
6. Use arrow keys to navigate
7. Press Escape to close

**Expected Results**:
- ✅ Full-screen viewer opens
- ✅ Image displays clearly
- ✅ Zoom in increases size smoothly
- ✅ Zoom out decreases size smoothly
- ✅ Reset (0 key) returns to original size
- ✅ Zoom percentage displays correctly
- ✅ Double-click zooms to cursor position
- ✅ Dragging pans image when zoomed
- ✅ Arrow keys navigate between pages
- ✅ Escape closes viewer
- ✅ No distortion or artifacts

---

### Vault Archive System Testing

#### Test Case 2.1: Initial Vault Setup

**Objective**: Set up vault for first time

**Prerequisites**: 
- Fresh application install (no previous vault)

**Steps**:
1. From welcome screen, click "The Vault"
2. Select vault drive/directory when prompted
3. Choose a test directory with write permissions
4. Confirm selection

**Expected Results**:
- ✅ Directory selection dialog appears
- ✅ Selected directory is accepted
- ✅ Vault initializes successfully
- ✅ Empty vault view appears
- ✅ "Start Case File" button visible
- ✅ Directory path saved for future sessions

---

#### Test Case 2.2: Create Case File

**Objective**: Create a new case in the vault

**Prerequisites**: 
- Vault initialized

**Steps**:
1. Click "Start Case File" or "New Case" button
2. Enter case name "Test Case 2024"
3. Confirm creation
4. Verify case appears in vault

**Expected Results**:
- ✅ Dialog prompts for case name
- ✅ Name input accepts text
- ✅ Invalid characters rejected/sanitized
- ✅ Empty names rejected
- ✅ Case folder created in vault directory
- ✅ Case appears in vault list
- ✅ Case is selectable/clickable

---

#### Test Case 2.3: Open and Navigate Case

**Objective**: Navigate into a case folder

**Prerequisites**: 
- Case created (Test Case 2.2)

**Steps**:
1. Click on created case
2. Observe case contents view
3. Check breadcrumb navigation
4. Create a subfolder (if feature available)
5. Navigate back using breadcrumb

**Expected Results**:
- ✅ Case opens to contents view
- ✅ Empty case shows appropriate message/UI
- ✅ Breadcrumb shows current path
- ✅ Navigation controls visible
- ✅ Back navigation works correctly

---

#### Test Case 2.4: Add Files to Case - Drag and Drop

**Objective**: Add files using drag and drop

**Prerequisites**: 
- Case open
- Test files ready (PDF, images, videos)

**Steps**:
1. Open file explorer with test files
2. Drag files to vault window
3. Drop files in the case area
4. Wait for files to be added

**Expected Results**:
- ✅ Drop zone indicates drop is possible
- ✅ Files copy to case directory
- ✅ Files appear in case view
- ✅ File thumbnails generate
- ✅ File metadata displays (name, size, type)
- ✅ Original files remain in source location (copy not move)

---

#### Test Case 2.5: Add Files to Case - File Dialog

**Objective**: Add files using file selection dialog

**Prerequisites**: 
- Case open

**Steps**:
1. Click "Add Files" button
2. Select multiple files from dialog
3. Confirm selection
4. Verify files added

**Expected Results**:
- ✅ File selection dialog opens
- ✅ Multiple file selection works
- ✅ Different file types accepted
- ✅ Files copy successfully
- ✅ Files appear in vault

---

#### Test Case 2.6: Extract PDF Within Vault

**Objective**: Extract PDF pages directly to vault extraction folder

**Prerequisites**: 
- Case with PDF file added

**Steps**:
1. Click on PDF file in vault
2. Click PDF extraction button/option
3. Enter extraction folder name "Extracted-Documents"
4. Choose to save parent PDF or not
5. Wait for extraction
6. Navigate to extraction folder

**Expected Results**:
- ✅ Extraction dialog appears
- ✅ Folder name input works
- ✅ Options are selectable
- ✅ Extraction completes successfully
- ✅ New folder created in case
- ✅ Folder contains extracted PNG files
- ✅ Parent PDF saved if option selected
- ✅ `.parent-pdf` metadata file created
- ✅ Folder is marked as extraction folder

---

#### Test Case 2.7: Navigate Extraction Folder

**Objective**: View and navigate extraction folder contents

**Prerequisites**: 
- Extraction folder created (Test Case 2.6)

**Steps**:
1. Click on extraction folder
2. View extracted pages
3. Click on individual pages
4. Navigate back to case

**Expected Results**:
- ✅ Folder opens showing extracted pages
- ✅ Pages display as thumbnails/grid
- ✅ Page numbers visible
- ✅ Clicking page opens viewer
- ✅ Breadcrumb navigation works
- ✅ Parent PDF link/info visible (if saved)

---

#### Test Case 2.8: Search Functionality

**Objective**: Search for cases and files

**Prerequisites**: 
- Multiple cases and files in vault

**Steps**:
1. Enter search term in search bar
2. Observe filtered results
3. Try different search terms
4. Search for file names
5. Search for case names
6. Clear search

**Expected Results**:
- ✅ Search input accepts text
- ✅ Results filter in real-time
- ✅ Matching cases appear
- ✅ Matching files appear
- ✅ Search is case-insensitive (verify if this is the design)
- ✅ No results message displays appropriately
- ✅ Clearing search restores all items

---

#### Test Case 2.9: File Thumbnails

**Objective**: Verify thumbnail generation for different file types

**Prerequisites**: 
- Case with various file types (images, PDFs, videos)

**Steps**:
1. Add JPEG image
2. Add PNG image
3. Add WebP image
4. Add PDF file
5. Add MP4 video
6. Observe thumbnails

**Expected Results**:
- ✅ JPEG thumbnail generates correctly
- ✅ PNG thumbnail generates correctly
- ✅ WebP thumbnail generates correctly
- ✅ PDF thumbnail shows first page
- ✅ Video thumbnail shows frame at ~10% duration
- ✅ Thumbnails cache for performance
- ✅ Thumbnails are clear and recognizable
- ✅ Loading states display if generation takes time

---

#### Test Case 2.10: Multiple Cases Management

**Objective**: Manage multiple cases simultaneously

**Prerequisites**: 
- None

**Steps**:
1. Create 5 different cases with distinct names
2. Add files to each case
3. Switch between cases
4. Search across all cases
5. Verify isolation of case contents

**Expected Results**:
- ✅ All cases created successfully
- ✅ Each case has separate folder
- ✅ Files don't mix between cases
- ✅ Switching between cases works smoothly
- ✅ Search shows results from all cases
- ✅ No data corruption or mixing

---

### Bookmark System Testing

#### Test Case 3.1: Create Bookmark from PDF Viewer

**Objective**: Create a bookmark from a PDF page

**Prerequisites**: 
- PDF file in vault
- PDF opened in viewer

**Steps**:
1. Open PDF in vault viewer
2. Navigate to specific page
3. Click bookmark button/icon
4. Enter bookmark details:
   - Name: "Important Finding"
   - Description: "Key evidence on page 5"
   - Notes: "Review with team"
   - Tags: "evidence, critical"
5. Save bookmark
6. Verify bookmark created

**Expected Results**:
- ✅ Bookmark button is visible
- ✅ Bookmark creation dialog appears
- ✅ All fields accept input
- ✅ Thumbnail auto-generates from page
- ✅ Bookmark saves successfully
- ✅ Success message displays
- ✅ Page shows bookmark indicator

---

#### Test Case 3.2: Access Bookmark Library

**Objective**: Open and view bookmark library

**Prerequisites**: 
- At least one bookmark created

**Steps**:
1. Click bookmark library icon/button
2. View bookmark library interface
3. Observe bookmark display

**Expected Results**:
- ✅ Library opens in modal/panel
- ✅ Bookmarks display as cards/list
- ✅ Thumbnails visible
- ✅ Bookmark metadata visible (name, description)
- ✅ Library is organized and readable

---

#### Test Case 3.3: Open Bookmark

**Objective**: Navigate to bookmarked page from library

**Prerequisites**: 
- Bookmark created for PDF page

**Steps**:
1. Open bookmark library
2. Click "Open" on a bookmark
3. Observe navigation

**Expected Results**:
- ✅ Click triggers navigation
- ✅ PDF opens at correct page
- ✅ Page matches bookmark thumbnail
- ✅ Viewer displays correctly
- ✅ Bookmark indicator visible on page

---

#### Test Case 3.4: Create Bookmark Folder

**Objective**: Organize bookmarks in folders

**Prerequisites**: 
- Bookmark library open

**Steps**:
1. Click "Create Folder" or similar
2. Enter folder name "Critical Evidence"
3. Create folder
4. Verify folder appears

**Expected Results**:
- ✅ Folder creation option available
- ✅ Name input works
- ✅ Folder created successfully
- ✅ Folder appears in library
- ✅ Folder is distinguishable from bookmarks

---

#### Test Case 3.5: Move Bookmark to Folder

**Objective**: Organize bookmark into folder

**Prerequisites**: 
- Bookmark and folder created

**Steps**:
1. Select bookmark
2. Move to folder (drag-drop or menu option)
3. Verify bookmark in folder

**Expected Results**:
- ✅ Move operation works
- ✅ Bookmark appears in folder
- ✅ Bookmark removed from root/previous location
- ✅ Folder structure maintained

---

#### Test Case 3.6: Edit Bookmark

**Objective**: Update bookmark details

**Prerequisites**: 
- Bookmark created

**Steps**:
1. Open bookmark library
2. Select bookmark
3. Click edit/options
4. Modify name, description, notes, tags
5. Save changes

**Expected Results**:
- ✅ Edit option available
- ✅ Current data pre-filled
- ✅ Changes accepted
- ✅ Changes saved correctly
- ✅ Updated details display in library

---

#### Test Case 3.7: Delete Bookmark

**Objective**: Remove bookmark

**Prerequisites**: 
- Bookmark created

**Steps**:
1. Open bookmark library
2. Select bookmark
3. Click delete
4. Confirm deletion
5. Verify bookmark removed

**Expected Results**:
- ✅ Delete option available
- ✅ Confirmation dialog appears
- ✅ Deletion removes bookmark
- ✅ Bookmark no longer in library
- ✅ Page indicator removed from PDF

---

#### Test Case 3.8: Bookmark from Detached Editor

**Objective**: Test cross-window bookmark functionality

**Prerequisites**: 
- Word editor detached to separate window

**Steps**:
1. Detach word editor
2. From detached window, open bookmark
3. Verify bookmark opens in main window

**Expected Results**:
- ✅ Bookmark accessible from detached window
- ✅ Opening bookmark switches to main window
- ✅ PDF opens at correct page in main window
- ✅ Both windows remain functional

---

### Word Editor Testing

#### Test Case 4.1: Open Word Editor

**Objective**: Access word editor panel

**Prerequisites**: 
- Application running

**Steps**:
1. Click word editor icon/button
2. Observe editor panel

**Expected Results**:
- ✅ Editor panel opens
- ✅ Editor interface displays
- ✅ Toolbar visible with formatting options
- ✅ Text area ready for input
- ✅ Cursor active in editor

---

#### Test Case 4.2: Create New Text File

**Objective**: Create and save new text file

**Prerequisites**: 
- Word editor open

**Steps**:
1. Click "New File" or Ctrl+N / Cmd+N
2. Type content: "This is a test document for The Vault application."
3. Apply formatting (bold, italic, underline)
4. Click Save or Ctrl+S / Cmd+S
5. Enter filename "Test Document 1"
6. Confirm save

**Expected Results**:
- ✅ New file creation works
- ✅ Editor clears/resets for new file
- ✅ Text input works smoothly
- ✅ Formatting applies correctly
- ✅ Save dialog appears
- ✅ Filename accepted
- ✅ File saves successfully
- ✅ Success message displays

---

#### Test Case 4.3: Text Formatting

**Objective**: Test all text formatting features

**Prerequisites**: 
- Text file open with content

**Steps**:
1. Select text
2. Apply bold (Ctrl+B / Cmd+B)
3. Apply italic (Ctrl+I / Cmd+I)
4. Apply underline (Ctrl+U / Cmd+U)
5. Change font size (8pt to 72pt)
6. Change text alignment (left, center, right, justify)
7. Test undo (Ctrl+Z / Cmd+Z)
8. Test redo (Ctrl+Shift+Z / Cmd+Shift+Z)

**Expected Results**:
- ✅ Bold applies correctly
- ✅ Italic applies correctly
- ✅ Underline applies correctly
- ✅ Font sizes change correctly
- ✅ All font sizes (8pt-72pt) work
- ✅ Text alignment changes work
- ✅ Undo reverses actions
- ✅ Redo re-applies actions
- ✅ Keyboard shortcuts work
- ✅ Toolbar buttons work

---

#### Test Case 4.4: Auto-Save Drafts

**Objective**: Verify auto-save functionality

**Prerequisites**: 
- New unsaved document

**Steps**:
1. Create new file
2. Type content
3. Wait without saving (observe behavior)
4. Close and reopen editor
5. Check for draft recovery

**Expected Results**:
- ✅ Draft auto-saves to localStorage
- ✅ Draft persists after closing editor
- ✅ Draft recoverable after reopening
- ✅ Draft debounces (doesn't save on every keystroke)

---

#### Test Case 4.5: Unsaved Changes Warning

**Objective**: Test unsaved changes detection

**Prerequisites**: 
- File open with changes

**Steps**:
1. Open existing file
2. Make modifications
3. Attempt to close editor without saving
4. Attempt to create new file without saving
5. Handle confirmation dialog

**Expected Results**:
- ✅ Closing triggers warning dialog
- ✅ Creating new file triggers warning
- ✅ Dialog offers save/discard/cancel options
- ✅ Save option saves changes
- ✅ Discard option discards changes
- ✅ Cancel option returns to editor

---

#### Test Case 4.6: Text Library

**Objective**: View and manage text files

**Prerequisites**: 
- Multiple text files created

**Steps**:
1. Click "Text Library" button
2. View list of text files
3. Click on a file to open
4. Sort/filter files (if available)

**Expected Results**:
- ✅ Library displays all text files
- ✅ Files show name and metadata
- ✅ Clicking file opens it
- ✅ Current file highlighted
- ✅ Library is navigable

---

#### Test Case 4.7: Delete Text File

**Objective**: Remove text file from library

**Prerequisites**: 
- Text file exists in library

**Steps**:
1. Open text library
2. Select file to delete
3. Click delete button
4. Confirm deletion
5. Verify file removed

**Expected Results**:
- ✅ Delete option available
- ✅ Confirmation dialog appears
- ✅ File deleted from vault
- ✅ File removed from library
- ✅ File no longer accessible

---

#### Test Case 4.8: Export Text File

**Objective**: Export text file to external format

**Prerequisites**: 
- Text file with content

**Steps**:
1. Open text file
2. Click "Export" option
3. Select export format (TXT initially supported)
4. Choose save location
5. Verify exported file

**Expected Results**:
- ✅ Export option available
- ✅ Format options display
- ✅ Save dialog appears
- ✅ File exports successfully
- ✅ Exported file contains correct content
- ✅ Exported file is valid format

---

#### Test Case 4.9: Detached Word Editor

**Objective**: Test word editor in separate window

**Prerequisites**: 
- Word editor open in main window

**Steps**:
1. Click "Detach" button
2. Observe new window
3. Edit content in detached window
4. Save file
5. Click "Reattach" button
6. Verify editor returns to main window

**Expected Results**:
- ✅ Detach button visible
- ✅ New window opens
- ✅ Editor content transfers to new window
- ✅ Editing works in detached window
- ✅ Saving works in detached window
- ✅ Reattach button visible
- ✅ Reattaching returns editor to main window
- ✅ Content preserved during detach/reattach

---

#### Test Case 4.10: Resizable Editor Panel

**Objective**: Test resizable divider for editor panel

**Prerequisites**: 
- Word editor open (not detached)

**Steps**:
1. Locate divider between editor and main content
2. Click and drag divider left/right
3. Observe panel resize
4. Close and reopen editor
5. Verify position persists

**Expected Results**:
- ✅ Divider is visible and draggable
- ✅ Dragging resizes panels smoothly
- ✅ Minimum/maximum sizes enforced
- ✅ Position saves to settings
- ✅ Position restores on reopen

---

#### Test Case 4.11: Text Statistics

**Objective**: Verify text statistics display

**Prerequisites**: 
- Text file with content

**Steps**:
1. Type various content in editor
2. Observe statistics (word count, sentence count, etc.)
3. Add/remove content
4. Verify statistics update

**Expected Results**:
- ✅ Statistics visible in editor
- ✅ Word count accurate
- ✅ Sentence count accurate
- ✅ Statistics update in real-time
- ✅ Statistics formatted clearly

---

### Category Tags Testing

#### Test Case 5.1: Create Category Tag

**Objective**: Create new category tag

**Prerequisites**: 
- Vault initialized

**Steps**:
1. Click "Create Tag" or tag management button
2. Enter tag name "Evidence"
3. Select color (e.g., red)
4. Save tag
5. Verify tag created

**Expected Results**:
- ✅ Tag creation interface available
- ✅ Name input accepts text
- ✅ Color picker works
- ✅ Tag saves successfully
- ✅ Tag appears in tag list
- ✅ Tag displays with correct color

---

#### Test Case 5.2: Assign Tag to Case

**Objective**: Apply category tag to case

**Prerequisites**: 
- Tag created
- Case exists

**Steps**:
1. Select case
2. Click tag assignment option
3. Select tag from list
4. Confirm assignment
5. Verify tag displays on case

**Expected Results**:
- ✅ Tag selection interface appears
- ✅ Available tags listed
- ✅ Tag assignment works
- ✅ Tag badge/indicator visible on case
- ✅ Tag color displays correctly

---

#### Test Case 5.3: Assign Tag to File

**Objective**: Apply category tag to individual file

**Prerequisites**: 
- Tag created
- File in vault

**Steps**:
1. Select file
2. Open file options/menu
3. Select tag assignment
4. Choose tag
5. Confirm
6. Verify tag on file

**Expected Results**:
- ✅ Tag assignment available for files
- ✅ Tag applies to file
- ✅ Tag visible on file item
- ✅ Tag distinguishable from case tags

---

#### Test Case 5.4: Filter by Category Tag

**Objective**: Filter cases/files by tag

**Prerequisites**: 
- Multiple cases/files with different tags

**Steps**:
1. Click tag filter option
2. Select specific tag
3. Observe filtered results
4. Select different tag
5. Clear filter

**Expected Results**:
- ✅ Tag filter interface available
- ✅ Filtering shows only tagged items
- ✅ Switching tags updates results
- ✅ Tag count/indicator shows if available
- ✅ Clearing filter restores all items

---

#### Test Case 5.5: Multiple Tags

**Objective**: Test multiple tag creation and usage

**Prerequisites**: 
- None

**Steps**:
1. Create 5 different tags with unique colors
2. Assign different tags to different cases
3. Filter by each tag
4. Verify tag independence

**Expected Results**:
- ✅ Multiple tags created successfully
- ✅ Each tag has unique color
- ✅ Tags apply independently
- ✅ Filtering works for each tag
- ✅ No tag conflicts

---

#### Test Case 5.6: Remove Tag from Case

**Objective**: Unassign tag from case

**Prerequisites**: 
- Case with tag assigned

**Steps**:
1. Select tagged case
2. Access tag options
3. Remove/unassign tag
4. Verify tag removed

**Expected Results**:
- ✅ Remove option available
- ✅ Tag removes successfully
- ✅ Tag indicator disappears from case
- ✅ Case still accessible

---

### File Management Testing

#### Test Case 6.1: Rename File

**Objective**: Rename a file in vault

**Prerequisites**: 
- File in vault

**Steps**:
1. Hover over file
2. Click rename/pencil icon
3. Enter new name "Renamed Test File"
4. Press Enter or click Confirm
5. Verify rename

**Expected Results**:
- ✅ Rename option visible on hover
- ✅ Input field appears with current name
- ✅ New name accepted
- ✅ Invalid characters rejected/sanitized
- ✅ File renamed in vault
- ✅ File system updated
- ✅ File still accessible with new name

---

#### Test Case 6.2: Rename Folder

**Objective**: Rename a folder in vault

**Prerequisites**: 
- Folder in case

**Steps**:
1. Hover over folder
2. Click rename icon
3. Enter new name
4. Confirm
5. Verify folder renamed
6. Check folder contents preserved

**Expected Results**:
- ✅ Rename works for folders
- ✅ Folder renamed successfully
- ✅ Folder path updated
- ✅ Contents preserved
- ✅ No data loss

---

#### Test Case 6.3: Delete File

**Objective**: Remove file from vault

**Prerequisites**: 
- File in vault

**Steps**:
1. Hover over file
2. Click delete/trash icon
3. Read confirmation dialog
4. Confirm deletion
5. Verify file removed
6. Check file system

**Expected Results**:
- ✅ Delete option visible
- ✅ Confirmation dialog appears
- ✅ Dialog warns about permanent deletion
- ✅ File deleted from vault
- ✅ File removed from file system
- ✅ File no longer listed

---

#### Test Case 6.4: Delete Folder

**Objective**: Remove folder and contents

**Prerequisites**: 
- Folder with files

**Steps**:
1. Select folder with contents
2. Click delete
3. Read warning about contents deletion
4. Confirm deletion
5. Verify folder and contents removed

**Expected Results**:
- ✅ Delete option available
- ✅ Warning mentions contents will be deleted
- ✅ Confirmation required
- ✅ Folder and all contents deleted
- ✅ Breadcrumb navigation updates if in folder

---

#### Test Case 6.5: Delete Case

**Objective**: Remove entire case

**Prerequisites**: 
- Case with files and folders

**Steps**:
1. Select case
2. Click delete case option
3. Read confirmation
4. Confirm deletion
5. Verify case removed

**Expected Results**:
- ✅ Delete case option available
- ✅ Strong warning about data loss
- ✅ Confirmation required
- ✅ Case and all contents deleted
- ✅ Case folder removed from file system

---

#### Test Case 6.6: View File Details

**Objective**: Access file metadata and information

**Prerequisites**: 
- File in vault

**Steps**:
1. Click on file
2. View file details/properties
3. Observe displayed information

**Expected Results**:
- ✅ File name displayed
- ✅ File size displayed
- ✅ File type displayed
- ✅ Modification date displayed
- ✅ Parent PDF info (if extraction)
- ✅ Tag info (if tagged)

---

### Security Features Testing

#### Test Case 7.1: PDF Audit/Security Checker

**Objective**: Run security check on PDF

**Prerequisites**: 
- PDF file in vault

**Steps**:
1. Open PDF Audit tool
2. Select PDF for audit
3. Run audit
4. Review audit report
5. Export/save report

**Expected Results**:
- ✅ Audit tool accessible
- ✅ PDF selection works
- ✅ Audit runs and completes
- ✅ Report displays findings
- ✅ Report is detailed and clear
- ✅ Export/save option works

---

#### Test Case 7.2: Detached Security Checker

**Objective**: Test security checker in separate window

**Prerequisites**: 
- Security checker feature available

**Steps**:
1. Open security checker
2. Detach to separate window
3. Run audit in detached window
4. Reattach window
5. Verify data persists

**Expected Results**:
- ✅ Detach option available
- ✅ New window opens
- ✅ Functionality works in detached mode
- ✅ Reattach works
- ✅ Data preserved

---

#### Test Case 7.3: Path Validation

**Objective**: Verify secure path validation

**Prerequisites**: 
- Developer tools/console access

**Steps**:
1. Attempt to access files outside vault
2. Try path traversal (../ in filenames)
3. Test with absolute paths
4. Observe error handling

**Expected Results**:
- ✅ Invalid paths rejected
- ✅ Path traversal blocked
- ✅ Vault boundary enforced
- ✅ Error messages don't reveal system info
- ✅ No security vulnerabilities

---

### UI/UX Testing

#### Test Case 8.1: Responsive Design

**Objective**: Test UI at different window sizes

**Prerequisites**: 
- Application running

**Steps**:
1. Resize window to minimum size
2. Resize to maximum size
3. Test at various medium sizes
4. Check all views (welcome, vault, editor, etc.)

**Expected Results**:
- ✅ UI elements scale appropriately
- ✅ No text cutoff or overlap
- ✅ Buttons remain accessible
- ✅ Scroll bars appear when needed
- ✅ Layout remains usable at all sizes

---

#### Test Case 8.2: Keyboard Navigation

**Objective**: Test keyboard accessibility

**Prerequisites**: 
- Application running

**Steps**:
1. Use Tab to navigate between elements
2. Use Enter to activate buttons
3. Use Escape to close dialogs
4. Test arrow keys in gallery
5. Test all documented shortcuts

**Expected Results**:
- ✅ Tab navigation works
- ✅ Focus indicators visible
- ✅ Enter activates buttons
- ✅ Escape closes modals/dialogs
- ✅ All shortcuts work as documented

---

#### Test Case 8.3: Toast Notifications

**Objective**: Verify notification system

**Prerequisites**: 
- Application running

**Steps**:
1. Perform actions that trigger success notifications
2. Perform actions that trigger error notifications
3. Perform actions that trigger info notifications
4. Observe timing and positioning

**Expected Results**:
- ✅ Toasts appear for appropriate actions
- ✅ Success toasts styled correctly (color, icon)
- ✅ Error toasts styled correctly
- ✅ Toasts auto-dismiss after delay
- ✅ Toasts positioned consistently
- ✅ Multiple toasts stack properly

---

#### Test Case 8.4: Progress Indicators

**Objective**: Test loading and progress states

**Prerequisites**: 
- Application running

**Steps**:
1. Extract large PDF (observe progress bar)
2. Load large vault (observe loading states)
3. Generate many thumbnails (observe loading)
4. Perform other long operations

**Expected Results**:
- ✅ Progress bars show during operations
- ✅ Percentage/status updates
- ✅ Loading spinners appear appropriately
- ✅ UI indicates when operations complete
- ✅ User can identify what's loading

---

#### Test Case 8.5: Error Messages

**Objective**: Verify user-friendly error handling

**Prerequisites**: 
- Application running

**Steps**:
1. Trigger various errors (invalid files, permissions, etc.)
2. Read error messages
3. Verify recovery options

**Expected Results**:
- ✅ Error messages are user-friendly
- ✅ No technical jargon or stack traces shown to users
- ✅ Messages suggest solutions
- ✅ Errors logged to console/logs
- ✅ Application doesn't crash
- ✅ User can recover from errors

---

#### Test Case 8.6: Dialogs and Modals

**Objective**: Test all dialog interactions

**Prerequisites**: 
- Application running

**Steps**:
1. Open various dialogs (case creation, file rename, etc.)
2. Test Escape to close
3. Test clicking outside to close (if applicable)
4. Test confirmation buttons
5. Test cancellation

**Expected Results**:
- ✅ Dialogs open correctly
- ✅ Escape closes dialogs
- ✅ Click outside behavior correct
- ✅ Confirm buttons work
- ✅ Cancel buttons work
- ✅ Focus management correct
- ✅ Dialog content readable

---

#### Test Case 8.7: Theme and Styling

**Objective**: Verify visual consistency

**Prerequisites**: 
- Application running

**Steps**:
1. Review all screens and components
2. Check color consistency
3. Check font consistency
4. Check spacing and alignment
5. Verify cyberpunk theme applied

**Expected Results**:
- ✅ Colors consistent with theme
- ✅ Fonts consistent throughout
- ✅ Spacing uniform
- ✅ Elements aligned properly
- ✅ Theme elements (neon, etc.) present
- ✅ Visual hierarchy clear

---

#### Test Case 8.8: Animations and Transitions

**Objective**: Test UI animations

**Prerequisites**: 
- Application running

**Steps**:
1. Navigate between views
2. Open/close panels
3. Hover over interactive elements
4. Observe transitions

**Expected Results**:
- ✅ Animations smooth (60fps)
- ✅ Transitions not too slow or fast
- ✅ Hover states provide feedback
- ✅ No jarring or broken animations
- ✅ Animations enhance UX

---

### Performance Testing

#### Test Case 9.1: Large PDF Performance

**Objective**: Test performance with large PDFs

**Test Data**: 
- PDF with 500+ pages
- PDF >100MB

**Metrics to Record**:
- Extraction time
- Memory usage during extraction
- Application responsiveness
- UI lag or freezing

**Steps**:
1. Select large PDF
2. Monitor system resources
3. Extract PDF
4. Record metrics
5. Verify completion

**Expected Results**:
- ✅ Extraction completes successfully
- ✅ Memory usage <2GB
- ✅ Application remains responsive
- ✅ Progress updates smoothly
- ✅ No crashes or hangs

**Performance Benchmarks**:
- 100-page PDF: <2 minutes
- 500-page PDF: <10 minutes
- Memory overhead: <1GB beyond file size

---

#### Test Case 9.2: Many Files in Vault

**Objective**: Test vault performance with many files

**Test Data**: 
- Case with 100+ files
- Case with 500+ files

**Steps**:
1. Create case
2. Add many files
3. Navigate case
4. Search files
5. Generate thumbnails

**Expected Results**:
- ✅ Vault loads in <5 seconds
- ✅ Thumbnails generate progressively
- ✅ Scrolling remains smooth
- ✅ Search performs quickly
- ✅ No UI lag

---

#### Test Case 9.3: Thumbnail Generation Performance

**Objective**: Test thumbnail generation efficiency

**Test Data**: 
- 50 images of various sizes
- 10 PDFs
- 5 videos

**Steps**:
1. Add all files to case
2. Measure time to generate all thumbnails
3. Verify caching works
4. Reopen case and verify cached thumbnails load

**Expected Results**:
- ✅ Thumbnails generate in reasonable time
- ✅ Progress indicators show during generation
- ✅ Cached thumbnails load instantly
- ✅ No duplicate generation
- ✅ Memory usage reasonable

---

#### Test Case 9.4: Application Startup Time

**Objective**: Measure and verify startup performance

**Steps**:
1. Close application
2. Start timer
3. Launch application
4. Stop timer when fully loaded
5. Repeat 5 times and average

**Expected Results**:
- ✅ Average startup <5 seconds
- ✅ Consistent startup times
- ✅ No errors during startup
- ✅ Previous session state restores

---

#### Test Case 9.5: Memory Leak Testing

**Objective**: Verify no memory leaks during extended use

**Steps**:
1. Note baseline memory usage
2. Perform various operations for 30 minutes:
   - Extract PDFs
   - Navigate vault
   - Create/delete files
   - Open/close editor
3. Monitor memory usage
4. Return to idle state
5. Verify memory returns to baseline

**Expected Results**:
- ✅ Memory usage stabilizes
- ✅ No continuous memory growth
- ✅ Memory released after operations
- ✅ Idle memory usage reasonable (<500MB)

---

#### Test Case 9.6: Concurrent Operations

**Objective**: Test handling of simultaneous operations

**Steps**:
1. Start PDF extraction
2. While extracting, navigate vault
3. Open word editor
4. Search for files
5. Open file viewer

**Expected Results**:
- ✅ All operations work simultaneously
- ✅ No blocking or freezing
- ✅ Progress continues for extraction
- ✅ UI remains responsive
- ✅ No crashes or errors

---

### Build and Deployment Testing

#### Test Case 10.1: Development Build

**Objective**: Verify development build works correctly

**Steps**:
```bash
npm run electron:dev
```

**Expected Results**:
- ✅ Build completes without errors
- ✅ Application launches
- ✅ Hot reload works
- ✅ DevTools available
- ✅ All features functional

---

#### Test Case 10.2: Production Build

**Objective**: Verify production build

**Steps**:
```bash
npm run build:all
npm run electron:build
```

**Expected Results**:
- ✅ Build completes without errors
- ✅ Installer created in `release/` directory
- ✅ Installer size reasonable (<200MB)
- ✅ All source files bundled
- ✅ Dependencies included

---

#### Test Case 10.3: Installer Testing - Windows

**Objective**: Test Windows installer

**Prerequisites**: 
- Windows machine
- Production build created

**Steps**:
1. Run installer (.exe)
2. Follow installation wizard
3. Install to default location
4. Launch application
5. Verify all features work
6. Uninstall application

**Expected Results**:
- ✅ Installer runs without warnings (if signed)
- ✅ Installation completes successfully
- ✅ Start menu shortcut created
- ✅ Desktop shortcut created (if selected)
- ✅ Application launches
- ✅ All features functional
- ✅ Uninstall works completely

---

#### Test Case 10.4: Application Icon

**Objective**: Verify application icons display correctly

**Steps**:
1. Install application
2. Check taskbar icon
3. Check window title bar icon
4. Check Start menu icon (Windows)
5. Check Dock icon (macOS)
6. Check desktop shortcut icon

**Expected Results**:
- ✅ Icons display correctly at all sizes
- ✅ Icons not pixelated
- ✅ Icons match branding
- ✅ Icons visible on light/dark backgrounds

---

#### Test Case 10.5: Code Signing (If Applicable)

**Objective**: Verify code signing

**Prerequisites**: 
- Signed build

**Steps**:
1. Right-click installer
2. View properties/certificate
3. Run installer
4. Check for security warnings

**Expected Results**:
- ✅ Certificate valid
- ✅ Publisher name correct
- ✅ No security warnings
- ✅ Windows Defender doesn't flag
- ✅ Gatekeeper allows (macOS)

---

#### Test Case 10.6: Fresh Install Testing

**Objective**: Test clean installation

**Prerequisites**: 
- Machine without application installed
- All application data removed

**Steps**:
1. Install application
2. Launch for first time
3. Complete first-run setup
4. Create vault
5. Test all features

**Expected Results**:
- ✅ First run experience works
- ✅ Default settings applied
- ✅ Vault creation works
- ✅ No errors or crashes
- ✅ All features initialize correctly

---

#### Test Case 10.7: Update/Upgrade Testing

**Objective**: Test upgrading from previous version

**Prerequisites**: 
- Previous version installed
- User data present

**Steps**:
1. Note current version and data
2. Install new version
3. Launch application
4. Verify data preserved
5. Test features

**Expected Results**:
- ✅ Installation over previous version works
- ✅ User data preserved
- ✅ Settings migrated
- ✅ Vault accessible
- ✅ No data loss

---

#### Test Case 10.8: Cross-Platform Testing

**Objective**: Verify application works on all platforms

**Platforms to Test**:
- Windows 10/11
- macOS (latest)
- Linux (Ubuntu/Debian)

**Steps** (for each platform):
1. Build for platform
2. Install
3. Run full feature test suite
4. Note any platform-specific issues

**Expected Results**:
- ✅ Builds for all platforms
- ✅ All features work on all platforms
- ✅ UI renders correctly
- ✅ File operations work correctly
- ✅ Platform-specific features work (if any)

---

## Automated Testing

### Running Automated Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:coverage:ci
```

### Test Coverage Goals

- **Hooks**: >80% coverage
- **Utilities**: >80% coverage
- **Components**: >70% coverage
- **Integration**: >60% coverage

### Automated Test Verification

**Before Release**:
1. Run full test suite: `npm run test`
2. Verify all tests pass
3. Check coverage report: `npm run test:coverage`
4. Review coverage for critical paths
5. Address any failing tests
6. No skipped tests without justification

**Test Categories**:
- Unit tests for hooks (`usePDFExtraction`, `useArchive`, etc.)
- Component tests (rendering, user interaction)
- Integration tests (IPC handlers)
- Utility tests (path validation, error handling)

---

## Performance Testing

### Performance Benchmarks

| Operation | Target Time | Maximum Acceptable |
|-----------|-------------|-------------------|
| App Startup | <3 seconds | 5 seconds |
| Small PDF Extraction (10 pages) | <10 seconds | 30 seconds |
| Medium PDF Extraction (50 pages) | <30 seconds | 2 minutes |
| Large PDF Extraction (100 pages) | <2 minutes | 5 minutes |
| Vault Load (100 files) | <2 seconds | 5 seconds |
| Thumbnail Generation (per file) | <500ms | 2 seconds |
| Search (1000 files) | <1 second | 3 seconds |

### Memory Benchmarks

| Scenario | Target Memory | Maximum Acceptable |
|----------|---------------|-------------------|
| Idle | <300MB | 500MB |
| Small PDF Extraction | <500MB | 1GB |
| Large PDF Extraction | <1.5GB | 2.5GB |
| Vault with 500 files | <800MB | 1.5GB |

### Performance Testing Tools

- **Task Manager / Activity Monitor**: Monitor CPU and memory
- **Chrome DevTools** (in dev mode): Profile performance
- **Electron DevTools**: Memory profiling
- **Network Monitor**: Check IPC overhead

---

## Test Checklists

### Pre-Release Test Checklist

**Core Functionality**:
- [ ] PDF extraction (small, medium, large)
- [ ] Save to directory
- [ ] Save to ZIP
- [ ] Vault creation and access
- [ ] Case creation and management
- [ ] File upload (drag-drop and dialog)
- [ ] PDF extraction within vault
- [ ] Search functionality
- [ ] File viewer (images, PDFs, videos)
- [ ] Bookmarks (create, edit, delete, open)
- [ ] Word editor (create, edit, save, delete)
- [ ] Category tags (create, assign, filter)
- [ ] File management (rename, delete)
- [ ] Folder navigation

**UI/UX**:
- [ ] Welcome screen
- [ ] Progress indicators
- [ ] Toast notifications
- [ ] Error messages
- [ ] Dialogs and modals
- [ ] Keyboard shortcuts
- [ ] Responsive design
- [ ] Theme and styling

**Performance**:
- [ ] Startup time acceptable
- [ ] Large PDF handling
- [ ] Many files in vault
- [ ] Memory usage reasonable
- [ ] No memory leaks

**Build/Deployment**:
- [ ] Development build works
- [ ] Production build successful
- [ ] Installer created
- [ ] Application installs correctly
- [ ] Icons display correctly
- [ ] Uninstaller works

**Security**:
- [ ] Path validation works
- [ ] No console errors in production
- [ ] DevTools disabled in production
- [ ] Logs written correctly
- [ ] No sensitive data exposed

**Automated Tests**:
- [ ] All unit tests pass
- [ ] All component tests pass
- [ ] Coverage meets goals
- [ ] Linting passes

---

### Quick Smoke Test Checklist

**Use this for rapid verification after changes** (15-20 minutes):

- [ ] Application launches
- [ ] Extract a simple PDF (5 pages)
- [ ] Save extracted pages
- [ ] Access vault
- [ ] Create case
- [ ] Add file to case
- [ ] Extract PDF in vault
- [ ] Create bookmark
- [ ] Open bookmark
- [ ] Create text file in word editor
- [ ] Save text file
- [ ] Create category tag
- [ ] Assign tag to case
- [ ] Search for file
- [ ] Rename a file
- [ ] Delete a file
- [ ] No errors or crashes

---

### Regression Test Checklist

**Use after bug fixes or significant changes**:

- [ ] Re-run test case that originally found the bug
- [ ] Test related functionality
- [ ] Run automated test suite
- [ ] Verify fix doesn't break other features
- [ ] Test edge cases around the fix
- [ ] Update test documentation if needed

---

## Reporting Issues

### Bug Report Template

```markdown
## Bug Description
[Clear description of the issue]

## Steps to Reproduce
1. [First step]
2. [Second step]
3. [Additional steps...]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happened]

## Environment
- OS: [Windows 10/11, macOS version, Linux distro]
- Application Version: [e.g., 1.0.0-prerelease.4]
- Node.js Version: [if relevant]

## Screenshots/Logs
[Attach screenshots or relevant log excerpts]

## Additional Context
[Any other relevant information]

## Severity
- [ ] Critical (app crash, data loss)
- [ ] High (major feature broken)
- [ ] Medium (feature partially works)
- [ ] Low (minor issue, cosmetic)

## Test Case Reference
[Reference to test case that found this bug, if applicable]
```

### Where to Report

- **GitHub Issues**: For bugs and feature requests
- **Development Team**: For security issues (do not post publicly)
- **Testing Logs**: Document in testing log/spreadsheet

---

## Appendix

### A. Test Data Examples

**Sample PDF Files**:
- Simple Invoice (2 pages, 100KB)
- Technical Manual (50 pages, 5MB)
- Research Paper (20 pages, 2MB)
- Scanned Documents (100 pages, 50MB)

**Sample Images**:
- JPEG photo (3000x2000, 2MB)
- PNG diagram (1920x1080, 500KB)
- WebP image (2000x2000, 300KB)

**Sample Videos**:
- Short clip (10 seconds, 5MB)
- Longer video (2 minutes, 50MB)

### B. Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| Ctrl+S / Cmd+S | Save file |
| Ctrl+N / Cmd+N | New file |
| Ctrl+B / Cmd+B | Bold |
| Ctrl+I / Cmd+I | Italic |
| Ctrl+U / Cmd+U | Underline |
| Ctrl+Z / Cmd+Z | Undo |
| Ctrl+Shift+Z / Cmd+Shift+Z | Redo |
| +/= | Zoom in |
| - | Zoom out |
| 0 | Reset zoom |
| Arrow Keys | Navigate files/pages |
| Escape | Close viewer/dialog |
| Enter | Confirm action |

### C. File Locations Reference

**Windows**:
- Application Data: `%USERPROFILE%\AppData\Roaming\pdftract\`
- Logs: `%USERPROFILE%\AppData\Roaming\pdftract\logs\`

**macOS**:
- Application Data: `~/Library/Application Support/pdftract/`
- Logs: `~/Library/Logs/pdftract/`

**Linux**:
- Application Data: `~/.config/pdftract/`
- Logs: `~/.config/pdftract/logs/`

### D. Common Issues and Solutions

**Issue**: PDF extraction fails
- **Solution**: Check PDF is not password-protected or corrupted

**Issue**: Vault directory not accessible
- **Solution**: Verify write permissions, avoid system directories

**Issue**: Thumbnails not generating
- **Solution**: Check file types supported, verify Sharp library installed

**Issue**: Application won't start
- **Solution**: Check Node.js version (20.x required), clear application data

**Issue**: Tests failing
- **Solution**: Run `npm ci` to ensure dependencies correct, clear test cache

### E. Testing Best Practices

1. **Test in isolation**: Clear application data between major test runs
2. **Use fresh test data**: Don't reuse corrupted or modified test files
3. **Document everything**: Record all test results, even passes
4. **Test edge cases**: Don't just test happy path
5. **Verify error handling**: Intentionally cause errors to test handling
6. **Test on clean environment**: Test fresh installs, not just development builds
7. **Cross-platform testing**: Test on all supported platforms
8. **Performance awareness**: Note any slowdowns or performance issues
9. **Security mindset**: Think about potential vulnerabilities
10. **User perspective**: Test as a user would use the application

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-07 | Initial comprehensive testing procedures document |

---

**End of Testing Procedures Document**

For questions or suggestions about these testing procedures, contact the development team or submit an issue on GitHub.
