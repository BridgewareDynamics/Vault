import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ExtractedPage } from '../types';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageViewerProps {
  page: ExtractedPage | null;
  onClose: () => void;
}

export function ImageViewer({ page, onClose }: ImageViewerProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!page) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          // Close if clicking outside the image
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
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="absolute -top-12 left-0 text-white hover:text-cyber-purple-400 transition-colors z-10"
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            {isZoomed ? <ZoomOut size={32} /> : <ZoomIn size={32} />}
          </button>

          {/* Page number */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gradient-purple text-white font-bold px-4 py-2 rounded-full text-sm shadow-lg border border-cyber-cyan-400/50">
            Page #{page.pageNumber}
          </div>

          {/* Image */}
          <motion.img
            src={page.imageData}
            alt={`Page ${page.pageNumber}`}
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

