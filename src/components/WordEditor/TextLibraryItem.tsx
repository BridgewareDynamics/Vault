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
}

export function TextLibraryItem({ file, onOpen, onEdit, onSaveAs, onDelete }: TextLibraryItemProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative cursor-pointer group"
    >
      <div
        onClick={onOpen}
        className={`relative rounded-lg overflow-hidden border-2 border-gray-700 hover:border-cyber-purple-500 transition-colors bg-gray-800 ${showDropdown ? 'mb-12' : ''}`}
      >
        {/* Preview/Icon */}
        <div className="aspect-[3/4] bg-gray-900 relative overflow-hidden">
          {file.preview ? (
            <div className="w-full h-full p-4 text-xs text-gray-400 overflow-hidden">
              <p className="line-clamp-6">{file.preview}</p>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="w-12 h-12 text-cyber-purple-400" />
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* File type badge */}
          <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            TEXT
          </div>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 p-2 bg-red-600/80 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
            aria-label="Delete file"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* File info */}
        <div className="p-2 flex items-center justify-between gap-2">
          <p className="text-white text-xs font-medium truncate flex-1">{file.name}</p>
          <div className="flex items-center gap-1">
            <button
              ref={arrowRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="flex-shrink-0 p-1 hover:bg-gray-700 rounded transition-colors"
              aria-label="File options"
              aria-expanded={showDropdown}
            >
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(false);
              onOpen();
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Open
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(false);
              onEdit();
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(false);
              onSaveAs();
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Save As
          </button>
        </div>
      )}
    </motion.div>
  );
}

