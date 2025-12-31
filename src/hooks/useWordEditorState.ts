// path: src/hooks/useWordEditorState.ts

import { useState } from 'react';

/**
 * Custom hook to manage word editor state.
 * Extracts all editor-related state management from the WordEditor component.
 */
export function useWordEditorState() {
  const [content, setContent] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showFileNameDialog, setShowFileNameDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  return {
    // Content state
    content,
    setContent,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    
    // Formatting state
    fontSize,
    setFontSize,
    textAlign,
    setTextAlign,
    
    // Dialog state
    showNewFileDialog,
    setShowNewFileDialog,
    showFileNameDialog,
    setShowFileNameDialog,
    
    // Loading states
    isLoading,
    setIsLoading,
    isSaving,
    setIsSaving,
  };
}

