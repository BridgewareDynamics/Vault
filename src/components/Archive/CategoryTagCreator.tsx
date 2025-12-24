import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CategoryTag } from './CategoryTag';

interface CategoryTagCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, color: string) => void;
  existingTagNames?: string[];
}

export function CategoryTagCreator({ isOpen, onClose, onConfirm, existingTagNames = [] }: CategoryTagCreatorProps) {
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
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-tag-creator-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-cyber-purple-500/60 shadow-2xl p-6 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <h2 id="category-tag-creator-title" className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
              Make new category tag
            </h2>
          </div>

          {/* Live Preview */}
          <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Preview:</p>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-gray-600" style={{ backgroundColor: color }} />
              <CategoryTag tag={previewTag} size="medium" />
            </div>
          </div>

          {/* Tag Name Input */}
          <label htmlFor="tag-name-input" className="block text-sm font-medium text-gray-300 mb-2">
            Tag Name
          </label>
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
            className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500 mb-4 transition-colors"
          />

          {/* Color Picker */}
          <label htmlFor="tag-color-input" className="block text-sm font-medium text-gray-300 mb-2">
            Color
          </label>
          <div className="mb-4 flex items-center gap-4">
            <input
              id="tag-color-input"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-16 h-16 rounded-lg border-2 border-gray-600 cursor-pointer bg-transparent"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none',
              }}
              aria-label="Tag color"
            />
            <div className="flex-1">
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
                className="w-full px-4 py-2 bg-gray-700/50 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500 transition-colors font-mono text-sm"
                aria-label="Color hex code"
              />
            </div>
          </div>

          {/* Preset Colors */}
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">Quick Colors:</p>
            <div className="flex flex-wrap gap-2">
              {['#8B5CF6', '#A855F7', '#C084FC', '#22D3EE', '#06B6D4', '#F59E0B', '#EF4444', '#10B981', '#6366F1', '#EC4899'].map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    color === presetColor ? 'border-cyber-purple-400 scale-110' : 'border-gray-600 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: presetColor }}
                  aria-label={`Select color ${presetColor}`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              aria-label="Cancel creating tag"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!tagName.trim() || existingTagNames.some(name => name.toLowerCase() === tagName.trim().toLowerCase())}
              className="flex-1 px-4 py-2 bg-gradient-purple text-white rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Create tag"
              aria-disabled={!tagName.trim()}
            >
              OK
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

