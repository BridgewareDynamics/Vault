import { motion } from 'framer-motion';
import { Folder, Trash2, Pencil, Image } from 'lucide-react';
import { ArchiveFile, Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';
import { useMemo } from 'react';
import { resolveVaultBackgroundUrl } from '../../utils/readFileDataUtils';
import { useSettingsContext } from '../../utils/settingsContext';

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
  const backgroundImageUrl = useMemo(
    () => resolveVaultBackgroundUrl(folder.backgroundImage),
    [folder.backgroundImage],
  );
  const { settings } = useSettingsContext();
  const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
  const isPastel = isLightTheme(theme);

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
        className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 ease-out shadow-lg hover:shadow-2xl ${
          isDragOver
            ? isPastel
              ? 'border-pink-400 bg-pink-300/20'
              : 'border-cyber-purple-500 bg-cyber-purple-500/20'
            : isPastel
              ? 'border-pink-200/50 hover:border-pink-400/60 bg-white/60 backdrop-blur-sm hover:bg-white/80 hover:shadow-pink-400/20'
              : 'border-gray-700/50 hover:border-cyber-purple-500/60 bg-gray-800/60 backdrop-blur-sm hover:bg-gray-800/80 hover:shadow-cyber-purple-500/20'
        }`}
        style={{
          backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Glowing background effect */}
        <div className={`absolute inset-0 transition-all duration-500 ${
          isPastel
            ? 'bg-gradient-to-br from-pink-400/0 via-pink-400/0 to-purple-400/0 group-hover:from-pink-400/10 group-hover:via-pink-400/5 group-hover:to-purple-400/10'
            : 'bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-cyan-600/10'
        }`}></div>
        
        {/* Background overlay to ensure readability */}
        {backgroundImageUrl && (
          <div className={`absolute inset-0 ${
            isPastel ? 'bg-white/50' : 'bg-gray-800/50'
          }`} />
        )}

        {/* Container with aspect ratio matching PDF containers (aspect-[3/4]) */}
        <div className={`aspect-[3/4] flex flex-col items-center justify-center p-6 relative z-10 ${
          backgroundImageUrl
            ? 'bg-transparent'
            : isPastel
              ? 'bg-slate-100'
              : 'bg-gray-900'
        }`}>
          {/* Folder Icon */}
          <div className="flex flex-col items-center gap-3 flex-1 justify-center">
            <motion.div 
              className="relative"
              animate={{
                filter: isPastel
                  ? [
                      'drop-shadow(0 0 15px rgba(244, 114, 182, 0.6))',
                      'drop-shadow(0 0 25px rgba(244, 114, 182, 0.9))',
                      'drop-shadow(0 0 15px rgba(244, 114, 182, 0.6))',
                    ]
                  : [
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
              <div className={`absolute inset-0 rounded-2xl blur-xl ${
                isPastel
                  ? 'bg-gradient-to-br from-pink-300/20 to-purple-300/20'
                  : 'bg-gradient-to-br from-purple-600/20 to-cyan-600/20'
              }`}></div>
              <div className={`relative p-4 rounded-2xl ${
                isPastel
                  ? 'bg-gradient-to-br from-pink-300/30 to-purple-300/30'
                  : 'bg-gradient-to-br from-purple-600/30 to-cyan-600/30'
              }`}>
                <Folder className={`w-12 h-12 ${isDragOver ? 'text-white' : 'text-white'}`} />
              </div>
            </motion.div>
            <span className={`font-medium text-sm text-center truncate w-full px-2 transition-all duration-300 ${
              isPastel
                ? 'text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400'
                : 'text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-purple-400 group-hover:to-cyber-cyan-400'
            }`}>
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
              className={`absolute bottom-2 left-2 z-10 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${
                isPastel
                  ? 'bg-white/80 hover:bg-pink-50'
                  : 'bg-gray-800/80 hover:bg-gray-700'
              }`}
                  aria-label="Edit background image"
                  title="Change background image"
            >
              <Image className={`w-4 h-4 ${
                isPastel ? 'text-pink-500' : 'text-cyber-purple-400'
              }`} />
            </button>
          )}

          {/* Rename pencil in bottom-right */}
          {onRename && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
              className={`absolute bottom-2 right-2 z-10 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${
                isPastel
                  ? 'bg-pink-100/80 hover:bg-pink-200'
                  : 'bg-gray-700/80 hover:bg-gray-600'
              }`}
              aria-label="Rename folder"
              title="Rename folder"
            >
              <Pencil className={`w-4 h-4 ${
                isPastel
                  ? 'text-gray-600 hover:text-pink-500'
                  : 'text-gray-300 hover:text-cyber-purple-400'
              }`} />
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
            <div className={`absolute inset-0 border-2 border-dashed flex items-center justify-center ${
              isPastel
                ? 'bg-pink-300/30 border-pink-400'
                : 'bg-cyber-purple-500/30 border-cyber-purple-500'
            }`}>
              <div className="text-center">
                <Folder className={`w-12 h-12 mx-auto mb-2 ${
                  isPastel ? 'text-pink-500' : 'text-cyber-purple-400'
                }`} />
                <p className={`text-xs font-medium ${
                  isPastel ? 'text-gray-800' : 'text-white'
                }`}>Drop here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

