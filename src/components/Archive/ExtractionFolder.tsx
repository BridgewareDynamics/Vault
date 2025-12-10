import { motion } from 'framer-motion';
import { Folder, Loader2, Trash2, Pencil } from 'lucide-react';
import { ArchiveFile } from '../../types';

interface ExtractionFolderProps {
  folder: ArchiveFile;
  isExtracting?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
}

export function ExtractionFolder({ folder, isExtracting = false, onClick, onDelete, onRename }: ExtractionFolderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isExtracting ? 0.6 : 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={!isExtracting ? { scale: 1.05 } : undefined}
      whileTap={!isExtracting ? { scale: 0.95 } : undefined}
      className={`relative ${onClick ? 'cursor-pointer' : ''} group`}
    >
      <div
        onClick={onClick}
        className={`relative rounded-lg overflow-hidden border-2 ${
          isExtracting 
            ? 'border-gray-600 bg-gray-800/30' 
            : 'border-gray-700 hover:border-cyber-purple-500 bg-gray-800/50'
        } transition-colors p-6`}
      >
        {/* Folder Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Folder className={`w-16 h-16 ${isExtracting ? 'text-gray-500' : 'text-cyber-purple-400'}`} />
            {isExtracting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                <Loader2 className="w-8 h-8 text-cyber-purple-400 animate-spin" />
              </div>
            )}
          </div>
          <span className={`font-medium text-sm text-center truncate w-full ${
            isExtracting ? 'text-gray-400' : 'text-white'
          }`}>
            {folder.name}
          </span>
        </div>

        {/* Overlay on hover (only when not extracting) */}
        {!isExtracting && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        )}

        {/* Action buttons */}
        {!isExtracting && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onRename && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRename();
                }}
                className="p-2 bg-gray-700/80 hover:bg-gray-600 rounded-lg"
                aria-label="Rename folder"
                title="Rename folder"
              >
                <Pencil className="w-4 h-4 text-gray-300 hover:text-cyber-purple-400" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 bg-red-600/80 hover:bg-red-600 rounded-lg"
                aria-label="Delete folder"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        )}

        {/* Loading overlay */}
        {isExtracting && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-cyber-purple-400 animate-spin mx-auto mb-2" />
              <p className="text-white text-xs">Preparing...</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}


