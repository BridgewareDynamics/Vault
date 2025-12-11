import { motion } from 'framer-motion';
import { Folder, Loader2, Trash2, Pencil } from 'lucide-react';
import { ArchiveCase } from '../../types';
import { useState, useEffect } from 'react';

interface CaseFolderProps {
  caseItem: ArchiveCase;
  isExtracting?: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onEditBackground?: () => void;
}

export function CaseFolder({ caseItem, isExtracting = false, onClick, onDelete, onEditBackground }: CaseFolderProps) {
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | undefined>(undefined);

  // Load background image as data URL
  useEffect(() => {
    const loadBackgroundImage = async () => {
      if (!caseItem.backgroundImage || !window.electronAPI) {
        setBackgroundImageUrl(undefined);
        return;
      }

      try {
        const fileData = await window.electronAPI.readFileData(caseItem.backgroundImage);
        const dataUrl = `data:${fileData.mimeType};base64,${fileData.data}`;
        setBackgroundImageUrl(dataUrl);
      } catch (error) {
        console.error('Failed to load background image:', error);
        setBackgroundImageUrl(undefined);
      }
    };

    loadBackgroundImage();
  }, [caseItem.backgroundImage]);

  return (
    <div className="flex flex-col gap-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative cursor-pointer group"
      >
        <div
          onClick={onClick}
          className="relative rounded-lg overflow-hidden border-2 border-gray-700 hover:border-cyber-purple-500 transition-colors bg-gray-800/50 p-6"
          style={{
            backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Background overlay to ensure readability */}
          {backgroundImageUrl && (
            <div className="absolute inset-0 bg-gray-800/50" />
          )}

          {/* Pencil icon in left corner */}
          {onEditBackground && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditBackground();
              }}
              className="absolute top-2 left-2 z-10 p-1.5 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Edit background image"
            >
              <Pencil className="w-4 h-4 text-cyber-purple-400" />
            </button>
          )}

          {/* Folder Icon */}
          <div className="flex flex-col items-center gap-3 relative z-10">
            <div className="relative">
              <Folder className="w-16 h-16 text-cyber-purple-400" />
              {isExtracting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                  <Loader2 className="w-8 h-8 text-cyber-purple-400 animate-spin" />
                </div>
              )}
            </div>
            <span className="text-white font-medium text-sm text-center truncate w-full">
              {caseItem.name}
            </span>
          </div>

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="absolute top-2 right-2 p-2 bg-red-600/80 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Delete case"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          )}

          {/* Loading overlay */}
          {isExtracting && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-cyber-purple-400 animate-spin mx-auto mb-2" />
                <p className="text-white text-xs">Extracting...</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Description Container - Separate from folder card */}
      {caseItem.description && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          className="w-full p-3 bg-gray-800/40 border border-cyber-purple-500/20 rounded-lg backdrop-blur-sm"
        >
          <p className="text-gray-300 text-xs leading-relaxed break-words text-center">
            {caseItem.description}
          </p>
        </motion.div>
      )}
    </div>
  );
}



