import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import { CategoryTag } from '../../types';
import { CategoryTag as CategoryTagComponent } from './CategoryTag';
import { CategoryTagCreator } from './CategoryTagCreator';

interface CategoryTagSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tagId: string | null) => void;
  tags: CategoryTag[];
  onCreateTag: (name: string, color: string) => Promise<CategoryTag | null>;
  selectedTagId?: string | null;
}

export function CategoryTagSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  tags, 
  onCreateTag,
  selectedTagId 
}: CategoryTagSelectorProps) {
  const [showCreator, setShowCreator] = useState(false);
  const [showExistingList, setShowExistingList] = useState(false);

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
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-tag-selector-title"
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
              <h2 id="category-tag-selector-title" className="text-2xl font-bold bg-gradient-purple bg-clip-text text-transparent">
                {selectedTag ? 'Category Tag' : 'Select Category Tag'}
              </h2>
            </div>

            {selectedTag ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Current Tag:</p>
                  <CategoryTagComponent tag={selectedTag} size="medium" />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowExistingList(true)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Tag className="w-4 h-4" />
                    Choose Existing
                  </button>
                  <button
                    onClick={handleRemoveTag}
                    className="flex-1 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Remove Tag
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setShowCreator(true)}
                  className="w-full px-4 py-3 bg-gradient-purple text-white rounded-lg hover:opacity-90 transition-opacity font-semibold flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Category Tag
                </button>
                <button
                  onClick={() => setShowExistingList(true)}
                  className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Tag className="w-5 h-5" />
                  Choose Existing Tag
                </button>
              </div>
            )}

            {showExistingList && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 max-h-64 overflow-y-auto space-y-2"
              >
                <p className="text-sm text-gray-400 mb-2">Select a tag:</p>
                {tags.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No tags available. Create one first.</p>
                ) : (
                  tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleSelectExisting(tag.id)}
                      className="w-full p-3 bg-gray-900/50 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3 text-left"
                    >
                      <CategoryTagComponent tag={tag} size="small" />
                    </button>
                  ))
                )}
                <button
                  onClick={() => setShowExistingList(false)}
                  className="w-full mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
              </motion.div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                aria-label="Close dialog"
              >
                {selectedTag ? 'Done' : 'Cancel'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {showCreator && (
        <CategoryTagCreator
          isOpen={showCreator}
          onClose={() => setShowCreator(false)}
          onConfirm={handleCreateTag}
          existingTagNames={tags.map(t => t.name)}
        />
      )}
    </>
  );
}


