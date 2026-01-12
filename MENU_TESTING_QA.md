# The Vault - Menu Testing Q&A Documentation

**Version**: 1.0  
**Last Updated**: 2026-01-12  
**Application Version**: 1.0.0-prerelease.5

---

## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start Guide](#quick-start-guide)
3. [Menu Testing Q&A by Feature](#menu-testing-qa-by-feature)
   - [Welcome Screen Menu](#welcome-screen-menu)
   - [PDF Extraction Menu](#pdf-extraction-menu)
   - [Vault/Archive Menu](#vaultarchive-menu)
   - [Word Editor Menu](#word-editor-menu)
   - [Bookmark System Menu](#bookmark-system-menu)
   - [Settings Menu](#settings-menu)
   - [Security Checker Menu](#security-checker-menu)
4. [Common Menu Issues & Solutions](#common-menu-issues--solutions)
5. [Testing Progress Checklist](#testing-progress-checklist)
6. [Appendix](#appendix)

---

## Introduction

### Purpose

This document provides a Question & Answer (Q&A) format testing guide specifically focused on testing **all menu systems** in The Vault application. It's designed to make testing menus easy, efficient, and comprehensive.

**Who is this for?**
- QA Testers
- Developers performing self-testing
- Beta testers
- Anyone validating menu functionality

**What you'll find here:**
- Common questions about each menu and how to test them
- Step-by-step testing procedures for all menus
- Expected behaviors and results
- Troubleshooting tips
- Progress tracking checklists

### Document Organization

Each menu section follows this structure:
1. **Q&A Format**: Common questions about the menu with answers
2. **Testing Steps**: How to access and test the menu
3. **Expected Results**: What should happen when the menu works correctly
4. **Common Issues**: Known problems and solutions

---

## Quick Start Guide

### Before You Begin

**Prerequisites:**
- The Vault application installed and running
- Test data prepared (sample PDFs, images, videos, text files)
- Notepad or spreadsheet for tracking test results

**Quick Testing Setup (5 minutes):**

1. **Prepare Test Files:**
   - 1 small PDF (5-10 pages)
   - 1 medium PDF (20-50 pages)
   - 3-5 image files (JPEG/PNG)
   - 1 video file (MP4)

2. **Launch Application:**
   ```bash
   npm run electron:dev  # For development testing
   # OR launch the installed application
   ```

3. **Open This Document:**
   - Keep this document open while testing
   - Use the checklist sections to track progress

### How to Use This Document

**For Quick Testing:**
1. Jump to the menu section you want to test
2. Read the Q&A to understand the menu
3. Follow the testing steps
4. Check off items in the checklist

**For Comprehensive Testing:**
1. Start from the Welcome Screen Menu
2. Work through each menu section in order
3. Complete all test cases
4. Fill out the progress checklist

---

## Menu Testing Q&A by Feature

### Welcome Screen Menu

#### Overview
The Welcome Screen is the first thing users see when launching The Vault. It provides two main menu options.

---

#### Q1: What options are available on the Welcome Screen menu?

**A:** The Welcome Screen has two primary buttons:
1. **"Select file"** - Opens the PDF extraction workflow
2. **"The Vault"** - Opens the research organization system (Archive)

Additionally, there's an **Action Toolbar** in the top-right corner with:
- **Word Editor button** (FileText icon) - Opens the word editor
- **Settings button** (Gear icon) - Opens application settings

---

#### Q2: How do I test the "Select file" button?

**A:** Testing Steps:
1. Launch The Vault application
2. Observe the Welcome Screen
3. Click the **"Select file"** button

**Expected Results:**
- ✅ File dialog opens immediately
- ✅ Dialog shows PDF files by default (*.pdf filter)
- ✅ You can navigate to select a PDF file
- ✅ After selecting, PDF extraction begins automatically
- ✅ Progress screen appears with extraction status

**Common Issues:**
- *Dialog doesn't open:* Check if file dialog is hidden behind the window
- *Can't see PDFs:* Check file filter is set to "All Files" or "PDF Files"

---

#### Q3: How do I test "The Vault" button?

**A:** Testing Steps:
1. From the Welcome Screen, click **"The Vault"** button
2. First-time users will see a directory selection dialog
3. Returning users will be taken directly to their vault

**Expected Results:**
- ✅ First time: Directory selection dialog appears
- ✅ Can select any directory with write permissions
- ✅ Vault view opens showing cases or empty state
- ✅ Selected directory path is remembered for next session

**Common Issues:**
- *Access denied error:* Selected a protected directory (try user folder instead)
- *Vault doesn't remember location:* Check application permissions for storing settings

---

#### Q4: How do I test the Word Editor button from Welcome Screen?

**A:** Testing Steps:
1. From Welcome Screen, locate the **Word Editor icon** (FileText) in top-right
2. Click the Word Editor button

**Expected Results:**
- ✅ Word Editor dialog opens
- ✅ Dialog shows option to "Open in Main Window" or "Open in Detached Window"
- ✅ Can select either option
- ✅ Editor opens in selected mode
- ✅ New file is ready to edit

**Common Issues:**
- *Button not visible:* Check screen resolution; button may be off-screen on small displays
- *Dialog doesn't respond:* Try closing and reopening

---

#### Q5: How do I test the Settings button from Welcome Screen?

**A:** Testing Steps:
1. From Welcome Screen, click the **Settings icon** (Gear) in top-right
2. Observe the Settings panel

**Expected Results:**
- ✅ Settings panel slides in from the right
- ✅ Shows all setting sections (General, PDF Extraction, Vault, etc.)
- ✅ Can modify settings
- ✅ Changes save automatically
- ✅ Can close settings panel with X or Escape key

**Common Issues:**
- *Settings won't open:* Check console for errors
- *Settings don't save:* Verify write permissions for app data directory

---

#### Q6: What keyboard shortcuts work on Welcome Screen?

**A:** Welcome Screen Keyboard Shortcuts:
- **Escape** - Close any open dialogs
- **Tab** - Navigate between buttons
- **Enter** - Activate focused button

**Testing:**
1. Use Tab to focus on "Select file" button
2. Press Enter - should open file dialog
3. Press Escape to close dialog
4. Repeat for other buttons

---

### PDF Extraction Menu

#### Overview
The PDF Extraction menu appears after selecting a PDF file. It provides controls for extraction progress, save options, and file management.

---

#### Q7: What menu options appear during PDF extraction?

**A:** During extraction, you'll see:

**Top Navigation:**
- **Home button** (House icon) - Return to Welcome Screen
- **Settings button** - Open settings

**Bottom Toolbar (appears after extraction completes):**
- **Select Save Directory** - Choose where to save files
- **Save Parent File** (toggle) - Include original PDF
- **Save into Zip Folder** (toggle) - Package as ZIP
- **Save** (button) - Execute the save operation

---

#### Q8: How do I test the extraction progress display?

**A:** Testing Steps:
1. Select a medium-sized PDF (20-50 pages)
2. Observe the extraction process

**Expected Results:**
- ✅ Progress bar appears at the top
- ✅ Shows percentage (0% to 100%)
- ✅ Status message shows "Extracting page X of Y"
- ✅ Extracted pages appear in gallery as they're processed
- ✅ Progress updates smoothly without freezing

**Test with Different PDF Sizes:**
- Small (5 pages): Should complete in <10 seconds
- Medium (50 pages): Should complete in <30 seconds
- Large (100 pages): Should complete in <2 minutes

---

#### Q9: How do I test the "Select Save Directory" button?

**A:** Testing Steps:
1. Wait for extraction to complete
2. Click **"Select Save Directory"** button in the bottom toolbar

**Expected Results:**
- ✅ Directory selection dialog opens
- ✅ Can navigate to any directory
- ✅ Can create new folder in the dialog
- ✅ After selection, button text changes to "Change Directory"
- ✅ Selected path is shown or indicated in the UI

**Common Issues:**
- *Can't create folder in dialog:* Try selecting an existing folder first
- *Dialog frozen:* May need to click dialog window to activate it

---

#### Q10: How do I test the "Save Parent File" toggle?

**A:** Testing Steps:
1. After selecting save directory, locate **"Save Parent File"** toggle
2. Click to toggle on (should turn purple/highlighted)
3. Click again to toggle off (should turn gray)

**Expected Results:**
- ✅ Toggle changes visual state (color and fill)
- ✅ ON state: Purple background, filled circle
- ✅ OFF state: Gray background, empty circle
- ✅ Save button reflects the selection
- ✅ When saved, original PDF is/isn't included based on toggle

**Testing Save with Toggle ON:**
1. Enable "Save Parent File"
2. Click Save
3. Check saved directory - original PDF should be present

**Testing Save with Toggle OFF:**
1. Disable "Save Parent File"
2. Click Save
3. Check saved directory - only PNG files, no original PDF

---

#### Q11: How do I test the "Save into Zip Folder" toggle?

**A:** Testing Steps:
1. Locate **"Save into Zip Folder"** toggle
2. Toggle it on and off

**Expected Results:**
- ✅ Toggle visual state changes (purple ON, gray OFF)
- ✅ When ON, clicking Save prompts for folder name
- ✅ When OFF, clicking Save saves directly to directory

**Testing ZIP Save:**
1. Enable "Save into Zip Folder"
2. Enable or disable "Save Parent File" as desired
3. Click **Save** button
4. Folder name dialog should appear
5. Enter name "test-extraction"
6. Confirm
7. Check save directory:
   - ✅ ZIP file created with entered name
   - ✅ ZIP contains all PNG pages
   - ✅ ZIP contains PDF if "Save Parent File" was ON
   - ✅ ZIP file can be extracted successfully

---

#### Q12: How do I test the Save button states?

**A:** The Save button has different states to test:

**State 1: Disabled (No Directory Selected)**
1. Start extraction
2. Wait for completion
3. Don't select a save directory
4. Observe Save button

**Expected Results:**
- ✅ Save button is grayed out
- ✅ Save button cannot be clicked
- ✅ Cursor shows "not-allowed" on hover

**State 2: Disabled (No Save Options Selected)**
1. Select a save directory
2. Disable both "Save Parent File" and "Save into Zip Folder"
3. Observe Save button

**Expected Results:**
- ✅ Save button is grayed out
- ✅ Save button cannot be clicked

**State 3: Enabled (Ready to Save)**
1. Select a save directory
2. Enable at least one save option
3. Observe Save button

**Expected Results:**
- ✅ Save button is colorful (purple gradient)
- ✅ Save button can be clicked
- ✅ Hover shows scale animation
- ✅ Clicking saves files successfully

---

#### Q13: How do I test the gallery viewer during extraction?

**A:** Testing Steps:
1. Select a PDF with at least 10 pages
2. Watch as extraction progresses

**Expected Results:**
- ✅ Gallery grid appears below the toolbar
- ✅ Pages appear one by one as they're extracted
- ✅ Each thumbnail shows the page number
- ✅ Thumbnails are clear and readable
- ✅ Can scroll through gallery smoothly
- ✅ Clicking a thumbnail opens the full-size viewer

---

#### Q14: How do I test the Home button during extraction?

**A:** Testing Steps:
1. Start PDF extraction
2. During extraction, click the **Home** button (top-left)

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Dialog warns about losing extraction progress
- ✅ Clicking "Confirm" returns to Welcome Screen
- ✅ Clicking "Cancel" stays on extraction page
- ✅ Extraction data is lost if confirmed

---

### Vault/Archive Menu

#### Overview
The Vault (Archive) menu system is the most complex, providing case management, file organization, and advanced features.

---

#### Q15: What are the main menu options on the Vault page?

**A:** The Vault page has several menu areas:

**Top Bar:**
- **Home button** - Return to Welcome Screen
- **Search bar** - Search for cases and files
- **Category tag filter** - Filter by tags
- **Word Editor button** - Open word editor
- **Settings button** - Open settings

**Main Content Area:**
- **Start Case File** button (when no cases exist)
- **New Case** button (when cases exist)
- Case folders (clickable to open)
- File/folder items with context menus

**File/Folder Context Menus:**
- Rename (pencil icon)
- Delete (trash icon)
- PDF extraction (for PDF files)
- Tag assignment

---

#### Q16: How do I test creating a new case from the menu?

**A:** Testing Steps:
1. Navigate to The Vault
2. Click **"Start Case File"** (first time) or **"New Case"** button

**Expected Results:**
- ✅ Dialog appears prompting for case name
- ✅ Input field accepts text
- ✅ Can type case name (e.g., "Test Case 2024")
- ✅ Invalid characters are rejected/sanitized
- ✅ Empty names are rejected
- ✅ Clicking "Create" creates the case folder
- ✅ New case appears in the vault list
- ✅ Success toast notification shows

**Testing Invalid Inputs:**
- Try special characters: `< > : " / \ | ? *`
- Try empty name
- Try very long name (>255 characters)

Expected: App should handle gracefully, show error messages

---

#### Q17: How do I test the search bar menu?

**A:** Testing Steps:

**Setup:**
1. Create 3-5 cases with different names
2. Add files to each case
3. Locate the search bar at the top

**Test Search:**
1. Click in the search bar
2. Type part of a case name (e.g., "Test")

**Expected Results:**
- ✅ Results filter in real-time as you type
- ✅ Matching cases appear
- ✅ Non-matching cases are hidden
- ✅ Clearing search restores all cases
- ✅ Search is case-insensitive (verify expected behavior)

**Test File Search:**
1. Navigate into a case with multiple files
2. Use search bar to search for file names

**Expected Results:**
- ✅ Files filter based on search term
- ✅ Search works across file names
- ✅ Updates in real-time

---

#### Q18: How do I test the category tag filter menu?

**A:** Testing Steps:

**Setup:**
1. Create category tags (Settings > Category Tags)
2. Assign tags to different cases
3. Return to vault main view

**Test Filter:**
1. Locate the tag filter dropdown/menu
2. Click to open tag selection
3. Select a specific tag

**Expected Results:**
- ✅ Tag filter menu opens
- ✅ Shows all available tags with colors
- ✅ Selecting a tag filters the view
- ✅ Only cases with that tag are shown
- ✅ Tag count indicator shows number of filtered items
- ✅ Clearing filter shows all cases again

**Test Multiple Tags:**
1. Apply one tag filter
2. Note filtered results
3. Change to a different tag
4. Verify results update

---

#### Q19: How do I test file context menus (rename, delete)?

**A:** Testing Steps:

**Test Rename Menu:**
1. Navigate to a case with files
2. Hover over a file
3. Click the **Pencil icon** (rename)

**Expected Results:**
- ✅ Rename icon appears on hover
- ✅ Clicking opens inline edit field
- ✅ Current name is pre-filled and selected
- ✅ Can type new name
- ✅ Press Enter or click ✓ to confirm
- ✅ Press Escape or click ✗ to cancel
- ✅ File renames successfully
- ✅ Success toast appears

**Test Delete Menu:**
1. Hover over a file
2. Click the **Trash icon** (delete)

**Expected Results:**
- ✅ Delete icon appears on hover
- ✅ Clicking opens confirmation dialog
- ✅ Dialog warns about permanent deletion
- ✅ "Confirm" button deletes the file
- ✅ "Cancel" button aborts deletion
- ✅ File is removed from view
- ✅ File is deleted from disk
- ✅ Success toast appears

---

#### Q20: How do I test the PDF extraction menu from within a case?

**A:** Testing Steps:
1. Add a PDF file to a case
2. Click on the PDF file
3. Locate the **PDF extraction button/dropdown**

**Expected Results:**
- ✅ PDF extraction option is visible
- ✅ Clicking opens extraction settings dialog
- ✅ Dialog prompts for extraction folder name
- ✅ Option to "Save Parent File" is present
- ✅ Can confirm to start extraction

**Test Extraction:**
1. Enter folder name "Extracted-Pages"
2. Toggle "Save Parent File" ON
3. Click "Extract" or "Confirm"

**Expected Results:**
- ✅ Extraction begins
- ✅ Progress indicator shows
- ✅ New folder created in case: "Extracted-Pages"
- ✅ Folder contains PNG files (page-1.png, page-2.png, etc.)
- ✅ Original PDF included if toggle was ON
- ✅ `.parent-pdf` metadata file created
- ✅ Success toast appears

---

#### Q21: How do I test folder navigation menus?

**A:** Testing Steps:

**Setup:**
1. Create a case
2. Add files to the case
3. Create extraction folders (nest some folders)

**Test Breadcrumb Navigation:**
1. Click into a case - breadcrumb shows: `Vault > Case Name`
2. Click into a folder - breadcrumb shows: `Vault > Case Name > Folder Name`
3. Click on "Case Name" in breadcrumb

**Expected Results:**
- ✅ Breadcrumb updates with each navigation
- ✅ Clicking breadcrumb item navigates to that level
- ✅ Current location is highlighted in breadcrumb
- ✅ Can navigate back multiple levels

**Test Back Button:**
1. Navigate deep into folders
2. Click the **Back** or **Up** button

**Expected Results:**
- ✅ Button navigates to parent folder
- ✅ Breadcrumb updates accordingly
- ✅ Files from parent folder display

---

#### Q22: How do I test the "Add Files" menu option?

**A:** Testing Steps:
1. Open a case
2. Click **"Add Files"** button

**Expected Results:**
- ✅ File selection dialog opens
- ✅ Can select multiple files
- ✅ Can select different file types (PDF, images, videos, etc.)
- ✅ Selected files copy to case folder
- ✅ Files appear in case view
- ✅ Thumbnails generate for files
- ✅ Success toast shows number of files added

**Test Drag and Drop (Alternative):**
1. Open file explorer with test files
2. Drag files to vault window
3. Drop files in the case area

**Expected Results:**
- ✅ Drop zone highlights when dragging over
- ✅ Files copy on drop
- ✅ Files appear in vault
- ✅ Same results as "Add Files" button

---

### Word Editor Menu

#### Overview
The Word Editor has its own toolbar with formatting and file management options. It can be opened in the main window or a detached window.

---

#### Q23: How do I access the Word Editor menu?

**A:** There are multiple ways to access the Word Editor:

**Method 1: From Welcome Screen**
1. Click **Word Editor icon** (FileText) in top-right
2. Choose "Open in Main Window" or "Open in Detached Window"

**Method 2: From Vault**
1. While viewing the vault, click **Word Editor icon** in top-right
2. Choose window mode

**Method 3: From Settings**
1. Open Settings
2. Navigate to Word Editor section
3. Click "Open Word Editor"

---

#### Q24: What menu options are in the Word Editor toolbar?

**A:** The Word Editor toolbar contains:

**File Operations:**
- **New File** button (or Ctrl+N / Cmd+N)
- **Save** button (or Ctrl+S / Cmd+S)
- **Text Library** button - Browse saved files
- **Delete** button - Delete current file
- **Export** button - Export to TXT format

**Formatting Tools:**
- **Bold** (B button or Ctrl+B / Cmd+B)
- **Italic** (I button or Ctrl+I / Cmd+I)
- **Underline** (U button or Ctrl+U / Cmd+U)
- **Font Size** dropdown (8pt to 72pt)
- **Text Alignment** buttons (left, center, right, justify)

**Window Controls:**
- **Detach/Reattach** button - Move editor to separate window or back

---

#### Q25: How do I test the New File menu option?

**A:** Testing Steps:
1. Open Word Editor
2. Type some content in the editor
3. Click **"New File"** button (or Ctrl+N / Cmd+N)

**Expected Results:**
- ✅ If current file has unsaved changes, warning dialog appears
- ✅ Dialog offers "Save", "Discard", "Cancel" options
- ✅ Choosing "Save" saves and creates new file
- ✅ Choosing "Discard" discards changes and creates new file
- ✅ Choosing "Cancel" returns to current file
- ✅ New file has empty editor
- ✅ Cursor is active and ready to type

---

#### Q26: How do I test the Save menu option?

**A:** Testing Steps:

**Test New File Save:**
1. Create new file (Ctrl+N / Cmd+N)
2. Type content: "This is a test document."
3. Click **Save** button (or Ctrl+S / Cmd+S)

**Expected Results:**
- ✅ Save dialog appears prompting for filename
- ✅ Input field accepts filename
- ✅ Can enter name "Test Document 1"
- ✅ Clicking "Confirm" saves the file
- ✅ Success toast appears
- ✅ File is saved to vault's text files directory

**Test Existing File Save:**
1. Open an existing file from Text Library
2. Make modifications
3. Click Save (Ctrl+S / Cmd+S)

**Expected Results:**
- ✅ File saves immediately (no dialog needed)
- ✅ Success toast appears
- ✅ Changes persist after closing/reopening

---

#### Q27: How do I test the Text Library menu?

**A:** Testing Steps:

**Setup:**
1. Create 3-5 text files with different names
2. Click **"Text Library"** button in Word Editor

**Expected Results:**
- ✅ Library modal/panel opens
- ✅ All saved text files are listed
- ✅ Each file shows name and metadata (date, size)
- ✅ Clicking a file opens it in the editor
- ✅ Current file is highlighted/indicated
- ✅ Can close library with X or Escape

**Test Search in Library (if available):**
1. If library has search, type partial filename
2. Verify filtering works

---

#### Q28: How do I test text formatting menu options?

**A:** Testing Steps:

**Test Bold:**
1. Type text: "This is bold text"
2. Select "bold text"
3. Click **B** button (or Ctrl+B / Cmd+B)

**Expected Results:**
- ✅ Selected text becomes bold
- ✅ Bold button highlights/activates
- ✅ Clicking again removes bold
- ✅ Keyboard shortcut works

**Test Italic:**
1. Type and select text
2. Click **I** button (or Ctrl+I / Cmd+I)

**Expected Results:**
- ✅ Text becomes italic
- ✅ Button highlights
- ✅ Toggle works

**Test Underline:**
1. Type and select text
2. Click **U** button (or Ctrl+U / Cmd+U)

**Expected Results:**
- ✅ Text becomes underlined
- ✅ Button highlights
- ✅ Toggle works

**Test Combined Formatting:**
1. Select text
2. Apply Bold, Italic, and Underline together

**Expected Results:**
- ✅ All three formats apply simultaneously
- ✅ All three buttons highlight
- ✅ Text displays with all formats

---

#### Q29: How do I test the Font Size menu?

**A:** Testing Steps:
1. Type some text in the editor
2. Select the text
3. Click **Font Size** dropdown

**Expected Results:**
- ✅ Dropdown opens showing sizes: 8pt to 72pt
- ✅ Current size is highlighted
- ✅ Clicking a size applies it to selected text
- ✅ Text resizes immediately
- ✅ Dropdown closes after selection

**Test Multiple Sizes:**
1. Apply different sizes to different parts of text
2. Verify each section has correct size
3. Save and reopen - verify sizes persist

---

#### Q30: How do I test text alignment menu options?

**A:** Testing Steps:
1. Type several lines of text
2. Select text or place cursor in paragraph

**Test Left Align:**
1. Click **Left Align** button

**Expected Results:**
- ✅ Text aligns to left margin
- ✅ Button highlights/activates

**Test Center Align:**
1. Click **Center** button

**Expected Results:**
- ✅ Text centers in editor
- ✅ Center button highlights

**Test Right Align:**
1. Click **Right** button

**Expected Results:**
- ✅ Text aligns to right margin
- ✅ Right button highlights

**Test Justify:**
1. Type a longer paragraph
2. Click **Justify** button

**Expected Results:**
- ✅ Text spreads to both margins
- ✅ Justify button highlights

---

#### Q31: How do I test the Delete File menu option?

**A:** Testing Steps:
1. Open a text file from library
2. Click **"Delete"** button

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Dialog warns about permanent deletion
- ✅ Shows filename being deleted
- ✅ "Confirm" button deletes the file
- ✅ "Cancel" button aborts deletion
- ✅ If confirmed, file removed from library
- ✅ Editor clears or loads different file
- ✅ Success toast appears

---

#### Q32: How do I test the Export menu option?

**A:** Testing Steps:
1. Open or create a text file with formatted content
2. Click **"Export"** button

**Expected Results:**
- ✅ Export dialog appears
- ✅ Shows available formats (TXT initially, PDF/DOCX/RTF planned)
- ✅ Can select TXT format
- ✅ Click "Export" opens save dialog
- ✅ Can choose save location
- ✅ File exports successfully
- ✅ Exported file contains correct content
- ✅ Formatting is preserved where possible (TXT is plain text)
- ✅ Success toast appears

---

#### Q33: How do I test the Detach/Reattach menu?

**A:** Testing Steps:

**Test Detach:**
1. Open Word Editor in main window
2. Click **"Detach"** button

**Expected Results:**
- ✅ New window opens
- ✅ Editor content transfers to new window
- ✅ Toolbar transfers to new window
- ✅ All functionality works in detached window
- ✅ Can edit, save, format text
- ✅ Main window remains accessible

**Test Reattach:**
1. In detached editor window, click **"Reattach"** button

**Expected Results:**
- ✅ Editor returns to main window
- ✅ Content preserved during reattach
- ✅ Detached window closes
- ✅ Editor functional in main window

**Test Cross-Window Functionality:**
1. Detach editor
2. Create bookmark from detached window (if available)

**Expected Results:**
- ✅ Bookmark opens in main window
- ✅ Both windows remain functional

---

#### Q34: How do I test auto-save and unsaved changes detection?

**A:** Testing Steps:

**Test Auto-Save:**
1. Create new file
2. Type content
3. Wait 5 seconds without saving
4. Close editor without saving
5. Reopen editor

**Expected Results:**
- ✅ Draft auto-saves to localStorage
- ✅ Draft recovers when reopening
- ✅ Debouncing prevents saving on every keystroke

**Test Unsaved Changes Warning:**
1. Open existing file
2. Make changes
3. Click "New File" without saving

**Expected Results:**
- ✅ Warning dialog appears
- ✅ Offers "Save", "Discard", "Cancel"
- ✅ Each option works correctly

---

### Bookmark System Menu

#### Overview
The Bookmark System allows creating and managing bookmarks for PDF pages. The menu is accessible from PDF viewers and a dedicated library.

---

#### Q35: How do I access the Bookmark menu?

**A:** Access methods:

**Method 1: From PDF Viewer**
1. Open a PDF file in vault
2. Navigate to a specific page
3. Click **Bookmark icon** in the viewer

**Method 2: From Bookmark Library**
1. Click **Bookmark Library icon** (usually in toolbar)
2. Library opens showing all bookmarks

---

#### Q36: How do I test creating a bookmark?

**A:** Testing Steps:
1. Open a PDF in vault viewer
2. Navigate to page 5 (or any specific page)
3. Click **"Bookmark"** button or icon

**Expected Results:**
- ✅ Bookmark creation dialog appears
- ✅ Thumbnail auto-generates from current page
- ✅ Input fields for:
  - Name (required)
  - Description (optional)
  - Notes (optional)
  - Tags (optional)
- ✅ Can enter bookmark details
- ✅ Clicking "Save" creates the bookmark
- ✅ Page shows bookmark indicator
- ✅ Success toast appears

**Test Bookmark Details:**
1. Name: "Important Finding"
2. Description: "Key evidence on page 5"
3. Notes: "Review with team"
4. Tags: "evidence, critical"
5. Save

Verify all details are stored correctly.

---

#### Q37: How do I test the Bookmark Library menu?

**A:** Testing Steps:

**Setup:**
1. Create 5-10 bookmarks on different PDF pages
2. Click **Bookmark Library** icon

**Expected Results:**
- ✅ Library modal/panel opens
- ✅ All bookmarks displayed as cards or list
- ✅ Each bookmark shows:
  - Thumbnail image
  - Name
  - Description
  - Tags
- ✅ Can scroll through bookmarks
- ✅ Layout is organized and readable

**Test Library Actions:**
1. Hover over a bookmark card

**Expected Results:**
- ✅ Action buttons appear (Open, Edit, Delete)
- ✅ Buttons are clearly labeled
- ✅ Icons are intuitive

---

#### Q38: How do I test opening a bookmark?

**A:** Testing Steps:
1. Open Bookmark Library
2. Locate a specific bookmark
3. Click **"Open"** button

**Expected Results:**
- ✅ PDF opens in viewer
- ✅ Navigates to exact bookmarked page
- ✅ Page matches bookmark thumbnail
- ✅ Bookmark indicator visible on page
- ✅ Viewer is fully functional

**Test from Different Locations:**
1. Open bookmark from main window
2. Open bookmark from vault view
3. If detached editor exists, try opening from there

All should navigate to correct page.

---

#### Q39: How do I test bookmark folders menu?

**A:** Testing Steps:

**Create Folder:**
1. In Bookmark Library, click **"Create Folder"** or similar
2. Enter folder name "Critical Evidence"
3. Confirm

**Expected Results:**
- ✅ Folder creation dialog appears
- ✅ Can enter folder name
- ✅ Folder appears in library
- ✅ Folder is distinguishable from bookmarks (folder icon)

**Organize Bookmarks:**
1. Drag a bookmark to the folder (or use move menu)
2. Verify bookmark moves into folder
3. Click folder to open
4. Verify bookmark is inside

**Expected Results:**
- ✅ Move operation works (drag-drop or menu)
- ✅ Bookmark appears in folder
- ✅ Bookmark removed from previous location
- ✅ Folder structure maintained

---

#### Q40: How do I test editing a bookmark?

**A:** Testing Steps:
1. Open Bookmark Library
2. Locate a bookmark
3. Click **"Edit"** button or icon

**Expected Results:**
- ✅ Edit dialog opens
- ✅ Current bookmark data pre-filled
- ✅ Can modify name, description, notes, tags
- ✅ Clicking "Save" updates the bookmark
- ✅ Changes reflect immediately in library
- ✅ Success toast appears

---

#### Q41: How do I test deleting a bookmark?

**A:** Testing Steps:
1. Open Bookmark Library
2. Locate a bookmark to delete
3. Click **"Delete"** button

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Dialog shows bookmark name
- ✅ Warns about permanent deletion
- ✅ "Confirm" deletes the bookmark
- ✅ "Cancel" aborts deletion
- ✅ Bookmark removed from library
- ✅ Page indicator removed from PDF
- ✅ Success toast appears

---

### Settings Menu

#### Overview
The Settings menu provides access to application configuration. It's organized into sections for different feature areas.

---

#### Q42: How do I access the Settings menu?

**A:** Access methods:
1. Click **Settings icon** (Gear) in top-right of any view
2. Keyboard shortcut (if available)
3. Settings panel slides in from right

---

#### Q43: What sections are available in the Settings menu?

**A:** Settings sections:

**General Settings:**
- Application theme (if applicable)
- Language preferences
- Default save locations

**PDF Extraction Settings:**
- Default extraction quality
- Auto-save preferences
- Default folder naming

**Vault Settings:**
- Default vault location
- Thumbnail cache settings
- File organization preferences

**Word Editor Settings:**
- Default font and size
- Auto-save interval
- Editor preferences

**Category Tags:**
- Create/manage tags
- Tag color customization

**Advanced Settings:**
- Performance tuning
- Debug options
- Cache management

---

#### Q44: How do I test creating category tags in Settings?

**A:** Testing Steps:
1. Open Settings
2. Navigate to **"Category Tags"** section
3. Click **"Create Tag"** or **"New Tag"**

**Expected Results:**
- ✅ Tag creation form appears
- ✅ Input field for tag name
- ✅ Color picker for tag color
- ✅ Can enter name (e.g., "Evidence")
- ✅ Can select color (e.g., red)
- ✅ Clicking "Create" saves the tag
- ✅ Tag appears in tags list
- ✅ Success toast appears

**Test Tag Usage:**
1. Create tag in Settings
2. Go to Vault
3. Assign tag to a case
4. Verify tag appears with correct color

---

#### Q45: How do I test changing vault location in Settings?

**A:** Testing Steps:
1. Open Settings
2. Navigate to **"Vault Settings"**
3. Click **"Change Vault Location"** or similar

**Expected Results:**
- ✅ Directory selection dialog appears
- ✅ Can select new directory
- ✅ Warning appears about moving data (if applicable)
- ✅ Confirmation required for change
- ✅ Vault location updates
- ✅ Setting persists after restart

**Important:** Test with caution; may affect existing data.

---

#### Q46: How do I test Settings persistence?

**A:** Testing Steps:
1. Open Settings
2. Change several settings:
   - Toggle an option
   - Select a different default
   - Modify a preference
3. Close Settings
4. Restart application
5. Reopen Settings

**Expected Results:**
- ✅ All changed settings persist
- ✅ Settings match what was set previously
- ✅ No settings reverted to defaults

---

### Security Checker Menu

#### Overview
The Security Checker (PDF Audit) menu provides PDF security analysis tools.

---

#### Q47: How do I access the Security Checker menu?

**A:** Access methods:

**Method 1: From Menu**
1. Look for **"PDF Audit"** or **"Security Checker"** option in menus
2. Click to open

**Method 2: From Vault**
1. Right-click a PDF file in vault (if context menu available)
2. Select "Security Audit" or similar

**Method 3: Keyboard Shortcut** (if available)

---

#### Q48: What options are in the Security Checker menu?

**A:** Security Checker menu options:

**File Selection:**
- **Select PDF** - Choose PDF to audit
- **Recent Files** - Quick access to recently audited PDFs

**Audit Options:**
- **Run Full Audit** - Comprehensive security check
- **Quick Scan** - Basic security review

**Results:**
- **View Report** - See audit findings
- **Export Report** - Save report to file
- **Print Report** - Print audit results

**Window Controls:**
- **Detach** - Open in separate window
- **Close** - Close the security checker

---

#### Q49: How do I test running a security audit?

**A:** Testing Steps:
1. Open Security Checker
2. Click **"Select PDF"** or similar
3. Choose a test PDF file
4. Click **"Run Audit"** or **"Scan"**

**Expected Results:**
- ✅ PDF loads successfully
- ✅ Audit begins with progress indicator
- ✅ Progress shows scan status
- ✅ Audit completes
- ✅ Report displays findings
- ✅ Report is detailed and organized
- ✅ Findings categorized (Critical, Warning, Info)

---

#### Q50: How do I test exporting a security report?

**A:** Testing Steps:
1. Run a security audit (see Q49)
2. Wait for audit to complete
3. Click **"Export Report"** button

**Expected Results:**
- ✅ Export options appear (format selection)
- ✅ Can choose format (PDF, TXT, etc.)
- ✅ Save dialog appears
- ✅ Can choose save location
- ✅ File exports successfully
- ✅ Exported report contains all findings
- ✅ Report is well-formatted
- ✅ Success toast appears

---

#### Q51: How do I test the detached Security Checker?

**A:** Testing Steps:
1. Open Security Checker
2. Click **"Detach"** button

**Expected Results:**
- ✅ New window opens
- ✅ Security Checker transfers to new window
- ✅ All functionality works in detached mode
- ✅ Can run audits in detached window
- ✅ Main window remains accessible

**Test Reattach:**
1. In detached window, click **"Reattach"**

**Expected Results:**
- ✅ Security Checker returns to main window
- ✅ Detached window closes
- ✅ Current audit state preserved

---

## Common Menu Issues & Solutions

### Issue 1: Menu Button Not Visible

**Symptoms:**
- Can't find a specific menu button
- Button seems to be missing

**Solutions:**
1. **Check Screen Resolution:** Resize window if on small screen
2. **Scroll:** Some menus may require scrolling to see all options
3. **Check Context:** Some buttons only appear in specific contexts
4. **Refresh:** Try closing and reopening the view

---

### Issue 2: Menu Click Not Responding

**Symptoms:**
- Clicking menu button does nothing
- No response or error message

**Solutions:**
1. **Wait a Moment:** Button may be disabled temporarily
2. **Check Hover State:** Ensure button is actually clickable (cursor changes)
3. **Console Errors:** Open dev tools (F12) and check for errors
4. **Restart App:** Close and relaunch application

---

### Issue 3: Menu Dialog Not Opening

**Symptoms:**
- Click button but dialog doesn't appear
- Dialog seems stuck or frozen

**Solutions:**
1. **Check Behind Window:** Dialog may be behind main window
2. **Press Escape:** Close any open dialogs that might be blocking
3. **Check Permissions:** App may not have permission for certain dialogs
4. **Task Manager:** Check if dialog window is in task manager

---

### Issue 4: Menu Options Greyed Out

**Symptoms:**
- Menu buttons are visible but disabled
- Can't click certain options

**Solutions:**
1. **Check Prerequisites:** Ensure required conditions are met
   - Example: Can't save without selecting directory
2. **Check Selection:** Some options require file/folder selection
3. **Check State:** App may be in a state that disables certain actions
4. **Read Tooltips:** Hover over button to see why it's disabled

---

### Issue 5: Menu Shortcuts Not Working

**Symptoms:**
- Keyboard shortcuts (Ctrl+S, etc.) don't work
- Have to use mouse instead

**Solutions:**
1. **Focus:** Ensure correct area has focus (click in editor first)
2. **OS Shortcuts:** System shortcuts may override app shortcuts
3. **Check Documentation:** Verify correct shortcut (Ctrl vs Cmd on Mac)
4. **Restart App:** Shortcuts may work after restart

---

### Issue 6: Save Menu Not Persisting Changes

**Symptoms:**
- Settings don't save
- Changes lost after restart

**Solutions:**
1. **Permissions:** Check app has write permissions
2. **Wait for Save:** Allow time for auto-save to complete
3. **Manual Save:** Use explicit save button/option
4. **Check Logs:** Look for save errors in application logs

---

### Issue 7: Context Menu Not Appearing

**Symptoms:**
- Right-click doesn't show menu
- Hover actions don't appear

**Solutions:**
1. **Slow Hover:** Hover longer to trigger menu
2. **Click Item:** Some menus appear on left-click, not right-click
3. **Check Item Type:** Not all items have context menus
4. **Look for Icons:** Menus may appear as icons on hover

---

## Testing Progress Checklist

### Daily Testing Checklist

Use this checklist for daily testing sessions (15-20 minutes):

**Date: ____________**

**Quick Smoke Test:**
- [ ] Application launches successfully
- [ ] Welcome Screen displays correctly
- [ ] Can access main menus (PDF Extraction, Vault, Settings)
- [ ] Basic file operations work (open, save)
- [ ] No console errors on startup

**Core Menu Tests:**
- [ ] Welcome Screen menu buttons responsive
- [ ] Settings menu opens and closes
- [ ] Word Editor menu accessible
- [ ] Vault navigation menus work
- [ ] All toolbar menus functional

**Issues Found:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

### Weekly Testing Checklist

Use this for comprehensive weekly testing (1-2 hours):

**Week of: ____________**

**Welcome Screen Menu (Q1-Q6)**
- [ ] "Select file" button works
- [ ] "The Vault" button works
- [ ] Word Editor button from Welcome Screen
- [ ] Settings button from Welcome Screen
- [ ] Keyboard navigation works
- [ ] All welcome screen menu items tested

**PDF Extraction Menu (Q7-Q14)**
- [ ] Extraction progress displays correctly
- [ ] "Select Save Directory" button works
- [ ] "Save Parent File" toggle works
- [ ] "Save into Zip Folder" toggle works
- [ ] Save button states correct (enabled/disabled)
- [ ] Gallery viewer works during extraction
- [ ] Home button works during extraction
- [ ] All extraction menu items tested

**Vault/Archive Menu (Q15-Q22)**
- [ ] Case creation menu works
- [ ] Search bar menu functional
- [ ] Category tag filter menu works
- [ ] File context menus (rename, delete) work
- [ ] PDF extraction from vault works
- [ ] Folder navigation menus functional
- [ ] "Add Files" menu option works
- [ ] All vault menu items tested

**Word Editor Menu (Q23-Q34)**
- [ ] Word Editor accessible from all locations
- [ ] New File menu option works
- [ ] Save menu option works
- [ ] Text Library menu works
- [ ] All formatting menu options work (bold, italic, underline)
- [ ] Font size menu works
- [ ] Text alignment menu works
- [ ] Delete file menu works
- [ ] Export menu works
- [ ] Detach/Reattach menu works
- [ ] All word editor menu items tested

**Bookmark System Menu (Q35-Q41)**
- [ ] Bookmark menu accessible from PDF viewer
- [ ] Create bookmark works
- [ ] Bookmark Library menu works
- [ ] Open bookmark works
- [ ] Bookmark folders menu works
- [ ] Edit bookmark works
- [ ] Delete bookmark works
- [ ] All bookmark menu items tested

**Settings Menu (Q42-Q46)**
- [ ] Settings menu opens from all views
- [ ] All settings sections accessible
- [ ] Category tag creation in Settings works
- [ ] Vault location change works
- [ ] Settings persistence verified
- [ ] All settings menu items tested

**Security Checker Menu (Q47-Q51)**
- [ ] Security Checker menu accessible
- [ ] Security audit runs successfully
- [ ] Export report works
- [ ] Detached Security Checker works
- [ ] All security checker menu items tested

**Issues Found:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

### Pre-Release Testing Checklist

Use this before any release (4-6 hours comprehensive testing):

**Version: ____________**  
**Date: ____________**  
**Tester: ____________**

#### All Menus Tested

**Welcome Screen Menu - Complete**
- [ ] Q1: Welcome Screen options identified
- [ ] Q2: "Select file" button tested
- [ ] Q3: "The Vault" button tested
- [ ] Q4: Word Editor button tested
- [ ] Q5: Settings button tested
- [ ] Q6: Keyboard shortcuts tested

**PDF Extraction Menu - Complete**
- [ ] Q7: Extraction menu options identified
- [ ] Q8: Extraction progress tested
- [ ] Q9: "Select Save Directory" tested
- [ ] Q10: "Save Parent File" toggle tested
- [ ] Q11: "Save into Zip Folder" toggle tested
- [ ] Q12: Save button states tested
- [ ] Q13: Gallery viewer tested
- [ ] Q14: Home button tested

**Vault/Archive Menu - Complete**
- [ ] Q15: Vault menu options identified
- [ ] Q16: Case creation tested
- [ ] Q17: Search bar tested
- [ ] Q18: Category tag filter tested
- [ ] Q19: File context menus tested
- [ ] Q20: PDF extraction from vault tested
- [ ] Q21: Folder navigation tested
- [ ] Q22: "Add Files" menu tested

**Word Editor Menu - Complete**
- [ ] Q23: Word Editor access tested
- [ ] Q24: Word Editor toolbar options identified
- [ ] Q25: New File menu tested
- [ ] Q26: Save menu tested
- [ ] Q27: Text Library menu tested
- [ ] Q28: Text formatting menus tested
- [ ] Q29: Font size menu tested
- [ ] Q30: Text alignment menu tested
- [ ] Q31: Delete file menu tested
- [ ] Q32: Export menu tested
- [ ] Q33: Detach/Reattach menu tested
- [ ] Q34: Auto-save and warnings tested

**Bookmark System Menu - Complete**
- [ ] Q35: Bookmark menu access tested
- [ ] Q36: Create bookmark tested
- [ ] Q37: Bookmark Library menu tested
- [ ] Q38: Open bookmark tested
- [ ] Q39: Bookmark folders menu tested
- [ ] Q40: Edit bookmark tested
- [ ] Q41: Delete bookmark tested

**Settings Menu - Complete**
- [ ] Q42: Settings menu access tested
- [ ] Q43: Settings sections identified
- [ ] Q44: Category tag creation tested
- [ ] Q45: Vault location change tested
- [ ] Q46: Settings persistence tested

**Security Checker Menu - Complete**
- [ ] Q47: Security Checker access tested
- [ ] Q48: Security Checker options identified
- [ ] Q49: Security audit tested
- [ ] Q50: Export report tested
- [ ] Q51: Detached Security Checker tested

#### Cross-Menu Testing

**Menu Consistency**
- [ ] All menus use consistent styling
- [ ] All menus use consistent icons
- [ ] All menus have consistent behavior
- [ ] All menus accessible via keyboard
- [ ] All menus have proper tooltips

**Menu Performance**
- [ ] All menus open quickly (<500ms)
- [ ] All menus responsive to clicks
- [ ] No menu lag or stuttering
- [ ] No memory leaks from menus

**Menu Error Handling**
- [ ] All menus handle errors gracefully
- [ ] Error messages are user-friendly
- [ ] Menus don't crash the app
- [ ] Can recover from menu errors

#### Platform-Specific Testing

- [ ] All menus tested on Windows
- [ ] All menus tested on macOS
- [ ] All menus tested on Linux
- [ ] Platform-specific shortcuts work (Ctrl vs Cmd)

#### Final Sign-Off

**All Critical Menu Paths Tested:**
- [ ] User can complete PDF extraction workflow using only menus
- [ ] User can manage vault using only menus
- [ ] User can create and edit documents using Word Editor menus
- [ ] User can manage bookmarks using menus
- [ ] User can configure app using Settings menus
- [ ] No blocking menu issues found

**Tester Notes:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Recommended for Release:** [ ] YES [ ] NO

**Reason if NO:**
```
_________________________________________________________________
_________________________________________________________________
```

---

### Feature-Specific Testing Checklist

Use this when testing a specific menu feature after changes:

**Feature: ____________________________**  
**Date: ____________**

**Related Q&A Items:**
- [ ] Q__: _________________________
- [ ] Q__: _________________________
- [ ] Q__: _________________________

**Test Cases:**
1. [ ] ___________________________________________
2. [ ] ___________________________________________
3. [ ] ___________________________________________
4. [ ] ___________________________________________
5. [ ] ___________________________________________

**Edge Cases:**
1. [ ] ___________________________________________
2. [ ] ___________________________________________
3. [ ] ___________________________________________

**Regression Tests:**
- [ ] Related menus still work
- [ ] Other features not affected
- [ ] No new console errors
- [ ] Performance not degraded

**Issues Found:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Appendix

### A. Menu Testing Best Practices

1. **Test Systematically:** Work through menus in order, don't skip around
2. **Document Everything:** Write down even small issues
3. **Use Real Data:** Test with realistic files and scenarios
4. **Test Edge Cases:** Try unusual inputs and actions
5. **Test Keyboard and Mouse:** Verify both input methods work
6. **Test on Different Platforms:** Menus may behave differently on Windows/Mac/Linux
7. **Test Accessibility:** Ensure menus work with keyboard-only navigation
8. **Check Visual Feedback:** Buttons should show hover/active states
9. **Verify Persistence:** Test that menu settings and states persist
10. **Test Error Scenarios:** Try operations that should fail

---

### B. Menu Keyboard Shortcuts Reference

| Shortcut | Menu Action |
|----------|-------------|
| **General** | |
| Escape | Close dialog/menu/viewer |
| Enter | Confirm action in dialog |
| Tab | Navigate between menu items |
| **Word Editor** | |
| Ctrl+S / Cmd+S | Save file |
| Ctrl+N / Cmd+N | New file |
| Ctrl+B / Cmd+B | Bold |
| Ctrl+I / Cmd+I | Italic |
| Ctrl+U / Cmd+U | Underline |
| Ctrl+Z / Cmd+Z | Undo |
| Ctrl+Shift+Z / Cmd+Shift+Z | Redo |
| **Image Viewer** | |
| +/= | Zoom in |
| - | Zoom out |
| 0 | Reset zoom |
| Arrow Keys | Navigate between files/pages |
| Escape | Close viewer |

---

### C. Quick Reference: Menu Locations

**Welcome Screen:**
- Top-Right: Word Editor, Settings
- Center: "Select file", "The Vault"

**PDF Extraction:**
- Top-Left: Home button
- Top-Right: Settings
- Bottom: Save options toolbar

**Vault:**
- Top-Left: Home button
- Top-Center: Search bar, Tag filter
- Top-Right: Word Editor, Settings
- Main Area: Case/file context menus

**Word Editor:**
- Toolbar: File operations, formatting tools
- Top-Right: Detach button (when in main window)

**Settings:**
- Right Panel: All settings sections
- Top-Right: Close button (X)

---

### D. Testing Notes Template

Use this template to document your testing sessions:

```
TESTING SESSION NOTES
=====================

Date: ____________________
Tester: __________________
Version: _________________
Platform: ________________

Menus Tested:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

Issues Found:
-------------
Issue #1:
  Menu: _______________________
  Description: _________________________________________
  Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
  Steps to Reproduce: __________________________________
  Expected: ___________________________________________
  Actual: _____________________________________________

Issue #2:
  Menu: _______________________
  Description: _________________________________________
  Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
  Steps to Reproduce: __________________________________
  Expected: ___________________________________________
  Actual: _____________________________________________

Screenshots/Logs:
-----------------
Attached: [ ] Screenshots [ ] Log files [ ] Screen recording

Additional Notes:
-----------------
_____________________________________________________
_____________________________________________________
_____________________________________________________

Sign-Off: _______________  Date: _______________
```

---

### E. Common Q&A Testing Scenarios

**Scenario 1: First-Time User**
- Start with empty application
- Test Welcome Screen menus first
- Follow natural workflow: PDF extraction → Vault → Word Editor
- Document any confusion or unclear menu labels

**Scenario 2: Power User**
- Test all keyboard shortcuts
- Test detached windows
- Test rapid menu switching
- Verify no performance degradation

**Scenario 3: Edge Cases**
- Test with very large files
- Test with many open menus simultaneously
- Test rapid clicking on menus
- Test menu behavior with low memory

**Scenario 4: Error Conditions**
- Test menus with no files
- Test menus with locked files
- Test menus with invalid inputs
- Test menu recovery after errors

---

### F. Menu Testing Glossary

**Context Menu:** Menu that appears on right-click or hover over an item

**Toolbar:** Row of buttons/icons providing quick access to functions

**Dialog:** Pop-up window requiring user input or confirmation

**Modal:** Dialog that blocks interaction with main window until closed

**Toggle:** Button that switches between two states (on/off)

**Dropdown:** Menu that expands downward showing options

**Breadcrumb:** Navigation showing current location in hierarchy

**Tooltip:** Small text appearing on hover explaining a button/menu

**Disabled State:** Menu item that cannot be clicked (usually grayed out)

**Active State:** Current selected or active menu item

---

## Document Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-12 | Initial Q&A menu testing documentation created |

---

**End of Menu Testing Q&A Documentation**

For questions about this documentation or to report documentation issues, please contact the development team.

**Testing Happy! 🚀**
