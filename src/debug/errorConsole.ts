import {
  CapturedError,
  createCapturedError,
  formatAllErrors,
  normalizeErrorReason,
  redactSensitiveText,
  sanitizeSource,
} from './sanitizeError';
import { logger } from '../utils/logger';
import { isVitestEnv } from '../utils/isVitestEnv';

const ROOT_ID = 'app-error-console-root';
const PANEL_ID = 'app-error-console-panel';
const LIST_ID = 'app-error-console-list';
const EMPTY_ID = 'app-error-console-empty';
const FALLBACK_ID = 'app-error-console-copy-fallback';

const isRendererDev =
  import.meta.env.DEV || import.meta.env.MODE === 'development';

declare global {
  interface Window {
    __APP_ERROR_CONSOLE_INSTALLED__?: boolean;
  }
}

interface ErrorConsoleState {
  errors: CapturedError[];
  panelVisible: boolean;
  userDismissed: boolean;
}

let state: ErrorConsoleState = {
  errors: [],
  panelVisible: false,
  userDismissed: false,
};

let listElement: HTMLElement | null = null;
let emptyElement: HTMLElement | null = null;
let panelElement: HTMLElement | null = null;

function hasOpenDevToolsApi(
  api: typeof window.electronAPI | undefined,
): api is typeof window.electronAPI & {
  openDevToolsInDev: () => Promise<{ success: boolean }>;
} {
  return (
    api !== undefined &&
    'openDevToolsInDev' in api &&
    typeof api.openDevToolsInDev === 'function'
  );
}

function createButton(label: string, onClick: () => void, extraClasses = ''): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = `rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${extraClasses}`;
  button.addEventListener('click', onClick);
  return button;
}

function createFieldRow(label: string, value: string): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'text-xs leading-relaxed';

  const labelEl = document.createElement('span');
  labelEl.className = 'font-semibold text-cyber-purple-300';
  labelEl.textContent = `${label}: `;

  const valueEl = document.createElement('span');
  valueEl.className = 'text-gray-200 break-words font-mono';
  valueEl.textContent = value;

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
}

function renderErrorItem(record: CapturedError): HTMLElement {
  const item = document.createElement('article');
  item.className =
    'rounded-lg border border-red-500/30 bg-red-950/20 p-3 space-y-1.5';
  item.dataset.errorId = record.id;

  item.appendChild(createFieldRow('Time', record.timestamp));
  item.appendChild(createFieldRow('Message', record.message));
  item.appendChild(createFieldRow('Source', record.source));

  if (record.line !== null) {
    item.appendChild(createFieldRow('Line', String(record.line)));
  }
  if (record.column !== null) {
    item.appendChild(createFieldRow('Column', String(record.column)));
  }
  if (record.stack) {
    const stackBlock = document.createElement('pre');
    stackBlock.className =
      'mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded bg-black/30 p-2 text-[11px] text-gray-300 font-mono';
    stackBlock.textContent = record.stack;
    item.appendChild(stackBlock);
  }

  return item;
}

function refreshErrorList(): void {
  if (!listElement || !emptyElement) {
    return;
  }

  while (listElement.firstChild) {
    listElement.removeChild(listElement.firstChild);
  }

  if (state.errors.length === 0) {
    emptyElement.classList.remove('hidden');
    return;
  }

  emptyElement.classList.add('hidden');
  for (const record of state.errors) {
    listElement.appendChild(renderErrorItem(record));
  }
}

function setPanelVisible(visible: boolean): void {
  if (!panelElement) {
    return;
  }

  state.panelVisible = visible;

  if (visible) {
    panelElement.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    panelElement.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
    panelElement.setAttribute('aria-hidden', 'false');
  } else {
    panelElement.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
    panelElement.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    panelElement.setAttribute('aria-hidden', 'true');
  }
}

function hideCopyFallback(): void {
  const existing = document.getElementById(FALLBACK_ID);
  if (existing) {
    existing.remove();
  }
}

