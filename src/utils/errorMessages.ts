/**
 * Centralized error message mapping utility
 * Converts technical error messages to user-friendly, actionable guidance
 */

export interface ErrorContext {
  operation?: string;
  fileName?: string;
  path?: string;
}

/**
 * Maps technical error messages to user-friendly ones
 */
export function getUserFriendlyError(error: unknown, _context?: ErrorContext): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // PDF Extraction Errors
  if (lowerMessage.includes('electron api not available') || lowerMessage.includes('electron api not available')) {
    return 'Application not fully loaded. Please refresh the page.';
  }

  if (lowerMessage.includes('invalid pdf') || lowerMessage.includes('not a valid pdf') || lowerMessage.includes('corrupted')) {
    return 'The selected file is not a valid PDF or is corrupted. Please select a different file.';
  }

  if (lowerMessage.includes('pdf file does not exist') || lowerMessage.includes('file does not exist')) {
    return 'The PDF file could not be found. It may have been moved or deleted.';
  }

  if (lowerMessage.includes('failed to read pdf') || lowerMessage.includes('unable to read')) {
    return 'Unable to read the PDF file. Please check that the file exists and you have permission to access it.';
  }

  if (lowerMessage.includes('pdf.js') || lowerMessage.includes('pdfjs') || lowerMessage.includes('unexpected pdf file data format')) {
    return 'Failed to process PDF. The file may be corrupted or in an unsupported format.';
  }

  if (lowerMessage.includes('canvas context') || lowerMessage.includes('failed to get canvas')) {
    return 'Unable to render PDF pages. Please try again or select a different file.';
  }

  // File Operation Errors
  if (lowerMessage.includes('invalid path') || lowerMessage.includes('invalid file path') || lowerMessage.includes('invalid directory')) {
    return 'The selected path is invalid. Please select a different location.';
  }

  if (lowerMessage.includes('permission denied') || lowerMessage.includes('eacces') || lowerMessage.includes('eperm')) {
    return 'Permission denied. Please check that you have write access to the selected location.';
  }

  if (lowerMessage.includes('file not found') || lowerMessage.includes('enoent')) {
    return 'The file or folder could not be found. It may have been moved or deleted.';
  }

  if (lowerMessage.includes('already exists') || lowerMessage.includes('eexist')) {
    return 'A file or folder with this name already exists. Please choose a different name.';
  }

  if (lowerMessage.includes('failed to delete') || lowerMessage.includes('unable to delete')) {
    return 'Unable to delete. The file may be in use or you may not have permission.';
  }

  if (lowerMessage.includes('failed to rename') || lowerMessage.includes('unable to rename')) {
    return 'Unable to rename. Please check that the new name is valid and you have permission.';
  }

  if (lowerMessage.includes('invalid folder name') || lowerMessage.includes('invalid case name')) {
    return 'The name contains invalid characters. Please use only letters, numbers, spaces, hyphens, and underscores.';
  }

  // IPC Communication Errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'The operation timed out. Please try again.';
  }

  if (lowerMessage.includes('connection lost') || lowerMessage.includes('ipc') && lowerMessage.includes('failed')) {
    return 'Lost connection to the application. Please refresh.';
  }

  // Archive-specific errors
  if (lowerMessage.includes('archive drive not set')) {
    return 'Vault directory not configured. Please select a vault directory first.';
  }

  if (lowerMessage.includes('case folder already exists')) {
    return 'A case with this name already exists. Please choose a different name.';
  }

  // Generic fallback
  if (errorMessage.includes('Failed to') || errorMessage.includes('Error:') || errorMessage.includes('failed')) {
    // Try to extract a more user-friendly message from the error
    const cleanMessage = errorMessage
      .replace(/^Error:\s*/i, '')
      .replace(/^Failed to\s*/i, '')
      .trim();
    
    if (cleanMessage && cleanMessage.length < 100) {
      return cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1) + '.';
    }
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again or restart the application.';
}

/**
 * Gets actionable guidance for specific error types
 */
export function getErrorGuidance(error: unknown, _context?: ErrorContext): string | null {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('permission denied') || lowerMessage.includes('eacces') || lowerMessage.includes('eperm')) {
    return 'Try running the application with administrator privileges or select a different location.';
  }

  if (lowerMessage.includes('file not found') || lowerMessage.includes('enoent')) {
    return 'Check that the file path is correct and the file has not been moved.';
  }

  if (lowerMessage.includes('invalid pdf') || lowerMessage.includes('corrupted')) {
    return 'Try opening the PDF in another application to verify it is not corrupted.';
  }

  if (lowerMessage.includes('timeout')) {
    return 'The file may be very large. Please wait a moment and try again.';
  }

  return null;
}

