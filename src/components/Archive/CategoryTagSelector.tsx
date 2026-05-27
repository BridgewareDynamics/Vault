import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, Tag, X, ChevronDown, ChevronUp, Sparkles, Filter, Trash2 } from 'lucide-react';
import { CategoryTag, Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';
import { CategoryTag as CategoryTagComponent } from './CategoryTag';
import { CategoryTagCreator } from './CategoryTagCreator';
import { useSettingsContext } from '../../utils/settingsContext';

interface CategoryTagSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tagId: string | null) => void;
  tags: CategoryTag[];
  onCreateTag: (name: string, color: string) => Promise<CategoryTag | null>;
  onDeleteTag: (tagId: string) => Promise<boolean>;
  selectedTagId?: string | null;
}

export function CategoryTagSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  tags, 
  onCreateTag,
  onDeleteTag,
  selectedTagId 
}: CategoryTagSelectorProps) {
  const [showCreator, setShowCreator] = useState(false);
  const [showExistingList, setShowExistingList] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<CategoryTag | null>(null);
  const { settings: appSettings } = useSettingsContext();
  const theme: Theme = (appSettings?.theme as Theme) || 'brideware-purple';
  const isPastel = isLightTheme(theme);

  const handleCreateTag = async (name: string, color: string) => {
    const newTag = await onCreateTag(name, color);
    if (newTag) {
      setShowCreator(false);
      onSelect(newTag.id);
      onClose();
    }
  };

  const handleSelectExisting = (tagId: string) => {
    onSelect(tagId);
    setShowExistingList(false);
    onClose();
  };

  const handleRemoveTag = () => {
    onSelect(null);
    onClose();
  };

  const handleDeleteTag = async () => {
    if (tagToDelete) {
      const success = await onDeleteTag(tagToDelete.id);
      if (success) {
        setTagToDelete(null);
        if (selectedTagId === tagToDelete.id) {
          onSelect(null);
        }
      }
    }
  };

  if (!isOpen) return null;

  const selectedTag = tags.find(t => t.id === selectedTagId);

  return (
    <>
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
          className={`fixed inset-0 z-[60] backdrop-blur-sm flex items-center justify-center p-4 ${
            isPastel ? 'bg-black/40' : 'bg-black/80'
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-tag-selector-title"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={`relative rounded-2xl border-2 shadow-2xl p-8 max-w-md w-full backdrop-blur-xl ${
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
                        <Filter className="w-8 h-8 text-pink-500" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                      <div className="relative p-4 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl shadow-2xl">
                        <Filter className="w-8 h-8 text-white" />
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <h2 
                    id="category-tag-selector-title" 
                    className={`text-3xl font-bold bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] ${
                      isPastel
                        ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500'
                        : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400'
                    }`}
                  >
                    {selectedTag ? 'Category Tag' : 'Select Tag'}
                  </h2>
                  <p className={`text-sm mt-1 ${
                    isPastel ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {selectedTag ? 'Manage your category tag' : 'Choose or create a tag'}
                  </p>
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

            {selectedTag ? (
              <div className="space-y-5">
                {/* Current Tag Display */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-xl border ${
                    isPastel
                      ? 'bg-pink-50/50 border-pink-200/40'
                      : 'bg-gray-800/50 border-cyber-purple-400/30'
                  }`}
                >
                  <p className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                    isPastel ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    <Tag className={`w-4 h-4 ${isPastel ? 'text-pink-500' : ''}`} />
                    Current Tag:
                  </p>
                  <CategoryTagComponent tag={selectedTag} size="large" />
                </motion.div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <motion.button
                    onClick={() => setShowCreator(true)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative overflow-hidden group w-full px-5 py-3.5 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border ${
                      isPastel
                        ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 hover:from-pink-500 hover:via-purple-500 hover:to-pink-500 hover:shadow-pink-500/50 border-pink-300/40'
                        : 'bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 hover:shadow-purple-500/50 border-purple-400/30'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="relative flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      <span>Create New Tag</span>
                      <Sparkles className="w-4 h-4 opacity-70" />
                    </div>
                  </motion.button>
                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => setShowExistingList(true)}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 px-4 py-3 border-2 rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg backdrop-blur-sm flex items-center justify-center gap-2 ${
                        isPastel
                          ? 'bg-pink-50/80 hover:bg-pink-100/80 border-pink-200/50 hover:border-pink-300/60 text-gray-700 hover:text-gray-900 hover:shadow-pink-300/20'
                          : 'bg-gray-800/70 hover:bg-gray-800/90 border-gray-700/50 hover:border-cyber-purple-400/60 text-gray-300 hover:text-white hover:shadow-cyber-purple-500/20'
                      }`}
                    >
                      <Tag className="w-4 h-4" />
                      Choose Existing
                    </motion.button>
                    <motion.button
                      onClick={handleRemoveTag}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 px-4 py-3 border-2 rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                        isPastel
                          ? 'bg-red-200/80 hover:bg-red-300/80 border-red-300/50 hover:border-red-400/60 text-red-700 hover:text-red-900 hover:shadow-red-300/30'
                          : 'bg-red-600/80 hover:bg-red-600 border-red-500/50 hover:border-red-400/60 text-white hover:shadow-red-500/30'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </motion.button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <motion.button
                  onClick={() => setShowCreator(true)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative overflow-hidden group w-full px-5 py-3.5 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border ${
                    isPastel
                      ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 hover:from-pink-500 hover:via-purple-500 hover:to-pink-500 hover:shadow-pink-500/50 border-pink-300/40'
                      : 'bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:from-purple-700 hover:via-purple-600 hover:to-cyan-700 hover:shadow-purple-500/50 border-purple-400/30'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="relative flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    <span>Create New Tag</span>
                    <Sparkles className="w-4 h-4 opacity-70" />
                  </div>
                </motion.button>
                <motion.button
                  onClick={() => setShowExistingList(true)}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full px-5 py-3.5 border-2 rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg backdrop-blur-sm flex items-center justify-center gap-2 ${
                    isPastel
                      ? 'bg-pink-50/80 hover:bg-pink-100/80 border-pink-200/50 hover:border-pink-300/60 text-gray-700 hover:text-gray-900 hover:shadow-pink-300/20'
                      : 'bg-gray-800/70 hover:bg-gray-800/90 border-gray-700/50 hover:border-cyber-purple-400/60 text-gray-300 hover:text-white hover:shadow-cyber-purple-500/20'
                  }`}
                >
                  <Tag className="w-5 h-5" />
                  Choose Existing Tag
                </motion.button>
              </div>
            )}

            {/* Enhanced Existing Tags List */}
            {showExistingList && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold flex items-center gap-2 ${
                    isPastel ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    <Tag className={`w-4 h-4 ${isPastel ? 'text-pink-500' : 'text-cyber-purple-400'}`} />
                    Available Tags
                  </p>
                  <motion.button
                    onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded-lg transition-colors ${
                      isPastel
                        ? 'hover:bg-pink-100/50 text-gray-600 hover:text-gray-900'
                        : 'hover:bg-gray-800/80 text-gray-400 hover:text-white'
                    }`}
                  >
                    {showTagsDropdown ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {showTagsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={`max-h-64 overflow-y-auto space-y-2 p-3 rounded-xl border ${
                        isPastel
                          ? 'bg-pink-50/50 border-pink-200/40'
                          : 'bg-gray-800/50 border-gray-700/50'
                      }`}>
                        {tags.length === 0 ? (
                          <div className="text-center py-6">
                            <div className={`inline-flex p-3 rounded-xl border mb-3 ${
                              isPastel
                                ? 'bg-pink-50/50 border-pink-300/30'
                                : 'bg-gray-800/50 border-cyber-purple-400/20'
                            }`}>
                              <Tag className={`w-8 h-8 ${
                                isPastel ? 'text-pink-400/50' : 'text-cyber-purple-400/50'
                              }`} />
                            </div>
                            <p className={`text-sm ${
                              isPastel ? 'text-gray-600' : 'text-gray-400'
                            }`}>No tags available. Create one first.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {tags.map((tag, index) => (
                              <motion.div
                                key={tag.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors border ${
                                  isPastel
                                    ? 'bg-pink-50/50 hover:bg-pink-100/80 border-pink-200/30 hover:border-pink-300/40'
                                    : 'bg-gray-800/50 hover:bg-gray-800 border-gray-700/30 hover:border-cyber-purple-400/30'
                                }`}
                              >
                                <motion.button
                                  onClick={() => handleSelectExisting(tag.id)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="flex-1 flex items-center gap-3 text-left"
                                >
                                  <CategoryTagComponent tag={tag} size="medium" />
                                </motion.button>
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTagToDelete(tag);
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className={`p-2 rounded-lg transition-colors group ${
                                    isPastel
                                      ? 'hover:bg-red-200/30'
                                      : 'hover:bg-red-600/20'
                                  }`}
                                  aria-label={`Delete tag ${tag.name}`}
                                >
                                  <X className={`w-4 h-4 transition-colors ${
                                    isPastel
                                      ? 'text-gray-600 group-hover:text-red-600'
                                      : 'text-gray-400 group-hover:text-red-400'
                                  }`} />
                                </motion.button>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {showCreator && (
        <CategoryTagCreator
          isOpen={showCreator}
          onClose={() => setShowCreator(false)}
          onConfirm={handleCreateTag}
          existingTagNames={tags.map(t => t.name)}
          isPastel={isPastel}
        />
      )}

      {/* Enhanced Delete Tag Confirmation Dialog */}
      <AnimatePresence>
        {tagToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTagToDelete(null)}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-tag-dialog-title"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              className={`relative rounded-2xl border-2 shadow-2xl p-8 max-w-md w-full backdrop-blur-xl ${
                isPastel
                  ? 'bg-gradient-to-br from-white/95 via-red-50/40 to-white/95 border-red-300/40'
                  : 'bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 border-red-500/40'
              }`}
              style={isPastel ? {
                boxShadow: '0 20px 60px rgba(251, 182, 206, 0.2), 0 0 0 1px rgba(251, 182, 206, 0.1)',
              } : {}}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  {isPastel ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-red-200/50 to-red-300/50 rounded-2xl blur-xl opacity-50"></div>
                      <div className="relative p-4 bg-gradient-to-br from-red-100/80 to-red-200/80 rounded-2xl shadow-lg border-2 border-red-200/40">
                        <Trash2 className="w-8 h-8 text-red-600" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl blur-xl opacity-50"></div>
                      <div className="relative p-4 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl shadow-2xl">
                        <Trash2 className="w-8 h-8 text-white" />
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <h2 id="delete-tag-dialog-title" className={`text-2xl font-bold ${
                    isPastel ? 'text-red-600' : 'text-red-400'
                  }`}>
                    Delete Tag
                  </h2>
                  <p className={`text-sm mt-1 ${
                    isPastel ? 'text-gray-600' : 'text-gray-400'
                  }`}>This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className={`mb-4 ${
                  isPastel ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Are you sure you want to delete the tag <span className={`font-semibold ${
                    isPastel ? 'text-gray-900' : 'text-white'
                  }`}>"{tagToDelete.name}"</span>?
                </p>
                <div className="flex justify-center my-4">
                  <CategoryTagComponent tag={tagToDelete} size="large" />
                </div>
                <div className={`p-3 border rounded-xl ${
                  isPastel
                    ? 'bg-red-100/50 border-red-300/40'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <p className={`text-sm flex items-center gap-2 ${
                    isPastel ? 'text-red-600' : 'text-red-400'
                  }`}>
                    <X className="w-4 h-4" />
                    This will remove the tag from all cases and files using it.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setTagToDelete(null)}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 px-5 py-3 rounded-xl border-2 transition-all duration-300 font-medium shadow-md hover:shadow-lg backdrop-blur-sm ${
                    isPastel
                      ? 'bg-pink-50/80 hover:bg-pink-100/80 text-gray-700 border-pink-200/50 hover:border-pink-300/50'
                      : 'bg-gray-800/70 hover:bg-gray-800/90 text-white border-gray-700/50 hover:border-gray-600/50'
                  }`}
                  aria-label="Cancel deleting tag"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleDeleteTag}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative overflow-hidden group flex-1 px-5 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2 border ${
                    isPastel
                      ? 'bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 text-red-900 hover:shadow-red-300/50 border-red-300/40'
                      : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white hover:shadow-red-500/50 border-red-400/30'
                  }`}
                  aria-label={`Confirm deletion of tag ${tagToDelete.name}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="relative flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
