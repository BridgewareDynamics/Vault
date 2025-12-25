import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';
import { ExtractedPage } from '../types';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageViewerProps {
  page: ExtractedPage | null;
  onClose: () => void;
}

export const ImageViewer = memo(function ImageViewer({ page, onClose }: ImageViewerProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleZoomToggle = useCallback(() => {
    setIsZoomed(prev => !prev);
  }, []);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();
    if (!isZoomed) {
      // Only zoom in on click, not zoom out
      handleZoomToggle();
    }
  }, [isZoomed, handleZoomToggle]);

  if (!page) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          // Close if clicking outside the image
          if (e.target === e.currentTarget && !isZoomed) {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-viewer-title"
      >
        <div
          className={`relative ${isZoomed ? 'w-full h-full' : 'max-w-[90vw] max-h-[90vh]'}`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 text-white hover:text-cyber-purple-400 transition-colors z-10"
            aria-label="Close image viewer"
          >
            <X size={32} aria-hidden="true" />
          </button>

          {/* Zoom button */}
          <button
            onClick={handleZoomToggle}
            className="absolute -top-12 left-0 text-white hover:text-cyber-purple-400 transition-colors z-10"
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            {isZoomed ? <ZoomOut size={32} aria-hidden="true" /> : <ZoomIn size={32} aria-hidden="true" />}
          </button>

          {/* Page number */}
          <div id="image-viewer-title" className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gradient-purple text-white font-bold px-4 py-2 rounded-full text-sm shadow-lg border border-cyber-cyan-400/50 z-10">
            Page #{page.pageNumber}
          </div>

          {/* Image container with zoom and pan */}
          <div
            ref={imageContainerRef}
            className={`w-full h-full flex items-center justify-center ${isZoomed ? 'overflow-hidden' : ''}`}
          >
            <motion.img
              ref={imageRef}
              src={page.imageData}
              alt={`Page ${page.pageNumber}`}
              className={`
                ${isZoomed ? 'w-auto h-auto' : 'max-w-full max-h-[90vh]'}
                object-contain rounded-lg shadow-2xl
                border-2 border-cyber-purple-500/50
                select-none
              `}
              style={{
                cursor: isZoomed ? 'grab' : 'zoom-in',
                willChange: 'transform',
                transform: 'translate3d(0, 0, 0)', // Force GPU acceleration
              }}
              animate={{
                scale: isZoomed ? 2.5 : 1,
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={handleImageClick}
              drag={isZoomed}
              dragConstraints={isZoomed ? imageContainerRef : false}
              dragElastic={0.1}
              dragMomentum={false}
              whileDrag={{ cursor: 'grabbing' }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