function showCopyFallback(text: string): void {
  hideCopyFallback();

  const overlay = document.createElement('div');
  overlay.id = FALLBACK_ID;
  overlay.className =
    'fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm';

  const dialog = document.createElement('div');
  dialog.className =
    'w-full max-w-xl rounded-xl border border-cyber-purple-500/40 bg-gray-900/95 p-4 shadow-2xl backdrop-blur-xl';

  const title = document.createElement('h3');
  title.className = 'mb-2 text-sm font-semibold text-white';
  title.textContent = 'Copy errors manually';

  const hint = document.createElement('p');
  hint.className = 'mb-3 text-xs text-gray-400';
  hint.textContent =
    'Clipboard access was blocked. Select the text below and copy it manually (Ctrl+C).';

  const textarea = document.createElement('textarea');
  textarea.readOnly = true;
  textarea.className =
    'mb-3 h-48 w-full resize-none rounded-lg border border-gray-700 bg-black/40 p-3 font-mono text-xs text-gray-200';
  textarea.value = text;

  const actions = document.createElement('div');
  actions.className = 'flex justify-end gap-2';

  const selectBtn = createButton(
    'Select all',
    () => {
      textarea.focus();
      textarea.select();
    },
    'bg-cyber-purple-600/80 text-white hover:bg-cyber-purple-500/80',
  );

  const closeBtn = createButton(
    'Close',
    () => hideCopyFallback(),
    'bg-gray-700 text-gray-100 hover:bg-gray-600',
  );

  actions.appendChild(selectBtn);
  actions.appendChild(closeBtn);

  dialog.appendChild(title);
  dialog.appendChild(hint);
  dialog.appendChild(textarea);
  dialog.appendChild(actions);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.select();
  });
}

async function copyErrorsToClipboard(): Promise<void> {
  const text = formatAllErrors(state.errors);

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    throw new Error('Clipboard API unavailable');
  } catch {
    showCopyFallback(text);
  }
}

function maybeOpenDevTools(): void {
  if (!isRendererDev || isVitestEnv()) {
    return;
  }

  const api = window.electronAPI;
  if (hasOpenDevToolsApi(api)) {
    api.openDevToolsInDev().catch(() => {
      // DevTools opening is best-effort only.
    });
  }
}

function pushError(record: CapturedError): void {
  const recordTime = Date.parse(record.timestamp);
  const isDuplicate = state.errors.some((existing) => {
    if (existing.message !== record.message || existing.source !== record.source) {
      return false;
    }
    const existingTime = Date.parse(existing.timestamp);
    return Number.isFinite(recordTime) && Number.isFinite(existingTime)
      && Math.abs(recordTime - existingTime) < 2_000;
  });
  if (isDuplicate) {
    return;
  }

  state.errors = [record, ...state.errors].slice(0, 100);
  refreshErrorList();

  if (state.userDismissed) {
    state.userDismissed = false;
  }
  setPanelVisible(true);
  maybeOpenDevTools();
}

export function reportCapturedError(
  error: unknown,
  meta?: { source?: string; componentStack?: string },
): void {
  const normalized = normalizeErrorReason(error);
  const stackParts = [normalized.stack, meta?.componentStack]
    .filter((part): part is string => Boolean(part))
    .map((part) => redactSensitiveText(part));

  const record = createCapturedError({
    message: normalized.message,
    source: meta?.source ?? 'react-error-boundary',
    stack: stackParts.length > 0 ? stackParts.join('\n\n') : null,
  });

  logger.error('Captured error:', normalized.message, meta?.componentStack ?? '');
  pushError(record);
}

function handleWindowError(event: ErrorEvent): void {
  const normalized = normalizeErrorReason(event.error ?? event.message);
  const record = createCapturedError({
    message: normalized.message || event.message || 'Unknown error',
    source: sanitizeSource(event.filename),
    line: Number.isFinite(event.lineno) ? event.lineno : null,
    column: Number.isFinite(event.colno) ? event.colno : null,
    stack: normalized.stack ?? null,
  });

  logger.error('Uncaught error in renderer:', event.error ?? event.message);
  pushError(record);
}

