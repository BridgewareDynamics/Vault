import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useInlineEditorMode } from './useInlineEditorMode';

describe('useInlineEditorMode', () => {
  it('returns false while the word editor is closed', () => {
    const { result } = renderHook(() => useInlineEditorMode(false));
    expect(result.current).toBe(false);
  });

  it('returns true (inline) when the editor is open and not in overlay mode', () => {
    const { result } = renderHook(() => useInlineEditorMode(true));
    expect(result.current).toBe(true);
  });

  it('switches to overlay (false) when the editor is opened from the viewer', () => {
    const { result } = renderHook(() => useInlineEditorMode(true));
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new CustomEvent('open-word-editor-from-viewer'));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new CustomEvent('close-word-editor'));
    });
    expect(result.current).toBe(true);
  });

  it('resets overlay mode back to inline when the editor closes', () => {
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => useInlineEditorMode(open),
      { initialProps: { open: true } },
    );

    act(() => {
      window.dispatchEvent(new CustomEvent('open-word-editor-from-viewer'));
    });
    expect(result.current).toBe(false);

    // Closing the editor clears the latched overlay flag...
    rerender({ open: false });
    expect(result.current).toBe(false);

    // ...so a subsequent inline open is reported as inline again.
    rerender({ open: true });
    expect(result.current).toBe(true);
  });
});
