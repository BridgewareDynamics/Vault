import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { ArchiveFile, CategoryTag } from '../../types';
import { FileText, Image, Video, File, Trash2, Play, ChevronDown, Pencil, Tag } from 'lucide-react';
import { PDFOptionsDropdown } from './PDFOptionsDropdown';
import { CategoryTag as CategoryTagComponent } from './CategoryTag';

interface ArchiveFileItemProps {
  file: ArchiveFile;
  onClick: () => void;
  onDelete?: () => void;
  onExtract?: () => void;
  onRename?: () => void;
  onDragStart?: (file: ArchiveFile) => void;
  onDragEnd?: () => void;
  caseTag?: CategoryTag | null;
  onTagClick?: () => void;
  onRunAudit?: () => void;
}

export function ArchiveFileItem({ file, onClick, onDelete, onExtract, onRename, onDragStart, onDragEnd, caseTag, onTagClick, onRunAudit }: ArchiveFileItemProps) {
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

  const getFileIcon = () => {
    switch (file.type) {
      case 'image':
        return <Image className="w-8 h-8 text-cyber-purple-400" aria-hidden="true" />;
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-400" aria-hidden="true" />;
      case 'video':
        return <Video className="w-8 h-8 text-blue-400" aria-hidden="true" />;
      default:
        return <File className="w-8 h-8 text-gray-400" aria-hidden="true" />;
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    // #region agent log
    if (window.electronAPI?.debugLog) window.electronAPI.debugLog({location:'ArchiveFileItem.tsx:56',message:'handleDragStart: Drag started',data:{filePath:file.path,fileName:file.name,fileType:file.type,isFolder:file.isFolder},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'}).catch(()=>{});
    // #endregion
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.path);
    // #region agent log
    if (window.electronAPI?.debugLog) window.electronAPI.debugLog({location:'ArchiveFileItem.tsx:60',message:'handleDragStart: DataTransfer set',data:{dataTransferTypes:Array.from(e.dataTransfer.types),effectAllowed:e.dataTransfer.effectAllowed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'}).catch(()=>{});
    // #endregion
    if (onDragStart) {
      onDragStart(file);
      // #region agent log
      if (window.electronAPI?.debugLog) window.electronAPI.debugLog({location:'ArchiveFileItem.tsx:64',message:'handleDragStart: onDragStart called',data:{filePath:file.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}).catch(()=>{});
      // #endregion
    }
  };

  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative cursor-pointer group ${showDropdown ? 'mb-16' : ''}`}
      draggable={true}
      onDragStart={handleDragStart as any}
      onDragEnd={handleDragEnd}
    >
      <div
        onClick={onClick}
        className="relative rounded-2xl overflow-hidden border-2 border-gray-700/50 hover:border-cyber-purple-500/60 transition-all duration-300 ease-out bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80 shadow-lg hover:shadow-2xl hover:shadow-cyber-purple-500/20"
      >
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-cyan-600/10 transition-all duration-500"></div>
        {/* Thumbnail or Icon */}
        <div className="aspect-[3/4] bg-gray-900 relative overflow-hidden">
          {file.thumbnail ? (
            <img
              src={file.thumbnail}
              alt={file.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {getFileIcon()}
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Category Tag - Top left corner, moved right to avoid overlap with file type badge */}
          {onTagClick && (
            <div className="absolute top-2 left-16 z-20 flex items-center gap-1.5">
              {!caseTag ? (
                // No tag: Show tag button same size as other action buttons
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick();
                  }}
                  className="p-1 hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Add category tag"
                  title="Add category tag"
                >
                  <Tag className="w-3 h-3 text-gray-400 hover:text-cyber-purple-400" />
                </button>
              ) : (
                // Has tag: Show tag badge with small edit button
                <>
                  <CategoryTagComponent tag={caseTag} size="xs" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagClick();
                    }}
                    className="p-0.5 hover:bg-gray-700/50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Change category tag"
                    title="Change category tag"
                  >
                    <Pencil className="w-2.5 h-2.5 text-gray-400 hover:text-cyber-purple-400" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* File type badge - positioned below tag if tag exists, otherwise normal position */}
          <div className={`absolute top-2 z-10 bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-lg ${onTagClick && caseTag ? 'left-2 top-10' : 'left-2'}`}>
            {file.type.toUpperCase()}
          </div>

          {/* Action buttons on hover */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {file.type === 'pdf' && onExtract && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExtract();
                }}
                className="p-2 bg-cyber-purple-500/90 hover:bg-cyber-purple-500 rounded-full backdrop-blur-sm"
                aria-label="Extract PDF"
                title="Start frame extraction"
              >
                <Play className="w-5 h-5 text-white" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* File name */}
        <div className="p-5 space-y-2 bg-gray-800/40 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white text-base font-bold truncate mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-purple-400 group-hover:to-cyber-cyan-400 transition-all duration-300">
                {file.name}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {onRename && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename();
                  }}
                  className="flex-shrink-0 p-2 hover:bg-gray-700/60 rounded-lg transition-all"
                  aria-label="Rename file"
                  title="Rename file"
                >
                  <Pencil className="w-4 h-4 text-gray-300 hover:text-cyber-purple-400" aria-hidden="true" />
                </button>
              )}
              {file.type === 'pdf' && (onExtract || onRunAudit) && (
                <button
                  ref={arrowRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className={`flex-shrink-0 p-2 hover:bg-gray-700/60 rounded-lg transition-all ${showDropdown ? 'bg-gray-700/60 rotate-180' : ''}`}
                  aria-label="PDF options"
                  title="PDF options"
                  aria-expanded={showDropdown}
                >
                  <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-4 right-4 p-2.5 bg-red-600/90 hover:bg-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-20 shadow-lg hover:shadow-red-500/50 transform hover:scale-110"
            aria-label="Delete file"
          >
            <Trash2 className="w-4 h-4 text-white" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* PDF Options Dropdown */}
      {file.type === 'pdf' && (onExtract || onRunAudit) && showDropdown && (
        <div ref={dropdownRef} className="absolute top-full left-0 right-0 z-50 mt-0.5">
          <PDFOptionsDropdown
            onStartExtraction={onExtract ? () => {
              setShowDropdown(false);
              onExtract();
            } : undefined}
            onRunAudit={onRunAudit ? () => {
              setShowDropdown(false);
              onRunAudit();
            } : undefined}
          />
        </div>
      )}
    </motion.div>
  );
}

