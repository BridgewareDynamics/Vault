import { useState, useEffect } from 'react';
import { Shield, Minimize2, FileText, AlertTriangle, CheckCircle, Loader2, Upload, Settings, Download, Zap, Lock, Eye, FolderOpen } from 'lucide-react';
import { useRedactionAudit, RedactionAuditResult } from '../hooks/useRedactionAudit';
import { useToast } from './Toast/ToastContext';
import { CaseSelectionDialog } from './Archive/CaseSelectionDialog';

interface PdfAuditState {
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
}

export function DetachedSecurityChecker() {
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    blackThreshold: 0.15,
    minOverlapArea: 4.0,
    minHits: 1,
    includeSecurityAudit: true,
  });
  const { isAuditing: hookIsAuditing, result, progressMessage: hookProgressMessage, auditPDF } = useRedactionAudit();
  const toast = useToast();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isReattaching, setIsReattaching] = useState(false);
  const [showCaseSelectionDialog, setShowCaseSelectionDialog] = useState(false);
  
  // Local state for audit when detaching during an audit
  const [localIsAuditing, setLocalIsAuditing] = useState(false);
  const [localProgressMessage, setLocalProgressMessage] = useState('');
  const [localResult, setLocalResult] = useState<RedactionAuditResult | null>(null);
  
  // Use hook state if available, otherwise use local state
  const isAuditing = hookIsAuditing || localIsAuditing;
  const progressMessage = hookProgressMessage || localProgressMessage;
  // Use local result if available (from detached audit completion), otherwise use hook result
  const finalResult = localResult || result;

  // Set up progress listener immediately - always listen for progress updates
  // This ensures we receive updates even when detaching during an audit
  useEffect(() => {
    if (!window.electronAPI?.onAuditProgress) return;
    
    const removeListener = window.electronAPI.onAuditProgress((message: string) => {
      // Always update progress message - if we're auditing, show it
      // This ensures we catch progress updates even if state hasn't synced yet
      setLocalProgressMessage(message);
      // If we receive a progress update and we're not marked as auditing yet, mark it
      if (!localIsAuditing && !hookIsAuditing && message) {
        setLocalIsAuditing(true);
      }
    });
    
    return () => {
      removeListener();
    };
  }, []); // Set up once on mount, don't depend on detachedDuringAudit

  // Listen for audit completion result (when audit completes in detached window)
  // Set up immediately on mount to ensure we catch results even if audit completes quickly
  useEffect(() => {
    if (!window.electronAPI?.onAuditResult) {
      console.warn('DetachedSecurityChecker: onAuditResult API not available');
      return;
    }
    
    console.log('DetachedSecurityChecker: Setting up audit result listener');
    
    // Also set up a test to verify IPC is working
    const testListener = () => {
      console.log('DetachedSecurityChecker: IPC listener is active and ready');
    };
    // Small delay to log that listener is ready
    setTimeout(testListener, 100);
    
    const removeResultListener = window.electronAPI.onAuditResult((auditResult: RedactionAuditResult) => {
      console.log('DetachedSecurityChecker: Received audit result via IPC', auditResult);
      console.log('DetachedSecurityChecker: Current state before update', {
        localIsAuditing,
        hookIsAuditing,
        hasLocalResult: !!localResult,
        hasHookResult: !!result,
        finalResultExists: !!(localResult || result),
      });
      // Update local result state
      setLocalResult(auditResult);
      // Clear auditing state - ensure both local and hook states are cleared
      setLocalIsAuditing(false);
      setLocalProgressMessage('');
      console.log('DetachedSecurityChecker: State updated with result:', {
        filename: auditResult.filename,
        totalPages: auditResult.totalPages,
        flaggedPagesCount: auditResult.flaggedPages?.length || 0,
      });
      toast.success('Audit completed successfully', 3000);
    });
    
    const removeErrorListener = window.electronAPI.onAuditError?.((error: string) => {
      console.error('DetachedSecurityChecker: Received audit error via IPC', error);
      // Clear auditing state
      setLocalIsAuditing(false);
      setLocalProgressMessage('');
      toast.error(`Audit failed: ${error}`, 5000);
    });
    
    return () => {
      console.log('DetachedSecurityChecker: Cleaning up audit result listeners');
      removeResultListener();
      if (removeErrorListener) {
        removeErrorListener();
      }
    };
  }, [toast]);

  // Listen for initial data from main process
  useEffect(() => {
    const handleData = (event: CustomEvent<PdfAuditState>) => {
      const data = event.detail;
      console.log('DetachedSecurityChecker: Received pdf-audit-data', {
        hasPdfPath: !!data.pdfPath,
        hasResult: !!data.result,
        resultFilename: data.result?.filename,
        isAuditing: data.isAuditing,
      });
      
      if (data.pdfPath) {
        setPdfPath(data.pdfPath);
      }
      if (data.settings) {
        setSettings(data.settings);
      }
      if (data.showSettings !== undefined) {
        setShowSettings(data.showSettings);
      }
      
      // If detaching during an audit, set up local state
      if (data.isAuditing) {
        setLocalIsAuditing(true);
        setLocalProgressMessage(data.progressMessage || 'Audit in progress...');
      }
      
      // If result is passed, it means audit completed - store it in local state
      if (data.result) {
        console.log('DetachedSecurityChecker: Received result in initial data, storing in localResult', {
          filename: data.result.filename,
          totalPages: data.result.totalPages,
          flaggedPages: data.result.flaggedPages?.length || 0,
        });
        setLocalResult(data.result);
        setLocalIsAuditing(false);
        setLocalProgressMessage('');
      } else {
        // Clear local result if no result is provided (fresh start)
        setLocalResult(null);
      }
    };

    window.addEventListener('pdf-audit-data' as any, handleData as EventListener);

    const checkExistingData = () => {
      const existingData = (window as any).__pdfAuditInitialData;
      if (existingData) {
        handleData({ detail: existingData } as CustomEvent);
        delete (window as any).__pdfAuditInitialData;
      }
    };
    checkExistingData();

    return () => {
      window.removeEventListener('pdf-audit-data' as any, handleData as EventListener);
    };
  }, []);

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
      // Clear local audit state if we were tracking a detached audit
      setLocalIsAuditing(false);
      setLocalProgressMessage('');
      
      await auditPDF(pdfPath, settings);
      // Audit completed - result is set by the hook
      setLocalIsAuditing(false);
      setLocalProgressMessage('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLocalIsAuditing(false);
      setLocalProgressMessage('');
      if (errorMessage.includes('Python 3.11+ is required')) {
        toast.error('Python 3.11+ is required. Please install Python from python.org', 8000);
      } else if (errorMessage.includes('pip install')) {
        toast.error('Failed to install Python dependencies. Please run: pip install pymupdf', 8000);
      }
    }
  };

  const handleReattach = async () => {
    if (isReattaching) {
      return;
    }

    setIsReattaching(true);

    try {
      if (!window.electronAPI) {
        toast.error('Electron API not available');
        setIsReattaching(false);
        return;
      }

      const state: PdfAuditState = {
        pdfPath,
        settings,
        showSettings,
        result: finalResult || null,
        isAuditing,
        progressMessage,
      };

      if (window.electronAPI.reattachPdfAudit) {
        await window.electronAPI.reattachPdfAudit(state);
        setTimeout(() => {
          setIsReattaching(false);
        }, 1000);
      } else {
        if (window.electronAPI.closeWindow) {
          await window.electronAPI.closeWindow();
        }
        setIsReattaching(false);
      }
    } catch (error) {
      toast.error('Failed to reattach audit window');
      console.error('Reattach error:', error);
      setIsReattaching(false);
    }
  };

  // Helper function to format audit result for report generation
  const formatAuditResult = () => {
    if (!finalResult) throw new Error('No audit result available');
    return {
        tool: "PDF Overlay Redaction Risk Checker",
        summary: {
          total_pdfs: 1,
          total_pages: finalResult.totalPages,
          pdfs_with_risks: finalResult.flaggedPages.length > 0 ? 1 : 0,
          total_flagged_pages: finalResult.flaggedPages.length,
        },
        reports: [{
          filename: finalResult.filename,
          total_pages: finalResult.totalPages,
          error: finalResult.error || null,
          flagged_pages: finalResult.flaggedPages.map(p => ({
            page_number: p.pageNumber,
            black_rect_count: p.blackRectCount,
            overlap_count: p.overlapCount,
            confidence_score: p.confidenceScore,
          })),
          security: finalResult.security ? {
            has_metadata: finalResult.security.has_metadata,
            metadata_keys: finalResult.security.metadata_keys || [],
            metadata_details: finalResult.security.metadata_details || {},
            has_attachments: finalResult.security.has_attachments,
            attachment_count: finalResult.security.attachment_count || 0,
            attachment_names: finalResult.security.attachment_names || [],
            has_annotations: finalResult.security.has_annotations,
            annotation_count: finalResult.security.annotation_count || 0,
            annotation_types: finalResult.security.annotation_types || [],
            has_forms: finalResult.security.has_forms,
            form_field_count: finalResult.security.form_field_count || 0,
            has_layers: finalResult.security.has_layers,
            layer_count: finalResult.security.layer_count || 0,
            has_javascript: finalResult.security.has_javascript,
            javascript_count: finalResult.security.javascript_count || 0,
            has_actions: finalResult.security.has_actions,
            has_thumbnails: finalResult.security.has_thumbnails,
            incremental_updates: finalResult.security.incremental_updates || finalResult.security.incremental_updates_suspected || false,
            version_count: finalResult.security.version_count || 0,
            has_hidden_text: finalResult.security.has_hidden_text || false,
            hidden_text_types: finalResult.security.hidden_text_types || [],
            white_on_white_pages: finalResult.security.white_on_white_pages || [],
            offpage_text_pages: finalResult.security.offpage_text_pages || [],
            overlay_risk: finalResult.security.overlay_risk || "NO",
            reviewer_names: finalResult.security.reviewer_names || [],
            has_ocr_layer: finalResult.security.has_ocr_layer || false,
            ocr_pages: finalResult.security.ocr_pages || [],
            is_scanned: finalResult.security.is_scanned || false,
            has_external_links: finalResult.security.has_external_links || false,
            external_urls: finalResult.security.external_urls || [],
            has_remote_resources: finalResult.security.has_remote_resources || false,
            has_signatures: finalResult.security.has_signatures || false,
            signature_count: finalResult.security.signature_count || 0,
            signer_names: finalResult.security.signer_names || [],
            has_structure_tags: finalResult.security.has_structure_tags || false,
            has_alt_text: finalResult.security.has_alt_text || false,
            has_watermarks: finalResult.security.has_watermarks || false,
            risk_score: finalResult.security.risk_score || 0,
            notes: finalResult.security.notes || [],
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

  const handleSaveToCaseFolder = async (selectedCasePath?: string) => {
    if (!finalResult || !window.electronAPI) return;

    if (!selectedCasePath) {
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
      const reportFilename = generateReportFilename(finalResult.filename);

      // Construct full path (use / as separator, main process will handle it)
      const reportPath = `${selectedCasePath}/${reportFilename}`;

      toast.updateToast(toastId, 'Generating PDF report...', 'info');

      // Generate report directly to case folder
      const reportResult = await window.electronAPI.generateAuditReport(auditResult, reportPath);

      if (reportResult.success) {
        toast.dismissToast(toastId);
        toast.success('Report saved to case folder!', 3000);
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

  const handleDownloadReport = async () => {
    if (!finalResult || !window.electronAPI) return;

    setIsGeneratingReport(true);
    const toastId = toast.info('Preparing report...', 0);

    try {
      // Format audit result for report generation
      const auditResult = formatAuditResult();

      // Generate filename
      const defaultFilename = generateReportFilename(finalResult.filename);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
      <div className="h-screen flex flex-col">
        {/* Enhanced Header */}
        <div className="relative p-8 border-b border-cyber-purple-400/30 bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 backdrop-blur-xl">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative p-5 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl shadow-2xl">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                  PDF Security Audit
                </h1>
                <p className="text-lg text-gray-400 mt-2">
                  Comprehensive redaction risk and security analysis
                </p>
              </div>
            </div>
            <button
              onClick={handleReattach}
              disabled={isReattaching}
              className="px-6 py-3 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl transition-all disabled:opacity-50 border border-gray-700/50 hover:border-cyber-purple-400/50 flex items-center gap-2 text-gray-300 hover:text-white"
              aria-label="Reattach audit to main window"
              title="Return to main window"
            >
              <Minimize2 size={20} className="text-cyber-purple-400" />
              <span className="font-medium">Reattach</span>
            </button>
          </div>
        </div>

        {/* Main Content Area - Full Screen Layout */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="h-full max-w-7xl mx-auto p-8">
            <div className="h-full grid grid-cols-12 gap-8 min-h-0">
              {/* Left Column - Controls */}
              <div className="col-span-12 lg:col-span-5 flex flex-col gap-6 overflow-y-auto min-h-0 pr-2">
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
                <div className="bg-gray-800/60 backdrop-blur-sm border border-cyber-purple-400/20 rounded-2xl p-8 shadow-2xl">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xl font-bold text-gray-200 mb-4">Select PDF File</label>
                      <button
                        onClick={handleSelectFile}
                        disabled={isAuditing}
                        className="w-full flex items-center justify-center gap-4 px-8 py-6 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-bold text-white text-lg transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Upload className="w-6 h-6" />
                        <span>{pdfPath ? 'Change PDF File' : 'Select PDF File'}</span>
                      </button>
                    </div>
                    
                    {pdfPath && (
                      <div className="flex items-center gap-4 p-5 bg-gray-900/60 rounded-xl border border-cyber-cyan-400/30">
                        <div className="p-3 bg-cyber-cyan-400/20 rounded-lg">
                          <FileText className="w-6 h-6 text-cyber-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-400 mb-1">Selected File</p>
                          <p className="text-base text-gray-200 truncate font-medium">{pdfPath}</p>
                        </div>
                      </div>
                    )}

                    {/* Settings Toggle */}
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="w-full flex items-center justify-between px-6 py-4 bg-gray-700/50 hover:bg-gray-700/70 rounded-xl transition-all border border-gray-600/50 hover:border-cyber-purple-400/50"
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

                    {/* Settings Panel */}
                    {showSettings && (
                      <div className="bg-gray-900/60 rounded-xl p-6 space-y-5 border border-cyber-purple-400/30">
                        <h3 className="text-lg font-bold text-gray-200 mb-4">Audit Configuration</h3>
                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">Black Threshold</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1"
                              value={settings.blackThreshold}
                              onChange={(e) => setSettings({ ...settings, blackThreshold: parseFloat(e.target.value) })}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-base focus:ring-2 focus:ring-cyber-purple-400 focus:border-transparent"
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
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-base focus:ring-2 focus:ring-cyber-purple-400 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">Min Hits</label>
                            <input
                              type="number"
                              min="1"
                              value={settings.minHits}
                              onChange={(e) => setSettings({ ...settings, minHits: parseInt(e.target.value) })}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-base focus:ring-2 focus:ring-cyber-purple-400 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Run Audit Button - Large and Prominent */}
                    <button
                      onClick={handleRunAudit}
                      disabled={!pdfPath || isAuditing}
                      className="w-full flex items-center justify-center gap-4 px-8 py-7 bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 hover:from-cyan-700 hover:via-purple-700 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-bold text-white text-xl transition-all disabled:cursor-not-allowed shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      {isAuditing ? (
                        <>
                          <Loader2 className="w-7 h-7 animate-spin relative z-10" />
                          <span className="relative z-10">Analyzing Document...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-7 h-7 relative z-10" />
                          <span className="relative z-10">Run Security Audit</span>
                        </>
                      )}
                    </button>

                    {/* Progress Indicator */}
                    {isAuditing && progressMessage && (
                      <div className="bg-gradient-to-r from-cyan-900/40 to-purple-900/40 rounded-xl p-6 border-2 border-cyber-cyan-400/30">
                        <div className="flex items-center gap-4">
                          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                          <div className="flex-1">
                            <p className="text-base font-semibold text-cyan-300 mb-1">Processing...</p>
                            <p className="text-sm text-gray-300">{progressMessage}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Results */}
              <div className="col-span-12 lg:col-span-7 flex flex-col min-h-0 overflow-hidden">
                {(!finalResult || finalResult === null) && !isAuditing ? (
                  <div className="flex-1 flex items-center justify-center min-h-0">
                    <div className="text-center space-y-6">
                      <div className="inline-flex p-6 bg-gray-800/50 rounded-2xl border border-cyber-purple-400/20">
                        <Eye className="w-16 h-16 text-cyber-purple-400/50" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-300 mb-2">Ready to Audit</h3>
                        <p className="text-gray-400 text-lg">Select a PDF file and run the security audit to see results here</p>
                      </div>
                    </div>
                  </div>
                ) : isAuditing && (!finalResult || finalResult === null) ? (
                  <div className="flex-1 flex items-center justify-center min-h-0">
                    <div className="text-center space-y-6 w-full max-w-md">
                      <div className="inline-flex p-6 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 rounded-2xl border-2 border-cyber-cyan-400/30">
                        <Loader2 className="w-16 h-16 text-cyber-cyan-400 animate-spin" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-cyan-300 mb-2">Audit in Progress</h3>
                        <p className="text-gray-300 text-lg mb-4">{progressMessage || 'Analyzing document...'}</p>
                        <div className="bg-gray-800/50 rounded-xl p-4 border border-cyber-cyan-400/20">
                          <p className="text-sm text-gray-400">
                            The audit is running in the background. Results will appear here when complete.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : finalResult && finalResult !== null ? (
                  <div className="flex-1 overflow-y-auto space-y-6 pr-2 min-h-0">
                    {/* Results Header */}
                    <div className="flex items-center justify-between bg-gray-800/60 backdrop-blur-sm border border-cyber-purple-400/20 rounded-2xl p-6 shadow-xl sticky top-0 z-10">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-xl">
                          <Lock className="w-8 h-8 text-cyber-purple-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-200">Audit Results</h2>
                          <p className="text-sm text-gray-400">{result?.totalPages || 0} pages analyzed</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleSaveToCaseFolder()}
                          disabled={isGeneratingReport}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-bold text-white transition-all disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
                          title="Save report to a case"
                        >
                          {isGeneratingReport ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <FolderOpen className="w-5 h-5" />
                              <span>Save to Case</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleDownloadReport}
                          disabled={isGeneratingReport}
                          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-bold text-white transition-all disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
                        >
                          {isGeneratingReport ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-5 h-5" />
                              <span>Download Report</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Summary Card */}
                    {finalResult && (
                      <div className={`rounded-2xl p-8 border-2 shadow-2xl ${
                        (finalResult.flaggedPages?.length || 0) > 0 
                          ? 'bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-600/50' 
                          : 'bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-600/50'
                      }`}>
                        <div className="flex items-center gap-6">
                          <div className={`p-6 rounded-2xl ${
                            (finalResult.flaggedPages?.length || 0) > 0 ? 'bg-red-600/20' : 'bg-green-600/20'
                          }`}>
                            {(finalResult.flaggedPages?.length || 0) > 0 ? (
                              <AlertTriangle className="w-12 h-12 text-red-400" />
                            ) : (
                              <CheckCircle className="w-12 h-12 text-green-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-3xl font-bold text-white mb-2">
                              {(finalResult.flaggedPages?.length || 0) > 0
                                ? `${finalResult.flaggedPages.length} Page${finalResult.flaggedPages.length !== 1 ? 's' : ''} Flagged`
                                : 'No Risks Detected'}
                            </div>
                            <div className="text-lg text-gray-300">
                              {finalResult.totalPages || 0} total pages analyzed
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Risk Score */}
                    {finalResult?.security?.risk_score !== undefined && (
                      <div className={`rounded-2xl p-8 border-2 shadow-2xl ${
                        finalResult.security.risk_score >= 70 ? 'bg-gradient-to-br from-red-900/40 to-red-800/20 border-red-600/50' :
                        finalResult.security.risk_score >= 40 ? 'bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border-yellow-600/50' :
                        'bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-600/50'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xl font-bold text-white">Overall Risk Score</span>
                          <span className={`text-4xl font-bold ${
                            finalResult.security.risk_score >= 70 ? 'text-red-400' :
                            finalResult.security.risk_score >= 40 ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                            {finalResult.security.risk_score}/100
                          </span>
                        </div>
                        <div className="w-full h-4 bg-gray-800/50 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full transition-all duration-500 ${
                              finalResult.security.risk_score >= 70 ? 'bg-red-500' :
                              finalResult.security.risk_score >= 40 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${finalResult.security.risk_score}%` }}
                          />
                        </div>
                        <div className="text-base text-gray-300">
                          {finalResult.security.risk_score >= 70 ? 'HIGH RISK - Multiple serious privacy/security issues detected' :
                           finalResult.security.risk_score >= 40 ? 'MEDIUM RISK - Several privacy concerns found' :
                           'LOW RISK - Minor issues only'}
                        </div>
                      </div>
                    )}

                    {/* Flagged Pages */}
                    {finalResult && finalResult.flaggedPages.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">
                          <AlertTriangle className="w-6 h-6" />
                          Flagged Pages
                        </h3>
                        <div className="grid gap-4">
                          {finalResult?.flaggedPages.map((page) => (
                            <div
                              key={page.pageNumber}
                              className="bg-red-900/30 border-2 border-red-600/40 rounded-xl p-6 hover:border-red-500/60 transition-all"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="text-2xl font-bold text-white mb-2">Page {page.pageNumber}</div>
                                  <div className="text-base text-gray-300 mb-3">
                                    {page.blackRectCount} black rect{page.blackRectCount !== 1 ? 's' : ''}, {page.overlapCount} overlap{page.overlapCount !== 1 ? 's' : ''}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-400">Confidence:</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-32 h-2.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full transition-all ${
                                            page.confidenceScore >= 7 ? 'bg-red-500' :
                                            page.confidenceScore >= 4 ? 'bg-yellow-500' :
                                            'bg-orange-500'
                                          }`}
                                          style={{ width: `${(page.confidenceScore / 10) * 100}%` }}
                                        />
                                      </div>
                                      <span className={`text-base font-bold ${
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

                    {/* Security Findings */}
                    {finalResult && finalResult.security && (
                      <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-cyber-cyan-400/20">
                        <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
                          <Shield className="w-6 h-6" />
                          Security & Privacy Findings
                        </h3>
                        <div className="space-y-2.5 max-h-96 overflow-y-auto">
                          {finalResult.security.has_metadata && (
                            <div className="flex items-center gap-3 p-2.5 bg-gray-900/50 rounded-lg">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">
                                Metadata present ({finalResult.security.metadata_keys.length} key{finalResult.security.metadata_keys.length !== 1 ? 's' : ''})
                                {finalResult.security.metadata_keys.length > 0 && finalResult.security.metadata_keys.length <= 5 && (
                                  <span className="text-gray-500 ml-1">
                                    ({finalResult.security.metadata_keys.join(', ')})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}

                          {finalResult.security.has_attachments && (
                            <div className="flex items-center gap-3 p-2.5 bg-gray-900/50 rounded-lg">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">Embedded attachments ({finalResult.security.attachment_count} file{finalResult.security.attachment_count !== 1 ? 's' : ''})</span>
                            </div>
                          )}

                          {/* Annotations */}
                          {finalResult.security.has_annotations ? (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">Annotations/Comments ({finalResult.security.annotation_count} annotation{finalResult.security.annotation_count !== 1 ? 's' : ''})</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">No annotations</span>
                            </div>
                          )}

                          {/* Forms */}
                          {finalResult.security.has_forms ? (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">Form fields ({finalResult.security.form_field_count} field{finalResult.security.form_field_count !== 1 ? 's' : ''})</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">No form fields</span>
                            </div>
                          )}

                          {/* Layers */}
                          {finalResult.security.has_layers ? (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">Optional Content Groups ({finalResult.security.layer_count} layer{finalResult.security.layer_count !== 1 ? 's' : ''})</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">No layers detected</span>
                            </div>
                          )}

                          {finalResult.security.has_javascript && (
                            <div className="flex items-center gap-3 p-2.5 bg-red-900/30 rounded-lg border border-red-600/30">
                              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">
                                JavaScript detected (potential security risk)
                                {finalResult.security.javascript_count !== undefined && finalResult.security.javascript_count > 0 && (
                                  <span className="text-gray-500 ml-1">({finalResult.security.javascript_count} instance{finalResult.security.javascript_count !== 1 ? 's' : ''})</span>
                                )}
                              </span>
                            </div>
                          )}

                          {/* Hidden Text */}
                          {finalResult.security.has_hidden_text ? (
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-gray-300 text-sm">Hidden/invisible text detected: {finalResult.security.hidden_text_types?.join(', ') || 'unknown'}</span>
                                {finalResult.security.white_on_white_pages && finalResult.security.white_on_white_pages.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">White-on-white text: pages {finalResult.security.white_on_white_pages.join(', ')}</div>
                                )}
                                {finalResult.security.offpage_text_pages && finalResult.security.offpage_text_pages.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">Off-page text: pages {finalResult.security.offpage_text_pages.join(', ')}</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">No hidden text detected</span>
                            </div>
                          )}

                          {/* OCR Layer */}
                          {finalResult.security.has_ocr_layer ? (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">
                                OCR text layer detected
                                {finalResult.security.ocr_pages && finalResult.security.ocr_pages.length > 0 && (
                                  <span className="text-gray-500 ml-1">(pages {finalResult.security.ocr_pages.join(', ')})</span>
                                )}
                                {finalResult.security.is_scanned && <span className="text-gray-500 ml-1">- Document appears scanned</span>}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">No OCR layer detected</span>
                            </div>
                          )}

                          {/* External Links */}
                          {finalResult.security.has_external_links ? (
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-gray-300 text-sm">External links: {finalResult.security.external_urls?.length || 0} URL{finalResult.security.external_urls?.length !== 1 ? 's' : ''}</span>
                                {finalResult.security.external_urls && finalResult.security.external_urls.length > 0 && finalResult.security.external_urls.length <= 5 && (
                                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                    {finalResult.security.external_urls.map((url, idx) => (
                                      <div key={idx} className="truncate" title={url}>{url}</div>
                                    ))}
                                  </div>
                                )}
                                {finalResult.security.external_urls && finalResult.security.external_urls.length > 5 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Showing first 5 of {finalResult.security.external_urls.length} URLs
                                    {finalResult.security.external_urls.slice(0, 5).map((url, idx) => (
                                      <div key={idx} className="truncate" title={url}>{url}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">No external links</span>
                            </div>
                          )}

                          {/* Remote Resources */}
                          {finalResult.security.has_remote_resources && (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">Remote resources referenced (may reveal IP/location when opened)</span>
                            </div>
                          )}

                          {/* Digital Signatures */}
                          {finalResult.security.has_signatures ? (
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-gray-300 text-sm">
                                  Digital signatures: {finalResult.security.signature_count || 0} signature{finalResult.security.signature_count !== 1 ? 's' : ''}
                                </span>
                                {finalResult.security.signer_names && finalResult.security.signer_names.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Signers: {finalResult.security.signer_names.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">No digital signatures</span>
                            </div>
                          )}

                          {/* Reviewer Names */}
                          {finalResult.security.reviewer_names && finalResult.security.reviewer_names.length > 0 && (
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-gray-300 text-sm">Reviewer names found:</span>
                                <div className="text-xs text-gray-500 mt-1">{finalResult.security.reviewer_names.join(', ')}</div>
                              </div>
                            </div>
                          )}

                          {/* Annotation Types */}
                          {finalResult.security.annotation_types && finalResult.security.annotation_types.length > 0 && (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">Annotation types: {finalResult.security.annotation_types.join(', ')}</span>
                            </div>
                          )}

                          {/* Attachment Names */}
                          {finalResult.security.attachment_names && finalResult.security.attachment_names.length > 0 && (
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-gray-300 text-sm">Attachment names:</span>
                                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                  {finalResult.security.attachment_names.map((name, idx) => (
                                    <div key={idx}>{name}</div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Structure Tags / Accessibility */}
                          {(finalResult.security.has_structure_tags || finalResult.security.has_alt_text) && (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">
                                Accessibility data present
                                {finalResult.security.has_structure_tags && ' (structure tags)'}
                                {finalResult.security.has_alt_text && ' (alt text)'}
                              </span>
                            </div>
                          )}

                          {/* Watermarks */}
                          {finalResult.security.has_watermarks && (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">Potential watermarks detected (may be used for leak tracing)</span>
                            </div>
                          )}

                          {/* Actions */}
                          {finalResult.security.has_actions ? (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">Document actions (auto-execute on open)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">No document actions</span>
                            </div>
                          )}

                          {/* Thumbnails */}
                          {finalResult.security.has_thumbnails ? (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">Thumbnail images present</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">No thumbnails</span>
                            </div>
                          )}

                          {/* Incremental Updates */}
                          {(finalResult.security.incremental_updates || finalResult.security.incremental_updates_suspected) ? (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">
                                Incremental updates detected
                                {finalResult.security.version_count && finalResult.security.version_count > 0 && (
                                  <span className="text-gray-500 ml-1">(~{finalResult.security.version_count} version{finalResult.security.version_count !== 1 ? 's' : ''})</span>
                                )}
                                <span className="text-gray-500 ml-1">- May contain earlier drafts</span>
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">No incremental updates detected</span>
                            </div>
                          )}

                          {/* Notes */}
                          {finalResult.security.notes && finalResult.security.notes.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                              <div className="text-xs font-semibold text-gray-400 mb-1">Notes:</div>
                              {finalResult.security.notes.map((note, idx) => (
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
                    {finalResult && finalResult.error && (
                      <div className="bg-red-900/40 border-2 border-red-600 rounded-xl p-6">
                        <div className="text-red-400 font-bold text-lg mb-2">Error</div>
                        <div className="text-red-200">{finalResult.error}</div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Selection Dialog */}
      <CaseSelectionDialog
        isOpen={showCaseSelectionDialog}
        onClose={() => setShowCaseSelectionDialog(false)}
        onSelectCase={handleCaseSelected}
      />
    </div>
  );
}
