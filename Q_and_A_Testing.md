# Q&A Manual Testing Guide

**Version**: 1.0  
**Last Updated**: 2026-01-12  
**Purpose**: Comprehensive questions and answers for manual testing of UI functionality and user interactions

---

## Table of Contents

1. [Case Description Editing Functionality](#case-description-editing-functionality)
2. [Image Viewer Close Button Functionality](#image-viewer-close-button-functionality)
3. [Vault Case Gallery Spacing Verification](#vault-case-gallery-spacing-verification)
4. [Cross-Feature Integration Testing](#cross-feature-integration-testing)
5. [Accessibility-Related Checks](#accessibility-related-checks)

---

## Case Description Editing Functionality

### Adding Case Descriptions

#### Question 1: How do I add a description to a case that doesn't have one?
**Answer**: 
- Locate the case folder in the vault
- Look for a '+' (Plus) icon button below the case folder card
- The '+' button should be visible in a separate container below the folder card
- Click the '+' button to open the description dialog
- Enter your description in the text area
- Click "Save" to confirm or "Cancel" to discard

#### Question 2: Where is the '+' icon positioned when a case has no description?
**Answer**: 
- The '+' icon is positioned in the top-left corner (absolute position: top-1, left-2) of a dedicated description container
- This container appears below the main case folder card
- The container has minimal height (min-h-[2rem]) and padding (p-2)
- The '+' icon is always visible (not hidden on hover) when there's no description
- The icon is small (w-3 h-3) and appears in gray-400 color, turning cyber-purple-400 on hover

#### Question 3: What happens when I click the '+' icon?
**Answer**: 
- A dialog titled "Add Description" should appear
- The dialog contains:
  - A FileText icon in a gradient purple-to-cyan background
  - A text area with placeholder "Add a description for this case..."
  - Two buttons: "Cancel" (gray) and "Save" (gradient purple-to-cyan)
- The text area should be focused automatically (autoFocus)
- You can type freely in the text area
- Pressing Escape will close the dialog
- Pressing Ctrl+Enter (or Cmd+Enter on Mac) will save the description

#### Question 4: Can I save an empty description?
**Answer**: 
- Yes, you can click "Save" with an empty text area
- The description will be saved as an empty string (trimmed)
- However, when the description is empty after trimming, the UI will revert to showing the '+' icon
- Empty or whitespace-only descriptions are effectively treated as "no description"

### Editing Existing Descriptions

#### Question 5: How do I edit an existing description?
**Answer**: 
- Locate the case folder with a description (text will be visible below the folder card)
- Hover over the description container
- A small pencil icon should appear in the top-left corner (absolute position: top-2, left-2)
- The pencil icon has opacity-0 by default and becomes opacity-100 on hover (group-hover/desc:opacity-100)
- Click the pencil icon to open the edit dialog

#### Question 6: What does the edit dialog look like?
**Answer**: 
- The dialog title changes to "Edit Description" (instead of "Add Description")
- The text area is pre-filled with the current description (initialDescription prop)
- All other dialog features remain the same:
  - FileText icon with gradient background
  - Cancel and Save buttons
  - Keyboard shortcuts (Escape to cancel, Ctrl+Enter to save)

#### Question 7: Where is the description text displayed?
**Answer**: 
- The description appears in a separate container below the case folder card
- The container has:
  - Background: bg-gray-800/40 (semi-transparent dark gray)
  - Border: border-cyber-purple-500/20 (subtle purple border)
  - Rounded corners: rounded-2xl
  - Backdrop blur: backdrop-blur-sm
  - Padding: p-4
- The text itself is:
  - Color: text-gray-300 (light gray)
  - Size: text-xs (extra small)
  - Alignment: text-center (centered)
  - Line height: leading-relaxed
  - Word breaking: break-words

### Persistence and Validation

#### Question 8: Are description changes saved permanently?
**Answer**: 
- Yes, when you click "Save", the onConfirm callback is triggered
- The description is passed to the parent component (CaseFolder)
- The parent component calls the appropriate handler (onEditDescription)
- The description should persist in the archive's case metadata
- Reloading the vault should show the saved description

#### Question 9: What happens if I click "Cancel" in the description dialog?
**Answer**: 
- The dialog closes without saving changes
- The onClose callback is triggered
- Any text entered in the dialog is discarded
- The original description (or no description) remains unchanged

#### Question 10: Can I use the description dialog with keyboard only?
**Answer**: 
- Yes, the dialog supports keyboard navigation:
  - Tab to move between text area and buttons
  - Escape key to close/cancel
  - Ctrl+Enter (Cmd+Enter on Mac) to save
  - Enter key on buttons to activate them
- The text area receives automatic focus when the dialog opens (autoFocus attribute)

### Visual Behavior

#### Question 11: Does the description container animate when it appears?
**Answer**: 
- Yes, the description container has Framer Motion animations:
  - Initial state: opacity 0, y position -10
  - Animated to: opacity 1, y position 0
  - Duration: 0.4 seconds with easeOut easing
  - Delay: 0.1 seconds for a staggered effect
- This creates a smooth fade-in and slide-down effect

#### Question 12: What visual feedback do I get when hovering over the description?
**Answer**: 
- The pencil edit icon fades in (opacity transition from 0 to 100)
- The icon changes color from gray-400 to cyber-purple-400 on hover
- The hover effect is scoped to the description container (group/desc)
- The background of the pencil button becomes gray-700/50 on hover

---

## Image Viewer Close Button Functionality

### Close Button Position and Appearance

#### Question 13: Where is the close button located in the Image Viewer?
**Answer**: 
- In the simple ImageViewer component (ImageViewer.tsx):
  - Position: Absolute, top -12 (above the image), right 0
  - Z-index: 10 to ensure it's above other elements
  - The button uses an X icon from lucide-react (size 32)
- In the Archive File Viewer (ArchiveFileViewer.tsx):
  - Position: Part of the control bar at the top
  - Located on the right side of the zoom controls
  - The button uses an X icon from lucide-react (size 20)

#### Question 14: What does the close button look like visually?
**Answer**: 
In ImageViewer.tsx:
- Icon: X (from lucide-react, 32px size)
- Color: White (text-white)
- Hover color: Cyber purple (hover:text-cyber-purple-400)
- Background: Transparent
- Transition: Smooth color transition (transition-colors)
- No border or background container

In ArchiveFileViewer.tsx:
- Icon: X (from lucide-react, 20px size)
- Padding: p-2 (more compact)
- Color: White (text-white)
- Hover effects:
  - Text color: cyber-purple-400
  - Background: gray-700 (rounded, hover:bg-gray-700)
- Consistent with zoom control styling

#### Question 15: How many ways can I close the image viewer?
**Answer**: 
Multiple ways to close:
1. Click the X close button in the top-right corner
2. Click outside the image on the backdrop (when not zoomed)
3. Press the Escape key (in some contexts)
4. Use the handleClose() function programmatically

### Close Button Behavior

#### Question 16: What happens when I click the close button?
**Answer**: 
- The onClose callback is immediately triggered
- In ImageViewer: The component uses AnimatePresence to animate out (opacity fade)
- In ArchiveFileViewer: The handleClose() function is called which:
  - Stops any ongoing page rendering
  - Cleans up PDF document resources
  - Cleans up blob URLs
  - Closes the viewer modal
  - Triggers the parent onClose callback

#### Question 17: Does the close button work while zoomed in?
**Answer**: 
- Yes, the close button remains functional regardless of zoom state
- In ImageViewer: The button is positioned outside the zoomable area (absolute positioning)
- In ArchiveFileViewer: The button is in the fixed control bar at the top
- Clicking close will exit the viewer immediately, even when zoomed

#### Question 18: Is the close button accessible via keyboard?
**Answer**: 
- Yes, the close button is fully keyboard accessible:
  - Tab key can focus the button
  - Enter or Space key activates the button
  - Has proper aria-label: "Close image viewer" or "Close viewer" or "Close"
  - Screen readers will announce the button's purpose
- Additionally, Escape key can close the viewer in some modes

### Integration with Other Controls

#### Question 19: How does the close button relate to zoom controls?
**Answer**: 
In ImageViewer.tsx:
- Close button (X) is on the right side, top -12 position
- Zoom button is on the left side, top -12 position (mirror position)
- Page number is centered between them
- All positioned above the image container

In ArchiveFileViewer.tsx:
- Close button is part of a horizontal control bar
- Located to the right of zoom in/out/reset controls
- All controls are in a flex container with consistent spacing
- All buttons share similar styling (p-2, same hover effects)

#### Question 20: What happens if I try to close while a PDF page is rendering?
**Answer**: 
- The close button remains functional during rendering
- Clicking close will:
  - Cancel the current render task (renderTaskRef.current?.cancel())
  - Stop the rendering process immediately
  - Clean up PDF document and resources
  - Close the viewer without waiting for render to complete

### Visual Feedback

#### Question 21: Does the close button provide visual feedback?
**Answer**: 
- Yes, multiple forms of feedback:
  - Hover state: Color changes to cyber-purple-400
  - In ArchiveFileViewer: Background appears on hover (bg-gray-700, rounded)
  - Smooth transitions for all state changes (transition-colors)
  - Cursor changes to pointer on hover (implicit)
  - Icon has aria-hidden="true" for proper accessibility

#### Question 22: Is the close button always visible?
**Answer**: 
- Yes, the close button is always visible when the viewer is open
- It is not hidden or faded out in any viewing state
- It maintains consistent visibility whether viewing images or PDFs
- Z-index ensures it appears above zoom controls and other elements

---

## Vault Case Gallery Spacing Verification

### Gallery Layout Structure

#### Question 23: How are case folders arranged in the vault gallery?
**Answer**: 
- Cases are displayed in a grid layout
- The ArchivePage component manages the overall layout
- Each case is rendered using the CaseFolder component
- Cases are wrapped in a container with proper spacing

#### Question 24: What is the top padding of the vault case gallery?
**Answer**: 
- The specific padding depends on the container structure in ArchivePage.tsx
- Modern UI typically uses padding utilities like pt-4, pt-6, or pt-8
- The padding ensures cases don't touch the top of the viewport
- Additional padding may be added for search bars or filters above the gallery

### Spacing Consistency

#### Question 25: What spacing exists between individual case folders?
**Answer**: 
- Each CaseFolder component has a flex container with gap-3 (0.75rem / 12px)
- This gap separates the folder card from the description container
- Grid or flex layouts at the parent level control horizontal and vertical spacing between cases
- Consistent gap values ensure uniform spacing across all cases

#### Question 26: Is there spacing between the case folder card and its description?
**Answer**: 
- Yes, the CaseFolder uses a flex container with `flex-col gap-3`
- This creates a 0.75rem (12px) gap between:
  - The main case folder card (with the folder icon and name)
  - The description container below it
- This gap is consistent and ensures visual separation

#### Question 27: How is padding handled within individual case folder cards?
**Answer**: 
- Main folder card container: p-6 (1.5rem / 24px padding on all sides)
- Description container: 
  - When description exists: p-4 (1rem / 16px)
  - When no description: p-2 (0.5rem / 8px)
- The padding creates breathing room around content
- Padding is reduced when showing just the '+' icon vs. full description text

### Responsive Behavior

#### Question 28: Does the gallery spacing adjust on different screen sizes?
**Answer**: 
- The components use Tailwind CSS responsive utilities
- Grid columns may adjust based on screen width
- Spacing utilities may have responsive variants (sm:, md:, lg:)
- Check ArchivePage.tsx for specific responsive grid configurations
- Padding and gaps should scale proportionally or use breakpoint-specific values

#### Question 29: What happens to spacing when hovering over a case folder?
**Answer**: 
- Case folders have hover animations (whileHover from Framer Motion)
- Hover effect: y: -4 (moves up 4px) and scale: 1.02 (slightly larger)
- Transform transitions are smooth (duration: 0.3s, easing: [0.4, 0, 0.2, 1])
- The hover effect doesn't change spacing between cases
- Shadow effects expand on hover (shadow-2xl, shadow-cyber-purple-500/20)

### Layout Consistency

#### Question 30: Are all case folders the same size?
**Answer**: 
- Case folder cards have consistent base dimensions
- Width and height may be controlled by grid layout
- The folder icon container is consistently sized (w-12 h-12 for icon)
- Description containers expand based on text content (auto height)
- Empty description containers have min-h-[2rem] to prevent collapse

#### Question 31: How does the layout handle cases with very long descriptions?
**Answer**: 
- Description text uses:
  - text-xs (small font size)
  - leading-relaxed (comfortable line height)
  - break-words (prevents overflow)
  - text-center (centered alignment)
- Container expands vertically to fit content
- No max-height constraint, so long descriptions are fully visible
- Scrolling is not added within description containers

#### Question 32: What spacing exists around the vault gallery container itself?
**Answer**: 
- Check ArchivePage.tsx for the main container padding
- Typical patterns include:
  - Container padding: p-4, p-6, or p-8
  - Top padding may be larger to accommodate navigation
  - Bottom padding for comfortable scrolling
  - Side padding for desktop viewing (may be responsive)

---

## Cross-Feature Integration Testing

### Case Description and Image Backgrounds

#### Question 33: How do case descriptions interact with background images?
**Answer**: 
- Background images are set on the main folder card container
- The background uses CSS properties:
  - backgroundImage: url() with base64 data URL
  - backgroundSize: cover
  - backgroundPosition: center
  - backgroundRepeat: no-repeat
- When a background image is present, an overlay (bg-gray-800/50) ensures text readability
- The description container is separate and appears below the folder card
- Background images don't affect the description container's appearance

#### Question 34: Can I edit a description and change the background image in the same session?
**Answer**: 
- Yes, these are independent operations
- Description editing is handled by the onEditDescription callback
- Background image editing is handled by the onEditBackground callback
- Both can be modified without affecting each other
- Changes to one don't trigger re-renders of the other unnecessarily

### Category Tags and Descriptions

#### Question 35: How do category tags interact with case descriptions?
**Answer**: 
- Category tags appear in the top-left corner of the folder card
- Descriptions appear in a separate container below the folder card
- They don't overlap or conflict visually
- Both can be present simultaneously
- Editing one doesn't affect the other
- Tags are stored in categoryTagId, descriptions in description field

#### Question 36: When I filter cases by category tag, are descriptions still visible?
**Answer**: 
- Yes, filtering is based on the categoryTagId property
- Filtered cases still render with their complete CaseFolder component
- Descriptions remain visible for filtered cases
- The filter doesn't hide or modify the description display

### Image Viewer and Bookmarks

#### Question 37: Can I create a bookmark while the image viewer is open?
**Answer**: 
- In ArchiveFileViewer (for PDFs), yes:
  - BookmarkPlus icon is available in the control bar
  - Clicking it opens the BookmarkCreator component
  - The viewer remains open in the background
  - After creating a bookmark, you return to the viewer
- In simple ImageViewer (for extracted pages), check if bookmark functionality is integrated

#### Question 38: Does closing the image viewer affect any bookmarks I've created?
**Answer**: 
- No, bookmarks are stored independently in the bookmark storage system
- Closing the viewer only triggers cleanup of viewer resources (PDFs, blob URLs)
- Bookmarks persist in localStorage or the bookmark file
- Opening the viewer again will show bookmark indicators for bookmarked pages

### Word Editor and Archive Interactions

#### Question 39: What happens if I open the word editor while viewing an archive file?
**Answer**: 
- The ArchiveFileViewer has special handling for word editor interactions
- When the word editor opens:
  - isOpeningWordEditorRef.current is set to true
  - isReattachingRef.current may be set during reattach operations
  - The viewer stays open to prevent premature closing
- The viewer listens for events:
  - 'reattach-word-editor-data'
  - 'open-word-editor-from-viewer'
- These prevent the viewer from closing during editor operations

#### Question 40: Can I view archive files and edit text documents simultaneously?
**Answer**: 
- Yes, if the word editor is in inline mode:
  - The editor appears in a side panel (determined by dividerPosition and panelWidth)
  - The archive file viewer can remain open
  - Resizable divider allows adjusting space allocation
- If the word editor is detached:
  - It opens in a separate window
  - The main window can continue showing the archive viewer
  - Both windows operate independently

### Metadata Handling

#### Question 41: How do TypeScript type definitions ensure data consistency?
**Answer**: 
- The ArchiveCase interface defines:
  ```typescript
  {
    name: string;
    description?: string;
    backgroundImage?: string;
    categoryTagId?: string;
    // ... other properties
  }
  ```
- Optional properties use the `?` modifier
- TypeScript compiler enforces type safety at compile time
- Runtime validation may occur in handler functions
- Type guards could verify data structures before processing

#### Question 42: What happens if metadata is corrupted or missing?
**Answer**: 
- Optional properties (description, backgroundImage, categoryTagId) can be undefined
- UI components handle undefined/null values gracefully:
  - Description: Shows '+' icon if undefined or empty
  - Background image: Shows default background if undefined
  - Category tag: Shows tag icon if no tag assigned
- Error handling in useEffect hooks catches loading failures
- Logger utility logs errors for debugging purposes

### Performance Considerations

#### Question 43: Does adding descriptions to many cases affect performance?
**Answer**: 
- Each description adds minimal data (text string)
- Rendering performance depends on:
  - Total number of cases visible (grid virtualization not observed in code)
  - Animation complexity (Framer Motion animations are GPU-accelerated)
  - Re-render optimization (React memo may be used)
- Large descriptions increase DOM size but remain manageable
- Consider pagination or virtual scrolling for very large vaults (100+ cases)

#### Question 44: Are image viewer resources properly cleaned up when switching between files?
**Answer**: 
- Yes, the ArchiveFileViewer implements thorough cleanup:
  - PDF render tasks are cancelled (renderTaskRef.current?.cancel())
  - PDF documents are cleaned up
  - Blob URLs are revoked (cleanupPDFBlobUrl utility)
  - Canvas contexts are cleared
  - Memory is released before loading new files
- This prevents memory leaks when rapidly switching between files

---

## Accessibility-Related Checks

### ARIA Labels and Roles

#### Question 45: Are all interactive buttons properly labeled for screen readers?
**Answer**: 
Yes, interactive elements have proper ARIA labels:
- Close buttons: `aria-label="Close image viewer"` or `aria-label="Close"`
- Zoom buttons: `aria-label="Zoom in"`, `aria-label="Zoom out"`
- Edit description: `aria-label="Edit description"` / `aria-label="Add description"`
- Edit background: `aria-label="Edit background image"`
- Rename case: `aria-label="Rename case"`
- Delete case: `aria-label="Delete case"`
- Tag buttons: `aria-label="Add category tag"` / `aria-label="Change category tag"`

#### Question 46: Do dialogs have proper ARIA attributes?
**Answer**: 
Yes, dialogs include:
- `role="dialog"` - Identifies the element as a dialog
- `aria-modal="true"` - Indicates the dialog is modal (blocks interaction with background)
- `aria-labelledby="[id]"` - References the dialog title element
- Examples:
  - CaseDescriptionDialog: `aria-labelledby="case-description-dialog-title"`
  - ImageViewer: `aria-labelledby="image-viewer-title"`

#### Question 47: Are decorative icons hidden from screen readers?
**Answer**: 
- Yes, lucide-react icons include `aria-hidden="true"` attribute
- This prevents screen readers from announcing decorative elements
- The interactive button itself has the aria-label for context
- Example: `<X size={32} aria-hidden="true" />`

### Keyboard Navigation

#### Question 48: Can I navigate the entire case gallery using only the keyboard?
**Answer**: 
- Yes, keyboard navigation should work:
  - Tab key moves focus between interactive elements
  - Each case folder's buttons (delete, rename, background, description) are focusable
  - Focus indicators should be visible (check for focus: styles)
  - Enter or Space activates focused buttons
- Test tab order to ensure logical flow
- Verify focus is visible with focus rings or outlines

#### Question 49: What keyboard shortcuts work in the image viewer?
**Answer**: 
- Based on the code, expected shortcuts include:
  - Escape: Close the viewer
  - Arrow keys: Navigate between pages/files (if implemented)
  - +/=: Zoom in (in PDF viewer)
  - -: Zoom out (in PDF viewer)
  - 0: Reset zoom (in PDF viewer)
  - Tab: Cycle through controls (zoom, close, navigation)

#### Question 50: Can I edit case descriptions using only the keyboard?
**Answer**: 
Yes, full keyboard support:
1. Tab to the '+' or pencil icon
2. Press Enter or Space to open the dialog
3. Text area receives automatic focus (autoFocus attribute)
4. Type the description
5. Options to save:
   - Tab to "Save" button and press Enter
   - Use keyboard shortcut: Ctrl+Enter (Cmd+Enter on Mac)
6. Options to cancel:
   - Press Escape key
   - Tab to "Cancel" button and press Enter

### Focus Management

#### Question 51: Where does focus go when I open a dialog?
**Answer**: 
- CaseDescriptionDialog: Focus automatically goes to the textarea (autoFocus attribute)
- Other dialogs should follow similar patterns
- This ensures keyboard users can immediately start interacting
- Focus trap should keep focus within the dialog until closed

#### Question 52: Where does focus return after closing a dialog?
**Answer**: 
- Focus should return to the element that triggered the dialog
- This is the expected behavior for accessible dialogs
- Verify this by:
  - Opening a dialog with keyboard (Tab + Enter)
  - Closing with Escape or Cancel
  - Checking if the original button is still focused

#### Question 53: Are focus indicators visible on all interactive elements?
**Answer**: 
- Check for focus: utility classes in Tailwind CSS
- Common patterns:
  - `focus:outline-none focus:ring-2 focus:ring-cyber-purple-500`
  - `focus:border-cyber-purple-500/60`
- Elements that should have focus indicators:
  - All buttons (close, zoom, edit, delete, etc.)
  - Text inputs and textareas
  - Dialog elements
- Verify visual focus indicators are distinct and visible

### Screen Reader Announcements

#### Question 54: Will screen readers announce when a description is added or edited?
**Answer**: 
- Direct announcements may not be present in the current implementation
- Consider adding:
  - Live region announcements: `<div aria-live="polite" aria-atomic="true">`
  - Toast notifications with `role="status"` or `role="alert"`
- The description text itself will be read when the screen reader navigates to it
- Button state changes ('+' to pencil) should be conveyed through aria-label

#### Question 55: How are page numbers announced in the image viewer?
**Answer**: 
- In ImageViewer: Page number is in a div with id="image-viewer-title"
- This is referenced by `aria-labelledby="image-viewer-title"` on the dialog
- Screen readers will announce "Page #[number]" when the dialog opens
- Navigation between pages should trigger updates (verify with testing)

### Color Contrast and Visual Accessibility

#### Question 56: Do all text elements meet WCAG contrast requirements?
**Answer**: 
Test the following combinations:
- White text on dark backgrounds (text-white on bg-gray-800/90):
  - Should meet WCAG AAA for normal text (7:1 minimum)
- Gray text on dark backgrounds (text-gray-300 on bg-gray-800/40):
  - Should meet WCAG AA for normal text (4.5:1 minimum)
- Colored text (cyber-purple-400, cyber-cyan-400):
  - Verify contrast ratios against backgrounds
  - Use tools like WebAIM Contrast Checker

#### Question 57: Are hover states distinguishable for users with low vision?
**Answer**: 
- Hover states should include:
  - Color changes (gray to cyber-purple-400)
  - Background changes (transparent to bg-gray-700)
  - Not rely solely on color (icon shape remains consistent)
- Test with:
  - Reduced contrast settings
  - Grayscale mode
  - Color blindness simulators

#### Question 58: Can the UI be used with text scaling?
**Answer**: 
- Test by increasing browser text size (Ctrl/Cmd + '+')
- Verify:
  - Text doesn't overflow containers
  - Buttons remain clickable and properly sized
  - Layout doesn't break with 200% text zoom
- Using rem/em units helps with scaling (Tailwind CSS text utilities)

### Motion and Animation

#### Question 59: Do animations respect prefers-reduced-motion?
**Answer**: 
- Check if Framer Motion animations include:
  ```javascript
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  ```
- Animations should either:
  - Disable motion entirely if prefers-reduced-motion is true
  - Reduce animation duration to near-instant
  - Remove transform/scale effects while keeping opacity changes
- Current implementation uses Framer Motion which can be configured for reduced motion

#### Question 60: Are there any flashing or strobing effects that could trigger seizures?
**Answer**: 
- Review animations in CaseFolder.tsx:
  - Pulsing glow effect on folder icon (2-second loop)
  - Opacity changes on glowing background
- Verify that:
  - No flashing occurs more than 3 times per second
  - Transitions are smooth and gradual
  - Color changes are gentle (not stark contrast flashes)
- The current animations appear to be slow and smooth, reducing risk

---

## Additional Testing Scenarios

### Edge Cases and Error Handling

#### Question 61: What happens if I try to add a very long description (10,000+ characters)?
**Answer**: 
- The textarea has no explicit maxLength attribute
- Test behavior with extremely long text:
  - Does the dialog handle it gracefully?
  - Does the description container grow appropriately?
  - Is there a performance impact on rendering?
- Consider adding maxLength validation for reasonable limits

#### Question 62: Can I use special characters or emojis in case descriptions?
**Answer**: 
- Yes, the textarea accepts all Unicode characters
- Emojis and special characters should display correctly
- The description uses UTF-8 encoding
- Test with: emoji, accented characters, CJK characters, RTL text

#### Question 63: What if I click multiple action buttons rapidly?
**Answer**: 
- Test rapid clicking on:
  - Description edit button (open multiple dialogs?)
  - Close button in image viewer
  - Navigation buttons (previous/next)
- Expected behavior:
  - Dialogs should not stack
  - Click handlers should debounce or disable buttons during operations
  - State should remain consistent

### Multi-User and Concurrency

#### Question 64: What happens if the vault files are modified externally while the app is running?
**Answer**: 
- The app may not have file watching implemented
- Manual refresh may be required to see external changes
- Test:
  - Edit a case description in the app
  - Manually edit the metadata file externally
  - Check which change persists
- Consider implementing file watchers for better sync

### Browser and Platform Compatibility

#### Question 65: Do all features work in the Electron environment?
**Answer**: 
- This is an Electron app, not a web browser app
- Electron APIs are accessed via window.electronAPI
- Test that:
  - File operations work correctly (readFileData, etc.)
  - IPC communication is reliable
  - Platform-specific features work (Windows, macOS, Linux)

---

## Testing Checklist Summary

Use this checklist for comprehensive manual testing:

### Case Description Functionality
- [ ] Click '+' icon to add description to case without description
- [ ] Enter text and save description
- [ ] Verify description appears below folder card
- [ ] Hover over existing description to see pencil icon
- [ ] Click pencil icon to edit description
- [ ] Modify description and save changes
- [ ] Cancel description editing (verify no changes saved)
- [ ] Try saving empty description
- [ ] Test keyboard shortcuts (Escape, Ctrl+Enter)
- [ ] Verify description persists after app restart

### Image Viewer Close Button
- [ ] Open image viewer for a PNG/JPG file
- [ ] Locate close button (X icon in top-right or control bar)
- [ ] Click close button to close viewer
- [ ] Open PDF in archive file viewer
- [ ] Locate close button in control bar
- [ ] Click close button to close PDF viewer
- [ ] Verify close button works while zoomed
- [ ] Test close button keyboard navigation (Tab, Enter)
- [ ] Verify alt methods still work (Escape, backdrop click)

### Vault Case Gallery Spacing
- [ ] Verify consistent spacing between case folders
- [ ] Check gap between folder card and description (gap-3)
- [ ] Verify padding within folder cards (p-6)
- [ ] Verify padding in description containers (p-4 or p-2)
- [ ] Test hover effects don't break spacing
- [ ] Check layout with various description lengths
- [ ] Verify responsive behavior on different window sizes

### Cross-Feature Integration
- [ ] Add description to case with background image
- [ ] Add description to case with category tag
- [ ] Verify background images and descriptions don't conflict
- [ ] Filter cases by tag, verify descriptions still visible
- [ ] Create bookmark while image viewer is open
- [ ] Open word editor while viewing archive file
- [ ] Test rapid switching between cases with descriptions

### Accessibility
- [ ] Navigate entire UI with keyboard only (Tab, Enter, Escape)
- [ ] Verify all buttons have aria-labels
- [ ] Check dialog ARIA attributes (role, aria-modal, aria-labelledby)
- [ ] Test with screen reader (NVDA, JAWS, or VoiceOver)
- [ ] Verify focus indicators are visible
- [ ] Check focus management (dialog open/close)
- [ ] Test with 200% text zoom
- [ ] Verify color contrast meets WCAG AA
- [ ] Test with prefers-reduced-motion enabled
- [ ] Check no flashing/strobing effects

---

**End of Q&A Testing Guide**

For additional testing procedures, refer to [TESTING_PROCEDURES.md](./TESTING_PROCEDURES.md).
