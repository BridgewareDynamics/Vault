---
name: Resizable Word Editor Panel
overview: Make the docked word editor panel resizable by adding a drag handle on the left edge, implementing drag-to-resize functionality, and updating the layout to use dynamic width instead of fixed 500px.
todos:
  - id: add-width-context
    content: Add panelWidth state and setPanelWidth function to WordEditorContext with localStorage persistence
    status: pending
  - id: add-resize-handle
    content: Add resize handle UI element on left edge of WordEditorPanel with proper styling and cursor
    status: pending
    dependencies:
      - add-width-context
  - id: implement-drag-logic
    content: Implement mouse drag handlers (mousedown, mousemove, mouseup) to calculate and update panel width with min/max constraints
    status: pending
    dependencies:
      - add-resize-handle
  - id: update-panel-width
    content: Replace fixed w-[500px] class with dynamic width from context in WordEditorPanel
    status: pending
    dependencies:
      - add-width-context
  - id: update-main-layout
    content: Update App.tsx to use dynamic panelWidth instead of hardcoded 500px for main content width calculation
    status: pending
    dependencies:
      - add-width-context
---

# Resizable Word Editor Panel

## Overview

The word editor panel is currently fixed at 500px width when docked. This plan implements a resizable panel with a drag handle that allows users to adjust the width dynamically.

## Current State

- `WordEditorPanel` has fixed width: `w-[500px] `(line 201 in `WordEditorPanel.tsx`)
- `App.tsx` uses hardcoded `500px` to calculate main content width (line 377)
- No resize functionality exists

## Implementation Plan

### 1. Add Width State Management

- **File**: `src/contexts/WordEditorContext.tsx`
- Add `panelWidth` state to the context (default: 500px)
- Add `setPanelWidth` function
- Load/save width preference from localStorage on mount/change

### 2. Implement Resize Handle Component

- **File**: `src/components/WordEditor/WordEditorPanel.tsx`
- Add a resize handle div on the left edge of the panel
- Style with hover effects and cursor (grab/resize cursor)
- Position absolutely on the left border

### 3. Implement Drag-to-Resize Logic

- **File**: `src/components/WordEditor/WordEditorPanel.tsx`
- Add mouse event handlers (mousedown, mousemove, mouseup)
- Calculate new width based on mouse position during drag
- Set min width (300px) and max width (80vw or similar)
- Update context width state during drag
- Prevent text selection during drag

### 4. Update Panel Width Usage

- **File**: `src/components/WordEditor/WordEditorPanel.tsx`
- Replace fixed `w-[500px]` with dynamic width from context
- Use inline style: `style={{ width: panelWidth }}`

### 5. Update Main Content Layout

- **File**: `src/App.tsx`
- Replace hardcoded `500px` with dynamic width from context
- Update width calculation: `calc(100vw - ${panelWidth}px)`

### 6. Add Visual Feedback

- Show resize cursor on hover over handle
- Add subtle visual indicator (border highlight or background change)
- Smooth transitions when width changes (but not during drag for responsiveness)

## Technical Details

### Resize Handle Design

- Position: Absolute, left edge of panel
- Width: 4-6px drag area
- Cursor: `col-resize` or `ew-resize`
- Visual: Subtle border or background on hover

### Width Constraints

- Minimum: 300px (to ensure usability)
- Maximum: 80vw (to prevent taking over entire screen)
- Default: 500px (current default)

### State Persistence

- Store width in localStorage key: `word-editor-panel-width`
- Load on mount, save on change
- Fallback to 500px if invalid or missing

## Files to Modify

1. `src/contexts/WordEditorContext.tsx` - Add width state
2. `src/components/WordEditor/WordEditorPanel.tsx` - Add resize handle and drag logic
3. `src/App.tsx` - Use dynamic width for main content

## Testing Considerations

- Verify drag works smoothly
- Check min/max constraints are enforced
- Ensure main content adjusts correctly
- Verify width persists across sessions