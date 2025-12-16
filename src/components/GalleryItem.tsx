import { motion } from 'framer-motion';
import { ExtractedPage } from '../types';

interface GalleryItemProps {
  page: ExtractedPage;
  onClick: () => void;
}

export function GalleryItem({ page, onClick }: GalleryItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative cursor-pointer group"
    >
      <div className="relative rounded-lg overflow-hidden border-2 border-gray-700 hover:border-cyber-purple-500 transition-colors bg-gray-800">
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
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* View icon on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
            <div className="bg-cyber-purple-500/90 rounded-full p-3 backdrop-blur-sm">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}



