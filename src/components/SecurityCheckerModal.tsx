import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, FileText, AlertTriangle, CheckCircle, Loader2, Upload, Settings, Download, Maximize2, Zap, Lock, FolderOpen } from 'lucide-react';
import { useRedactionAudit, RedactionAuditResult } from '../hooks/useRedactionAudit';
import { useToast } from './Toast/ToastContext';
import { CaseSelectionDialog } from './Archive/CaseSelectionDialog';

interface SecurityCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPdfPath?: string | null;
  caseFolderPath?: string | null;
  onReportSaved?: () => void;
}

export function SecurityCheckerModal({ isOpen, onClose, initialPdfPath, caseFolderPath, onReportSaved }: SecurityCheckerModalProps) {
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    blackThreshold: 0.15,
    minOverlapArea: 4.0,
    minHits: 1,
    includeSecurityAudit: true,
  });
  const { isAuditing, result, progressMessage, auditPDF, setResult } = useRedactionAudit();
  const toast = useToast();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showCaseSelectionDialog, setShowCaseSelectionDialog] = useState(false);

  const handleSelectFile = async () => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return;
      }

      const filePath = await window.electronAPI.selectPDFFile();
      if (filePath) {
        setPdfPath(filePath);
        toast.info('PDF file selected');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to select file');
    }
  };

  const handleRunAudit = async () => {
    if (!pdfPath) {
      toast.error('Please select a PDF file first');
      return;
    }

    try {
      await auditPDF(pdfPath, settings);
    } catch (error) {
      // Check if it's a Python installation error and provide helpful message
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Python 3.11+ is required')) {
        toast.error('Python 3.11+ is required. Please install Python from python.org', 8000);
      } else if (errorMessage.includes('pip install')) {
        toast.error('Failed to install Python dependencies. Please run: pip install pymupdf', 8000);
      }
      // Other errors already handled by hook
    }
  };

  const handleClose = () => {
    setPdfPath(null);
    setShowSettings(false);
    onClose();
  };

  const handleDetach = async () => {
    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        return;
      }

      // Prepare state to transfer
      const state = {
        pdfPath,
        settings,
        showSettings,
        result: result || null,
        isAuditing,
        progressMessage,
      };

      console.log('SecurityCheckerModal: Detaching with state', {
        hasResult: !!result,
        resultFilename: result?.filename,
        pdfPath,
        isAuditing,
      });

      // Create detached window
      await window.electronAPI.createPdfAuditWindow(state);

      // Close modal after detaching
      onClose();
      toast.info('Audit opened in separate window');
    } catch (error) {
      toast.error('Failed to open audit in separate window');
      console.error('Detach error:', error);
    }
  };

  // Set initial PDF path when modal opens
  useEffect(() => {
    if (isOpen && initialPdfPath) {
      setPdfPath(initialPdfPath);
    } else if (!isOpen) {
      // Clear PDF path when modal closes
      setPdfPath(null);
    }
  }, [isOpen, initialPdfPath]);

  // Listen for reattach data from detached window
  useEffect(() => {
    const handleReattach = (event: CustomEvent<{
      pdfPath: string | null;
      settings: {
        blackThreshold: number;
        minOverlapArea: number;
        minHits: number;
        includeSecurityAudit: boolean;
      };
      showSettings: boolean;
      result: RedactionAuditResult | null;
      isAuditing: boolean;
      progressMessage: string;
    }>) => {
      const data = event.detail;
      
      // Restore state
      if (data.pdfPath) {
        setPdfPath(data.pdfPath);
      }
      if (data.settings) {
        setSettings(data.settings);
      }
      if (data.showSettings !== undefined) {
        setShowSettings(data.showSettings);
      }
      // Restore result if available (from detached window)
      if (data.result) {
        setResult(data.result);
      }
      // Note: isAuditing and progressMessage are managed by the hook and will be cleared
      // when the audit completes or when a new audit is started
    };

    window.addEventListener('reattach-pdf-audit-data' as any, handleReattach as EventListener);
    return () => {
      window.removeEventListener('reattach-pdf-audit-data' as any, handleReattach as EventListener);
    };
  }, [setResult]);

  // Helper function to format audit result for report generation
  const formatAuditResult = () => {
    if (!result) throw new Error('No audit result available');
    return {
        tool: "PDF Overlay Redaction Risk Checker",
        summary: {
          total_pdfs: 1,
          total_pages: result.totalPages,
          pdfs_with_risks: result.flaggedPages.length > 0 ? 1 : 0,
          total_flagged_pages: result.flaggedPages.length,
        },
        reports: [{
          filename: result.filename,
          total_pages: result.totalPages,
          error: result.error || null,
          flagged_pages: result.flaggedPages.map(p => ({
            page_number: p.pageNumber,
            black_rect_count: p.blackRectCount,
            overlap_count: p.overlapCount,
            confidence_score: p.confidenceScore,
          })),
          security: result.security ? {
            has_metadata: result.security.has_metadata,
            metadata_keys: result.security.metadata_keys || [],
            metadata_details: result.security.metadata_details || {},
            has_attachments: result.security.has_attachments,
            attachment_count: result.security.attachment_count || 0,
            attachment_names: result.security.attachment_names || [],
            has_annotations: result.security.has_annotations,
            annotation_count: result.security.annotation_count || 0,
            annotation_types: result.security.annotation_types || [],
            has_forms: result.security.has_forms,
            form_field_count: result.security.form_field_count || 0,
            has_layers: result.security.has_layers,
            layer_count: result.security.layer_count || 0,
            has_javascript: result.security.has_javascript,
            javascript_count: result.security.javascript_count || 0,
            has_actions: result.security.has_actions,
            has_thumbnails: result.security.has_thumbnails,
            incremental_updates: result.security.incremental_updates || result.security.incremental_updates_suspected || false,
            version_count: result.security.version_count || 0,
            has_hidden_text: result.security.has_hidden_text || false,
            hidden_text_types: result.security.hidden_text_types || [],
            white_on_white_pages: result.security.white_on_white_pages || [],
            offpage_text_pages: result.security.offpage_text_pages || [],
            overlay_risk: result.security.overlay_risk || "NO",
            reviewer_names: result.security.reviewer_names || [],
            has_ocr_layer: result.security.has_ocr_layer || false,
            ocr_pages: result.security.ocr_pages || [],
            is_scanned: result.security.is_scanned || false,
            has_external_links: result.security.has_external_links || false,
            external_urls: result.security.external_urls || [],
            has_remote_resources: result.security.has_remote_resources || false,
            has_signatures: result.security.has_signatures || false,
            signature_count: result.security.signature_count || 0,
            signer_names: result.security.signer_names || [],
            has_structure_tags: result.security.has_structure_tags || false,
            has_alt_text: result.security.has_alt_text || false,
            has_watermarks: result.security.has_watermarks || false,
            risk_score: result.security.risk_score || 0,
            notes: result.security.notes || [],
          } : null,
        }],
    };
  };

  // Helper function to generate report filename
  const generateReportFilename = (baseFilename: string) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const nameWithoutExt = baseFilename.replace(/\.pdf$/i, '');
    return `${nameWithoutExt}_security_audit_${timestamp}.pdf`;
  };

  const handleDownloadReport = async () => {
    if (!result || !window.electronAPI) return;

    setIsGeneratingReport(true);
    const toastId = toast.info('Preparing report...', 0);

    try {
      // Format audit result for report generation
      const auditResult = formatAuditResult();

      // Generate filename
      const defaultFilename = generateReportFilename(result.filename);

      // Show save dialog via IPC
      const saveResult = await window.electronAPI.showSaveDialog({
        title: 'Save Security Audit Report',
        defaultPath: defaultFilename,
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (saveResult.canceled || !saveResult.filePath) {
        toast.dismissToast(toastId);
        toast.info('Report generation cancelled', 2000);
        return;
      }

      toast.updateToast(toastId, 'Generating PDF report...', 'info');

      // Generate report
      const reportResult = await window.electronAPI.generateAuditReport(auditResult, saveResult.filePath);

      if (reportResult.success) {
        toast.dismissToast(toastId);
        toast.success('Report generated successfully!', 3000);
      } else {
        throw new Error(reportResult.error || 'Failed to generate report');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate report';
      toast.dismissToast(toastId);
      toast.error(`Report generation failed: ${message}`, 5000);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSaveToCaseFolder = async (selectedCasePath?: string) => {
    if (!result || !window.electronAPI) return;

    const targetCasePath = selectedCasePath || caseFolderPath;
    if (!targetCasePath) {
      // Show case selection dialog if no case path is provided
      setShowCaseSelectionDialog(true);
      return;
    }

    setIsGeneratingReport(true);
    const toastId = toast.info('Saving report to case folder...', 0);

    try {
      // Format audit result for report generation
      const auditResult = formatAuditResult();

      // Generate filename
      const reportFilename = generateReportFilename(result.filename);

      // Construct full path (use / as separator, main process will handle it)
      const reportPath = `${targetCasePath}/${reportFilename}`;

      toast.updateToast(toastId, 'Generating PDF report...', 'info');

      // Generate report directly to case folder
      const reportResult = await window.electronAPI.generateAuditReport(auditResult, reportPath);

      if (reportResult.success) {
        toast.dismissToast(toastId);
        toast.success('Report saved to case folder!', 3000);
        
        // Notify parent component that report was saved (for refreshing file list)
        if (onReportSaved) {
          onReportSaved();
        }
      } else {
        throw new Error(reportResult.error || 'Failed to generate report');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save report';
      toast.dismissToast(toastId);
      toast.error(`Report save failed: ${message}`, 5000);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleCaseSelected = (casePath: string) => {
    handleSaveToCaseFolder(casePath);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl border-2 border-cyber-purple-400/40 shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
              {/* Enhanced Header */}
              <div className="relative p-8 border-b border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                      <div className="relative p-5 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl shadow-2xl">
                        <Shield className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent">
                        PDF Security Audit
                      </h2>
                      <p className="text-base text-gray-400 mt-1">
                        Comprehensive redaction risk and security analysis
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDetach}
                      className="px-5 py-2.5 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl transition-all border border-gray-700/50 hover:border-cyber-purple-400/50 flex items-center gap-2 text-gray-300 hover:text-white"
                      aria-label="Detach audit to separate window"
                      title="Open in separate window"
                    >
                      <Maximize2 size={18} className="text-cyber-purple-400" />
                      <span className="font-medium text-sm">Detach</span>
                    </button>
                    <button
                      onClick={handleClose}
                      className="p-2.5 hover:bg-gray-800 rounded-xl transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Controls */}
                  <div className="space-y-6">
                    {/* Security Notice */}
                    <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border-2 border-yellow-600/50 rounded-2xl p-6 shadow-xl">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-yellow-600/20 rounded-xl">
                          <AlertTriangle className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-yellow-300 mb-2">Security Notice</h3>
                          <p className="text-sm text-yellow-200/90 leading-relaxed">
                            This tool detects risk indicators only. It does NOT extract or display any redacted content. 
                            All findings are heuristic and require manual verification.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* File Selection Card */}
                    <div className="bg-gray-800/60 backdrop-blur-sm border border-cyber-purple-400/20 rounded-2xl p-6 shadow-2xl">
                      <div className="space-y-5">
                        <div>
                          <label className="block text-lg font-bold text-gray-200 mb-4">Select PDF File</label>
                          <button
                            onClick={handleSelectFile}
                            disabled={isAuditing}
                            className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-bold text-white text-base transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Upload className="w-5 h-5" />
                            <span>{pdfPath ? 'Change PDF File' : 'Select PDF File'}</span>
                          </button>
                        </div>
                        
                        {pdfPath && (
                          <div className="flex items-center gap-4 p-4 bg-gray-900/60 rounded-xl border border-cyber-cyan-400/30">
                            <div className="p-2.5 bg-cyber-cyan-400/20 rounded-lg">
                              <FileText className="w-5 h-5 text-cyber-cyan-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-400 mb-1">Selected File</p>
                              <p className="text-sm text-gray-200 truncate font-medium">{pdfPath}</p>
                            </div>
                          </div>
                        )}

                        {/* Settings Toggle */}
                        <button
                          onClick={() => setShowSettings(!showSettings)}
                          className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-700/50 hover:bg-gray-700/70 rounded-xl transition-all border border-gray-600/50 hover:border-cyber-purple-400/50"
                          aria-label="Toggle Settings"
                        >
                          <div className="flex items-center gap-3">
                            <Settings className="w-5 h-5 text-gray-300" />
                            <span className="font-semibold text-gray-200">Advanced Settings</span>
                          </div>
                          <div className={`transform transition-transform ${showSettings ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-900/60 rounded-xl p-5 space-y-4 border border-cyber-purple-400/30"
                      >
                        <h3 className="text-base font-bold text-gray-200 mb-3">Audit Configuration</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">Black Threshold</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1"
                              value={settings.blackThreshold}
                              onChange={(e) => setSettings({ ...settings, blackThreshold: parseFloat(e.target.value) })}
                              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyber-purple-400 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">Min Overlap Area</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={settings.minOverlapArea}
                              onChange={(e) => setSettings({ ...settings, minOverlapArea: parseFloat(e.target.value) })}
                              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyber-purple-400 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">Min Hits</label>
                            <input
                              type="number"
                              min="1"
                              value={settings.minHits}
                              onChange={(e) => setSettings({ ...settings, minHits: parseInt(e.target.value) })}
                              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyber-purple-400 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Run Audit Button - Large and Prominent */}
                    <button
                      onClick={handleRunAudit}
                      disabled={!pdfPath || isAuditing}
                      className="w-full flex items-center justify-center gap-3 px-6 py-6 bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 hover:from-cyan-700 hover:via-purple-700 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-bold text-white text-lg transition-all disabled:cursor-not-allowed shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      {isAuditing ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin relative z-10" />
                          <span className="relative z-10">Analyzing Document...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-6 h-6 relative z-10" />
                          <span className="relative z-10">Run Security Audit</span>
                        </>
                      )}
                    </button>

                    {/* Progress Indicator */}
                    {isAuditing && progressMessage && (
                      <div className="bg-gradient-to-r from-cyan-900/40 to-purple-900/40 rounded-xl p-5 border-2 border-cyber-cyan-400/30">
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                          <div className="flex-1">
                            <p className="text-base font-semibold text-cyan-300 mb-1">Processing...</p>
                            <p className="text-sm text-gray-300">{progressMessage}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Results */}
                  <div className="space-y-6">
                    {!result ? (
                      <div className="h-full flex items-center justify-center min-h-[400px]">
                        <div className="text-center space-y-4">
                          <div className="inline-flex p-5 bg-gray-800/50 rounded-2xl border border-cyber-purple-400/20">
                            <Lock className="w-12 h-12 text-cyber-purple-400/50" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-300 mb-2">Ready to Audit</h3>
                            <p className="text-gray-400">Select a PDF file and run the security audit to see results here</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        {/* Results Header */}
                        <div className="flex items-center justify-between bg-gray-800/60 backdrop-blur-sm border border-cyber-purple-400/20 rounded-2xl p-5 shadow-xl">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-xl">
                              <Lock className="w-6 h-6 text-cyber-purple-400" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-200">Audit Results</h3>
                              <p className="text-xs text-gray-400">{result.totalPages} pages analyzed</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleSaveToCaseFolder()}
                              disabled={isGeneratingReport}
                              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-bold text-white transition-all disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl text-sm"
                              title={caseFolderPath ? "Save report to current case folder" : "Save report to a case"}
                            >
                              {isGeneratingReport ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <FolderOpen className="w-4 h-4" />
                                  <span>{caseFolderPath ? 'Save to Current Case' : 'Save to Case'}</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleDownloadReport}
                              disabled={isGeneratingReport}
                              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-bold text-white transition-all disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl text-sm"
                            >
                              {isGeneratingReport ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4" />
                                  <span>Download Report</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Summary Card */}
                        <div className={`rounded-2xl p-6 border-2 shadow-2xl ${
                          result.flaggedPages.length > 0 
                            ? 'bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-600/50' 
                            : 'bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-600/50'
                        }`}>
                          <div className="flex items-center gap-5">
                            <div className={`p-5 rounded-2xl ${
                              result.flaggedPages.length > 0 ? 'bg-red-600/20' : 'bg-green-600/20'
                            }`}>
                              {result.flaggedPages.length > 0 ? (
                                <AlertTriangle className="w-10 h-10 text-red-400" />
                              ) : (
                                <CheckCircle className="w-10 h-10 text-green-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-2xl font-bold text-white mb-1">
                                {result.flaggedPages.length > 0
                                  ? `${result.flaggedPages.length} Page${result.flaggedPages.length !== 1 ? 's' : ''} Flagged`
                                  : 'No Risks Detected'}
                              </div>
                              <div className="text-base text-gray-300">
                                {result.totalPages} total pages analyzed
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Flagged Pages */}
                        {result.flaggedPages.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-lg font-bold text-red-400 flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5" />
                              Flagged Pages
                            </h4>
                            <div className="grid gap-3">
                              {result.flaggedPages.map((page) => (
                                <div
                                  key={page.pageNumber}
                                  className="bg-red-900/30 border-2 border-red-600/40 rounded-xl p-5 hover:border-red-500/60 transition-all"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="text-xl font-bold text-white mb-2">Page {page.pageNumber}</div>
                                      <div className="text-sm text-gray-300 mb-3">
                                        {page.blackRectCount} black rect{page.blackRectCount !== 1 ? 's' : ''}, {page.overlapCount} overlap{page.overlapCount !== 1 ? 's' : ''}
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-400">Confidence:</span>
                                        <div className="flex items-center gap-2">
                                          <div className="w-28 h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                              className={`h-full transition-all ${
                                                page.confidenceScore >= 7 ? 'bg-red-500' :
                                                page.confidenceScore >= 4 ? 'bg-yellow-500' :
                                                'bg-orange-500'
                                              }`}
                                              style={{ width: `${(page.confidenceScore / 10) * 100}%` }}
                                            />
                                          </div>
                                          <span className={`text-sm font-bold ${
                                            page.confidenceScore >= 7 ? 'text-red-400' :
                                            page.confidenceScore >= 4 ? 'text-yellow-400' :
                                            'text-orange-400'
                                          }`}>
                                            {page.confidenceScore}/10
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Risk Score */}
                        {result.security?.risk_score !== undefined && (
                          <div className={`rounded-2xl p-6 border-2 shadow-2xl ${
                            result.security.risk_score >= 70 ? 'bg-gradient-to-br from-red-900/40 to-red-800/20 border-red-600/50' :
                            result.security.risk_score >= 40 ? 'bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border-yellow-600/50' :
                            'bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-600/50'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-lg font-bold text-white">Overall Risk Score</span>
                              <span className={`text-3xl font-bold ${
                                result.security.risk_score >= 70 ? 'text-red-400' :
                                result.security.risk_score >= 40 ? 'text-yellow-400' :
                                'text-green-400'
                              }`}>
                                {result.security.risk_score}/100
                              </span>
                            </div>
                            <div className="w-full h-3.5 bg-gray-800/50 rounded-full overflow-hidden mb-2">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  result.security.risk_score >= 70 ? 'bg-red-500' :
                                  result.security.risk_score >= 40 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${result.security.risk_score}%` }}
                              />
                            </div>
                            <div className="text-sm text-gray-300">
                              {result.security.risk_score >= 70 ? 'HIGH RISK - Multiple serious privacy/security issues detected' :
                               result.security.risk_score >= 40 ? 'MEDIUM RISK - Several privacy concerns found' :
                               'LOW RISK - Minor issues only'}
                            </div>
                          </div>
                        )}

                        {/* Security Findings */}
                        {result.security && (
                          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-cyber-cyan-400/20">
                            <h4 className="text-lg font-bold text-cyan-400 mb-5 flex items-center gap-2">
                              <Shield className="w-5 h-5" />
                              Security & Privacy Findings
                            </h4>
                            <div className="space-y-2.5 max-h-80 overflow-y-auto">
                              {result.security.has_metadata && (
                                <div className="flex items-center gap-3 p-2.5 bg-gray-900/50 rounded-lg">
                                  <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                  <span className="text-gray-300 text-sm">
                                    Metadata present ({result.security.metadata_keys.length} key{result.security.metadata_keys.length !== 1 ? 's' : ''})
                                    {result.security.metadata_keys.length > 0 && result.security.metadata_keys.length <= 5 && (
                                      <span className="text-gray-500 ml-1">
                                        ({result.security.metadata_keys.join(', ')})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )}

                              {result.security.has_attachments && (
                                <div className="flex items-center gap-3 p-2.5 bg-gray-900/50 rounded-lg">
                                  <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                  <span className="text-gray-300 text-sm">Embedded attachments ({result.security.attachment_count} file{result.security.attachment_count !== 1 ? 's' : ''})</span>
                                </div>
                              )}

                            {/* Annotations */}
                            {result.security.has_annotations ? (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <span className="text-gray-300">Annotations/Comments ({result.security.annotation_count} annotation{result.security.annotation_count !== 1 ? 's' : ''})</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">No annotations</span>
                              </div>
                            )}

                            {/* Forms */}
                            {result.security.has_forms ? (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <span className="text-gray-300">Form fields ({result.security.form_field_count} field{result.security.form_field_count !== 1 ? 's' : ''})</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">No form fields</span>
                              </div>
                            )}

                            {/* Layers */}
                            {result.security.has_layers ? (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <span className="text-gray-300">Optional Content Groups ({result.security.layer_count} layer{result.security.layer_count !== 1 ? 's' : ''})</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">No layers detected</span>
                              </div>
                            )}

                              {result.security.has_javascript && (
                                <div className="flex items-center gap-3 p-2.5 bg-red-900/30 rounded-lg border border-red-600/30">
                                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                  <span className="text-gray-300 text-sm">
                                    JavaScript detected (potential security risk)
                                    {result.security.javascript_count !== undefined && result.security.javascript_count > 0 && (
                                      <span className="text-gray-500 ml-1">({result.security.javascript_count} instance{result.security.javascript_count !== 1 ? 's' : ''})</span>
                                    )}
                                  </span>
                                </div>
                              )}

                            {/* Hidden Text */}
                            {result.security.has_hidden_text ? (
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <span className="text-gray-300">Hidden/invisible text detected: {result.security.hidden_text_types?.join(', ') || 'unknown'}</span>
                                  {result.security.white_on_white_pages && result.security.white_on_white_pages.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">White-on-white text: pages {result.security.white_on_white_pages.join(', ')}</div>
                                  )}
                                  {result.security.offpage_text_pages && result.security.offpage_text_pages.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">Off-page text: pages {result.security.offpage_text_pages.join(', ')}</div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">No hidden text detected</span>
                              </div>
                            )}

                            {/* OCR Layer */}
                            {result.security.has_ocr_layer ? (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <span className="text-gray-300">
                                  OCR text layer detected
                                  {result.security.ocr_pages && result.security.ocr_pages.length > 0 && (
                                    <span className="text-gray-500 ml-1">(pages {result.security.ocr_pages.join(', ')})</span>
                                  )}
                                  {result.security.is_scanned && <span className="text-gray-500 ml-1">- Document appears scanned</span>}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">No OCR layer detected</span>
                              </div>
                            )}

                            {/* External Links */}
                            {result.security.has_external_links ? (
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <span className="text-gray-300">External links: {result.security.external_urls?.length || 0} URL{result.security.external_urls?.length !== 1 ? 's' : ''}</span>
                                  {result.security.external_urls && result.security.external_urls.length > 0 && result.security.external_urls.length <= 5 && (
                                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                      {result.security.external_urls.map((url, idx) => (
                                        <div key={idx} className="truncate" title={url}>{url}</div>
                                      ))}
                                    </div>
                                  )}
                                  {result.security.external_urls && result.security.external_urls.length > 5 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Showing first 5 of {result.security.external_urls.length} URLs
                                      {result.security.external_urls.slice(0, 5).map((url, idx) => (
                                        <div key={idx} className="truncate" title={url}>{url}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">No external links</span>
                              </div>
                            )}

                            {/* Remote Resources */}
                            {result.security.has_remote_resources && (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <span className="text-gray-300">Remote resources referenced (may reveal IP/location when opened)</span>
                              </div>
                            )}

                            {/* Digital Signatures */}
                            {result.security.has_signatures ? (
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <span className="text-gray-300">
                                    Digital signatures: {result.security.signature_count || 0} signature{result.security.signature_count !== 1 ? 's' : ''}
                                  </span>
                                  {result.security.signer_names && result.security.signer_names.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Signers: {result.security.signer_names.join(', ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">No digital signatures</span>
                              </div>
                            )}

                            {/* Reviewer Names */}
                            {result.security.reviewer_names && result.security.reviewer_names.length > 0 && (
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <span className="text-gray-300">Reviewer names found:</span>
                                  <div className="text-xs text-gray-500 mt-1">{result.security.reviewer_names.join(', ')}</div>
                                </div>
                              </div>
                            )}

                            {/* Annotation Types */}
                            {result.security.annotation_types && result.security.annotation_types.length > 0 && (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <span className="text-gray-300">Annotation types: {result.security.annotation_types.join(', ')}</span>
                              </div>
                            )}

                            {/* Attachment Names */}
                            {result.security.attachment_names && result.security.attachment_names.length > 0 && (
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <span className="text-gray-300">Attachment names:</span>
                                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                    {result.security.attachment_names.map((name, idx) => (
                                      <div key={idx}>{name}</div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Structure Tags / Accessibility */}
                            {(result.security.has_structure_tags || result.security.has_alt_text) && (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <span className="text-gray-300">
                                  Accessibility data present
                                  {result.security.has_structure_tags && ' (structure tags)'}
                                  {result.security.has_alt_text && ' (alt text)'}
                                </span>
                              </div>
                            )}

                            {/* Watermarks */}
                            {result.security.has_watermarks && (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <span className="text-gray-300">Potential watermarks detected (may be used for leak tracing)</span>
                              </div>
                            )}

                            {/* Actions */}
                            {result.security.has_actions ? (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <span className="text-gray-300">Document actions (auto-execute on open)</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">No document actions</span>
                              </div>
                            )}

                            {/* Thumbnails */}
                            {result.security.has_thumbnails ? (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <span className="text-gray-300">Thumbnail images present</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">No thumbnails</span>
                              </div>
                            )}

                            {/* Incremental Updates */}
                            {(result.security.incremental_updates || result.security.incremental_updates_suspected) ? (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <span className="text-gray-300">
                                  Incremental updates detected
                                  {result.security.version_count && result.security.version_count > 0 && (
                                    <span className="text-gray-500 ml-1">(~{result.security.version_count} version{result.security.version_count !== 1 ? 's' : ''})</span>
                                  )}
                                  <span className="text-gray-500 ml-1">- May contain earlier drafts</span>
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">No incremental updates detected</span>
                              </div>
                            )}

                            {/* Notes */}
                            {result.security.notes && result.security.notes.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-700">
                                <div className="text-xs font-semibold text-gray-400 mb-1">Notes:</div>
                                {result.security.notes.map((note, idx) => (
                                  <div key={idx} className="text-xs text-gray-500 flex items-start gap-1">
                                    <span className="text-gray-600">•</span>
                                    <span>{note}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                        {/* Error */}
                        {result.error && (
                          <div className="bg-red-900/40 border-2 border-red-600 rounded-xl p-5">
                            <div className="text-red-400 font-bold text-base mb-2">Error</div>
                            <div className="text-red-200 text-sm">{result.error}</div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Case Selection Dialog */}
      <CaseSelectionDialog
        isOpen={showCaseSelectionDialog}
        onClose={() => setShowCaseSelectionDialog(false)}
        onSelectCase={handleCaseSelected}
      />
    </AnimatePresence>
  );
}
