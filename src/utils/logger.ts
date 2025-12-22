// Renderer-side logger utility
// Routes logs to main process via IPC in production, uses console in dev mode

import { LogLevel, LogArgs } from '../types';

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Logger utility for renderer process
 * - In development: logs to console for convenience
 * - In production: routes logs to main process via IPC
 */
// Type guard for electronAPI
function hasLogToMain(api: typeof window.electronAPI): api is typeof window.electronAPI & { logToMain: (level: LogLevel, ...args: LogArgs) => Promise<void> } {
  return api !== undefined && 'logToMain' in api && typeof api.logToMain === 'function';
}

export const logger = {
  log: (...args: LogArgs) => {
    if (isDev) {
      console.log(...args);
    } else if (hasLogToMain(window.electronAPI)) {
      window.electronAPI.logToMain('log', ...args).catch(() => {
        // Fallback to console if IPC fails
        console.log(...args);
      });
    } else {
      // Fallback if Electron API not available
      console.log(...args);
    }
  },

  info: (...args: LogArgs) => {
    if (isDev) {
      console.info(...args);
    } else if (hasLogToMain(window.electronAPI)) {
      window.electronAPI.logToMain('info', ...args).catch(() => {
        console.info(...args);
      });
    } else {
      console.info(...args);
    }
  },

  warn: (...args: LogArgs) => {
    if (isDev) {
      console.warn(...args);
    } else if (hasLogToMain(window.electronAPI)) {
      window.electronAPI.logToMain('warn', ...args).catch(() => {
        console.warn(...args);
      });
    } else {
      console.warn(...args);
    }
  },

  error: (...args: LogArgs) => {
    // Always log errors to console as well for critical visibility
    console.error(...args);
    
    // Also route to main process if available
    if (!isDev && hasLogToMain(window.electronAPI)) {
      window.electronAPI.logToMain('error', ...args).catch(() => {
        // Already logged to console above
      });
    }
  },

  debug: (...args: LogArgs) => {
    if (isDev) {
      console.debug(...args);
    } else if (hasLogToMain(window.electronAPI)) {
      window.electronAPI.logToMain('debug', ...args).catch(() => {
        // Silent in production if IPC fails
      });
    }
  },
};



