import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Tag, ChevronDown, Filter } from 'lucide-react';
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
      className="relative flex items-center gap-2 sm:gap-3"
    >
      <div className="relative flex-1 min-w-0">
        <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg blur-sm"></div>
            <div className="relative p-1.5 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" aria-hidden="true" />
            </div>
          </div>
        </div>
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
          className="w-full pl-11 sm:pl-14 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-gray-800/70 hover:bg-gray-800/80 border-2 border-gray-700/50 hover:border-gray-600/50 focus:border-cyber-purple-500/60 focus:ring-2 focus:ring-cyber-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all duration-300 backdrop-blur-sm text-sm sm:text-base"
        />
        {value && (
          <motion.button
            onClick={() => onChange('')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </motion.button>
        )}
      </div>

      {/* Enhanced Search By Tag Button */}
      {onTagSelect && (
        <div className="relative flex-shrink-0" style={{ zIndex: 9999 }}>
          <motion.button
            ref={buttonRef}
            onClick={() => setShowTagDropdown(!showTagDropdown)}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`relative overflow-hidden group flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border-2 transition-all duration-300 font-medium shadow-md hover:shadow-lg ${
              selectedTagId
                ? 'bg-cyber-purple-500/20 border-cyber-purple-500/60 text-cyber-purple-400 hover:bg-cyber-purple-500/30 hover:shadow-cyber-purple-500/30'
                : 'bg-gray-800/70 hover:bg-gray-800/90 border-gray-700/50 hover:border-cyber-purple-400/60 text-gray-300 hover:text-white hover:shadow-cyber-purple-500/20'
            } backdrop-blur-sm`}
            aria-label="Search by tag"
            aria-expanded={showTagDropdown}
          >
            <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
              selectedTagId
                ? 'from-purple-600/10 via-purple-600/5 to-cyan-600/10'
                : 'from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/5 group-hover:via-purple-600/3 group-hover:to-cyan-600/5'
            }`}></div>
            <div className="relative flex items-center gap-2">
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-br rounded-lg blur-sm transition-opacity ${
                  selectedTagId ? 'from-purple-600/20 to-cyan-600/20 opacity-100' : 'from-purple-600/20 to-cyan-600/20 opacity-0 group-hover:opacity-100'
                }`}></div>
                <Filter className={`w-4 h-4 transition-colors ${selectedTagId ? 'text-cyber-purple-400' : 'text-gray-400 group-hover:text-cyber-purple-400'}`} />
              </div>
              <span className="text-sm sm:text-base whitespace-nowrap">Filter</span>
              <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 ${showTagDropdown ? 'rotate-180' : ''} ${selectedTagId ? 'text-cyber-purple-400' : 'text-gray-400 group-hover:text-cyber-purple-400'}`} />
            </div>
          </motion.button>

          {/* Enhanced Tag Dropdown */}
          <AnimatePresence>
            {showTagDropdown && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute top-full right-0 mt-2 w-72 bg-gradient-to-br from-gray-800/95 via-gray-800/95 to-gray-900/95 border-2 border-cyber-purple-400/40 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
                style={{ zIndex: 9999 }}
              >
                <div className="max-h-80 overflow-y-auto">
                  {tags.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="inline-flex p-3 bg-gray-800/50 rounded-xl border border-cyber-purple-400/20 mb-3">
                        <Tag className="w-8 h-8 text-cyber-purple-400/50" />
                      </div>
                      <p className="text-gray-400 text-sm">No category tags available</p>
                    </div>
                  ) : (
                    <>
                      <motion.button
                        onClick={() => {
                          onTagSelect(null);
                          setShowTagDropdown(false);
                        }}
                        whileHover={{ x: 2 }}
                        className={`w-full px-4 py-3 text-left transition-all flex items-center gap-3 ${
                          !selectedTagId 
                            ? 'bg-cyber-purple-500/20 border-l-2 border-cyber-purple-400' 
                            : 'hover:bg-gray-700/50'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full transition-all ${
                          !selectedTagId ? 'bg-cyber-purple-400' : 'bg-gray-600'
                        }`}></div>
                        <span className={`text-sm font-medium transition-colors ${
                          !selectedTagId ? 'text-cyber-purple-400' : 'text-gray-300'
                        }`}>All Cases</span>
                      </motion.button>
                      {tags.map((tag: CategoryTag, index) => (
                        <motion.button
                          key={tag.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => {
                            onTagSelect(tag.id);
                            setShowTagDropdown(false);
                          }}
                          whileHover={{ x: 2 }}
                          className={`w-full px-4 py-3 text-left transition-all flex items-center gap-3 ${
                            selectedTagId === tag.id 
                              ? 'bg-cyber-purple-500/20 border-l-2 border-cyber-purple-400' 
                              : 'hover:bg-gray-700/50'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full transition-all ${
                            selectedTagId === tag.id ? 'bg-cyber-purple-400' : 'bg-gray-600'
                          }`}></div>
                          <CategoryTagComponent tag={tag} size="small" />
                        </motion.button>
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



