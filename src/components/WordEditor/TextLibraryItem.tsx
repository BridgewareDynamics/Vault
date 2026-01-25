import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronDown, Trash2 } from 'lucide-react';
import { Theme } from '../../types';
import { useSettingsContext } from '../../utils/settingsContext';

interface TextFile {
  name: string;
  path: string;
  size: number;
  modified: number;
  preview?: string;
}

interface TextLibraryItemProps {
  file: TextFile;
  onOpen: () => void;
  onEdit: () => void;
  onSaveAs: () => void;
  onDelete: () => void;
  isDetached?: boolean;
  layout?: 'card' | 'list';
}

export function TextLibraryItem({ file, onOpen, onEdit, onSaveAs, onDelete, isDetached = false, layout = 'card' }: TextLibraryItemProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLButtonElement>(null);
  const { settings } = useSettingsContext();
  const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
  const isPastel = theme === 'pastel';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        arrowRef.current &&
        !arrowRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // List layout for narrow panels
  if (layout === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="relative group"
      >
        <div
          onClick={onOpen}
          className={`relative rounded-lg overflow-hidden border transition-all duration-200 ease-out ${showDropdown ? 'mb-14' : ''} ${
            isPastel
              ? 'border-pink-200/30 hover:border-pink-400/50 bg-white/30 hover:bg-white/50'
              : 'border-gray-700/30 hover:border-cyber-purple-500/50 bg-gray-800/30 hover:bg-gray-800/50'
          }`}
        >
          <div className="flex items-center gap-2.5 p-2.5">
            {/* Icon */}
            <div className={`flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center border ${
              isPastel
                ? 'bg-gradient-to-br from-slate-100 to-pink-50 border-pink-200/40'
                : 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700/40'
            }`}>
              <FileText className={`w-4 h-4 ${
                isPastel ? 'text-pink-500/70' : 'text-cyber-purple-400/70'
              }`} />
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate transition-colors duration-200 ${
                isPastel
                  ? 'text-gray-800 group-hover:text-pink-600'
                  : 'text-white group-hover:text-cyber-purple-300'
              }`}>
                {file.name}
              </p>
              <div className={`flex items-center gap-2 text-xs mt-0.5 ${
                isPastel ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <span>{formatDate(file.modified)}</span>
                <span>•</span>
                <span>{formatSize(file.size)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 hover:bg-red-600/20 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                aria-label="Delete file"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
              <button
                ref={arrowRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className={`p-1.5 rounded-md transition-all duration-200 ${showDropdown ? (isPastel ? 'bg-pink-100/50' : 'bg-gray-700/50') : ''} ${
                  isPastel ? 'hover:bg-pink-100/50' : 'hover:bg-gray-700/50'
                }`}
                aria-label="File options"
                aria-expanded={showDropdown}
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''} ${
                  isPastel ? 'text-gray-500' : 'text-gray-400'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className={`absolute top-full left-0 right-0 z-50 mt-1 rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm border ${
              isPastel
                ? 'bg-white/95 border-pink-200/50'
                : 'bg-gray-800 border-gray-700/50'
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                onOpen();
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                isPastel
                  ? 'text-gray-700 hover:bg-pink-100/50 hover:text-gray-800'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              Open
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                onEdit();
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                isPastel
                  ? 'text-gray-700 hover:bg-pink-100/50 hover:text-gray-800'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                onSaveAs();
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                isPastel
                  ? 'text-gray-700 hover:bg-pink-100/50 hover:text-gray-800'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              Save As
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  // Enhanced card layout for detached mode
  if (isDetached) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ y: -4, scale: 1.02 }}
        className="relative cursor-pointer group"
      >
        <div
          onClick={onOpen}
          className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 ease-out backdrop-blur-sm shadow-lg hover:shadow-2xl ${showDropdown ? 'mb-16' : ''} ${
            isPastel
              ? 'border-pink-200/50 hover:border-pink-400/60 bg-white/60 hover:bg-white/80 hover:shadow-pink-400/20'
              : 'border-gray-700/50 hover:border-cyber-purple-500/60 bg-gray-800/60 hover:bg-gray-800/80 hover:shadow-cyber-purple-500/20'
          }`}
        >
          {/* Glowing background effect */}
          <div className={`absolute inset-0 transition-all duration-500 ${
            isPastel
              ? 'bg-gradient-to-br from-pink-400/0 via-pink-400/0 to-purple-400/0 group-hover:from-pink-400/10 group-hover:via-pink-400/5 group-hover:to-purple-400/10'
              : 'bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-cyan-600/10'
          }`}></div>
          
          {/* Card Content */}
          <div className="flex flex-col relative z-10">
            {/* Preview/Icon Section */}
            <div className={`relative overflow-hidden ${
              isPastel
                ? 'bg-gradient-to-br from-slate-100/90 via-pink-50/20 to-slate-100/90'
                : 'bg-gradient-to-br from-gray-900/90 via-purple-900/20 to-gray-900/90'
            }`} style={{ minHeight: '140px' }}>
              {file.preview ? (
                <div className={`w-full h-full p-6 text-sm overflow-hidden ${
                  isPastel ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  <p className="line-clamp-5 leading-relaxed">{file.preview}</p>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-6">
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-2xl blur-xl ${
                      isPastel
                        ? 'bg-gradient-to-br from-pink-300/20 to-purple-300/20'
                        : 'bg-gradient-to-br from-purple-600/20 to-cyan-600/20'
                    }`}></div>
                    <div className={`relative p-6 rounded-2xl ${
                      isPastel
                        ? 'bg-gradient-to-br from-pink-300/30 to-purple-300/30'
                        : 'bg-gradient-to-br from-purple-600/30 to-cyan-600/30'
                    }`}>
                      <FileText className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-t opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                isPastel
                  ? 'from-white/70 via-transparent to-transparent'
                  : 'from-black/70 via-transparent to-transparent'
              }`} />

              {/* File type badge */}
              <div className={`absolute top-4 left-4 z-10 text-white text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-lg ${
                isPastel
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400'
                  : 'bg-gradient-to-r from-purple-600 to-cyan-600'
              }`}>
                TEXT
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="absolute top-4 right-4 p-2.5 bg-red-600/90 hover:bg-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-20 shadow-lg hover:shadow-red-500/50 transform hover:scale-110"
                aria-label="Delete file"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* File info section */}
            <div className={`p-5 space-y-2 backdrop-blur-sm ${
              isPastel ? 'bg-white/40' : 'bg-gray-800/40'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-base font-bold truncate mb-2 transition-all duration-300 ${
                    isPastel
                      ? 'text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400'
                      : 'text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-purple-400 group-hover:to-cyber-cyan-400'
                  }`}>
                    {file.name}
                  </p>
                  <div className={`flex items-center gap-3 text-xs ${
                    isPastel ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isPastel ? 'bg-pink-400/60' : 'bg-cyber-purple-400/60'
                      }`}></span>
                      {formatDate(file.modified)}
                    </span>
                    <span>•</span>
                    <span>{formatSize(file.size)}</span>
                  </div>
                </div>
                <button
                  ref={arrowRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className={`flex-shrink-0 p-2 rounded-lg transition-all ${showDropdown ? (isPastel ? 'bg-pink-100/60' : 'bg-gray-700/60') : ''} ${
                    isPastel ? 'hover:bg-pink-100/60' : 'hover:bg-gray-700/60'
                  }`}
                  aria-label="File options"
                  aria-expanded={showDropdown}
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''} ${
                    isPastel ? 'text-gray-600' : 'text-gray-300'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Dropdown Menu */}
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            ref={dropdownRef}
            className={`absolute top-full left-0 right-0 z-50 mt-2 backdrop-blur-xl border-2 rounded-xl shadow-2xl overflow-hidden ${
              isPastel
                ? 'bg-white/95 border-pink-300/30'
                : 'bg-gray-800/95 border-cyber-purple-400/30'
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                onOpen();
              }}
              className={`w-full px-5 py-3 text-left text-sm font-medium transition-all ${
                isPastel
                  ? 'text-gray-700 hover:bg-gradient-to-r hover:from-pink-300/20 hover:to-purple-300/20 hover:text-gray-800'
                  : 'text-gray-300 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20 hover:text-white'
              }`}
            >
              Open
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                onEdit();
              }}
              className={`w-full px-5 py-3 text-left text-sm font-medium transition-all ${
                isPastel
                  ? 'text-gray-700 hover:bg-gradient-to-r hover:from-pink-300/20 hover:to-purple-300/20 hover:text-gray-800'
                  : 'text-gray-300 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20 hover:text-white'
              }`}
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                onSaveAs();
              }}
              className={`w-full px-5 py-3 text-left text-sm font-medium transition-all ${
                isPastel
                  ? 'text-gray-700 hover:bg-gradient-to-r hover:from-pink-300/20 hover:to-purple-300/20 hover:text-gray-800'
                  : 'text-gray-300 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20 hover:text-white'
              }`}
            >
              Save As
            </button>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Standard card layout for non-detached mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2 }}
      className="relative cursor-pointer group"
    >
      <div
        onClick={onOpen}
        className={`relative rounded-xl overflow-hidden border transition-all duration-200 ease-out shadow-sm hover:shadow-lg ${showDropdown ? 'mb-16' : ''} ${
          isPastel
            ? 'border-pink-200/50 hover:border-pink-400/60 bg-white/50 hover:bg-white'
            : 'border-gray-700/50 hover:border-cyber-purple-500/60 bg-gray-800/50 hover:bg-gray-800'
        }`}
      >
        {/* Card Content */}
        <div className="flex flex-col">
          {/* Preview/Icon Section */}
          <div className={`relative overflow-hidden ${
            isPastel
              ? 'bg-gradient-to-br from-slate-100 to-pink-50'
              : 'bg-gradient-to-br from-gray-900 to-gray-800'
          }`} style={{ minHeight: '160px' }}>
            {file.preview ? (
              <div className={`w-full h-full p-5 text-sm overflow-hidden ${
                isPastel ? 'text-gray-700' : 'text-gray-300'
              }`}>
                <p className="line-clamp-4 leading-relaxed">{file.preview}</p>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileText className={`w-16 h-16 ${
                  isPastel ? 'text-pink-500/60' : 'text-cyber-purple-400/60'
                }`} />
              </div>
            )}

            {/* Overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-t opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              isPastel
                ? 'from-white/60 via-transparent to-transparent'
                : 'from-black/60 via-transparent to-transparent'
            }`} />

            {/* File type badge */}
            <div className={`absolute top-3 left-3 z-10 text-white text-xs font-semibold px-2.5 py-1 rounded-md backdrop-blur-sm ${
              isPastel ? 'bg-pink-400/90' : 'bg-cyber-purple-500/90'
            }`}>
              TEXT
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="absolute top-3 right-3 p-2 bg-red-600/90 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20 shadow-lg"
              aria-label="Delete file"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* File info section */}
          <div className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate mb-1 transition-colors duration-200 ${
                  isPastel
                    ? 'text-gray-800 group-hover:text-pink-600'
                    : 'text-white group-hover:text-cyber-purple-300'
                }`}>
                  {file.name}
                </p>
                <div className={`flex items-center gap-3 text-xs ${
                  isPastel ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  <span>{formatDate(file.modified)}</span>
                  <span>•</span>
                  <span>{formatSize(file.size)}</span>
                </div>
              </div>
              <button
                ref={arrowRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${showDropdown ? (isPastel ? 'bg-pink-100/50' : 'bg-gray-700/50') : ''} ${
                  isPastel ? 'hover:bg-pink-100/50' : 'hover:bg-gray-700/50'
                }`}
                aria-label="File options"
                aria-expanded={showDropdown}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''} ${
                  isPastel ? 'text-gray-500' : 'text-gray-400'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className={`absolute top-full left-0 right-0 z-50 mt-2 rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm border ${
            isPastel
              ? 'bg-white/95 border-pink-200/50'
              : 'bg-gray-800 border-gray-700/50'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(false);
              onOpen();
            }}
            className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
              isPastel
                ? 'text-gray-700 hover:bg-pink-100/50 hover:text-gray-800'
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            Open
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(false);
              onEdit();
            }}
            className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
              isPastel
                ? 'text-gray-700 hover:bg-pink-100/50 hover:text-gray-800'
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(false);
              onSaveAs();
            }}
            className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
              isPastel
                ? 'text-gray-700 hover:bg-pink-100/50 hover:text-gray-800'
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            Save As
          </button>
        </div>
      )}
    </motion.div>
  );
}

