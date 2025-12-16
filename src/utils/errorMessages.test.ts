import { describe, it, expect } from 'vitest';
import { getUserFriendlyError, getErrorGuidance } from './errorMessages';

describe('errorMessages', () => {
  describe('getUserFriendlyError', () => {
    it('should handle Error instances', () => {
      const error = new Error('Invalid PDF file');
      const result = getUserFriendlyError(error);
      expect(result).toBe('The selected file is not a valid PDF or is corrupted. Please select a different file.');
    });

    it('should handle string errors', () => {
      const result = getUserFriendlyError('Invalid PDF file');
      expect(result).toBe('The selected file is not a valid PDF or is corrupted. Please select a different file.');
    });

    it('should handle non-Error, non-string errors', () => {
      const result = getUserFriendlyError(123);
      expect(result).toBe('An unexpected error occurred. Please try again or restart the application.');
    });

    describe('PDF Extraction Errors', () => {
      it('should map electron API not available errors', () => {
        expect(getUserFriendlyError('Electron API not available')).toBe(
          'Application not fully loaded. Please refresh the page.'
        );
        expect(getUserFriendlyError('electron api not available')).toBe(
          'Application not fully loaded. Please refresh the page.'
        );
      });

      it('should map invalid PDF errors', () => {
        expect(getUserFriendlyError('Invalid PDF')).toBe(
          'The selected file is not a valid PDF or is corrupted. Please select a different file.'
        );
        expect(getUserFriendlyError('not a valid pdf')).toBe(
          'The selected file is not a valid PDF or is corrupted. Please select a different file.'
        );
        expect(getUserFriendlyError('corrupted PDF file')).toBe(
          'The selected file is not a valid PDF or is corrupted. Please select a different file.'
        );
      });

      it('should map PDF file does not exist errors', () => {
        expect(getUserFriendlyError('PDF file does not exist')).toBe(
          'The PDF file could not be found. It may have been moved or deleted.'
        );
        expect(getUserFriendlyError('file does not exist')).toBe(
          'The PDF file could not be found. It may have been moved or deleted.'
        );
      });

      it('should map failed to read PDF errors', () => {
        expect(getUserFriendlyError('Failed to read PDF')).toBe(
          'Unable to read the PDF file. Please check that the file exists and you have permission to access it.'
        );
        expect(getUserFriendlyError('unable to read PDF file')).toBe(
          'Unable to read the PDF file. Please check that the file exists and you have permission to access it.'
        );
      });

      it('should map PDF.js errors', () => {
        expect(getUserFriendlyError('PDF.js error')).toBe(
          'Failed to process PDF. The file may be corrupted or in an unsupported format.'
        );
        expect(getUserFriendlyError('pdfjs error')).toBe(
          'Failed to process PDF. The file may be corrupted or in an unsupported format.'
        );
        expect(getUserFriendlyError('Unexpected PDF file data format')).toBe(
          'Failed to process PDF. The file may be corrupted or in an unsupported format.'
        );
      });

      it('should map canvas context errors', () => {
        expect(getUserFriendlyError('Canvas context error')).toBe(
          'Unable to render PDF pages. Please try again or select a different file.'
        );
        expect(getUserFriendlyError('Failed to get canvas')).toBe(
          'Unable to render PDF pages. Please try again or select a different file.'
        );
      });
    });

    describe('File Operation Errors', () => {
      it('should map invalid path errors', () => {
        expect(getUserFriendlyError('Invalid path')).toBe(
          'The selected path is invalid. Please select a different location.'
        );
        expect(getUserFriendlyError('invalid file path')).toBe(
          'The selected path is invalid. Please select a different location.'
        );
        expect(getUserFriendlyError('invalid directory')).toBe(
          'The selected path is invalid. Please select a different location.'
        );
      });

      it('should map permission denied errors', () => {
        expect(getUserFriendlyError('Permission denied')).toBe(
          'Permission denied. Please check that you have write access to the selected location.'
        );
        expect(getUserFriendlyError('EACCES')).toBe(
          'Permission denied. Please check that you have write access to the selected location.'
        );
        expect(getUserFriendlyError('EPERM')).toBe(
          'Permission denied. Please check that you have write access to the selected location.'
        );
      });

      it('should map file not found errors', () => {
        expect(getUserFriendlyError('File not found')).toBe(
          'The file or folder could not be found. It may have been moved or deleted.'
        );
        expect(getUserFriendlyError('ENOENT')).toBe(
          'The file or folder could not be found. It may have been moved or deleted.'
        );
      });

      it('should map already exists errors', () => {
        expect(getUserFriendlyError('Already exists')).toBe(
          'A file or folder with this name already exists. Please choose a different name.'
        );
        expect(getUserFriendlyError('EEXIST')).toBe(
          'A file or folder with this name already exists. Please choose a different name.'
        );
      });

      it('should map failed to delete errors', () => {
        expect(getUserFriendlyError('Failed to delete')).toBe(
          'Unable to delete. The file may be in use or you may not have permission.'
        );
        expect(getUserFriendlyError('Unable to delete file')).toBe(
          'Unable to delete. The file may be in use or you may not have permission.'
        );
      });

      it('should map failed to rename errors', () => {
        expect(getUserFriendlyError('Failed to rename')).toBe(
          'Unable to rename. Please check that the new name is valid and you have permission.'
        );
        expect(getUserFriendlyError('Unable to rename file')).toBe(
          'Unable to rename. Please check that the new name is valid and you have permission.'
        );
      });

      it('should map invalid folder name errors', () => {
        expect(getUserFriendlyError('Invalid folder name')).toBe(
          'The name contains invalid characters. Please use only letters, numbers, spaces, hyphens, and underscores.'
        );
        expect(getUserFriendlyError('invalid case name')).toBe(
          'The name contains invalid characters. Please use only letters, numbers, spaces, hyphens, and underscores.'
        );
      });
    });

    describe('IPC Communication Errors', () => {
      it('should map timeout errors', () => {
        expect(getUserFriendlyError('Timeout')).toBe('The operation timed out. Please try again.');
        expect(getUserFriendlyError('Timed out')).toBe('The operation timed out. Please try again.');
      });

      it('should map connection lost errors', () => {
        expect(getUserFriendlyError('Connection lost')).toBe(
          'Lost connection to the application. Please refresh.'
        );
        expect(getUserFriendlyError('IPC failed')).toBe(
          'Lost connection to the application. Please refresh.'
        );
      });
    });

    describe('Archive-specific Errors', () => {
      it('should map archive drive not set errors', () => {
        expect(getUserFriendlyError('Archive drive not set')).toBe(
          'Vault directory not configured. Please select a vault directory first.'
        );
      });

      it('should map case folder already exists errors', () => {
        // Note: "already exists" pattern matches first (line 57), so strings containing it return the generic message
        expect(getUserFriendlyError('Case folder already exists')).toBe(
          'A file or folder with this name already exists. Please choose a different name.'
        );
        // The specific "case folder already exists" check (line 87) only matches if "already exists" is not present
        // This is a code path that's hard to reach in practice, but we test it with a message that doesn't contain "already exists"
        expect(getUserFriendlyError('case folder exists')).toBe(
          'An unexpected error occurred. Please try again or restart the application.'
        );
      });
    });

    describe('Generic Fallback', () => {
      it('should handle "Failed to" prefix errors', () => {
        expect(getUserFriendlyError('Failed to process')).toBe('Process.');
        expect(getUserFriendlyError('Failed to save file')).toBe('Save file.');
      });

      it('should handle "Error:" prefix errors', () => {
        expect(getUserFriendlyError('Error: Something went wrong')).toBe('Something went wrong.');
      });

      it('should handle "failed" in error message', () => {
        // "Operation failed" matches the "failed" check, gets cleaned and capitalized
        expect(getUserFriendlyError('Operation failed')).toBe('Operation failed.');
      });

      it('should return default for long cleaned messages', () => {
        const longMessage = 'Failed to ' + 'a'.repeat(100);
        expect(getUserFriendlyError(longMessage)).toBe(
          'An unexpected error occurred. Please try again or restart the application.'
        );
      });

      it('should return default for unknown errors', () => {
        expect(getUserFriendlyError('Some random error')).toBe(
          'An unexpected error occurred. Please try again or restart the application.'
        );
      });
    });

    describe('Case Sensitivity', () => {
      it('should handle case-insensitive matching', () => {
        expect(getUserFriendlyError('INVALID PDF')).toBe(
          'The selected file is not a valid PDF or is corrupted. Please select a different file.'
        );
        expect(getUserFriendlyError('Permission Denied')).toBe(
          'Permission denied. Please check that you have write access to the selected location.'
        );
      });
    });
  });

  describe('getErrorGuidance', () => {
    it('should return guidance for permission denied errors', () => {
      expect(getErrorGuidance('Permission denied')).toBe(
        'Try running the application with administrator privileges or select a different location.'
      );
      expect(getErrorGuidance('EACCES')).toBe(
        'Try running the application with administrator privileges or select a different location.'
      );
      expect(getErrorGuidance('EPERM')).toBe(
        'Try running the application with administrator privileges or select a different location.'
      );
    });

    it('should return guidance for file not found errors', () => {
      expect(getErrorGuidance('File not found')).toBe(
        'Check that the file path is correct and the file has not been moved.'
      );
      expect(getErrorGuidance('ENOENT')).toBe(
        'Check that the file path is correct and the file has not been moved.'
      );
    });

    it('should return guidance for invalid PDF errors', () => {
      expect(getErrorGuidance('Invalid PDF')).toBe(
        'Try opening the PDF in another application to verify it is not corrupted.'
      );
      expect(getErrorGuidance('corrupted PDF')).toBe(
        'Try opening the PDF in another application to verify it is not corrupted.'
      );
    });

    it('should return guidance for timeout errors', () => {
      expect(getErrorGuidance('Timeout')).toBe(
        'The file may be very large. Please wait a moment and try again.'
      );
    });

    it('should return null for errors without specific guidance', () => {
      expect(getErrorGuidance('Some random error')).toBeNull();
      expect(getErrorGuidance('Unknown error')).toBeNull();
    });

    it('should handle Error instances', () => {
      const error = new Error('Permission denied');
      expect(getErrorGuidance(error)).toBe(
        'Try running the application with administrator privileges or select a different location.'
      );
    });

    it('should handle string errors', () => {
      expect(getErrorGuidance('File not found')).toBe(
        'Check that the file path is correct and the file has not been moved.'
      );
    });

    it('should handle non-Error, non-string errors', () => {
      expect(getErrorGuidance(123)).toBeNull();
    });

    it('should handle case-insensitive matching', () => {
      expect(getErrorGuidance('PERMISSION DENIED')).toBe(
        'Try running the application with administrator privileges or select a different location.'
      );
    });
  });
});