function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  const normalized = normalizeErrorReason(event.reason);
  const record = createCapturedError({
    message: normalized.message,
    source: 'unhandledrejection',
    stack: normalized.stack ?? null,
  });

  logger.error('Unhandled promise rejection in renderer:', event.reason);
  event.preventDefault();
  pushError(record);
}

function buildPanelUi(root: HTMLElement): void {
  const panel = document.createElement('section');
  panel.id = PANEL_ID;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'App Error Console');
  panel.setAttribute('aria-hidden', 'true');
  panel.className =
    'app-error-console-panel pointer-events-none fixed bottom-3 right-3 z-[99999] w-[min(100vw-1.5rem,28rem)] translate-y-4 rounded-2xl border border-cyber-purple-500/40 bg-gradient-to-br from-gray-950/95 via-purple-950/80 to-gray-950/95 opacity-0 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out sm:bottom-4 sm:right-4';

  const inner = document.createElement('div');
  inner.className = 'flex max-h-[min(70vh,32rem)] flex-col overflow-hidden p-3 sm:p-4';

  const header = document.createElement('div');
  header.className = 'mb-3 flex items-start justify-between gap-3';

  const titleWrap = document.createElement('div');
  const title = document.createElement('h2');
  title.className = 'text-sm font-bold text-white sm:text-base';
  title.textContent = 'App Error Console';

  const badge = document.createElement('p');
  badge.className = 'mt-0.5 text-[11px] text-cyber-purple-300/90';
  badge.textContent = 'Local debugging only';

  titleWrap.appendChild(title);
  titleWrap.appendChild(badge);

  const actions = document.createElement('div');
  actions.className = 'flex flex-wrap justify-end gap-1.5';

  const copyBtn = createButton(
    'Copy Errors',
    () => {
      void copyErrorsToClipboard();
    },
    'bg-cyber-cyan-600/30 text-cyber-cyan-200 hover:bg-cyber-cyan-600/45 border border-cyber-cyan-500/30',
  );

  const clearBtn = createButton(
    'Clear',
    () => {
      state.errors = [];
      refreshErrorList();
    },
    'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-600/50',
  );

  const closeBtn = createButton(
    'Close',
    () => {
      state.userDismissed = true;
      setPanelVisible(false);
    },
    'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-600/50',
  );

  actions.appendChild(copyBtn);
  actions.appendChild(clearBtn);
  actions.appendChild(closeBtn);

  header.appendChild(titleWrap);
  header.appendChild(actions);

  const list = document.createElement('div');
  list.id = LIST_ID;
  list.className = 'min-h-0 flex-1 space-y-2 overflow-y-auto pr-1';

  const empty = document.createElement('p');
  empty.id = EMPTY_ID;
  empty.className = 'rounded-lg border border-gray-700/60 bg-black/20 p-3 text-xs text-gray-400';
  empty.textContent = 'No errors captured yet.';

  const footer = document.createElement('p');
  footer.className = 'mt-3 border-t border-white/10 pt-2 text-[11px] text-gray-500';
  footer.textContent = 'This console only stores errors locally for debugging.';

  list.appendChild(empty);
  inner.appendChild(header);
  inner.appendChild(list);
  inner.appendChild(footer);
  panel.appendChild(inner);
  root.appendChild(panel);

  listElement = list;
  emptyElement = empty;
  panelElement = panel;
}

function installDevTestShortcut(): void {
  if (!isRendererDev || isVitestEnv()) {
    return;
  }

  window.addEventListener('keydown', (event) => {
    const isShortcut =
      event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'e';
    if (!isShortcut) {
      return;
    }

    event.preventDefault();
    throw new Error('App Error Console test error');
  });
}

export function initAppErrorConsole(): void {
  if (window.__APP_ERROR_CONSOLE_INSTALLED__) {
    return;
  }
  window.__APP_ERROR_CONSOLE_INSTALLED__ = true;

  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    document.body.appendChild(root);
  }

  if (!document.getElementById(PANEL_ID)) {
    buildPanelUi(root);
    refreshErrorList();
    setPanelVisible(false);
  }

  window.addEventListener('error', handleWindowError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  installDevTestShortcut();
}
