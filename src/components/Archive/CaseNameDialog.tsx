import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FolderPlus, Plus } from 'lucide-react';
import { CategoryTagSelector } from './CategoryTagSelector';
import { CategoryTag } from './CategoryTag';
import { useCategoryTags } from '../../hooks/useCategoryTags';

interface CaseNameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (caseName: string, description: string, categoryTagId?: string) => void;
}

export function CaseNameDialog({ isOpen, onClose, onConfirm }: CaseNameDialogProps) {
  const [caseName, setCaseName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const { tags, createTag } = useCategoryTags();

  useEffect(() => {
    if (isOpen) {
      setCaseName('');
      setDescription('');
      setSelectedTagId(null);
      setShowTagSelector(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (caseName.trim()) {
      onConfirm(caseName.trim(), description.trim(), selectedTagId || undefined);
      setCaseName('');
      setDescription('');
      setSelectedTagId(null);
    }
  };

  const handleTagSelect = (tagId: string | null) => {
    setSelectedTagId(tagId);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleTextareaKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      // Ctrl/Cmd + Enter to submit
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="case-name-dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            // Only close if clicking directly on the backdrop (not on dialog or its children)
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-name-dialog-title"
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
            <div className="p-2 bg-gradient-purple rounded-lg" aria-hidden="true">
              <FolderPlus className="w-6 h-6 text-white" />
            </div>
            <h2 id="case-name-dialog-title" className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
              Name File
            </h2>
          </div>

          <label htmlFor="case-name-input" className="sr-only">
            Case name
          </label>
          <input
            id="case-name-input"
            type="text"
            value={caseName}
            onChange={(e) => setCaseName(e.target.value)}
            onKeyDown={handleKeyPress}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            placeholder="Enter case name..."
            autoFocus
            aria-label="Case name"
            aria-required="true"
            className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500 mb-4 transition-colors"
          />

          <label htmlFor="case-description-textarea" className="sr-only">
            Case description
          </label>
          <textarea
            id="case-description-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleTextareaKeyPress}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            placeholder="Description..."
            rows={4}
            aria-label="Case description (optional)"
            className="w-full px-4 py-3 bg-gray-700/50 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500 mb-4 resize-none transition-colors"
          />

          {/* Category Tag Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Add Description tag:
            </label>
            <div className="flex items-center gap-3">
              {selectedTagId ? (
                <div className="flex-1">
                  {(() => {
                    const tag = tags.find(t => t.id === selectedTagId);
                    return tag ? <CategoryTag tag={tag} size="small" /> : null;
                  })()}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTagSelector(true)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-700 border-2 border-gray-600 hover:border-cyber-purple-500 transition-colors"
                  aria-label="Add category tag"
                >
                  <Plus className="w-5 h-5 text-gray-400" />
                </button>
              )}
              {selectedTagId && (
                <button
                  type="button"
                  onClick={() => setShowTagSelector(true)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Change
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              aria-label="Cancel creating case"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!caseName.trim()}
              className="flex-1 px-4 py-2 bg-gradient-purple text-white rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Create case"
              aria-disabled={!caseName.trim()}
            >
              OK
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}

      {showTagSelector && (
        <CategoryTagSelector
          key="category-tag-selector"
          isOpen={showTagSelector}
          onClose={() => setShowTagSelector(false)}
          onSelect={handleTagSelect}
          tags={tags}
          onCreateTag={createTag}
          selectedTagId={selectedTagId}
        />
      )}
    </AnimatePresence>
  );
}



