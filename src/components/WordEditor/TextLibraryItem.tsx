import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronDown, Trash2 } from 'lucide-react';

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
          className={`relative rounded-lg overflow-hidden border border-gray-700/30 hover:border-cyber-purple-500/50 transition-all duration-200 ease-out bg-gray-800/30 hover:bg-gray-800/50 ${showDropdown ? 'mb-14' : ''}`}
        >
          <div className="flex items-center gap-2.5 p-2.5">
            {/* Icon */}
            <div className="flex-shrink-0 w-9 h-9 rounded-md bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center border border-gray-700/40">
              <FileText className="w-4 h-4 text-cyber-purple-400/70" />
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate group-hover:text-cyber-purple-300 transition-colors duration-200">
                {file.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
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
                className={`p-1.5 hover:bg-gray-700/50 rounded-md transition-all duration-200 ${showDropdown ? 'bg-gray-700/50' : ''}`}
                aria-label="File options"
                aria-expanded={showDropdown}
              >
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-800 border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                onOpen();
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
            >
              Open
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                onEdit();
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                onSaveAs();
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
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
          className={`relative rounded-2xl overflow-hidden border-2 border-gray-700/50 hover:border-cyber-purple-500/60 transition-all duration-300 ease-out bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80 shadow-lg hover:shadow-2xl hover:shadow-cyber-purple-500/20 ${showDropdown ? 'mb-16' : ''}`}
        >
          {/* Glowing background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-cyan-600/10 transition-all duration-500"></div>
          
          {/* Card Content */}
          <div className="flex flex-col relative z-10">
            {/* Preview/Icon Section */}
            <div className="relative bg-gradient-to-br from-gray-900/90 via-purple-900/20 to-gray-900/90 overflow-hidden" style={{ minHeight: '140px' }}>
              {file.preview ? (
                <div className="w-full h-full p-6 text-sm text-gray-300 overflow-hidden">
                  <p className="line-clamp-5 leading-relaxed">{file.preview}</p>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-2xl blur-xl"></div>
                    <div className="relative p-6 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-2xl">
                      <FileText className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* File type badge */}
              <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-lg">
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
            <div className="p-5 space-y-2 bg-gray-800/40 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-base font-bold truncate mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-purple-400 group-hover:to-cyber-cyan-400 transition-all duration-300">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyber-purple-400/60"></span>
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
                  className={`flex-shrink-0 p-2 hover:bg-gray-700/60 rounded-lg transition-all ${showDropdown ? 'bg-gray-700/60 rotate-180' : ''}`}
                  aria-label="File options"
                  aria-expanded={showDropdown}
                >
                  <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
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
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-gray-800/95 backdrop-blur-xl border-2 border-cyber-purple-400/30 rounded-xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                onOpen();
              }}
              className="w-full px-5 py-3 text-left text-sm font-medium text-gray-300 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20 hover:text-white transition-all"
            >
              Open
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                onEdit();
              }}
              className="w-full px-5 py-3 text-left text-sm font-medium text-gray-300 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20 hover:text-white transition-all"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                onSaveAs();
              }}
              className="w-full px-5 py-3 text-left text-sm font-medium text-gray-300 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20 hover:text-white transition-all"
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
        className={`relative rounded-xl overflow-hidden border border-gray-700/50 hover:border-cyber-purple-500/60 transition-all duration-200 ease-out bg-gray-800/50 hover:bg-gray-800 shadow-sm hover:shadow-lg ${showDropdown ? 'mb-16' : ''}`}
      >
        {/* Card Content */}
        <div className="flex flex-col">
          {/* Preview/Icon Section */}
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden" style={{ minHeight: '160px' }}>
            {file.preview ? (
              <div className="w-full h-full p-5 text-sm text-gray-300 overflow-hidden">
                <p className="line-clamp-4 leading-relaxed">{file.preview}</p>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileText className="w-16 h-16 text-cyber-purple-400/60" />
              </div>
            )}

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* File type badge */}
            <div className="absolute top-3 left-3 z-10 bg-cyber-purple-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-md backdrop-blur-sm">
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
                <p className="text-white text-sm font-semibold truncate mb-1 group-hover:text-cyber-purple-300 transition-colors duration-200">
                  {file.name}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
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
                className={`flex-shrink-0 p-1.5 hover:bg-gray-700/50 rounded-md transition-colors ${showDropdown ? 'bg-gray-700/50' : ''}`}
                aria-label="File options"
                aria-expanded={showDropdown}
              >
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-2 bg-gray-800 border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(false);
              onOpen();
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
          >
            Open
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(false);
              onEdit();
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(false);
              onSaveAs();
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
          >
            Save As
          </button>
        </div>
      )}
    </motion.div>
  );
}

