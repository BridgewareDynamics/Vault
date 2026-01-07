import { motion } from 'framer-motion';
import { Bookmark, Trash2, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Bookmark as BookmarkType } from '../../types';

interface BookmarkCardProps {
  bookmark: BookmarkType;
  onDelete: () => void;
  isDetached?: boolean;
}

export function BookmarkCard({ bookmark, onDelete, isDetached = false }: BookmarkCardProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThumbnail();
  }, [bookmark.id, bookmark.thumbnail]);

  const loadThumbnail = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Try to get thumbnail from storage
      if (bookmark.thumbnail) {
        // If thumbnail is a data URL, use it directly
        if (bookmark.thumbnail.startsWith('data:')) {
          setThumbnail(bookmark.thumbnail);
          setLoading(false);
          return;
        }
      }

      // Try to load from saved thumbnail
      const savedThumbnail = await window.electronAPI.getBookmarkThumbnail(bookmark.id);
      if (savedThumbnail) {
        setThumbnail(savedThumbnail);
      } else if (bookmark.thumbnail) {
        setThumbnail(bookmark.thumbnail);
      }
    } catch (error) {
      console.error('Failed to load thumbnail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPDF = async () => {
    // Check if we're in detached editor mode
    // In dev mode, it's a query param: ?editor=detached
    // In production, it could be query param or hash: ?editor=detached or #editor=detached
    const isDetachedEditor = 
      window.location.search.includes('editor=detached') || 
      window.location.hash.includes('editor=detached');
    
    if (isDetachedEditor && window.electronAPI?.openBookmarkInMainWindow) {
      // Use IPC to open bookmark in main window
      try {
        await window.electronAPI.openBookmarkInMainWindow({
          pdfPath: bookmark.pdfPath,
          pageNumber: bookmark.pageNumber,
        });
      } catch (error) {
        console.error('Failed to open bookmark in main window:', error);
      }
    } else {
      // Dispatch event to open PDF at specific page
      // This will be handled by the archive system
      // If not detached, this is from the Word Editor panel, so keep the panel open
      const event = new CustomEvent('open-bookmark', {
        detail: {
          pdfPath: bookmark.pdfPath,
          pageNumber: bookmark.pageNumber,
          keepPanelOpen: !isDetached, // Keep panel open if opened from within the panel
        },
      });
      window.dispatchEvent(event);
    }
  };

  const pdfName = bookmark.pdfPath.split(/[/\\]/).pop() || bookmark.pdfPath;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-cyber-purple-500/50 transition-all ${isDetached ? '' : 'w-full'}`}
      style={isDetached ? { width: '226px' } : undefined}
    >
      {/* Thumbnail */}
      <div className="relative w-full h-32 bg-gray-900 overflow-hidden">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyber-purple-400 border-r-cyber-cyan-400 animate-spin"></div>
              <div className="absolute inset-1 rounded-full border border-transparent border-b-cyber-cyan-400 border-l-cyber-purple-400 animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}></div>
            </div>
          </div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={`Page ${bookmark.pageNumber} thumbnail`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <Bookmark size={32} className="text-gray-600" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
          Page {bookmark.pageNumber}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h4
          onClick={handleOpenPDF}
          className="text-white font-medium mb-1 cursor-pointer hover:text-cyber-purple-400 transition-colors line-clamp-1"
          title={`${pdfName} - Page ${bookmark.pageNumber}`}
        >
          {bookmark.name}
        </h4>
        <p className="text-xs text-gray-400 mb-2 line-clamp-1" title={pdfName}>
          {pdfName}
        </p>
        {bookmark.description && (
          <p className="text-sm text-gray-300 mb-2 line-clamp-2" title={bookmark.description}>
            {bookmark.description}
          </p>
        )}
        {bookmark.note && (
          <p className="text-xs text-gray-400 italic line-clamp-2" title={bookmark.note}>
            {bookmark.note}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
          <button
            onClick={handleOpenPDF}
            className="flex items-center gap-1 text-xs text-cyber-purple-400 hover:text-cyber-purple-300 transition-colors"
            title="Open PDF at this page"
          >
            <ExternalLink size={14} />
            <span>Open</span>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-red-400"
            aria-label="Delete bookmark"
            title="Delete bookmark"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

