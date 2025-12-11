import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { ArchiveFile } from '../../types';

interface ArchiveFileViewerProps {
  file: ArchiveFile | null;
  files: ArchiveFile[];
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function ArchiveFileViewer({ file, files, onClose, onNext, onPrevious }: ArchiveFileViewerProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [fileData, setFileData] = useState<{ data: string; mimeType: string } | null>(null);
  const [loading, setLoading] = useState(false);
  
  // PDF.js state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfLoadingProgress, setPdfLoadingProgress] = useState(0);
  const [pageRendering, setPageRendering] = useState(false);
  const [pageScale, setPageScale] = useState(1.5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    if (file) {
      if (file.type === 'pdf') {
        loadPDF();
      } else {
        loadFileData();
      }
    } else {
      setFileData(null);
      setPdfDoc(null);
      setCurrentPage(1);
      setTotalPages(0);
    }
  }, [file]);

  const loadFileData = async () => {
    if (!file || !window.electronAPI) return;

    try {
      setLoading(true);
      const data = await window.electronAPI.readFileData(file.path);
      setFileData({
        data: `data:${data.mimeType};base64,${data.data}`,
        mimeType: data.mimeType,
      });
    } catch (error) {
      console.error('Failed to load file data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPDF = async () => {
    if (!file || !window.electronAPI || file.type !== 'pdf') return;

    try {
      setPdfLoading(true);
      setPdfLoadingProgress(0);
      
      // Import PDF.js first
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      // Use readPDFFile - now returns base64 to avoid array length limits
      setPdfLoadingProgress(10);
      const fileData = await window.electronAPI.readPDFFile(file.path);
      
      // Handle both base64 string (new) and array (old) for backward compatibility
      let arrayBuffer: ArrayBuffer;
      
      if (typeof fileData === 'string') {
        // New format: base64 string
        try {
          const cleanBase64 = fileData.trim().replace(/\s/g, '');
          const binaryString = atob(cleanBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer;
        } catch (error) {
          throw new Error(`Failed to decode base64 PDF data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else if (Array.isArray(fileData)) {
        // Old format: array of numbers
        arrayBuffer = new Uint8Array(fileData).buffer;
      } else {
        throw new Error('Unexpected PDF file data format');
      }
      
      setPdfLoadingProgress(30);
      
      // Optimize PDF.js loading with streaming enabled
      // disableAutoFetch: false allows streaming
      // disableStream: false enables streaming for faster initial load
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        disableAutoFetch: false,
        disableStream: false,
        // Use lower verbosity for better performance
        verbosity: 0,
      });
      
      // Track loading progress
      loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
        if (progress.total > 0) {
          const percent = Math.min(30 + (progress.loaded / progress.total) * 60, 90);
          setPdfLoadingProgress(Math.round(percent));
        }
      };
      
      const pdf = await loadingTask.promise;
      setPdfLoadingProgress(95);
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setPdfLoadingProgress(100);
      
      // Wait for first page to render before hiding loading screen
      // This prevents the white rectangle flash
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Small delay to show completion, then hide loading
      setTimeout(() => {
        setPdfLoading(false);
        setPdfLoadingProgress(0);
      }, 300);
    } catch (error) {
      console.error('Failed to load PDF:', error);
      setPdfLoading(false);
      setPdfLoadingProgress(0);
    }
  };

  const renderPDFPage = async (pageNum: number) => {
    if (!pdfDoc) return;

    // Cancel any ongoing render task
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {
        // Ignore cancellation errors
      }
      renderTaskRef.current = null;
    }

    // Wait for canvas to be available with multiple retries
    let canvas = canvasRef.current;
    let retries = 0;
    const maxRetries = 20; // Wait up to 1 second (20 * 50ms)
    
    while (!canvas && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 50));
      canvas = canvasRef.current;
      retries++;
    }
    
    if (!canvas) {
      console.warn('Canvas not available for rendering after retries');
      return;
    }

    try {
      setPageRendering(true);
      
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: pageScale });
      
      const context = canvas.getContext('2d');
      
      if (!context) {
        console.warn('Failed to get canvas context');
        setPageRendering(false);
        return;
      }

      // Set canvas size first
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Fill with gray background (better than white for loading state)
      context.fillStyle = '#f3f4f6';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Create render task and store it
      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport,
      });
      
      renderTaskRef.current = renderTask;
      
      // Wait for render to complete
      await renderTask.promise;
      
      // Clear the ref only if this is still the current task
      if (renderTaskRef.current === renderTask) {
        renderTaskRef.current = null;
      }
      
      setPageRendering(false);
    } catch (error: any) {
      // Ignore cancellation errors
      if (error?.name === 'RenderingCancelledException' || error?.message?.includes('cancelled')) {
        return;
      }
      console.error('Failed to render PDF page:', error);
      setPageRendering(false);
      renderTaskRef.current = null;
    }
  };

  // Define handlers before useEffects that use them
  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const handleZoomIn = useCallback(() => {
    setPageScale(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPageScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  useEffect(() => {
    if (pdfDoc && currentPage > 0) {
      // Use requestAnimationFrame to ensure canvas is in DOM
      requestAnimationFrame(() => {
        // Clear canvas when page changes to avoid showing previous page
        const canvas = canvasRef.current;
        if (canvas) {
          const context = canvas.getContext('2d');
          if (context && canvas.width > 0 && canvas.height > 0) {
            // Fill with gray instead of clearing to avoid flash
            context.fillStyle = '#f3f4f6';
            context.fillRect(0, 0, canvas.width, canvas.height);
          }
        }
        renderPDFPage(currentPage);
      });
    }
    
    // Cleanup: cancel any pending render on unmount or when dependencies change
    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore cancellation errors
        }
        renderTaskRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage, pageScale]);

  // Keyboard navigation for PDFs
  useEffect(() => {
    if (file?.type !== 'pdf' || !pdfDoc) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePreviousPage();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [file, pdfDoc, handlePreviousPage, handleNextPage, handleZoomIn, handleZoomOut]);

  if (!file) return null;

  const currentIndex = files.findIndex(f => f.path === file.path);
  const hasNext = onNext && currentIndex < files.length - 1;
  const hasPrevious = onPrevious && currentIndex > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-0"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`relative ${file?.type === 'pdf' ? 'w-full h-full' : 'max-w-[90vw] max-h-[90vh]'}`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute ${file?.type === 'pdf' ? 'top-2 right-2' : '-top-12 right-0'} text-white hover:text-cyber-purple-400 transition-colors z-30 bg-black/60 rounded-full p-2`}
            aria-label="Close"
          >
            <X size={24} />
          </button>

          {/* Zoom button */}
          {file.type === 'image' && (
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="absolute -top-12 left-0 text-white hover:text-cyber-purple-400 transition-colors z-10"
              aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
            >
              {isZoomed ? <ZoomOut size={32} /> : <ZoomIn size={32} />}
            </button>
          )}

          {/* Navigation buttons */}
          {hasPrevious && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrevious?.();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-cyber-purple-400 transition-colors z-10 bg-black/60 rounded-full p-2"
              aria-label="Previous file"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {hasNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext?.();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-cyber-purple-400 transition-colors z-10 bg-black/60 rounded-full p-2"
              aria-label="Next file"
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* File name */}
          {file.type !== 'pdf' && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gradient-purple text-white font-bold px-4 py-2 rounded-full text-sm shadow-lg border border-cyber-cyan-400/50">
              {file.name}
            </div>
          )}

          {/* File content */}
          {file.type === 'pdf' ? (
            <>
              {pdfLoading ? (
                <div className="flex flex-col items-center justify-center w-full h-full bg-gray-900 rounded-lg">
                  <div className="text-center mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
                    <p className="text-gray-300 mb-2">Loading PDF...</p>
                    {pdfLoadingProgress > 0 && (
                      <div className="w-64 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyber-purple-400 to-cyber-purple-600 h-full transition-all duration-300 ease-out"
                          style={{ width: `${pdfLoadingProgress}%` }}
                        />
                      </div>
                    )}
                    {pdfLoadingProgress > 0 && (
                      <p className="text-gray-400 text-sm mt-2">{pdfLoadingProgress}%</p>
                    )}
                  </div>
                </div>
              ) : pdfDoc ? (
                <div className="relative w-full h-full flex flex-col items-center bg-gray-900 rounded-lg overflow-auto">
                  {/* PDF Controls */}
                  <div className="sticky top-0 z-20 w-full bg-gray-800/95 backdrop-blur-sm border-b border-cyber-purple-500/50 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage <= 1}
                        className="p-2 text-white hover:text-cyber-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded hover:bg-gray-700"
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <span className="text-white font-medium">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages}
                        className="p-2 text-white hover:text-cyber-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded hover:bg-gray-700"
                        aria-label="Next page"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white text-xs font-medium">{file.name}</span>
                      <div className="flex items-center gap-2 border-l border-gray-600 pl-3">
                        <button
                          onClick={handleZoomOut}
                          className="p-2 text-white hover:text-cyber-purple-400 transition-colors rounded hover:bg-gray-700"
                          aria-label="Zoom out"
                        >
                          <ZoomOut size={20} />
                        </button>
                        <span className="text-white text-sm min-w-[60px] text-center font-medium">
                          {Math.round(pageScale * 100)}%
                        </span>
                        <button
                          onClick={handleZoomIn}
                          className="p-2 text-white hover:text-cyber-purple-400 transition-colors rounded hover:bg-gray-700"
                          aria-label="Zoom in"
                        >
                          <ZoomIn size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* PDF Canvas */}
                  <div className="flex-1 w-full flex items-center justify-center p-4 relative min-h-[400px]">
                    {pageRendering && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-purple-400 mx-auto mb-2"></div>
                          <p className="text-gray-300 text-sm">Loading page...</p>
                        </div>
                      </div>
                    )}
                    {/* Always render canvas so ref is available */}
                    <canvas
                      ref={canvasRef}
                      className={`max-w-full shadow-2xl bg-gray-100 rounded transition-opacity duration-300 ${
                        pageRendering ? 'opacity-30' : 'opacity-100'
                      }`}
                      style={{ maxHeight: 'calc(100vh - 120px)' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-900 rounded-lg">
                  <p className="text-gray-300">Failed to load PDF</p>
                </div>
              )}
            </>
          ) : loading ? (
            <div className="flex items-center justify-center w-full h-96 bg-gray-900 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Loading...</p>
              </div>
            </div>
          ) : fileData ? (
            <div className="relative">
              {file.type === 'image' ? (
                <motion.img
                  src={fileData.data}
                  alt={file.name}
                  className={`
                    max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl
                    border-2 border-cyber-purple-500/50
                  `}
                  style={{ cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
                  animate={{ scale: isZoomed ? 1.5 : 1 }}
                  transition={{ duration: 0.3 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed(!isZoomed);
                  }}
                />
              ) : file.type === 'video' ? (
                <video
                  src={fileData.data}
                  controls
                  className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border-2 border-cyber-purple-500/50"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-96 bg-gray-900 rounded-lg">
                  <p className="text-gray-300">Preview not available for this file type</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-96 bg-gray-900 rounded-lg">
              <p className="text-gray-300">Failed to load file</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



