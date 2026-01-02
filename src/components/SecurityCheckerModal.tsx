import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, FileText, AlertTriangle, CheckCircle, Loader2, Upload, Settings, Download } from 'lucide-react';
import { useRedactionAudit, RedactionAuditResult } from '../hooks/useRedactionAudit';
import { useToast } from './Toast/ToastContext';

interface SecurityCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SecurityCheckerModal({ isOpen, onClose }: SecurityCheckerModalProps) {
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    blackThreshold: 0.15,
    minOverlapArea: 4.0,
    minHits: 1,
    includeSecurityAudit: true,
  });
  const { isAuditing, result, progressMessage, auditPDF } = useRedactionAudit();
  const toast = useToast();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

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

  const handleDownloadReport = async () => {
    if (!result || !window.electronAPI) return;

    setIsGeneratingReport(true);
    const toastId = toast.info('Preparing report...', 0);

    try {
      // Format audit result for report generation
      const auditResult = {
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

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const baseFilename = result.filename.replace(/\.pdf$/i, '');
      const defaultFilename = `${baseFilename}_security_audit_${timestamp}.pdf`;

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
            <div className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl border-2 border-cyber-purple-400/40 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="relative p-6 border-b border-cyber-purple-400/30">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400 bg-clip-text text-transparent">
                      PDF Audit
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Audit PDF files for redaction risks and security issues
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Security Notice */}
                <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-200">
                      <strong className="text-yellow-300">Security Notice:</strong> This tool detects risk indicators only.
                      It does NOT extract or display any redacted content. All findings are heuristic and require manual verification.
                    </div>
                  </div>
                </div>

                {/* File Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-300">Select PDF File</label>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSelectFile}
                      disabled={isAuditing}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 rounded-lg font-semibold text-white transition-all disabled:cursor-not-allowed"
                    >
                      <Upload className="w-5 h-5" />
                      {pdfPath ? 'Change File' : 'Select PDF'}
                    </button>
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="px-4 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                      aria-label="Settings"
                    >
                      <Settings className="w-5 h-5 text-gray-300" />
                    </button>
                  </div>
                  {pdfPath && (
                    <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-cyber-purple-400/20">
                      <FileText className="w-4 h-4 text-cyber-cyan-400" />
                      <span className="text-sm text-gray-300 truncate flex-1">{pdfPath}</span>
                    </div>
                  )}
                </div>

                {/* Settings Panel */}
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-800/50 rounded-lg p-4 space-y-4 border border-cyber-purple-400/20"
                  >
                    <h3 className="text-sm font-semibold text-gray-300">Advanced Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Black Threshold</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={settings.blackThreshold}
                          onChange={(e) => setSettings({ ...settings, blackThreshold: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Min Overlap Area</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={settings.minOverlapArea}
                          onChange={(e) => setSettings({ ...settings, minOverlapArea: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Min Hits</label>
                        <input
                          type="number"
                          min="1"
                          value={settings.minHits}
                          onChange={(e) => setSettings({ ...settings, minHits: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                        />
                      </div>
                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.includeSecurityAudit}
                            onChange={(e) => setSettings({ ...settings, includeSecurityAudit: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                          />
                          Include Security Audit
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Run Audit Button */}
                <button
                  onClick={handleRunAudit}
                  disabled={!pdfPath || isAuditing}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 rounded-lg font-semibold text-white transition-all disabled:cursor-not-allowed"
                >
                  {isAuditing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Run Security Audit
                    </>
                  )}
                </button>

                {/* Progress Indicator */}
                {isAuditing && progressMessage && (
                  <div className="mt-3 bg-gray-800/50 rounded-lg p-3 border border-cyber-cyan-400/20">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span className="text-sm text-gray-300">{progressMessage}</span>
                    </div>
                  </div>
                )}

                {/* Results */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-300">Audit Results</h3>
                        <button
                          onClick={handleDownloadReport}
                          disabled={isGeneratingReport}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 rounded-lg font-semibold text-white text-sm transition-all disabled:cursor-not-allowed"
                        >
                          {isGeneratingReport ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Download Report
                            </>
                          )}
                        </button>
                      </div>

                      {/* Summary */}
                      <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-cyber-purple-400/20">
                        <div className="flex items-center gap-3 mb-3">
                          {result.flaggedPages.length > 0 ? (
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                          ) : (
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          )}
                          <div>
                            <div className="font-semibold text-white">
                              {result.flaggedPages.length > 0
                                ? `${result.flaggedPages.length} Page(s) Flagged`
                                : 'No Risks Detected'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {result.totalPages} total pages analyzed
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Flagged Pages */}
                      {result.flaggedPages.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-red-400">Flagged Pages:</h4>
                          {result.flaggedPages.map((page) => (
                            <div
                              key={page.pageNumber}
                              className="bg-red-900/20 border border-red-600/30 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-white">Page {page.pageNumber}</div>
                                  <div className="text-sm text-gray-400 mt-1">
                                    {page.blackRectCount} black rect(s), {page.overlapCount} overlap(s)
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">
                                      Confidence: 
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full ${
                                            page.confidenceScore >= 7 ? 'bg-red-500' :
                                            page.confidenceScore >= 4 ? 'bg-yellow-500' :
                                            'bg-orange-500'
                                          }`}
                                          style={{ width: `${(page.confidenceScore / 10) * 100}%` }}
                                        />
                                      </div>
                                      <span className={`text-xs font-semibold ${
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
                      )}

                      {/* Risk Score */}
                      {result.security?.risk_score !== undefined && (
                        <div className="mt-4 mb-4">
                          <div className={`rounded-lg p-4 border-2 ${
                            result.security.risk_score >= 70 ? 'bg-red-900/20 border-red-600/50' :
                            result.security.risk_score >= 40 ? 'bg-yellow-900/20 border-yellow-600/50' :
                            'bg-green-900/20 border-green-600/50'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-white">Overall Risk Score</span>
                              <span className={`text-2xl font-bold ${
                                result.security.risk_score >= 70 ? 'text-red-400' :
                                result.security.risk_score >= 40 ? 'text-yellow-400' :
                                'text-green-400'
                              }`}>
                                {result.security.risk_score}/100
                              </span>
                            </div>
                            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  result.security.risk_score >= 70 ? 'bg-red-500' :
                                  result.security.risk_score >= 40 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${result.security.risk_score}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {result.security.risk_score >= 70 ? 'HIGH RISK - Multiple serious privacy/security issues detected' :
                               result.security.risk_score >= 40 ? 'MEDIUM RISK - Several privacy concerns found' :
                               'LOW RISK - Minor issues only'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Security Findings */}
                      {result.security && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-sm font-semibold text-cyan-400">Security & Privacy Findings:</h4>
                          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3 text-sm border border-cyber-cyan-400/20 max-h-96 overflow-y-auto">
                            {/* Metadata */}
                            {result.security.has_metadata ? (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <span className="text-gray-300">
                                  Metadata present ({result.security.metadata_keys.length} key{result.security.metadata_keys.length !== 1 ? 's' : ''})
                                  {result.security.metadata_keys.length > 0 && result.security.metadata_keys.length <= 5 && (
                                    <span className="text-gray-500 ml-1">
                                      ({result.security.metadata_keys.join(', ')})
                                    </span>
                                  )}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">No metadata detected</span>
                              </div>
                            )}

                            {/* Attachments */}
                            {result.security.has_attachments ? (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <span className="text-gray-300">Embedded attachments ({result.security.attachment_count} file{result.security.attachment_count !== 1 ? 's' : ''})</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">No attachments</span>
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

                            {/* JavaScript */}
                            {result.security.has_javascript ? (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <span className="text-gray-300">
                                  JavaScript detected (potential security risk)
                                  {result.security.javascript_count !== undefined && result.security.javascript_count > 0 && (
                                    <span className="text-gray-500 ml-1">({result.security.javascript_count} instance{result.security.javascript_count !== 1 ? 's' : ''})</span>
                                  )}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">No JavaScript</span>
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
                        <div className="mt-4 bg-red-900/30 border border-red-600 rounded-lg p-4">
                          <div className="text-red-400 font-semibold">Error:</div>
                          <div className="text-red-200 text-sm mt-1">{result.error}</div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
