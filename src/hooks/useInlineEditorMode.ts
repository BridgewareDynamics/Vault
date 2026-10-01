import { useEffect, useState } from 'react';

/**
 * Reports whether the word editor is currently rendered *inline* (side-by-side
 * with the archive) as opposed to as an *overlay* panel.
 *
 * This replaces a `document.body` `MutationObserver` that previously detected
 * the inline layout by watching the whole DOM subtree for the
 * `word-editor-inline-container` node. Instead, it derives the same value that
 * `App.tsx` uses for `useSideBySideLayout` (`isWordEditorOpen && !overlayMode`)
 * from the same explicit window events that toggle the layout there:
 *
 * - `open-word-editor-from-viewer` switches the editor into overlay mode.
 * - `close-word-editor` (and the editor closing) resets back to inline mode.
 *
 * Keeping the derivation event-driven means consumers stay in sync via React
 * state instead of polling the DOM.
 */
export function useInlineEditorMode(isWordEditorOpen: boolean): boolean {
  const [isOverlayMode, setIsOverlayMode] = useState(false);

  useEffect(() => {
    const enableOverlay = () => setIsOverlayMode(true);
    const disableOverlay = () => setIsOverlayMode(false);

    window.addEventListener('open-word-editor-from-viewer', enableOverlay);
    window.addEventListener('close-word-editor', disableOverlay);

    return () => {
      window.removeEventListener('open-word-editor-from-viewer', enableOverlay);
      window.removeEventListener('close-word-editor', disableOverlay);
    };
  }, []);

  // When the editor closes, the overlay flag is reset (mirrors App.tsx).
  useEffect(() => {
    if (!isWordEditorOpen) {
      setIsOverlayMode(false);
    }
  }, [isWordEditorOpen]);

  return isWordEditorOpen && !isOverlayMode;
}
