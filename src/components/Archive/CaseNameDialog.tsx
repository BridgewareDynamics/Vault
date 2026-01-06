import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FolderPlus, Plus, Sparkles, X, FileText } from 'lucide-react';
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
  const { tags, createTag, deleteTag } = useCategoryTags();

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
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedTag = tags.find(t => t.id === selectedTagId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="case-name-dialog"
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
          aria-labelledby="case-name-dialog-title"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl border-2 border-cyber-purple-400/40 shadow-2xl p-8 max-w-lg w-full backdrop-blur-xl"
          >
            {/* Enhanced Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                  <div className="relative p-4 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl shadow-2xl">
                    <FolderPlus className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h2 
                    id="case-name-dialog-title" 
                    className="text-3xl font-bold bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]"
                  >
                    Create New Case
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">Start organizing your research</p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-gray-800/80 rounded-xl transition-colors text-gray-400 hover:text-white"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Case Name Input */}
            <div className="mb-5">
              <label htmlFor="case-name-input" className="block text-sm font-semibold text-gray-300 mb-2.5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyber-purple-400" />
                Case Name
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 rounded-xl blur-sm"></div>
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
                  className="relative w-full px-4 py-3.5 bg-gray-800/70 hover:bg-gray-800/80 border-2 border-gray-700/50 focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Description Input */}
            <div className="mb-5">
              <label htmlFor="case-description-textarea" className="block text-sm font-semibold text-gray-300 mb-2.5">
                Description <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 rounded-xl blur-sm"></div>
                <textarea
                  id="case-description-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleTextareaKeyPress}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Add a description for this case..."
                  rows={4}
                  aria-label="Case description (optional)"
                  className="relative w-full px-4 py-3.5 bg-gray-800/70 hover:bg-gray-800/80 border-2 border-gray-700/50 focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none resize-none transition-all duration-300 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Enhanced Category Tag Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Category Tag <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-3">
                {selectedTagId ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 p-3 bg-gray-800/50 rounded-xl border border-cyber-purple-400/30"
                  >
                    {selectedTag && <CategoryTag tag={selectedTag} size="medium" />}
                  </motion.div>
                ) : (
                  <motion.button
                    type="button"
                    onClick={() => setShowTagSelector(true)}
                    onMouseDown={(e) => e.stopPropagation()}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative overflow-hidden group flex items-center justify-center gap-2 px-5 py-3 bg-gray-800/70 hover:bg-gray-800/90 border-2 border-gray-700/50 hover:border-cyber-purple-400/60 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-cyber-purple-500/20 backdrop-blur-sm"
                    aria-label="Add category tag"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/5 group-hover:via-purple-600/3 group-hover:to-cyan-600/5 transition-all duration-500"></div>
                    <div className="relative flex items-center gap-2">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Plus className="w-5 h-5 text-gray-400 group-hover:text-cyber-purple-400 transition-colors" />
                      </div>
                      <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Add Tag</span>
                    </div>
                  </motion.button>
                )}
                {selectedTagId && (
                  <motion.button
                    type="button"
                    onClick={() => setShowTagSelector(true)}
                    onMouseDown={(e) => e.stopPropagation()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-3 bg-gray-800/70 hover:bg-gray-800/90 border-2 border-gray-700/50 hover:border-cyber-purple-400/60 text-gray-300 hover:text-white rounded-xl transition-all duration-300 font-medium text-sm"
                  >
                    Change
                  </motion.button>
                )}
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex gap-3 pt-2">
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-5 py-3 bg-gray-800/70 hover:bg-gray-800/90 text-white rounded-xl border-2 border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 font-medium shadow-md hover:shadow-lg backdrop-blur-sm"
                aria-label="Cancel creating case"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleConfirm}
                disabled={!caseName.trim()}
                whileHover={{ scale: caseName.trim() ? 1.02 : 1, y: caseName.trim() ? -1 : 0 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden group flex-1 px-5 py-3 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-400/30"
                aria-label="Create case"
                aria-disabled={!caseName.trim()}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="relative flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Create Case</span>
                </div>
              </motion.button>
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
          onDeleteTag={deleteTag}
          selectedTagId={selectedTagId}
        />
      )}
    </AnimatePresence>
  );
}
