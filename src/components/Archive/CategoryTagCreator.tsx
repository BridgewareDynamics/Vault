import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sparkles, X, Palette, Tag as TagIcon, Eye } from 'lucide-react';
import { CategoryTag } from './CategoryTag';

interface CategoryTagCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, color: string) => void;
  existingTagNames?: string[];
  isPastel?: boolean;
}

export function CategoryTagCreator({ isOpen, onClose, onConfirm, existingTagNames = [], isPastel = false }: CategoryTagCreatorProps) {
  const [tagName, setTagName] = useState('');
  const [color, setColor] = useState('#8B5CF6'); // Default purple

  useEffect(() => {
    if (isOpen) {
      setTagName('');
      setColor('#8B5CF6');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!tagName.trim()) {
      return;
    }

    // Check for duplicate names (case-insensitive)
    if (existingTagNames.some(name => name.toLowerCase() === tagName.trim().toLowerCase())) {
      return;
    }

    onConfirm(tagName.trim(), color);
    setTagName('');
    setColor('#8B5CF6');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Create a mock tag for preview
  const previewTag = { id: 'preview', name: tagName || 'Tag Name', color };
  const isDuplicate = existingTagNames.some(name => name.toLowerCase() === tagName.trim().toLowerCase());
  const isValid = tagName.trim() && !isDuplicate;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        className={`fixed inset-0 z-[70] backdrop-blur-sm flex items-center justify-center p-4 ${
          isPastel ? 'bg-black/40' : 'bg-black/80'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-tag-creator-title"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={`relative rounded-2xl border-2 shadow-2xl p-8 max-w-lg w-full backdrop-blur-xl ${
            isPastel
              ? 'bg-gradient-to-br from-white/95 via-pink-50/40 to-white/95 border-pink-200/40'
              : 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border-cyber-purple-400/40'
          }`}
          style={isPastel ? {
            boxShadow: '0 20px 60px rgba(251, 182, 206, 0.2), 0 0 0 1px rgba(251, 182, 206, 0.1)',
          } : {}}
        >
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                {isPastel ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-200/50 via-purple-200/50 to-blue-200/50 rounded-2xl blur-xl opacity-50"></div>
                    <div className="relative p-4 bg-gradient-to-br from-pink-100/80 via-purple-100/80 to-blue-100/80 rounded-2xl shadow-lg border-2 border-pink-200/40">
                      <TagIcon className="w-8 h-8 text-pink-500" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                    <div className="relative p-4 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl shadow-2xl">
                      <TagIcon className="w-8 h-8 text-white" />
                    </div>
                  </>
                )}
              </div>
              <div>
                <h2 
                  id="category-tag-creator-title" 
                  className={`text-3xl font-bold bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] ${
                    isPastel
                      ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500'
                      : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400'
                  }`}
                >
                  Create Tag
                </h2>
                <p className={`text-sm mt-1 ${
                  isPastel ? 'text-gray-600' : 'text-gray-400'
                }`}>Design your custom category tag</p>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-xl transition-colors ${
                isPastel
                  ? 'hover:bg-pink-100/50 text-gray-600 hover:text-gray-900'
                  : 'hover:bg-gray-800/80 text-gray-400 hover:text-white'
              }`}
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Enhanced Live Preview */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-5 rounded-xl border ${
              isPastel
                ? 'bg-pink-50/50 border-pink-200/40'
                : 'bg-gray-800/50 border-cyber-purple-400/30'
            }`}
          >
            <p className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
              isPastel ? 'text-gray-700' : 'text-gray-300'
            }`}>
              <Eye className={`w-4 h-4 ${isPastel ? 'text-pink-500' : 'text-cyber-purple-400'}`} />
              Live Preview
            </p>
            <div className="flex items-center justify-center">
              <CategoryTag tag={previewTag} size="large" />
            </div>
          </motion.div>

          {/* Enhanced Tag Name Input */}
          <div className="mb-5">
            <label htmlFor="tag-name-input" className={`block text-sm font-semibold mb-2.5 flex items-center gap-2 ${
              isPastel ? 'text-gray-700' : 'text-gray-300'
            }`}>
              <TagIcon className={`w-4 h-4 ${isPastel ? 'text-pink-500' : 'text-cyber-purple-400'}`} />
              Tag Name
            </label>
            <div className="relative">
              {!isPastel && <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 rounded-xl blur-sm"></div>}
              <input
                id="tag-name-input"
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                onKeyDown={handleKeyPress}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                placeholder="Enter tag name..."
                autoFocus
                aria-label="Tag name"
                aria-required="true"
                className={`relative w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                  isDuplicate 
                    ? isPastel
                      ? 'bg-white/80 border-red-400/60 focus:ring-2 focus:ring-red-400/20 text-gray-700 placeholder-gray-400'
                      : 'border-red-500/60 focus:ring-2 focus:ring-red-500/20 bg-gray-800/70 hover:bg-gray-800/80 text-white placeholder-gray-500'
                    : isPastel
                    ? 'bg-white/80 hover:bg-white border-pink-200/50 focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20 text-gray-700 placeholder-gray-400'
                    : 'border-gray-700/50 focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20 bg-gray-800/70 hover:bg-gray-800/80 text-white placeholder-gray-500'
                }`}
              />
            </div>
            {isDuplicate && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-2 text-sm flex items-center gap-1 ${
                  isPastel ? 'text-red-600' : 'text-red-400'
                }`}
              >
                <X className="w-3 h-3" />
                A tag with this name already exists
              </motion.p>
            )}
          </div>

          {/* Enhanced Color Picker Section */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
              isPastel ? 'text-gray-700' : 'text-gray-300'
            }`}>
              <Palette className={`w-4 h-4 ${isPastel ? 'text-pink-500' : 'text-cyber-purple-400'}`} />
              Color
            </label>
            
            {/* Color Input Row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                {!isPastel && <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-xl blur-sm"></div>}
                <input
                  id="tag-color-input"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className={`relative w-20 h-20 rounded-xl border-2 cursor-pointer bg-transparent transition-all ${
                    isPastel
                      ? 'border-pink-200/50 hover:border-pink-400/60'
                      : 'border-gray-700/50 hover:border-cyber-purple-500/60'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                  }}
                  aria-label="Tag color"
                />
              </div>
              <div className="flex-1 relative">
                {!isPastel && <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 rounded-xl blur-sm"></div>}
                <input
                  type="text"
                  value={color}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                      setColor(value);
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="#8B5CF6"
                  className={`relative w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 font-mono text-sm backdrop-blur-sm ${
                    isPastel
                      ? 'bg-white/80 hover:bg-white border-pink-200/50 focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20 text-gray-700 placeholder-gray-400'
                      : 'bg-gray-800/70 hover:bg-gray-800/80 border-gray-700/50 focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20 text-white placeholder-gray-500'
                  }`}
                  aria-label="Color hex code"
                />
              </div>
            </div>

            {/* Enhanced Preset Colors */}
            <div>
              <p className={`text-sm mb-3 ${
                isPastel ? 'text-gray-600' : 'text-gray-400'
              }`}>Quick Colors:</p>
              <div className="grid grid-cols-5 gap-3">
                {['#8B5CF6', '#A855F7', '#C084FC', '#22D3EE', '#06B6D4', '#F59E0B', '#EF4444', '#10B981', '#6366F1', '#EC4899'].map((presetColor) => (
                  <motion.button
                    key={presetColor}
                    type="button"
                    onClick={() => setColor(presetColor)}
                    onMouseDown={(e) => e.stopPropagation()}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative h-12 rounded-xl border-2 transition-all ${
                      color === presetColor 
                        ? isPastel
                          ? 'border-pink-400 scale-110 shadow-lg shadow-pink-400/50'
                          : 'border-cyber-purple-400 scale-110 shadow-lg shadow-cyber-purple-500/50'
                        : isPastel
                        ? 'border-pink-200/50 hover:border-pink-300/50'
                        : 'border-gray-700/50 hover:border-gray-600/50'
                    }`}
                    style={{ backgroundColor: presetColor }}
                    aria-label={`Select color ${presetColor}`}
                  >
                    {color === presetColor && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className={`w-3 h-3 rounded-full ${
                          isPastel ? 'bg-gray-800' : 'bg-white'
                        }`}></div>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex gap-3 pt-2">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 px-5 py-3 rounded-xl border-2 transition-all duration-300 font-medium shadow-md hover:shadow-lg backdrop-blur-sm ${
                isPastel
                  ? 'bg-pink-50/80 hover:bg-pink-100/80 text-gray-700 border-pink-200/50 hover:border-pink-300/50'
                  : 'bg-gray-800/70 hover:bg-gray-800/90 text-white border-gray-700/50 hover:border-gray-600/50'
              }`}
              aria-label="Cancel creating tag"
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleConfirm}
              disabled={!isValid}
              whileHover={{ scale: isValid ? 1.02 : 1, y: isValid ? -1 : 0 }}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden group flex-1 px-5 py-3 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border ${
                isPastel
                  ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 hover:from-pink-500 hover:via-purple-500 hover:to-pink-500 hover:shadow-pink-500/50 border-pink-300/40'
                  : 'bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 hover:shadow-purple-500/50 border-purple-400/30'
              }`}
              aria-label="Create tag"
              aria-disabled={!isValid}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="relative flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Create Tag</span>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
