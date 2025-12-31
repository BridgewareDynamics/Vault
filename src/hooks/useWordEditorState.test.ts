import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWordEditorState } from './useWordEditorState';

describe('useWordEditorState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWordEditorState());

    expect(result.current.content).toBe('');
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.fontSize).toBe(14);
    expect(result.current.textAlign).toBe('left');
    expect(result.current.showNewFileDialog).toBe(false);
    expect(result.current.showFileNameDialog).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });

  it('should update content', () => {
    const { result } = renderHook(() => useWordEditorState());

    act(() => {
      result.current.setContent('Hello world');
    });

    expect(result.current.content).toBe('Hello world');
  });

  it('should update hasUnsavedChanges', () => {
    const { result } = renderHook(() => useWordEditorState());

    act(() => {
      result.current.setHasUnsavedChanges(true);
    });

    expect(result.current.hasUnsavedChanges).toBe(true);

    act(() => {
      result.current.setHasUnsavedChanges(false);
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should update fontSize', () => {
    const { result } = renderHook(() => useWordEditorState());

    act(() => {
      result.current.setFontSize(18);
    });

    expect(result.current.fontSize).toBe(18);

    act(() => {
      result.current.setFontSize(24);
    });

    expect(result.current.fontSize).toBe(24);
  });

  it('should update textAlign', () => {
    const { result } = renderHook(() => useWordEditorState());

    act(() => {
      result.current.setTextAlign('center');
    });

    expect(result.current.textAlign).toBe('center');

    act(() => {
      result.current.setTextAlign('right');
    });

    expect(result.current.textAlign).toBe('right');

    act(() => {
      result.current.setTextAlign('justify');
    });

    expect(result.current.textAlign).toBe('justify');

    act(() => {
      result.current.setTextAlign('left');
    });

    expect(result.current.textAlign).toBe('left');
  });

  it('should update showNewFileDialog', () => {
    const { result } = renderHook(() => useWordEditorState());

    act(() => {
      result.current.setShowNewFileDialog(true);
    });

    expect(result.current.showNewFileDialog).toBe(true);

    act(() => {
      result.current.setShowNewFileDialog(false);
    });

    expect(result.current.showNewFileDialog).toBe(false);
  });

  it('should update showFileNameDialog', () => {
    const { result } = renderHook(() => useWordEditorState());

    act(() => {
      result.current.setShowFileNameDialog(true);
    });

    expect(result.current.showFileNameDialog).toBe(true);

    act(() => {
      result.current.setShowFileNameDialog(false);
    });

    expect(result.current.showFileNameDialog).toBe(false);
  });

  it('should update isLoading', () => {
    const { result } = renderHook(() => useWordEditorState());

    act(() => {
      result.current.setIsLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setIsLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should update isSaving', () => {
    const { result } = renderHook(() => useWordEditorState());

    act(() => {
      result.current.setIsSaving(true);
    });

    expect(result.current.isSaving).toBe(true);

    act(() => {
      result.current.setIsSaving(false);
    });

    expect(result.current.isSaving).toBe(false);
  });

  it('should handle multiple state updates independently', () => {
    const { result } = renderHook(() => useWordEditorState());

    act(() => {
      result.current.setContent('Test content');
      result.current.setHasUnsavedChanges(true);
      result.current.setFontSize(20);
      result.current.setTextAlign('center');
    });

    expect(result.current.content).toBe('Test content');
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.fontSize).toBe(20);
    expect(result.current.textAlign).toBe('center');
  });

  it('should maintain state across re-renders', () => {
    const { result, rerender } = renderHook(() => useWordEditorState());

    act(() => {
      result.current.setContent('Persistent content');
      result.current.setFontSize(16);
    });

    rerender();

    expect(result.current.content).toBe('Persistent content');
    expect(result.current.fontSize).toBe(16);
  });
});




