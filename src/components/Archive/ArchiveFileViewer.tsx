import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, BookmarkPlus, Bookmark } from 'lucide-react';
import { ArchiveFile, PDFDocument, PDFRenderTask } from '../../types';
import { logger } from '../../utils/logger';
import { setupPDFWorker } from '../../utils/pdfWorker';
import { cleanupPDFBlobUrl } from '../../utils/pdfSource';
import { LargePDFWarningDialog } from '../LargePDFWarningDialog';
import { useWordEditor } from '../../contexts/WordEditorContext';
import { BookmarkCreator } from '../Bookmarks/BookmarkCreator';
import { useToast } from '../Toast/ToastContext';

interface ArchiveFileViewerProps {
  file: ArchiveFile | null;
  files: ArchiveFile[];
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  initialPage?: number;
  onInitialPageApplied?: () => void;
}

export function ArchiveFileViewer({ file, files, onClose, onNext, onPrevious, initialPage, onInitialPageApplied }: ArchiveFileViewerProps) {
  const { isOpen: isWordEditorOpen, setIsOpen: setWordEditorOpen, panelWidth, dividerPosition } = useWordEditor();
  const toast = useToast();
  const [isInlineMode, setIsInlineMode] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [fileData, setFileData] = useState<{ data: string; mimeType: string } | null>(null);
  const isOpeningWordEditorRef = useRef(false);
  const isReattachingRef = useRef(false);
  const reattachTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Detect if editor is in inline mode (check for inline container)
  useEffect(() => {
    const checkInlineMode = () => {
      const inlineContainer = document.getElementById('word-editor-inline-container');
      setIsInlineMode(!!inlineContainer && isWordEditorOpen);
    };
    
    checkInlineMode();
    
    // Check periodically in case container is added/removed
    const interval = setInterval(checkInlineMode, 100);
    
    // Also check on mutations
    const observer = new MutationObserver(checkInlineMode);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [isWordEditorOpen]);

  // Keep ref in sync with word editor state to prevent closing when editor is open
  useEffect(() => {
    isOpeningWordEditorRef.current = isWordEditorOpen;
    // Clear reattaching flag when word editor is confirmed open
    if (isWordEditorOpen && isReattachingRef.current) {
      isReattachingRef.current = false;
      // Clear any pending timeout
      if (reattachTimeoutRef.current) {
        clearTimeout(reattachTimeoutRef.current);
        reattachTimeoutRef.current = null;
      }
    }
  }, [isWordEditorOpen]);

  // Listen for events that open the word editor to prevent closing during opening/reattaching
  useEffect(() => {
    const handleOpenEditor = () => {
      // Immediately set refs to prevent closing during opening/reattaching
      isOpeningWordEditorRef.current = true;
      isReattachingRef.current = true;
      
      // Clear any existing timeout
      if (reattachTimeoutRef.current) {
        clearTimeout(reattachTimeoutRef.current);
      }
      
      // Fallback: Clear the reattaching flag after a delay as a safety net
      // The flag should be cleared when isWordEditorOpen becomes true, but this ensures
      // we don't get stuck if something goes wrong
      reattachTimeoutRef.current = setTimeout(() => {
        isReattachingRef.current = false;
        reattachTimeoutRef.current = null;
      }, 2000);
    };

    // Listen to both the reattach event and the open-from-viewer event
    // Both should prevent closing during the opening process
    window.addEventListener('reattach-word-editor-data' as any, handleOpenEditor as EventListener);
    window.addEventListener('open-word-editor-from-viewer' as any, handleOpenEditor as EventListener);
    return () => {
      window.removeEventListener('reattach-word-editor-data' as any, handleOpenEditor as EventListener);
      window.removeEventListener('open-word-editor-from-viewer' as any, handleOpenEditor as EventListener);
      if (reattachTimeoutRef.current) {
        clearTimeout(reattachTimeoutRef.current);
        reattachTimeoutRef.current = null;
      }
    };
  }, []);
  const [loading, setLoading] = useState(false);
  const [showBookmarkCreator, setShowBookmarkCreator] = useState(false);
  const [currentPageBookmarks, setCurrentPageBookmarks] = useState<Array<{ id: string; name: string }>>([]);
  const initialPageAppliedRef = useRef(false);
  
  // PDF.js state
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfLoadingProgress, setPdfLoadingProgress] = useState(0);
  const [pageRendering, setPageRendering] = useState(false);
  const [pageScale, setPageScale] = useState(1.5);
  const [pageJumpValue, setPageJumpValue] = useState('');
  const pageJumpInputRef = useRef<HTMLInputElement>(null);
  // Initialize zoom mode - always enabled to allow proper canvas sizing
  const [isPdfZoomed, setIsPdfZoomed] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<PDFRenderTask | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const canvasX = useMotionValue(0);
  const canvasY = useMotionValue(0);
  const imageX = useMotionValue(0);
  const imageY = useMotionValue(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const isDraggingRef = useRef(false);
  const isPdfDraggingRef = useRef(false);
  const dragConstraintsRef = useRef<{ left: number; right: number; top: number; bottom: number } | false | null>(null);
  
  // Warning dialog state
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warningFileSize, setWarningFileSize] = useState(0);
  const [memoryInfo, setMemoryInfo] = useState<{ totalMemory: number; freeMemory: number; usedMemory: number } | null>(null);
  const [pendingLoad, setPendingLoad] = useState<{ filePath: string; pdfjsLib: any } | null>(null);
  const warningResolveRef = useRef<((value: boolean) => void) | null>(null);
  
  // Handle warning dialog actions
  const handleWarningContinue = async () => {
    setShowWarningDialog(false);
    if (warningResolveRef.current) {
      warningResolveRef.current(true);
      warningResolveRef.current = null;
    }
    
    // Continue loading the PDF
    if (pendingLoad) {
      try {
        // Ensure worker is set up before loading
        await setupPDFWorker();
        
        // Small delay to ensure worker is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { createChunkedPDFSource } = await import('../../utils/pdfSource');
        const pdf = await createChunkedPDFSource(
          pendingLoad.filePath, 
          pendingLoad.pdfjsLib,
          undefined, // showWarning (not needed here, already shown)
          (progress) => setPdfLoadingProgress(progress) // onProgress
        );
        
        // Verify PDF is valid before setting state
        if (pdf && typeof pdf.numPages === 'number' && pdf.numPages > 0) {
          setPdfDoc(pdf);
          setTotalPages(pdf.numPages);
          // Use initialPage if provided, otherwise default to 1
          const startPage = initialPage && initialPage >= 1 && initialPage <= pdf.numPages ? initialPage : 1;
          setCurrentPage(startPage);
          setPdfLoading(false);
          setPdfLoadingProgress(0);
        } else {
          throw new Error('Invalid PDF document loaded');
        }
      } catch (error) {
        logger.error('Failed to load PDF after warning:', error);
        setPdfLoading(false);
        setPdfLoadingProgress(0);
        setPdfDoc(null);
      }
      setPendingLoad(null);
    }
  };
  
  const handleWarningCancel = () => {
    setShowWarningDialog(false);
    if (warningResolveRef.current) {
      warningResolveRef.current(false);
      warningResolveRef.current = null;
    }
    
    // Cleanup any pending PDF resources
    if (pendingLoad) {
      // Cancel any ongoing operations
      setPendingLoad(null);
    }
    
    // Cleanup PDF document if it exists
    if (pdfDoc) {
      try {
        cleanupPDFBlobUrl(pdfDoc);
        pdfDoc.destroy().catch(() => {
          // Ignore destroy errors
        });
        
        // Close file handle if this was a streaming source
        if (file && file.type === 'pdf' && window.electronAPI) {
          window.electronAPI.closePDFFileHandle(file.path).catch(() => {
            // Ignore cleanup errors
          });
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      setPdfDoc(null);
    }
    
    setPdfLoading(false);
    setPdfLoadingProgress(0);
    
    // Force garbage collection hint
    if (typeof globalThis !== 'undefined' && (globalThis as any).gc) {
      (globalThis as any).gc();
    }
  };
  
  const handleWarningSplit = () => {
    // Placeholder for future split feature
    logger.info('Split PDF feature coming soon');
  };

  // Cleanup PDF when component unmounts or file changes
  useEffect(() => {
    return () => {
      // Cleanup PDF document when component unmounts
      if (pdfDoc) {
        try {
          cleanupPDFBlobUrl(pdfDoc);
          pdfDoc.destroy().catch(() => {
            // Ignore destroy errors
          });
          
          // Close file handle if this was a streaming source
          if (file && file.type === 'pdf' && window.electronAPI) {
            window.electronAPI.closePDFFileHandle(file.path).catch(() => {
              // Ignore cleanup errors
            });
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [pdfDoc, file]);
  
  // Cleanup when viewer closes
  const handleClose = useCallback(() => {
    // Cleanup PDF before closing
    if (pdfDoc) {
      try {
        cleanupPDFBlobUrl(pdfDoc);
        pdfDoc.destroy().catch(() => {
          // Ignore destroy errors
        });
        
        // Close file handle if this was a streaming source
        if (file && file.type === 'pdf' && window.electronAPI) {
          window.electronAPI.closePDFFileHandle(file.path).catch(() => {
            // Ignore cleanup errors
          });
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      setPdfDoc(null);
    }
    
    // Clear file data to free memory immediately
    setFileData(null);
    
    // Force garbage collection hint if available
    if (typeof globalThis !== 'undefined' && (globalThis as any).gc) {
      (globalThis as any).gc();
    }
    
    onClose();
  }, [pdfDoc, file, onClose]);

  useEffect(() => {
    if (file) {
      // Clear previous file data before loading new one to free memory
      if (fileData) {
        setFileData(null);
      }
      
      if (file.type === 'pdf') {
        loadPDF();
      } else {
        loadFileData();
      }
    } else {
      // Cleanup when file is cleared
      if (pdfDoc) {
        try {
          cleanupPDFBlobUrl(pdfDoc);
          pdfDoc.destroy().catch(() => {
            // Ignore destroy errors
          });
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      setFileData(null);
      setPdfDoc(null);
      setCurrentPage(1);
      setTotalPages(0);
    }
    // Reset image zoom when file changes
    setImageScale(1);
    imageX.set(0);
    imageY.set(0);
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
      logger.error('Failed to load file data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPDF = async () => {
    if (!file || !window.electronAPI || file.type !== 'pdf') return;

    try {
      setPdfLoading(true);
      setPdfLoadingProgress(0);
      
      // Import PDF.js and setup worker
      const [pdfjsLib, { createChunkedPDFSource }] = await Promise.all([
        import('pdfjs-dist'),
        import('../../utils/pdfSource'),
      ]);
      await setupPDFWorker();
      
      setPdfLoadingProgress(10);
      const fileData = await window.electronAPI.readPDFFile(file.path);
      
      let pdf: PDFDocument;
      
      // Handle new format with type field
      if (fileData && typeof fileData === 'object' && 'type' in fileData) {
        if (fileData.type === 'file-path') {
          // Large file - use chunked reading with warning dialog
          setPdfLoadingProgress(20);
          
          // Show warning dialog for large files
          const showWarning = async (fileSize: number, memInfo: { totalMemory: number; freeMemory: number; usedMemory: number }): Promise<boolean> => {
            return new Promise((resolve) => {
              setWarningFileSize(fileSize);
              setMemoryInfo(memInfo);
              setShowWarningDialog(true);
              setPendingLoad({ filePath: fileData.path, pdfjsLib });
              warningResolveRef.current = resolve;
            });
          };
          
          pdf = await createChunkedPDFSource(
            fileData.path, 
            pdfjsLib, 
            showWarning,
            (progress) => setPdfLoadingProgress(progress) // onProgress
          );
        } else if (fileData.type === 'base64') {
          // Small file - decode base64
          setPdfLoadingProgress(20);
          const cleanBase64 = fileData.data.trim().replace(/\s/g, '');
          const binaryString = atob(cleanBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const arrayBuffer = bytes.buffer;
          
          setPdfLoadingProgress(30);
          const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            disableAutoFetch: false,
            disableStream: false,
            verbosity: 0,
          });
          pdf = await loadingTask.promise;
        } else {
          throw new Error('Unexpected PDF file data format');
        }
      } else if (typeof fileData === 'string') {
        // Legacy format: base64 string
        setPdfLoadingProgress(20);
        const cleanBase64 = fileData.trim().replace(/\s/g, '');
        const binaryString = atob(cleanBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;
        
        setPdfLoadingProgress(30);
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          disableAutoFetch: false,
          disableStream: false,
          verbosity: 0,
        });
        pdf = await loadingTask.promise;
      } else if (Array.isArray(fileData)) {
        // Legacy format: array of numbers
        setPdfLoadingProgress(20);
        const arrayBuffer = new Uint8Array(fileData).buffer;
        
        setPdfLoadingProgress(30);
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          disableAutoFetch: false,
          disableStream: false,
          verbosity: 0,
        });
        pdf = await loadingTask.promise;
      } else {
        throw new Error('Unexpected PDF file data format');
      }
      
      setPdfLoadingProgress(95);
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      // Use initialPage if provided, otherwise default to 1
      const startPage = initialPage && initialPage >= 1 && initialPage <= pdf.numPages ? initialPage : 1;
      setCurrentPage(startPage);
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
      logger.error('Failed to load PDF:', error);
      setPdfLoading(false);
      setPdfLoadingProgress(0);
    }
  };

  // Calculate drag constraints based on canvas and container sizes
  const calculateDragConstraints = useCallback(() => {
    if (!canvasRef.current || !pdfContainerRef.current) {
      return false; // Return false instead of null for framer-motion
    }

    const canvas = canvasRef.current;
    const container = pdfContainerRef.current;
    
    // Use actual canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Only enable constraints if canvas is larger than container
    if (canvasWidth <= containerWidth && canvasHeight <= containerHeight) {
      return false; // No constraints needed
    }
    
    // Calculate overflow (how much canvas extends beyond container)
    const overflowX = Math.max(0, (canvasWidth - containerWidth) / 2);
    const overflowY = Math.max(0, (canvasHeight - containerHeight) / 2);
    
    // Return constraints relative to center (0, 0)
    return {
      left: -overflowX,
      right: overflowX,
      top: -overflowY,
      bottom: overflowY,
    };
  }, []);

  // Update drag constraints when page scale or panel width changes
  useEffect(() => {
    if (pdfDoc && pageScale >= 1.0 && isPdfZoomed) {
      const updateConstraints = () => {
        const constraints = calculateDragConstraints();
        dragConstraintsRef.current = constraints;
      };
      
      // Immediate update attempt
      requestAnimationFrame(updateConstraints);
      
      // Also update after multiple checkpoints to catch layout changes when panel opens
      const timeout1 = setTimeout(updateConstraints, 0); // Next tick
      const timeout2 = setTimeout(updateConstraints, 16); // One frame
      const timeout3 = setTimeout(updateConstraints, 50); // After brief delay
      const timeout4 = setTimeout(updateConstraints, 100); // After potential animations
      
      // Also listen for resize events to recalculate constraints
      const resizeObserver = new ResizeObserver(() => {
        // Use requestAnimationFrame for smooth updates during resize
        requestAnimationFrame(updateConstraints);
      });
      
      if (pdfContainerRef.current) {
        resizeObserver.observe(pdfContainerRef.current);
      }
      
      if (canvasRef.current) {
        resizeObserver.observe(canvasRef.current);
      }
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        clearTimeout(timeout4);
        resizeObserver.disconnect();
      };
    } else {
      dragConstraintsRef.current = false;
    }
  }, [pdfDoc, pageScale, isPdfZoomed, panelWidth, isWordEditorOpen, calculateDragConstraints]);

  const renderPDFPage = async (pageNum: number) => {
    if (!pdfDoc) return;

    // Verify PDF document is still valid (not destroyed)
    try {
      // Check if document is still valid by accessing a property
      if (typeof pdfDoc.numPages !== 'number' || pdfDoc.numPages <= 0) {
        logger.warn('PDF document is invalid or destroyed');
        return;
      }
    } catch (e) {
      logger.warn('PDF document has been destroyed, cannot render');
      return;
    }

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
      logger.warn('Canvas not available for rendering after retries');
      return;
    }

    try {
      setPageRendering(true);
      
      // Double-check PDF is still valid before getting page
      if (!pdfDoc) {
        setPageRendering(false);
        return;
      }
      
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: pageScale });
      
      const context = canvas.getContext('2d');
      
      if (!context) {
        logger.warn('Failed to get canvas context');
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
      
      // Recalculate drag constraints after render using requestAnimationFrame for smooth update
      requestAnimationFrame(() => {
        const constraints = calculateDragConstraints();
        dragConstraintsRef.current = constraints;
      });
    } catch (error: unknown) {
      // Ignore cancellation errors
      const errorName = error && typeof error === 'object' && 'name' in error ? String(error.name) : undefined;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if error is due to destroyed document or worker
      if (errorMessage.includes('sendWithPromise') || 
          errorMessage.includes('null') ||
          errorMessage.includes('destroyed') ||
          errorMessage.includes('worker')) {
        logger.warn('PDF document or worker was destroyed during render');
        setPageRendering(false);
        renderTaskRef.current = null;
        return;
      }
      
      if (errorName === 'RenderingCancelledException' || errorMessage.includes('cancelled')) {
        return;
      }
      logger.error('Failed to render PDF page:', error);
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

  const handlePageJump = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageJumpValue, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setPageJumpValue('');
      pageJumpInputRef.current?.blur();
    }
  }, [pageJumpValue, totalPages]);

  const handlePageJumpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setPageJumpValue(value);
    }
  }, []);

  const handlePageJumpKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setPageJumpValue('');
      pageJumpInputRef.current?.blur();
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    setPageScale(prev => {
      const newScale = Math.min(prev + 0.25, 5);
      // Keep zoom mode enabled for all scales
      if (!isPdfZoomed) {
        setIsPdfZoomed(true);
      }
      // Reset position to center when zooming
      canvasX.set(0);
      canvasY.set(0);
      return newScale;
    });
  }, [isPdfZoomed, canvasX, canvasY]);

  const handleZoomOut = useCallback(() => {
    setPageScale(prev => {
      const newScale = Math.max(prev - 0.25, 0.5);
      // Keep zoom mode enabled for all scales
      if (!isPdfZoomed) {
        setIsPdfZoomed(true);
      }
      // Reset position to center when zooming
      canvasX.set(0);
      canvasY.set(0);
      return newScale;
    });
  }, [isPdfZoomed, canvasX, canvasY]);


  useEffect(() => {
    if (pdfDoc && currentPage > 0) {
      // Verify PDF document is still valid before rendering
      try {
        // Check if document is still valid by accessing a property
        if (typeof pdfDoc.numPages !== 'number' || pdfDoc.numPages <= 0) {
          logger.warn('PDF document is invalid, skipping render');
          return;
        }
      } catch (e) {
        logger.warn('PDF document has been destroyed, skipping render');
        return;
      }
      
      // Use requestAnimationFrame to ensure canvas is in DOM
      requestAnimationFrame(() => {
        // Double-check PDF is still valid
        if (!pdfDoc) {
          return;
        }
        
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

  // Reset canvas position to center when scale changes
  useEffect(() => {
    // Reset position to center when scale changes
    canvasX.set(0);
    canvasY.set(0);
  }, [pageScale, canvasX, canvasY]);

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

  // Reset initialPageAppliedRef when file changes
  useEffect(() => {
    initialPageAppliedRef.current = false;
  }, [file]);

  // Set initial page once when PDF loads and initialPage is provided
  useEffect(() => {
    if (initialPage && initialPage >= 1 && pdfDoc && initialPage <= totalPages && !initialPageAppliedRef.current) {
      setCurrentPage(initialPage);
      initialPageAppliedRef.current = true;
      // Notify parent that initial page has been applied
      if (onInitialPageApplied) {
        onInitialPageApplied();
      }
    }
  }, [initialPage, pdfDoc, totalPages, onInitialPageApplied]);

  // Check for bookmarks on current page
  useEffect(() => {
    const checkBookmarks = async () => {
      if (!file || file.type !== 'pdf' || !window.electronAPI) {
        setCurrentPageBookmarks([]);
        return;
      }

      try {
        const allBookmarks = await window.electronAPI.getBookmarks();
        const pageBookmarks = allBookmarks.filter(
          b => b.pdfPath === file.path && b.pageNumber === currentPage
        );
        setCurrentPageBookmarks(pageBookmarks.map(b => ({ id: b.id, name: b.name })));
      } catch (error) {
        logger.error('Failed to check bookmarks:', error);
        setCurrentPageBookmarks([]);
      }
    };

    checkBookmarks();
  }, [file, currentPage]);

  // Keyboard navigation for images
  useEffect(() => {
    if (file?.type !== 'image' || !fileData) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setImageScale(prev => {
          const newScale = Math.min(4, prev + 0.25);
          imageX.set(0);
          imageY.set(0);
          return newScale;
        });
      } else if (e.key === '-') {
        e.preventDefault();
        setImageScale(prev => {
          const newScale = Math.max(0.5, prev - 0.25);
          imageX.set(0);
          imageY.set(0);
          return newScale;
        });
      } else if (e.key === '0') {
        e.preventDefault();
        setImageScale(1);
        imageX.set(0);
        imageY.set(0);
      } else if (e.key === 'Escape') {
        if (imageScale > 1) {
          e.preventDefault();
          setImageScale(1);
          imageX.set(0);
          imageY.set(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [file, fileData, imageX, imageY]);

  if (!file) return null;

  const currentIndex = files.findIndex(f => f.path === file.path);
  const hasNext = onNext && currentIndex < files.length - 1;
  const hasPrevious = onPrevious && currentIndex > 0;

  // Generate thumbnail from current PDF page
  const generatePageThumbnail = useCallback(async (): Promise<string | undefined> => {
    if (!pdfDoc || !canvasRef.current || file?.type !== 'pdf') {
      return undefined;
    }

    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Calculate thumbnail size (200px max dimension)
      const THUMBNAIL_SIZE = 200;
      const aspectRatio = viewport.width / viewport.height;
      let width = THUMBNAIL_SIZE;
      let height = THUMBNAIL_SIZE;
      
      if (aspectRatio > 1) {
        height = THUMBNAIL_SIZE / aspectRatio;
      } else {
        width = THUMBNAIL_SIZE * aspectRatio;
      }
      
      // Create temporary canvas for thumbnail
      const thumbnailCanvas = document.createElement('canvas');
      thumbnailCanvas.width = width;
      thumbnailCanvas.height = height;
      const context = thumbnailCanvas.getContext('2d', {
        willReadFrequently: false,
        alpha: false,
      });
      
      if (!context) {
        return undefined;
      }
      
      // Render page to thumbnail canvas
      const thumbnailViewport = page.getViewport({ scale: width / viewport.width });
      await page.render({
        canvasContext: context,
        viewport: thumbnailViewport,
      }).promise;
      
      // Convert to base64 PNG
      return thumbnailCanvas.toDataURL('image/png');
    } catch (error) {
      logger.error('Failed to generate bookmark thumbnail:', error);
      return undefined;
    }
  }, [pdfDoc, currentPage, file?.type]);

  // Handle bookmark creation
  const handleCreateBookmark = useCallback(async (bookmarkData: {
    pdfPath: string;
    pageNumber: number;
    name: string;
    description?: string;
    note?: string;
    createFolder: boolean;
    thumbnail?: string;
  }) => {
    if (!window.electronAPI) {
      toast.error('Electron API not available');
      return;
    }

    try {
      // Generate thumbnail if not provided
      let thumbnail = bookmarkData.thumbnail;
      if (!thumbnail) {
        thumbnail = await generatePageThumbnail();
      }

      // Check if folder already exists for this PDF (always check, not just if createFolder is true)
      const folders = await window.electronAPI.getBookmarkFolders();
      // Normalize paths for comparison
      const normalizePath = (path: string) => path.replace(/\\/g, '/');
      const normalizedPdfPath = normalizePath(bookmarkData.pdfPath);
      const existingFolder = folders.find(f => normalizePath(f.pdfPath) === normalizedPdfPath);
      
      let folderId: string | undefined = undefined;
      
      // If folder exists, use it; otherwise create one if requested
      if (existingFolder) {
        folderId = existingFolder.id;
      } else if (bookmarkData.createFolder) {
        try {
          const newFolder = await window.electronAPI.createBookmarkFolder({
            name: `${file?.name || 'PDF'} Bookmarks`,
            pdfPath: bookmarkData.pdfPath,
            thumbnail,
          });
          
          folderId = newFolder.id;
          
          // Dispatch event for folder creation
          const folderEvent = new CustomEvent('bookmark-folder-created', {
            detail: { folderId: newFolder.id }
          });
          window.dispatchEvent(folderEvent);
        } catch (error) {
          logger.warn('Failed to create bookmark folder:', error);
        }
      }

      // Create bookmark with folderId if we have one
      const bookmark = await window.electronAPI.createBookmark({
        pdfPath: bookmarkData.pdfPath,
        pageNumber: bookmarkData.pageNumber,
        name: bookmarkData.name,
        description: bookmarkData.description,
        note: bookmarkData.note,
        thumbnail,
        folderId,
        tags: [],
      });

      // Save thumbnail if generated
      if (thumbnail) {
        try {
          await window.electronAPI.saveBookmarkThumbnail(bookmark.id, thumbnail);
        } catch (error) {
          logger.warn('Failed to save bookmark thumbnail:', error);
        }
      }

      toast.success('Bookmark created successfully');
      setShowBookmarkCreator(false);
      
      // Refresh bookmark indicator for current page
      const allBookmarks = await window.electronAPI.getBookmarks();
      const pageBookmarks = allBookmarks.filter(
        b => b.pdfPath === file?.path && b.pageNumber === currentPage
      );
      setCurrentPageBookmarks(pageBookmarks.map(b => ({ id: b.id, name: b.name })));
      
      // Dispatch event to notify bookmark library to refresh
      const refreshEvent = new CustomEvent('bookmark-created', {
        detail: { bookmarkId: bookmark.id, folderId: bookmark.folderId }
      });
      window.dispatchEvent(refreshEvent);
    } catch (error) {
      logger.error('Failed to create bookmark:', error);
      toast.error('Failed to create bookmark');
    }
  }, [generatePageThumbnail, file?.name, toast]);

  return (
    <>
      <AnimatePresence>
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          // Only close if clicking directly on the backdrop, not on child elements
          // Also don't close if word editor is open, we're in the process of opening it, or reattaching
          if (e.target === e.currentTarget && !isWordEditorOpen && !isOpeningWordEditorRef.current && !isReattachingRef.current) {
            handleClose();
          }
        }}
        className="fixed inset-y-0 left-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 transition-all duration-300"
        style={{
          // When editor is open in inline mode (archive visible), constrain to archive section width
          // When editor is open in overlay mode (archive not visible), leave space for panel on right
          width: isWordEditorOpen 
            ? (isInlineMode
                ? `${dividerPosition}%` // Inline mode: archive section width
                : `calc(100vw - ${panelWidth}px)`) // Overlay mode: viewport width minus panel width
            : '100vw',
          // Only set right in overlay mode to ensure proper positioning
          ...(isWordEditorOpen && !isInlineMode ? { right: `${panelWidth}px` } : {}),
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className={`relative ${file?.type === 'pdf' ? 'w-full h-full' : 'w-full h-full flex items-center justify-center'}`}
          onClick={(e) => {
            // Close on backdrop click only when not zoomed and word editor is not open
            // Also don't close if we're reattaching
            if (e.target === e.currentTarget && !isWordEditorOpen && !isOpeningWordEditorRef.current && !isReattachingRef.current) {
              if (file?.type === 'image' && imageScale <= 1) {
                handleClose();
              } else if (file?.type !== 'image' && file?.type !== 'pdf') {
                handleClose();
              }
            }
          }}
        >

          {/* Image Zoom Controls */}
          {file.type === 'image' && fileData && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-2 border border-cyber-purple-500/50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageScale(prev => Math.max(0.5, prev - 0.25));
                  imageX.set(0);
                  imageY.set(0);
                }}
                className="text-white hover:text-cyber-purple-400 transition-colors p-1.5 rounded hover:bg-gray-700/50"
                aria-label="Zoom out"
                disabled={imageScale <= 0.5}
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-white text-sm font-medium min-w-[50px] text-center">
                {Math.round(imageScale * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageScale(prev => Math.min(4, prev + 0.25));
                  imageX.set(0);
                  imageY.set(0);
                }}
                className="text-white hover:text-cyber-purple-400 transition-colors p-1.5 rounded hover:bg-gray-700/50"
                aria-label="Zoom in"
                disabled={imageScale >= 4}
              >
                <ZoomIn size={18} />
              </button>
              <div className="w-px h-4 bg-gray-600 mx-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageScale(1);
                  imageX.set(0);
                  imageY.set(0);
                }}
                className="text-white hover:text-cyber-purple-400 transition-colors text-xs px-2 py-1 rounded hover:bg-gray-700/50"
                aria-label="Reset zoom"
              >
                Reset
              </button>
            </div>
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
            <div className="absolute top-4 left-4 z-30 bg-black/70 backdrop-blur-sm text-white font-medium px-4 py-2 rounded-lg text-sm shadow-lg border border-cyber-purple-500/50 max-w-xs truncate">
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
                    <p className="text-gray-300 mb-2">
                      {pdfLoadingProgress < 90 ? 'Reading file...' : 'Parsing PDF...'}
                    </p>
                    {pdfLoadingProgress > 0 && (
                      <div className="w-64 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyber-purple-400 to-cyber-purple-600 h-full transition-all duration-300 ease-out"
                          style={{ width: `${pdfLoadingProgress}%` }}
                        />
                      </div>
                    )}
                    {pdfLoadingProgress > 0 && (
                      <p className="text-gray-400 text-sm mt-2">
                        {pdfLoadingProgress < 90 
                          ? `Reading: ${Math.round((pdfLoadingProgress / 90) * 100)}%`
                          : `Parsing: ${Math.round(((pdfLoadingProgress - 90) / 10) * 100)}%`
                        }
                      </p>
                    )}
                  </div>
                </div>
              ) : pdfDoc ? (
                <div className="relative w-full h-full flex flex-col items-center bg-gray-900 rounded-lg overflow-hidden">
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
                      <form onSubmit={handlePageJump} className="flex items-center gap-1">
                        <input
                          ref={pageJumpInputRef}
                          type="text"
                          value={pageJumpValue}
                          onChange={handlePageJumpChange}
                          onKeyDown={handlePageJumpKeyDown}
                          placeholder="Go to..."
                          className="w-20 px-2 py-1 text-sm text-white bg-gray-700/50 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-cyber-purple-500/50 focus:border-cyber-purple-500 placeholder-gray-500"
                          aria-label="Jump to page number"
                          title={`Enter page number (1-${totalPages}) and press Enter`}
                        />
                      </form>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages}
                        className="p-2 text-white hover:text-cyber-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded hover:bg-gray-700"
                        aria-label="Next page"
                      >
                        <ChevronRight size={20} />
                      </button>
                      {/* Bookmarked indicator */}
                      {currentPageBookmarks.length > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1 px-2 py-1 bg-cyber-purple-500/20 border border-cyber-purple-500/50 rounded text-xs text-cyber-purple-300"
                          title={`${currentPageBookmarks.length} bookmark${currentPageBookmarks.length > 1 ? 's' : ''} on this page`}
                        >
                          <Bookmark size={12} className="fill-cyber-purple-400" />
                          <span>Bookmarked</span>
                        </motion.div>
                      )}
                      {/* Bookmark button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowBookmarkCreator(true);
                        }}
                        className="p-2 text-white hover:text-cyber-purple-400 transition-colors rounded hover:bg-gray-700"
                        aria-label="Create bookmark"
                        title="Create bookmark for this page"
                      >
                        <BookmarkPlus size={20} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Word Editor button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          // Open word editor via context and dispatch event to ensure SettingsPanel opens it
                          // The useEffect will sync the ref with the state
                          setWordEditorOpen(true);
                          // Dispatch event to ensure SettingsPanel opens the word editor panel
                          window.dispatchEvent(new CustomEvent('open-word-editor-from-viewer'));
                        }}
                        className="p-2 text-white hover:text-cyber-purple-400 transition-colors rounded hover:bg-gray-700"
                        aria-label="Open word editor"
                        title="Open word editor"
                      >
                        <FileText size={20} />
                      </button>
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
                      {/* Close button */}
                      <button
                        onClick={handleClose}
                        className="p-2 text-white hover:text-cyber-purple-400 transition-colors rounded hover:bg-gray-700"
                        aria-label="Close"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {/* PDF Canvas Container with Zoom and Pan */}
                  <div 
                    ref={pdfContainerRef}
                    className="flex-1 w-full h-full relative overflow-hidden"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pageRendering && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-purple-400 mx-auto mb-2"></div>
                          <p className="text-gray-300 text-sm">Loading page...</p>
                        </div>
                      </div>
                    )}
                    {/* Canvas wrapper for drag functionality */}
                    <motion.div
                      drag={isPdfZoomed && pageScale >= 1.0}
                      dragConstraints={typeof dragConstraintsRef.current === 'object' && dragConstraintsRef.current !== null ? dragConstraintsRef.current : pdfContainerRef}
                      dragElastic={0.1}
                      dragMomentum={false}
                      dragPropagation={false}
                      onDragStart={() => {
                        isPdfDraggingRef.current = true;
                        // Prevent text selection during drag
                        document.body.style.userSelect = 'none';
                        document.body.style.cursor = 'grabbing';
                        // Recalculate constraints at drag start in case panel just opened/resized
                        requestAnimationFrame(() => {
                          const constraints = calculateDragConstraints();
                          dragConstraintsRef.current = constraints;
                        });
                      }}
                      onDragEnd={() => {
                        isPdfDraggingRef.current = false;
                        // Small delay to prevent click events after drag
                        setTimeout(() => {
                          document.body.style.userSelect = '';
                          document.body.style.cursor = '';
                        }, 50);
                        // Recalculate constraints after drag ends to ensure accuracy
                        requestAnimationFrame(() => {
                          const constraints = calculateDragConstraints();
                          dragConstraintsRef.current = constraints;
                        });
                      }}
                      whileDrag={{ cursor: 'grabbing' }}
                      style={{
                        cursor: (isPdfZoomed && pageScale >= 1.0 && !isPdfDraggingRef.current) ? 'grab' : 'default',
                        display: 'inline-block',
                        touchAction: 'none',
                        willChange: 'transform',
                        x: canvasX,
                        y: canvasY,
                      }}
                      onClick={(e) => {
                        // Only stop propagation if we're not dragging
                        if (isPdfZoomed && pageScale >= 1.0 && !isPdfDraggingRef.current) {
                          e.stopPropagation();
                        }
                      }}
                    >
                      <canvas
                        ref={canvasRef}
                        className={`shadow-2xl bg-gray-100 rounded transition-opacity duration-300 select-none ${
                          pageRendering ? 'opacity-30' : 'opacity-100'
                        }`}
                        style={{ 
                          maxWidth: isPdfZoomed ? 'none' : '100%',
                          maxHeight: isPdfZoomed ? 'none' : 'calc(100vh - 120px)',
                          width: isPdfZoomed ? undefined : 'auto',
                          height: isPdfZoomed ? undefined : 'auto',
                          display: 'block',
                          objectFit: 'none',
                        }}
                      />
                    </motion.div>
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
            <div 
              ref={imageContainerRef}
              className={`relative w-full h-full flex items-center justify-center ${
                imageScale > 1 ? 'overflow-hidden' : ''
              }`}
            >
              {file.type === 'image' ? (
                <motion.div
                  style={{
                    x: imageX,
                    y: imageY,
                    cursor: imageScale > 1 ? 'grab' : 'default',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    touchAction: 'none',
                  }}
                  drag={imageScale > 1}
                  dragConstraints={imageScale > 1 ? imageContainerRef : false}
                  dragElastic={0}
                  dragMomentum={false}
                  whileDrag={{ cursor: 'grabbing' }}
                  onDragStart={(e) => {
                    isDraggingRef.current = true;
                    e.stopPropagation();
                  }}
                  onDrag={(e) => {
                    e.stopPropagation();
                  }}
                  onDragEnd={(e) => {
                    // Use setTimeout to allow drag to complete before resetting flag
                    setTimeout(() => {
                      isDraggingRef.current = false;
                    }, 100);
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    // Only zoom on click if not zoomed and not dragging
                    if (!isDraggingRef.current && imageScale <= 1) {
                      e.stopPropagation();
                      setImageScale(2);
                    }
                  }}
                >
                  <img
                    ref={imageRef}
                    src={fileData.data}
                    alt={file.name}
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border-2 border-cyber-purple-500/50 select-none"
                    style={{
                      cursor: imageScale > 1 ? 'grab' : 'zoom-in',
                      display: 'block',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      ...({ WebkitUserDrag: 'none' } as React.CSSProperties),
                      draggable: false,
                      transform: `scale(${imageScale})`,
                      transition: 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    } as React.CSSProperties}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (imageScale > 1) {
                        setImageScale(1);
                        imageX.set(0);
                        imageY.set(0);
                      } else {
                        setImageScale(2);
                        imageX.set(0);
                        imageY.set(0);
                      }
                    }}
                    onLoad={() => {
                      // Reset position when image loads
                      imageX.set(0);
                      imageY.set(0);
                    }}
                    onDragStart={(e) => {
                      // Prevent browser's default image drag
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                </motion.div>
              ) : file.type === 'video' ? (
                <video
                  src={file.path.startsWith('http') ? file.path : `vault-video://${encodeURIComponent(file.path)}`}
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
      
      {/* Large PDF Warning Dialog - Outside main AnimatePresence to avoid key conflicts */}
      {memoryInfo && (
        <LargePDFWarningDialog
          isOpen={showWarningDialog}
          fileSize={warningFileSize}
          totalMemory={memoryInfo.totalMemory}
          freeMemory={memoryInfo.freeMemory}
          onContinue={handleWarningContinue}
          onSplit={handleWarningSplit}
          onCancel={handleWarningCancel}
        />
      )}

      {/* Bookmark Creator */}
      {file?.type === 'pdf' && (
        <BookmarkCreator
          isOpen={showBookmarkCreator}
          onClose={() => setShowBookmarkCreator(false)}
          onConfirm={handleCreateBookmark}
          pdfPath={file.path}
          pageNumber={currentPage}
          pdfName={file.name}
        />
      )}
    </>
  );
}



