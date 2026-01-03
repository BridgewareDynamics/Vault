import { useState, useCallback } from 'react';
import { useToast } from '../components/Toast/ToastContext';

export interface RedactionAuditResult {
  filename: string;
  totalPages: number;
  flaggedPages: Array<{
    pageNumber: number;
    blackRectCount: number;
    overlapCount: number;
    confidenceScore: number;
  }>;
  security?: {
    // Basic checks
    has_metadata: boolean;
    metadata_keys: string[];
    metadata_details?: Record<string, string>;
    has_attachments: boolean;
    attachment_count: number;
    attachment_names?: string[];
    has_annotations: boolean;
    annotation_count: number;
    annotation_types?: string[];
    has_forms: boolean;
    form_field_count: number;
    has_layers: boolean;
    layer_count: number;
    has_javascript: boolean;
    javascript_count?: number;
    has_actions: boolean;
    has_thumbnails: boolean;
    incremental_updates?: boolean;
    incremental_updates_suspected?: boolean; // Legacy support
    version_count?: number;
    // Advanced checks
    has_hidden_text?: boolean;
    hidden_text_types?: string[];
    white_on_white_pages?: number[];
    offpage_text_pages?: number[];
    overlay_risk?: string;
    reviewer_names?: string[];
    has_ocr_layer?: boolean;
    ocr_pages?: number[];
    is_scanned?: boolean;
    has_external_links?: boolean;
    external_urls?: string[];
    has_remote_resources?: boolean;
    has_signatures?: boolean;
    signature_count?: number;
    signer_names?: string[];
    has_structure_tags?: boolean;
    has_alt_text?: boolean;
    has_watermarks?: boolean;
    risk_score?: number;
    notes: string[];
  };
  error?: string;
}

export interface AuditOptions {
  blackThreshold?: number;
  minOverlapArea?: number;
  minHits?: number;
  includeSecurityAudit?: boolean;
}

export function useRedactionAudit() {
  const [isAuditing, setIsAuditing] = useState(false);
  const [result, setResult] = useState<RedactionAuditResult | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const toast = useToast();

  const auditPDF = useCallback(async (
    pdfPath: string,
    options: AuditOptions = {}
  ) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    setIsAuditing(true);
    setResult(null);
    setProgressMessage('Initializing...');

    try {
      // Set up progress listener - update UI state only, no toast spam
      const removeListener = window.electronAPI.onAuditProgress((message: string) => {
        setProgressMessage(message);
        // No toast updates here - progress is visible in button and progress indicator
      });

      // Show initial toast only
      toast.info('Running security audit...', 3000);
      
      const auditResult = await window.electronAPI.auditPDFRedaction(pdfPath, options);
      
      // Clean up listener
      removeListener();
      setResult(auditResult);
      
      // Only show completion toasts (errors or results)
      if (auditResult.error) {
        toast.error(`Audit error: ${auditResult.error}`, 5000);
      } else if (auditResult.flaggedPages.length > 0) {
        toast.success(
          `Found ${auditResult.flaggedPages.length} flagged page(s)`,
          4000
        );
      } else {
        toast.success('No redaction risks detected', 3000);
      }
      
      return auditResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Audit failed';
      
      // Provide more helpful error messages
      let errorMessage = message;
      if (message.includes('Python 3.11+ is required')) {
        errorMessage = 'Python 3.11+ is required. Please install Python from python.org';
      } else if (message.includes('pip install')) {
        errorMessage = 'Python dependencies installation failed. Please install manually: pip install pymupdf';
      } else if (message.includes('PyMuPDF')) {
        errorMessage = 'PyMuPDF library is missing. The app will try to install it automatically on next run.';
      }
      
      toast.error(`Security audit failed: ${errorMessage}`, 8000);
      throw error;
    } finally {
      setIsAuditing(false);
      setProgressMessage('');
    }
  }, [toast]);

  // Expose setResult so components can restore result state (e.g., when reattaching from detached window)
  const setResultState = useCallback((newResult: RedactionAuditResult | null) => {
    setResult(newResult);
  }, []);

  return {
    isAuditing,
    result,
    progressMessage,
    auditPDF,
    setResult: setResultState,
  };
}
