import { motion } from 'framer-motion';
import { Shield, Image as ImageIcon } from 'lucide-react';
import { Theme } from '../../types';
import { isLightTheme } from '../../theme/themeSemantics';
import { useSettingsContext } from '../../utils/settingsContext';

interface PDFOptionsDropdownProps {
  onStartExtraction?: () => void;
  onRunAudit?: () => void;
}

export function PDFOptionsDropdown({ onStartExtraction, onRunAudit }: PDFOptionsDropdownProps) {
  const { settings } = useSettingsContext();
  const theme: Theme = (settings?.theme as Theme) || 'brideware-purple';
  const isPastel = isLightTheme(theme);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={`backdrop-blur-sm border-2 rounded-xl shadow-2xl overflow-hidden min-w-0 ${
        isPastel
          ? 'bg-white/95 border-pink-400/60'
          : 'bg-gray-800/95 border-cyber-purple-500/60'
      }`}
    >
      {onRunAudit && (
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onRunAudit();
          }}
          className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all group ${
            isPastel
              ? `hover:bg-gradient-to-r hover:from-pink-300/20 hover:to-purple-300/20 text-gray-800 ${onStartExtraction ? 'border-b border-pink-200/50' : ''}`
              : `hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20 text-white ${onStartExtraction ? 'border-b border-gray-700/50' : ''}`
          }`}
        >
          <div className="p-1.5 bg-cyber-purple-400/20 rounded-lg group-hover:bg-cyber-purple-400/30 transition-colors">
            <Shield className="w-4 h-4 text-cyber-purple-400 group-hover:text-cyber-purple-300 transition-colors" />
          </div>
          <span className="text-sm font-semibold group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-purple-400 group-hover:to-cyber-cyan-400 transition-all">
            PDF Audit
          </span>
        </motion.button>
      )}
      {onStartExtraction && (
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onStartExtraction();
          }}
          className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all group ${
            isPastel
              ? 'hover:bg-gradient-to-r hover:from-pink-300/20 hover:to-purple-300/20 text-gray-800'
              : 'hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20 text-white'
          }`}
        >
          <div className={`p-1.5 rounded-lg transition-colors ${
            isPastel
              ? 'bg-pink-400/20 group-hover:bg-pink-400/30'
              : 'bg-cyber-purple-400/20 group-hover:bg-cyber-purple-400/30'
          }`}>
            <ImageIcon className={`w-4 h-4 transition-colors ${
              isPastel
                ? 'text-pink-500 group-hover:text-pink-600'
                : 'text-cyber-purple-400 group-hover:text-cyber-purple-300'
            }`} />
          </div>
          <span className={`text-sm font-semibold transition-all ${
            isPastel
              ? 'group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400'
              : 'group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-purple-400 group-hover:to-cyber-cyan-400'
          }`}>
            Convert to Images
          </span>
        </motion.button>
      )}
    </motion.div>
  );
}

