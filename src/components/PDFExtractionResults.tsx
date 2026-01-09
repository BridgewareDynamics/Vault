import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ExtractedPage } from '../types';
import { CheckSquare, Square, Eye } from 'lucide-react';

interface PDFExtractionResultsProps {
  pages: ExtractedPage[];
  selectedPages: Set<number>;
  onPageClick: (page: ExtractedPage) => void;
  onPageSelect: (pageNumber: number, selected: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function PDFExtractionResults({
  pages,
  selectedPages,
  onPageClick,
  onPageSelect,
  onSelectAll,
  onDeselectAll,
}: PDFExtractionResultsProps) {
  const allSelected = useMemo(
    () => pages.length > 0 && pages.every((p) => selectedPages.has(p.pageNumber)),
    [pages, selectedPages]
  );

  const someSelected = useMemo(
    () => pages.some((p) => selectedPages.has(p.pageNumber)),
    [pages, selectedPages]
  );

  const handleToggleAll = () => {
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  if (pages.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No pages extracted yet. Start conversion to see results.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Selection Controls */}
      <div className="flex items-center justify-between bg-gray-800/60 backdrop-blur-sm border border-cyber-purple-400/20 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleAll}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-300 hover:text-white"
            aria-label={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-cyber-purple-400" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
          </button>
          {someSelected && (
            <span className="text-sm text-gray-400">
              {selectedPages.size} of {pages.length} selected
            </span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          {pages.length} page{pages.length !== 1 ? 's' : ''} extracted
        </div>
      </div>

      {/* Grid Layout - Limited to 3 rows with scrolling */}
      <div className="overflow-y-auto max-h-[600px] pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139, 92, 246, 0.5) transparent' }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {pages.map((page) => {
          const isSelected = selectedPages.has(page.pageNumber);
          return (
            <motion.div
              key={page.pageNumber}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative cursor-pointer group"
            >
              <div
                className={`relative rounded-lg overflow-hidden border-2 transition-all bg-gray-800 ${
                  isSelected
                    ? 'border-cyber-purple-400 shadow-lg shadow-cyber-purple-400/50'
                    : 'border-gray-700 hover:border-cyber-purple-500'
                }`}
              >
                {/* Selection Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPageSelect(page.pageNumber, !isSelected);
                  }}
                  className={`absolute top-2 right-2 z-20 p-1.5 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-cyber-purple-500 text-white'
                      : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700'
                  }`}
                  aria-label={isSelected ? 'Deselect page' : 'Select page'}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                {/* Page number badge */}
                <div className="absolute top-2 left-2 z-10 bg-gradient-purple text-white font-bold px-3 py-1 rounded-full text-sm shadow-lg border border-cyber-cyan-400/50">
                  #{page.pageNumber}
                </div>

                {/* Image */}
                <div className="aspect-[3/4] bg-gray-900 relative overflow-hidden">
                  <img
                    src={page.imageData}
                    alt={`Page ${page.pageNumber}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onClick={() => onPageClick(page)}
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* View icon on hover */}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => onPageClick(page)}
                    aria-hidden="true"
                  >
                    <div className="bg-cyber-purple-500/90 rounded-full p-3 backdrop-blur-sm">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute inset-0 border-4 border-cyber-purple-400 pointer-events-none rounded-lg" />
                )}
              </div>
            </motion.div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
