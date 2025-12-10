import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

interface PDFOptionsDropdownProps {
  onStartExtraction: () => void;
}

export function PDFOptionsDropdown({ onStartExtraction }: PDFOptionsDropdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="bg-gray-800 border-2 border-cyber-purple-500/60 rounded-lg shadow-xl overflow-hidden"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStartExtraction();
        }}
        className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-gray-700 transition-colors text-white"
      >
        <FileText className="w-3.5 h-3.5 text-cyber-purple-400" />
        <span className="text-xs font-medium">Start Page Extraction</span>
      </button>
    </motion.div>
  );
}

