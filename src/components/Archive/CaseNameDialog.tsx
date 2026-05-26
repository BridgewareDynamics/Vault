import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FolderPlus, Plus, Sparkles, X, FileText } from 'lucide-react';
import { CategoryTagSelector } from './CategoryTagSelector';
import { CategoryTag } from './CategoryTag';
import { useCategoryTags } from '../../hooks/useCategoryTags';
import { useSettingsContext } from '../../utils/settingsContext';
import { Theme } from '../../types';

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
  const { settings: appSettings } = useSettingsContext();
  const theme: Theme = (appSettings?.theme as Theme) || 'brideware-purple';
  const isPastel = theme === 'pastel';

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

  const selectedTag = tags.find((tag) => tag.id === selectedTagId);

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
          className={`fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4 ${
            isPastel ? 'bg-black/40' : 'bg-black/80'
          }`}
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
            className={`relative rounded-2xl border-2 shadow-2xl p-8 max-w-lg w-full backdrop-blur-xl ${
              isPastel
                ? 'bg-gradient-to-br from-white/95 via-pink-50/40 to-white/95 border-pink-200/40'
                : 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border-cyber-purple-400/40'
            }`}
            style={
              isPastel
                ? {
                    boxShadow: '0 20px 60px rgba(251, 182, 206, 0.2), 0 0 0 1px rgba(251, 182, 206, 0.1)',
                  }
                : {}
            }
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {isPastel ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-200/50 via-purple-200/50 to-blue-200/50 rounded-2xl blur-xl opacity-50"></div>
                      <div className="relative p-4 bg-gradient-to-br from-pink-100/80 via-purple-100/80 to-blue-100/80 rounded-2xl shadow-lg border-2 border-pink-200/40">
                        <FolderPlus className="w-8 h-8 text-pink-500" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                      <div className="relative p-4 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl shadow-2xl">
                        <FolderPlus className="w-8 h-8 text-white" />
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <h2
                    id="case-name-dialog-title"
                    className={`text-3xl font-bold bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] ${
                      isPastel
                        ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500'
                        : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400'
                    }`}
                  >
                    Create New Case
                  </h2>
                  <p className={`text-sm mt-1 ${isPastel ? 'text-gray-600' : 'text-gray-400'}`}>
                    Start organizing your research
                  </p>
                </div>
              </div>
              <motion.button
                type="button"
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

            <div className="mb-5">
              <label
                htmlFor="case-name-input"
                className={`block text-sm font-semibold mb-2.5 flex items-center gap-2 ${
                  isPastel ? 'text-gray-700' : 'text-gray-300'
                }`}
              >
                <FileText className={`w-4 h-4 ${isPastel ? 'text-pink-500' : 'text-cyber-purple-400'}`} />
                Case Name
              </label>
              <div className="relative">
                {!isPastel && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 rounded-xl blur-sm"></div>
                )}
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
                  className={`relative w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                    isPastel
                      ? 'bg-white/80 hover:bg-white border-pink-200/50 focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20 text-gray-700 placeholder-gray-400'
                      : 'bg-gray-800/70 hover:bg-gray-800/80 border-gray-700/50 focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20 text-white placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            <div className="mb-5">
              <label
                htmlFor="case-description-textarea"
                className={`block text-sm font-semibold mb-2.5 ${isPastel ? 'text-gray-700' : 'text-gray-300'}`}
              >
                Description <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <div className="relative">
                {!isPastel && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 rounded-xl blur-sm"></div>
                )}
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
                  className={`relative w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none resize-none transition-all duration-300 backdrop-blur-sm ${
                    isPastel
                      ? 'bg-white/80 hover:bg-white border-pink-200/50 focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20 text-gray-700 placeholder-gray-400'
                      : 'bg-gray-800/70 hover:bg-gray-800/80 border-gray-700/50 focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20 text-white placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-3 ${isPastel ? 'text-gray-700' : 'text-gray-300'}`}>
                Category Tag <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <div className="flex items-center gap-3">
                {selectedTagId ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex-1 p-3 rounded-xl border ${
                      isPastel
                        ? 'bg-pink-50/50 border-pink-200/40'
                        : 'bg-gray-800/50 border-cyber-purple-400/30'
                    }`}
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
                    className={`relative overflow-hidden group flex items-center justify-center gap-2 px-5 py-3 border-2 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg backdrop-blur-sm ${
                      isPastel
                        ? 'bg-pink-50/80 hover:bg-pink-100/80 border-pink-200/50 hover:border-pink-300/60 hover:shadow-pink-300/20'
                        : 'bg-gray-800/70 hover:bg-gray-800/90 border-gray-700/50 hover:border-cyber-purple-400/60 hover:shadow-cyber-purple-500/20'
                    }`}
                    aria-label="Add category tag"
                  >
                    {!isPastel && (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/5 group-hover:via-purple-600/3 group-hover:to-cyan-600/5 transition-all duration-500"></div>
                    )}
                    <div className="relative flex items-center gap-2">
                      <div className="relative">
                        {!isPastel && (
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        )}
                        <Plus
                          className={`w-5 h-5 transition-colors ${
                            isPastel
                              ? 'text-gray-600 group-hover:text-pink-500'
                              : 'text-gray-400 group-hover:text-cyber-purple-400'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-sm font-medium transition-colors ${
                          isPastel
                            ? 'text-gray-700 group-hover:text-gray-900'
                            : 'text-gray-300 group-hover:text-white'
                        }`}
                      >
                        Add Tag
                      </span>
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
                    className={`px-4 py-3 border-2 rounded-xl transition-all duration-300 font-medium text-sm ${
                      isPastel
                        ? 'bg-pink-50/80 hover:bg-pink-100/80 border-pink-200/50 hover:border-pink-300/60 text-gray-700 hover:text-gray-900'
                        : 'bg-gray-800/70 hover:bg-gray-800/90 border-gray-700/50 hover:border-cyber-purple-400/60 text-gray-300 hover:text-white'
                    }`}
                  >
                    Change
                  </motion.button>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 px-5 py-3 rounded-xl border-2 transition-all duration-300 font-medium shadow-md hover:shadow-lg backdrop-blur-sm ${
                  isPastel
                    ? 'bg-pink-50/80 hover:bg-pink-100/80 text-gray-700 border-pink-200/50 hover:border-pink-300/50'
                    : 'bg-gray-800/70 hover:bg-gray-800/90 text-white border-gray-700/50 hover:border-gray-600/50'
                }`}
                aria-label="Cancel creating case"
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                onClick={handleConfirm}
                disabled={!caseName.trim()}
                whileHover={{ scale: caseName.trim() ? 1.02 : 1, y: caseName.trim() ? -1 : 0 }}
                whileTap={{ scale: 0.98 }}
                className={`relative overflow-hidden group flex-1 px-5 py-3 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border ${
                  isPastel
                    ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 hover:from-pink-500 hover:via-purple-500 hover:to-pink-500 hover:shadow-pink-500/50 border-pink-300/40'
                    : 'bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 hover:shadow-purple-500/50 border-purple-400/30'
                }`}
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
