import { useEffect, useRef } from 'react';

interface UseEditorShortcutsOptions {
  onSave?: () => void;
  onNewFile?: () => void;
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleUnderline?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  enabled?: boolean;
  editorRef?: React.RefObject<{ focus: () => void } | null>;
}

/**
 * Check if the target element is a text input field (not the editor)
 */
function isTextInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  
  const tagName = target.tagName.toLowerCase();
  
  // Check if it's a regular input or textarea
  if (tagName === 'input') {
    const inputType = (target as HTMLInputElement).type?.toLowerCase();
    const textInputTypes = ['text', 'search', 'email', 'password', 'url', 'tel', 'number'];
    return textInputTypes.includes(inputType);
  }
  
  if (tagName === 'textarea') {
    return true;
  }
  
  // Check if it's contentEditable but NOT the Lexical editor
  if (target.isContentEditable) {
    // If it's inside the Lexical editor wrapper, it's the editor itself
    const isLexicalEditor = target.closest('.lexical-editor-wrapper') !== null ||
                            target.closest('[data-lexical-editor="true"]') !== null;
    return !isLexicalEditor;
  }
  
  return false;
}

export function useEditorShortcuts({
  onSave,
  onNewFile,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onUndo,
  onRedo,
  enabled = true,
  editorRef,
}: UseEditorShortcutsOptions) {
  const handlersRef = useRef({
    onSave,
    onNewFile,
    onToggleBold,
    onToggleItalic,
    onToggleUnderline,
    onUndo,
    onRedo,
  });

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = {
      onSave,
      onNewFile,
      onToggleBold,
      onToggleItalic,
      onToggleUnderline,
      onUndo,
      onRedo,
    };
  }, [onSave, onNewFile, onToggleBold, onToggleItalic, onToggleUnderline, onUndo, onRedo]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      if (!ctrlOrCmd) return;

      const target = event.target as HTMLElement | null;
      const key = event.key.toLowerCase();
      const handlers = handlersRef.current;

      // Check if we're in a text input (not the editor)
      const isTextInput = isTextInputElement(target);
      
      // Check if we're in the Lexical editor
      const isInLexicalEditor = target?.closest('.lexical-editor-wrapper') !== null ||
                                target?.closest('[data-lexical-editor="true"]') !== null ||
                                (target?.hasAttribute('contenteditable') && 
                                 target?.getAttribute('contenteditable') === 'true' &&
                                 !isTextInput);

      // File operations (Save, New) - work globally except in text inputs
      if (key === 's' && handlers.onSave) {
        if (!isTextInput) {
          event.preventDefault();
          event.stopPropagation();
          handlers.onSave();
        }
        return;
      }

      if (key === 'n' && handlers.onNewFile) {
        if (!isTextInput) {
          event.preventDefault();
          event.stopPropagation();
          handlers.onNewFile();
        }
        return;
      }

      // Formatting and history shortcuts
      // When in Lexical editor: Let Lexical handle them natively (don't intercept)
      // When NOT in Lexical editor: Handle them ourselves (for toolbar buttons, etc.)
      if (isInLexicalEditor) {
        // Let Lexical handle formatting/history shortcuts natively
        // Don't prevent default or stop propagation
        return;
      }

      // Only handle formatting/history when NOT in Lexical editor and NOT in text input
      if (!isTextInput) {
        switch (key) {
          case 'b':
            if (handlers.onToggleBold) {
              event.preventDefault();
              event.stopPropagation();
              handlers.onToggleBold();
            }
            break;
          case 'i':
            if (handlers.onToggleItalic) {
              event.preventDefault();
              event.stopPropagation();
              handlers.onToggleItalic();
            }
            break;
          case 'u':
            if (handlers.onToggleUnderline) {
              event.preventDefault();
              event.stopPropagation();
              handlers.onToggleUnderline();
            }
            break;
          case 'z':
            if (event.shiftKey) {
              // Ctrl+Shift+Z or Cmd+Shift+Z for redo
              if (handlers.onRedo) {
                event.preventDefault();
                event.stopPropagation();
                handlers.onRedo();
              }
            } else {
              // Ctrl+Z or Cmd+Z for undo
              if (handlers.onUndo) {
                event.preventDefault();
                event.stopPropagation();
                handlers.onUndo();
              }
            }
            break;
          case 'y':
            // Ctrl+Y for redo (Windows/Linux)
            if (!isMac && handlers.onRedo) {
              event.preventDefault();
              event.stopPropagation();
              handlers.onRedo();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, editorRef]);
}

