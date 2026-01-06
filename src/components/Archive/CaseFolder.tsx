import { motion } from 'framer-motion';
import { Folder, Loader2, Trash2, Pencil, Image, Tag } from 'lucide-react';
import { ArchiveCase } from '../../types';
import { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { useCategoryTags } from '../../hooks/useCategoryTags';
import { CategoryTag } from './CategoryTag';

interface CaseFolderProps {
  caseItem: ArchiveCase;
  isExtracting?: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onEditBackground?: () => void;
  onTagClick?: () => void;
}

export function CaseFolder({ caseItem, isExtracting = false, onClick, onDelete, onRename, onEditBackground, onTagClick }: CaseFolderProps) {
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | undefined>(undefined);
  const { getTagById } = useCategoryTags();
  const categoryTag = getTagById(caseItem.categoryTagId);

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
        logger.error('Failed to load background image:', error);
        setBackgroundImageUrl(undefined);
      }
    };

    loadBackgroundImage();
  }, [caseItem.backgroundImage]);

  return (
    <div className="flex flex-col gap-3">
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative cursor-pointer group"
      >
        <div
          onClick={onClick}
          className="relative rounded-2xl overflow-hidden border-2 border-gray-700/50 hover:border-cyber-purple-500/60 transition-all duration-300 ease-out bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80 shadow-lg hover:shadow-2xl hover:shadow-cyber-purple-500/20 p-6"
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

          {/* Category Tag - Top left corner */}
          {onTagClick && (
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
              {!categoryTag ? (
                // No tag: Show tag button
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
                  <CategoryTag tag={categoryTag} size="xs" />
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

          {/* Folder Icon */}
          <div className="flex flex-col items-center gap-3 relative z-10">
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
                <Folder className="w-12 h-12 text-white" />
              </div>
              {isExtracting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                  <Loader2 className="w-8 h-8 text-cyber-purple-400 animate-spin" />
                </div>
              )}
            </motion.div>
            <span className="text-white font-medium text-sm text-center truncate w-full group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-purple-400 group-hover:to-cyber-cyan-400 transition-all duration-300">
              {caseItem.name}
            </span>
          </div>

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

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
              aria-label="Rename case"
              title="Rename case"
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
          className="w-full p-4 bg-gray-800/40 border border-cyber-purple-500/20 rounded-2xl backdrop-blur-sm"
        >
          <p className="text-gray-300 text-xs leading-relaxed break-words text-center">
            {caseItem.description}
          </p>
        </motion.div>
      )}
    </div>
  );
}
