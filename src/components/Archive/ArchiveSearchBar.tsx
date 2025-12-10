import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ArchiveSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ArchiveSearchBar({ value, onChange, placeholder = 'Search...' }: ArchiveSearchBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-purple-500 transition-colors"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}



