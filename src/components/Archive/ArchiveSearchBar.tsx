import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Tag, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { CategoryTag as CategoryTagComponent } from './CategoryTag';
import { CategoryTag } from '../../types';

interface ArchiveSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tags?: CategoryTag[];
  selectedTagId?: string | null;
  onTagSelect?: ((tagId: string | null) => void) | null;
}

export function ArchiveSearchBar({ value, onChange, placeholder = 'Search...', tags = [], selectedTagId, onTagSelect }: ArchiveSearchBarProps) {
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowTagDropdown(false);
      }
    };

    if (showTagDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showTagDropdown]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex items-center gap-2"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
        <label htmlFor="archive-search-input" className="sr-only">
          Search
        </label>
        <input
          id="archive-search-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500 transition-colors"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Search By Tag Button */}
      {onTagSelect && (
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setShowTagDropdown(!showTagDropdown)}
            className={`flex items-center gap-2 px-4 py-2 bg-gray-800/50 border-2 rounded-lg transition-colors ${
              selectedTagId
                ? 'border-cyber-purple-500 text-cyber-purple-400'
                : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
            }`}
            aria-label="Search by tag"
            aria-expanded={showTagDropdown}
          >
            <Tag className="w-4 h-4" />
            <span className="text-sm font-medium">Search By Tag</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTagDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Tag Dropdown */}
          <AnimatePresence>
            {showTagDropdown && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border-2 border-cyber-purple-500/60 rounded-lg shadow-xl overflow-hidden z-50"
              >
                <div className="max-h-64 overflow-y-auto">
                  {tags.length === 0 ? (
                    <div className="p-4 text-gray-500 text-sm text-center">
                      No category tags available
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          onTagSelect(null);
                          setShowTagDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                          !selectedTagId ? 'bg-gray-700' : ''
                        }`}
                      >
                        <span className="text-white text-sm">All Cases</span>
                      </button>
                      {tags.map((tag: CategoryTag) => (
                        <button
                          key={tag.id}
                          onClick={() => {
                            onTagSelect(tag.id);
                            setShowTagDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 ${
                            selectedTagId === tag.id ? 'bg-gray-700' : ''
                          }`}
                        >
                          <CategoryTagComponent tag={tag} size="small" />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}



