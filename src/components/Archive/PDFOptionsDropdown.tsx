import { motion } from 'framer-motion';
import { FileText, Shield } from 'lucide-react';

interface PDFOptionsDropdownProps {
  onStartExtraction?: () => void;
  onRunAudit?: () => void;
}

export function PDFOptionsDropdown({ onStartExtraction, onRunAudit }: PDFOptionsDropdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="bg-gray-800 border-2 border-cyber-purple-500/60 rounded-lg shadow-xl overflow-hidden min-w-0"
    >
      {onRunAudit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRunAudit();
          }}
          className={`w-full px-2.5 py-1.5 flex items-center gap-2 text-left hover:bg-gray-700 transition-colors text-white ${onStartExtraction ? 'border-b border-gray-700/50' : ''}`}
        >
          <Shield className="w-3.5 h-3.5 text-cyber-purple-400" />
          <span className="text-xs font-medium">PDF Audit</span>
        </button>
      )}
      {onStartExtraction && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartExtraction();
          }}
          className="w-full px-2.5 py-1.5 flex items-center gap-2 text-left hover:bg-gray-700 transition-colors text-white"
        >
          <FileText className="w-3.5 h-3.5 text-cyber-purple-400" />
          <span className="text-xs font-medium">Start Page Extraction</span>
        </button>
      )}
    </motion.div>
  );
}

