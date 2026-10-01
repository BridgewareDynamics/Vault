export interface CapturedError {
  id: string;
  message: string;
  source: string;
  line: number | null;
  column: number | null;
  stack: string | null;
  timestamp: string;
}

const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const API_KEY_PATTERN = /\b(sk-[A-Za-z0-9]{16,}|api[_-]?key\s*[:=]\s*["']?[^\s"']+)/gi;
const LONG_BASE64_PATTERN = /[A-Za-z0-9+/]{80,}={0,2}/g;
const ENV_ASSIGNMENT_PATTERN =
  /(?:process\.env\.[A-Z0-9_]+|VITE_[A-Z0-9_]+)\s*[:=]\s*["']?[^\s"']+/gi;
const STORAGE_PATTERN =
  /(?:localStorage|sessionStorage|document\.cookie)\s*[[.(][^\n]{0,200}/gi;

const WINDOWS_PATH_PATTERN =
  /[A-Za-z]:\\(?:[^\\:*?"<>|\r\n]+\\)*[^\\:*?"<>|\r\n]+/g;
const UNIX_PATH_PATTERN =
  /(?:\/(?:Users|home|var|tmp|opt|mnt|Volumes)(?:\/[^/\s:,)]+)+)/g;
const URL_IN_STACK_PATTERN = /https?:\/\/[^\s/]+(\/[^\s:]+)(:\d+:\d+)?/g;
const URL_PATTERN = /https?:\/\/[^\s/]+(\/[^\s]*)?/g;

function basenameFromPath(pathPart: string): string {
  const trimmed = pathPart.replace(/\/$/, '');
  const segments = trimmed.split(/[\\/]/);
  return segments[segments.length - 1] || 'script';
}

function redactUrls(input: string): string {
  let result = input.replace(URL_IN_STACK_PATTERN, (_match, pathPart: string, lineCol = '') => {
    return `[source]/${basenameFromPath(pathPart)}${lineCol}`;
  });

  result = result.replace(URL_PATTERN, (_match, pathPart = '') => {
    if (!pathPart) {
      return '[source]';
    }
    return `[source]/${basenameFromPath(pathPart)}`;
  });

  return result;
}

function redactFilePaths(input: string): string {
  let result = input.replace(WINDOWS_PATH_PATTERN, (match) => {
    const parts = match.split(/[\\/]/);
    const base = parts[parts.length - 1] || 'file';
    return `[path]/${base}`;
  });

  result = result.replace(UNIX_PATH_PATTERN, (match) => {
    const parts = match.split('/');
    const base = parts[parts.length - 1] || 'file';
    return `[path]/${base}`;
  });

  return result;
}

export function redactSensitiveText(input: string): string {
  if (!input) {
    return '';
  }

  let result = input;
  result = result.replace(BEARER_PATTERN, 'Bearer [redacted]');
  result = result.replace(JWT_PATTERN, '[jwt redacted]');
  result = result.replace(API_KEY_PATTERN, '[api-key redacted]');
  result = result.replace(LONG_BASE64_PATTERN, '[base64 redacted]');
  result = result.replace(ENV_ASSIGNMENT_PATTERN, '[env redacted]');
  result = result.replace(STORAGE_PATTERN, '[storage redacted]');
  result = redactUrls(result);
  result = redactFilePaths(result);
  return result;
}

export function normalizeErrorReason(reason: unknown): { message: string; stack?: string } {
  if (reason instanceof Error) {
    return {
      message: reason.message || 'Unknown error',
      stack: reason.stack,
    };
  }

  if (typeof reason === 'string') {
    return { message: reason };
  }

  if (typeof reason === 'object' && reason !== null) {
    const maybeMessage = (reason as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      const maybeStack = (reason as { stack?: unknown }).stack;
      return {
        message: maybeMessage,
        stack: typeof maybeStack === 'string' ? maybeStack : undefined,
      };
    }

    try {
      return { message: JSON.stringify(reason) };
    } catch {
      return { message: 'Non-serializable rejection reason' };
    }
  }

  return { message: String(reason) };
}

export function sanitizeSource(source: string | undefined | null): string {
  if (!source) {
    return 'unknown';
  }
  return redactSensitiveText(source);
}

export function createCapturedError(params: {
  message: string;
  source?: string;
  line?: number | null;
  column?: number | null;
  stack?: string | null;
  timestamp?: string;
  id?: string;
}): CapturedError {
  return {
    id: params.id ?? crypto.randomUUID(),
    message: redactSensitiveText(params.message),
    source: sanitizeSource(params.source),
    line: params.line ?? null,
    column: params.column ?? null,
    stack: params.stack ? redactSensitiveText(params.stack) : null,
    timestamp: params.timestamp ?? new Date().toISOString(),
  };
}

export function formatErrorRecord(record: CapturedError): string {
  const lines = [
    `--- Error ${record.id} ---`,
    `Timestamp: ${record.timestamp}`,
    `Message: ${record.message}`,
    `Source: ${record.source}`,
  ];

  if (record.line !== null) {
    lines.push(`Line: ${record.line}`);
  }
  if (record.column !== null) {
    lines.push(`Column: ${record.column}`);
  }
  if (record.stack) {
    lines.push(`Stack:\n${record.stack}`);
  }

  return lines.join('\n');
}

export function formatAllErrors(records: CapturedError[]): string {
  if (records.length === 0) {
    return 'No errors captured.';
  }
  return records.map(formatErrorRecord).join('\n\n');
}
