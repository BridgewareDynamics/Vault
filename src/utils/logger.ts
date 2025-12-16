// Renderer-side logger utility
// Routes logs to main process via IPC in production, uses console in dev mode

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Logger utility for renderer process
 * - In development: logs to console for convenience
 * - In production: routes logs to main process via IPC
 */
export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    } else if (window.electronAPI?.logToMain) {
      window.electronAPI.logToMain('log', ...args).catch(() => {
        // Fallback to console if IPC fails
        console.log(...args);
      });
    } else {
      // Fallback if Electron API not available
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    } else if (window.electronAPI?.logToMain) {
      window.electronAPI.logToMain('info', ...args).catch(() => {
        console.info(...args);
      });
    } else {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    } else if (window.electronAPI?.logToMain) {
      window.electronAPI.logToMain('warn', ...args).catch(() => {
        console.warn(...args);
      });
    } else {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    // Always log errors to console as well for critical visibility
    console.error(...args);
    
    // Also route to main process if available
    if (!isDev && window.electronAPI?.logToMain) {
      window.electronAPI.logToMain('error', ...args).catch(() => {
        // Already logged to console above
      });
    }
  },

  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    } else if (window.electronAPI?.logToMain) {
      window.electronAPI.logToMain('debug', ...args).catch(() => {
        // Silent in production if IPC fails
      });
    }
  },
};



