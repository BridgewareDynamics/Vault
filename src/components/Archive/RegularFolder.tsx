import { motion } from 'framer-motion';
import { Folder, Trash2, Pencil, Image } from 'lucide-react';
import { ArchiveFile } from '../../types';
import { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';

interface RegularFolderProps {
  folder: ArchiveFile;
  onClick?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onEditBackground?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
}

export function RegularFolder({ 
  folder, 
  onClick, 
  onDelete, 
  onRename,
  onEditBackground,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver = false
}: RegularFolderProps) {
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
        logger.error('Failed to load folder background image:', error);
        setBackgroundImageUrl(undefined);
      }
    };

    loadBackgroundImage();
  }, [folder.backgroundImage]);

  if (!folder) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative ${onClick ? 'cursor-pointer' : ''} group`}
    >
      <div
        onClick={onClick}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onDragOver) onDragOver(e);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onDragLeave) onDragLeave(e);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onDrop) onDrop(e);
        }}
        className={`relative rounded-2xl overflow-hidden border-2 ${
          isDragOver
            ? 'border-cyber-purple-500 bg-cyber-purple-500/20'
            : 'border-gray-700/50 hover:border-cyber-purple-500/60 bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80'
        } transition-all duration-300 ease-out shadow-lg hover:shadow-2xl hover:shadow-cyber-purple-500/20`}
        style={{
          backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-cyan-600/10 transition-all duration-500"></div>
        
        {/* Background overlay to ensure readability */}
        {backgroundImageUrl && (
          <div className="absolute inset-0 bg-gray-800/50" />
        )}

        {/* Container with aspect ratio matching PDF containers (aspect-[3/4]) */}
        <div className={`aspect-[3/4] flex flex-col items-center justify-center p-6 relative z-10 ${backgroundImageUrl ? 'bg-transparent' : 'bg-gray-900'}`}>
          {/* Folder Icon */}
          <div className="flex flex-col items-center gap-3 flex-1 justify-center">
            <motion.div 
              className="relative"
              animate={{
                filter: [
                  'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))',
                  'drop-shadow(0 0 25px rgba(139, 92, 246, 0.9))',
                  'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-2xl blur-xl"></div>
              <div className="relative p-4 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-2xl">
                <Folder className={`w-12 h-12 ${isDragOver ? 'text-white' : 'text-white'}`} />
              </div>
            </motion.div>
            <span className="font-medium text-sm text-center truncate w-full px-2 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-purple-400 group-hover:to-cyber-cyan-400 transition-all duration-300">
              {folder.name}
            </span>
          </div>

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Image icon in bottom-left corner */}
          {onEditBackground && (
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
          {onRename && (
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
          {onDelete && (
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

          {/* Drag over indicator */}
          {isDragOver && (
            <div className="absolute inset-0 bg-cyber-purple-500/30 border-2 border-cyber-purple-500 border-dashed flex items-center justify-center">
              <div className="text-center">
                <Folder className="w-12 h-12 text-cyber-purple-400 mx-auto mb-2" />
                <p className="text-white text-xs font-medium">Drop here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

