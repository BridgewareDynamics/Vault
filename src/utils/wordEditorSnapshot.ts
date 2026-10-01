import type { MapModuleWordEditorSnapshot } from '../types/detachableModules';

const COLLECT_EVENT = 'collect-word-editor-snapshot';
const RESPONSE_EVENT = 'word-editor-snapshot-response';

export async function collectWordEditorSnapshot(
  timeoutMs = 500
): Promise<MapModuleWordEditorSnapshot | undefined> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener(RESPONSE_EVENT, onResponse as EventListener);
      resolve(undefined);
    }, timeoutMs);

    const onResponse = (event: Event) => {
      window.clearTimeout(timeout);
      window.removeEventListener(RESPONSE_EVENT, onResponse as EventListener);
      const detail = (event as CustomEvent<MapModuleWordEditorSnapshot | null>).detail;
      resolve(detail ?? undefined);
    };

    window.addEventListener(RESPONSE_EVENT, onResponse as EventListener);
    window.dispatchEvent(new CustomEvent(COLLECT_EVENT));
  });
}

export function dispatchWordEditorReattach(snapshot: MapModuleWordEditorSnapshot) {
  window.dispatchEvent(
    new CustomEvent('reattach-word-editor-data', {
      detail: {
        content: snapshot.content,
        filePath: snapshot.filePath,
        viewState: snapshot.viewState,
        casePath: null,
      },
    })
  );
}

export { COLLECT_EVENT, RESPONSE_EVENT };
