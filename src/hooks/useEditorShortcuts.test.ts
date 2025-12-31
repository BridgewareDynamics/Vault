import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEditorShortcuts } from './useEditorShortcuts';

describe('useEditorShortcuts', () => {
  let mockOnSave: ReturnType<typeof vi.fn>;
  let mockOnNewFile: ReturnType<typeof vi.fn>;
  let mockOnToggleBold: ReturnType<typeof vi.fn>;
  let mockOnToggleItalic: ReturnType<typeof vi.fn>;
  let mockOnToggleUnderline: ReturnType<typeof vi.fn>;
  let mockOnUndo: ReturnType<typeof vi.fn>;
  let mockOnRedo: ReturnType<typeof vi.fn>;
  let mockEditorRef: React.RefObject<{ focus: () => void }>;

  beforeEach(() => {
    mockOnSave = vi.fn();
    mockOnNewFile = vi.fn();
    mockOnToggleBold = vi.fn();
    mockOnToggleItalic = vi.fn();
    mockOnToggleUnderline = vi.fn();
    mockOnUndo = vi.fn();
    mockOnRedo = vi.fn();
    mockEditorRef = { current: { focus: vi.fn() } };

    // Mock navigator.platform
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createKeyboardEvent = (
    key: string,
    options: {
      ctrlKey?: boolean;
      metaKey?: boolean;
      shiftKey?: boolean;
      target?: HTMLElement;
    } = {}
  ): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', {
      key,
      ctrlKey: options.ctrlKey ?? false,
      metaKey: options.metaKey ?? false,
      shiftKey: options.shiftKey ?? false,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'target', {
      value: options.target || document.body,
      writable: false,
    });
    return event;
  };

  describe('Save shortcut (Ctrl+S / Cmd+S)', () => {
    it('should call onSave on Ctrl+S (Windows)', () => {
      renderHook(() =>
        useEditorShortcuts({
          onSave: mockOnSave,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('s', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should call onSave on Cmd+S (Mac)', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      renderHook(() =>
        useEditorShortcuts({
          onSave: mockOnSave,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('s', { metaKey: true });
      window.dispatchEvent(event);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should not call onSave when not in text input', () => {
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);

      renderHook(() =>
        useEditorShortcuts({
          onSave: mockOnSave,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('s', { ctrlKey: true, target: input });
      window.dispatchEvent(event);

      expect(mockOnSave).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should not call onSave when disabled', () => {
      renderHook(() =>
        useEditorShortcuts({
          onSave: mockOnSave,
          enabled: false,
        })
      );

      const event = createKeyboardEvent('s', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('New File shortcut (Ctrl+N / Cmd+N)', () => {
    it('should call onNewFile on Ctrl+N', () => {
      renderHook(() =>
        useEditorShortcuts({
          onNewFile: mockOnNewFile,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('n', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockOnNewFile).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should not call onNewFile in text input', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      renderHook(() =>
        useEditorShortcuts({
          onNewFile: mockOnNewFile,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('n', { ctrlKey: true, target: textarea });
      window.dispatchEvent(event);

      expect(mockOnNewFile).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });
  });

  describe('Formatting shortcuts', () => {
    it('should call onToggleBold on Ctrl+B when not in Lexical editor', () => {
      renderHook(() =>
        useEditorShortcuts({
          onToggleBold: mockOnToggleBold,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('b', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockOnToggleBold).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should call onToggleItalic on Ctrl+I when not in Lexical editor', () => {
      renderHook(() =>
        useEditorShortcuts({
          onToggleItalic: mockOnToggleItalic,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('i', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockOnToggleItalic).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should call onToggleUnderline on Ctrl+U when not in Lexical editor', () => {
      renderHook(() =>
        useEditorShortcuts({
          onToggleUnderline: mockOnToggleUnderline,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('u', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockOnToggleUnderline).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should not call formatting shortcuts in Lexical editor', () => {
      const lexicalEditor = document.createElement('div');
      lexicalEditor.className = 'lexical-editor-wrapper';
      document.body.appendChild(lexicalEditor);

      renderHook(() =>
        useEditorShortcuts({
          onToggleBold: mockOnToggleBold,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('b', { ctrlKey: true, target: lexicalEditor });
      window.dispatchEvent(event);

      expect(mockOnToggleBold).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);

      document.body.removeChild(lexicalEditor);
    });

    it('should not call formatting shortcuts in text input', () => {
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);

      renderHook(() =>
        useEditorShortcuts({
          onToggleBold: mockOnToggleBold,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('b', { ctrlKey: true, target: input });
      window.dispatchEvent(event);

      expect(mockOnToggleBold).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });
  });

  describe('Undo/Redo shortcuts', () => {
    it('should call onUndo on Ctrl+Z when not in Lexical editor', () => {
      renderHook(() =>
        useEditorShortcuts({
          onUndo: mockOnUndo,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('z', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockOnUndo).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should call onRedo on Ctrl+Y (Windows/Linux)', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });

      renderHook(() =>
        useEditorShortcuts({
          onRedo: mockOnRedo,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('y', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockOnRedo).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should not call onRedo on Ctrl+Y on Mac', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      renderHook(() =>
        useEditorShortcuts({
          onRedo: mockOnRedo,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('y', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockOnRedo).not.toHaveBeenCalled();
    });

    it('should call onRedo on Ctrl+Shift+Z', () => {
      renderHook(() =>
        useEditorShortcuts({
          onRedo: mockOnRedo,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('z', { ctrlKey: true, shiftKey: true });
      window.dispatchEvent(event);

      expect(mockOnRedo).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should not call undo/redo in Lexical editor', () => {
      const lexicalEditor = document.createElement('div');
      lexicalEditor.setAttribute('data-lexical-editor', 'true');
      document.body.appendChild(lexicalEditor);

      renderHook(() =>
        useEditorShortcuts({
          onUndo: mockOnUndo,
          onRedo: mockOnRedo,
          enabled: true,
        })
      );

      const undoEvent = createKeyboardEvent('z', { ctrlKey: true, target: lexicalEditor });
      window.dispatchEvent(undoEvent);

      const redoEvent = createKeyboardEvent('y', { ctrlKey: true, target: lexicalEditor });
      window.dispatchEvent(redoEvent);

      expect(mockOnUndo).not.toHaveBeenCalled();
      expect(mockOnRedo).not.toHaveBeenCalled();

      document.body.removeChild(lexicalEditor);
    });
  });

  describe('Handler updates', () => {
    it('should use updated handlers', () => {
      const { rerender } = renderHook(
        ({ onSave }) =>
          useEditorShortcuts({
            onSave,
            enabled: true,
          }),
        {
          initialProps: { onSave: mockOnSave },
        }
      );

      const newOnSave = vi.fn();
      rerender({ onSave: newOnSave });

      const event = createKeyboardEvent('s', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(newOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Text input detection', () => {
    it('should detect text input elements', () => {
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);

      renderHook(() =>
        useEditorShortcuts({
          onSave: mockOnSave,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('s', { ctrlKey: true, target: input });
      window.dispatchEvent(event);

      expect(mockOnSave).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should detect textarea elements', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      renderHook(() =>
        useEditorShortcuts({
          onSave: mockOnSave,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('s', { ctrlKey: true, target: textarea });
      window.dispatchEvent(event);

      expect(mockOnSave).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should detect different input types', () => {
      const inputTypes = ['text', 'search', 'email', 'password', 'url', 'tel', 'number'];

      inputTypes.forEach(type => {
        const input = document.createElement('input');
        input.type = type;
        document.body.appendChild(input);

        const { unmount } = renderHook(() =>
          useEditorShortcuts({
            onSave: mockOnSave,
            enabled: true,
          })
        );

        const event = createKeyboardEvent('s', { ctrlKey: true, target: input });
        window.dispatchEvent(event);

        expect(mockOnSave).not.toHaveBeenCalled();

        document.body.removeChild(input);
        unmount();
        mockOnSave.mockClear();
      });
    });
  });

  describe('Cleanup', () => {
    it('should remove event listener on unmount', () => {
      const { unmount } = renderHook(() =>
        useEditorShortcuts({
          onSave: mockOnSave,
          enabled: true,
        })
      );

      unmount();

      const event = createKeyboardEvent('s', { ctrlKey: true });
      window.dispatchEvent(event);

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('No modifier key', () => {
    it('should not trigger shortcuts without Ctrl/Cmd', () => {
      renderHook(() =>
        useEditorShortcuts({
          onSave: mockOnSave,
          onNewFile: mockOnNewFile,
          onToggleBold: mockOnToggleBold,
          enabled: true,
        })
      );

      const event = createKeyboardEvent('s');
      window.dispatchEvent(event);

      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockOnNewFile).not.toHaveBeenCalled();
      expect(mockOnToggleBold).not.toHaveBeenCalled();
    });
  });
});




