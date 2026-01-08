import log from 'electron-log';
import { app } from 'electron';

// Type definitions for logger
type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';
type LogArgs = Parameters<typeof console.log>;

// More robust dev detection - prioritize !app.isPackaged
const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';

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
    log.info(...args);
  },
  info: (...args: LogArgs) => {
    log.info(...args);
  },
  warn: (...args: LogArgs) => {
    log.warn(...args);
  },
  error: (...args: LogArgs) => {
    log.error(...args);
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








