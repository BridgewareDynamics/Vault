// path: src/utils/debugLogger.ts

/**
 * Conditional debug logger for word editor components.
 * Only logs in development mode or when explicitly enabled.
 * 
 * In production builds, all debug logs are disabled to reduce bundle size and improve performance.
 */

const isDebugEnabled = (): boolean => {
  // Enable debug logging in development mode
  if (import.meta.env.DEV) {
    return true;
  }
  
  // Allow explicit enable via localStorage flag (for production debugging)
  if (typeof window !== 'undefined' && localStorage.getItem('enable-word-editor-debug') === 'true') {
    return true;
  }
  
  return false;
};

interface DebugLogData {
  location: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp?: number;
  sessionId?: string;
  runId?: string;
  hypothesisId?: string;
}

/**
 * Conditionally logs debug information for word editor components.
 * 
 * @param logData - Debug log data object
 */
export function debugLog(logData: DebugLogData): void {
  if (!isDebugEnabled()) {
    return;
  }

  // Only log if electronAPI is available
  if (window.electronAPI?.debugLog) {
    const fullLogData = {
      location: logData.location,
      message: logData.message,
      data: logData.data,
      timestamp: logData.timestamp ?? Date.now(),
      sessionId: logData.sessionId ?? 'default',
      runId: logData.runId ?? 'default',
      hypothesisId: logData.hypothesisId ?? 'default',
    };
    
    // Fire and forget - don't block execution
    window.electronAPI.debugLog(fullLogData).catch(() => {
      // Silently fail if logging fails
    });
  }
}







