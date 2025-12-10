import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (file) {
      loadFileData();
    } else {
      setFileData(null);
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
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative max-w-[90vw] max-h-[90vh]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 text-white hover:text-cyber-purple-400 transition-colors z-10"
            aria-label="Close"
          >
            <X size={32} />
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
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gradient-purple text-white font-bold px-4 py-2 rounded-full text-sm shadow-lg border border-cyber-cyan-400/50">
            {file.name}
          </div>

          {/* File content */}
          {loading ? (
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
              ) : file.type === 'pdf' ? (
                <iframe
                  src={fileData.data}
                  className="w-full h-[90vh] rounded-lg shadow-2xl border-2 border-cyber-purple-500/50"
                  title={file.name}
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



