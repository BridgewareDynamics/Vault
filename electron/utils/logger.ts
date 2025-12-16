import log from 'electron-log';
import { app } from 'electron';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

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
  log: (...args: any[]) => {
    log.info(...args);
  },
  info: (...args: any[]) => {
    log.info(...args);
  },
  warn: (...args: any[]) => {
    log.warn(...args);
  },
  error: (...args: any[]) => {
    log.error(...args);
  },
  debug: (...args: any[]) => {
    if (isDev) {
      log.debug(...args);
    }
  },
};

// Export the raw log instance for advanced usage if needed
export { log };




