import log from 'electron-log';
import { app } from 'electron';
import * as crypto from 'crypto';

// Type definitions for logger
type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';
type LogArgs = Parameters<typeof console.log>;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

/**
 * Produce a short, stable, non-reversible token for a sensitive value. Used so
 * that the same path/case name maps to the same token across log lines (handy
 * for correlating events) without persisting the plaintext.
 */
function hashToken(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 10);
}

/**
 * Redact a single absolute path or case name for persisted logs.
 *
 * In development this is a no-op so console output stays readable; in
 * production (where logs are written to file) it returns a stable hash token so
 * case names and absolute paths are never stored in plaintext. Prefer wrapping
 * sensitive values at the call site with this helper.
 */
export function redactPath(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return String(value);
  }
  if (isDev) {
    return value;
  }
  return `<path#${hashToken(value)}>`;
}

// Defense-in-depth scrubber for persisted logs: catches absolute Windows/drive
// paths (e.g. `D:\The Vault App\Case\file.png` or `D:/...`) that slip into log
// strings or error messages without an explicit redactPath() wrap. The negative
// lookbehind avoids matching URL schemes like `http://`.
const WINDOWS_PATH_REGEX = /(?<![A-Za-z])[A-Za-z]:[\\/][^\r\n"'`]*/g;

function scrubString(value: string): string {
  return value.replace(WINDOWS_PATH_REGEX, (match) => `<path#${hashToken(match.trimEnd())}>`);
}

function scrubArg(arg: unknown): unknown {
  if (typeof arg === 'string') {
    return scrubString(arg);
  }
  if (arg instanceof Error) {
    const cloned = new Error(scrubString(arg.message));
    cloned.name = arg.name;
    if (arg.stack) {
      cloned.stack = scrubString(arg.stack);
    }
    return cloned;
  }
  return arg;
}

function scrubArgs(args: LogArgs): LogArgs {
  // Keep development logs fully readable; only scrub what gets persisted.
  if (isDev) {
    return args;
  }
  return args.map(scrubArg) as LogArgs;
}

// Configure electron-log
if (!isDev) {
  // In production, log to file in user data directory
  log.transports.file.level = 'info';
  log.transports.console.level = false; // Disable console in production
} else {
  // In development, log to console
  log.transports.console.level = 'debug';
  log.transports.file.level = false; // Disable file logging in dev
}

// Set log file location (electron-log handles this automatically, but we can customize)
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB max file size

// Create a logger interface that matches console API for easy migration
export const logger = {
  log: (...args: LogArgs) => {
    log.info(...scrubArgs(args));
  },
  info: (...args: LogArgs) => {
    log.info(...scrubArgs(args));
  },
  warn: (...args: LogArgs) => {
    log.warn(...scrubArgs(args));
  },
  error: (...args: LogArgs) => {
    log.error(...scrubArgs(args));
  },
  debug: (...args: LogArgs) => {
    if (isDev) {
      log.debug(...args);
    }
  },
};

// Export types for use in other electron files
export type { LogLevel, LogArgs };

// Export the raw log instance for advanced usage if needed
export { log };








