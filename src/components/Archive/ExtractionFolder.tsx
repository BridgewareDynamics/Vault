import { motion } from 'framer-motion';
import { Folder, Loader2, Trash2, Pencil, Image } from 'lucide-react';
import { ArchiveFile } from '../../types';
import { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';

interface ExtractionFolderProps {
  folder: ArchiveFile;
  isExtracting?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onEditBackground?: () => void;
}

export function ExtractionFolder({ folder, isExtracting = false, onClick, onDelete, onRename, onEditBackground }: ExtractionFolderProps) {
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | undefined>(undefined);

  // Load background image as data URL
  useEffect(() => {
    const loadBackgroundImage = async () => {
      if (!folder.backgroundImage || !window.electronAPI) {
        setBackgroundImageUrl(undefined);
        return;
      }

      try {
        const fileData = await window.electronAPI.readFileData(folder.backgroundImage);
        const dataUrl = `data:${fileData.mimeType};base64,${fileData.data}`;
        setBackgroundImageUrl(dataUrl);
      } catch (error) {
        logger.error('Failed to load extraction folder background image:', error);
        setBackgroundImageUrl(undefined);
      }
    };

    loadBackgroundImage();
  }, [folder.backgroundImage]);

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

        {/* Folder Icon */}
        <div className="flex flex-col items-center gap-3 relative z-10">
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

        {/* Image icon in bottom-left corner */}
        {!isExtracting && onEditBackground && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditBackground();
            }}
            className="absolute bottom-2 left-2 z-10 p-1.5 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Edit background image"
            title="Change background image"
          >
            <Image className="w-4 h-4 text-cyber-purple-400" />
          </button>
        )}

        {/* Rename pencil in bottom-right */}
        {!isExtracting && onRename && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="absolute bottom-2 right-2 z-10 p-1.5 bg-gray-700/80 hover:bg-gray-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Rename folder"
            title="Rename folder"
          >
            <Pencil className="w-4 h-4 text-gray-300 hover:text-cyber-purple-400" />
          </button>
        )}

        {/* Delete button in top-right */}
        {!isExtracting && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 z-10 p-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Delete folder"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
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


