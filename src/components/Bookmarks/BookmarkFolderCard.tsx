import { motion } from 'framer-motion';
import { Folder, Trash2, Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BookmarkFolder } from '../../types';

interface BookmarkFolderCardProps {
  folder: BookmarkFolder;
  onOpen: () => void;
  onDelete: () => void;
  isDetached?: boolean;
}

export function BookmarkFolderCard({ folder, onOpen, onDelete, isDetached = false }: BookmarkFolderCardProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThumbnail();
    loadBookmarkCount();
  }, [folder.id, folder.thumbnail]);

  const loadThumbnail = async () => {
    if (!window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      if (folder.thumbnail) {
        if (folder.thumbnail.startsWith('data:')) {
          setThumbnail(folder.thumbnail);
          setLoading(false);
          return;
        }
      }

      // Try to get thumbnail from first bookmark in folder
      const bookmarks = await window.electronAPI.getBookmarksByFolder(folder.id);
      if (bookmarks.length > 0 && bookmarks[0].thumbnail) {
        if (bookmarks[0].thumbnail.startsWith('data:')) {
          setThumbnail(bookmarks[0].thumbnail);
        } else {
          const savedThumbnail = await window.electronAPI.getBookmarkThumbnail(bookmarks[0].id);
          if (savedThumbnail) {
            setThumbnail(savedThumbnail);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load folder thumbnail:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarkCount = async () => {
    if (!window.electronAPI) return;

    try {
      const bookmarks = await window.electronAPI.getBookmarksByFolder(folder.id);
      setBookmarkCount(bookmarks.length);
    } catch (error) {
      console.error('Failed to load bookmark count:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={onOpen}
      className={`bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-cyber-purple-500/50 transition-all cursor-pointer ${isDetached ? '' : 'w-full'}`}
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
            alt={`${folder.name} thumbnail`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <Folder size={32} className="text-gray-600" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
          <Bookmark size={12} />
          <span>{bookmarkCount}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium line-clamp-1 flex-1" title={folder.name}>
            {folder.name}
          </h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-red-400 ml-2"
            aria-label="Delete folder"
            title="Delete folder"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {bookmarkCount} bookmark{bookmarkCount !== 1 ? 's' : ''}
        </p>
      </div>
    </motion.div>
  );
}

