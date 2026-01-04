---
name: Resizable Divider for Editor and Archive
overview: Implement a resizable divider/splitter that allows users to adjust the space allocation between the Word Editor and Archive when both are visible. Since the Editor can only be open when the Archive is open, the side-by-side layout will always be used when the Editor is visible.
todos:
  - id: create-divider-component
    content: Create ResizableDivider component with drag handlers, visual feedback, and constraint logic
    status: pending
  - id: extend-word-editor-context
    content: Add dividerPosition state and localStorage persistence to WordEditorContext
    status: pending
  - id: modify-word-editor-panel
    content: Update WordEditorPanel to support inline mode (remove fixed positioning, adjust styling)
    status: pending
  - id: update-app-layout
    content: Modify App.tsx to render side-by-side flex layout when Editor is open, integrate ResizableDivider
    status: pending
    dependencies:
      - create-divider-component
      - extend-word-editor-context
      - modify-word-editor-panel
  - id: update-archive-page
    content: Ensure ArchivePage adapts to constrained width in side-by-side layout
    status: pending
  - id: test-and-refine
    content: Test divider functionality, persistence, constraints, and edge cases
    status: pending
    dependencies:
      - update-app-layout
      - update-archive-page
---

# Resizable Divider for Editor and Archive

## Overview

When the Word Editor is open (which requires the Archive to be open), display them side-by-side with a draggable vertical divider that allows users to resize the space allocation between the two components. The divider position will persist across sessions.

## Architecture

### Layout Structure

- When `showArchive === true` AND `isWordEditorOpen === true`:
- Display Archive on the left
- Display Editor on the right
- Vertical divider between them (draggable)
- When only Archive is visible: Full-width Archive (current behavior)
- Editor cannot be open without Archive (constraint)

### Components to Modify

1. **[src/App.tsx](src/App.tsx)**

- Modify the Archive rendering logic to support side-by-side layout when Editor is open
- Add container div that manages the split layout
- Integrate divider component
- Check `isWordEditorOpen` from context to determine layout

2. **[src/components/WordEditor/WordEditorPanel.tsx](src/components/WordEditor/WordEditorPanel.tsx)**

- Modify panel to support inline mode (side-by-side) instead of overlay mode
- Remove fixed positioning when in Archive context
- Adjust styling for inline mode (flex layout)
- Remove overlay-specific animations when in split view

3. **[src/contexts/WordEditorContext.tsx](src/contexts/WordEditorContext.tsx)**

- Add state for divider position (percentage: 0-100)
- Add localStorage persistence for divider position
- Add setter for divider position
- Default position: 50% (equal split)

4. **New Component: [src/components/ResizableDivider.tsx](src/components/ResizableDivider.tsx)**

- Create reusable resizable divider component
- Handle mouse drag events
- Visual feedback during drag (hover state, active state)
- Emit position changes to parent
- Constrain movement within min/max bounds

## Implementation Details

### Divider Component

- Visual: Vertical line (4px width) with hover effect (cyber-purple accent)
- Interaction: Click and drag to resize
- Constraints: 
- Min width for Archive: 300px (or 20% of viewport)
- Min width for Editor: 400px (or 30% of viewport)
- Position storage: Store as percentage of viewport width for responsiveness
- Cursor: `col-resize` during hover and drag

### State Management

- Store divider position in `WordEditorContext`
- Default: 50% (equal split)
- Persist to localStorage with key `'word-editor-divider-position'`
- Load on mount, validate range (20% - 80%)
- Update position in real-time during drag

### Layout CSS

- Use flexbox for side-by-side layout
- Container: `display: flex`, `height: 100vh`
- Archive: `flex: 0 0 <divider-position>%`, `overflow: auto`
- Divider: Fixed width (4px), `cursor: col-resize`, `user-select: none`
- Editor: `flex: 1`, `overflow: hidden` (internal scrolling handled by panel)

### Responsive Behavior

- On window resize, maintain percentage-based position
- Ensure minimum widths are respected (recalculate if needed)
- Handle edge cases (very small viewports: disable divider or use fixed widths)

## Files to Create/Modify

1. **Create**: `src/components/ResizableDivider.tsx`

- Props: 
    - `position: number` (percentage 0-100)
    - `onResize: (position: number) => void`
    - `minLeft?: number` (default: 20)
    - `minRight?: number` (default: 30)
- State: `isDragging: boolean`
- Handlers: `handleMouseDown`, `handleMouseMove`, `handleMouseUp`
- Visual: Line with hover/active states

2. **Modify**: `src/contexts/WordEditorContext.tsx`

- Add `dividerPosition: number` (0-100, percentage)
- Add `setDividerPosition: (position: number) => void`
- Add localStorage persistence logic (load on mount, save on change)
- Validate position on load (clamp to 20-80%)

3. **Modify**: `src/App.tsx`

- Check if Editor is open when Archive is visible
- Render split layout container when `isWordEditorOpen === true`
- Structure:
     ```tsx
               {showArchive && (
                 isWordEditorOpen ? (
                   <div className="flex h-screen">
                     <ArchivePage ... style={{ width: `${dividerPosition}%` }} />
                     <ResizableDivider ... />
                     <WordEditorPanel ... style={{ width: `${100 - dividerPosition}%` }} />
                   </div>
                 ) : (
                   <ArchivePage ... />
                 )
               )}
     ```




4. **Modify**: `src/components/WordEditor/WordEditorPanel.tsx`

- Remove fixed positioning when used in split view
- Adjust styling: Remove `fixed right-0 top-0 bottom-0`
- Use `h-full` and flex layout instead
- Keep animations but adjust for inline context
- Remove overlay backdrop when in split view

5. **Modify**: `src/components/Archive/ArchivePage.tsx`

- Ensure content adapts to constrained width
- Test grid layouts with reduced width
- Verify scrolling works correctly

## Testing Considerations

- Verify divider drags smoothly without jank
- Test minimum width constraints (can't drag beyond limits)
- Test persistence across page reloads
- Test with different viewport sizes
- Ensure no layout breaking at extremes
- Test rapid dragging
- Verify Archive content remains usable at minimum width
- Verify Editor remains usable at minimum width

## Edge Cases

- Very small viewport (< 800px): Consider disabling split view or using fixed minimums
- Rapid window resize: Maintain percentage, but validate against new min/max