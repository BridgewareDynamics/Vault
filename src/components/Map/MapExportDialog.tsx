import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileJson, Image } from 'lucide-react';
import { Theme } from '../../types';
import { useMapTheme } from './mapTheme';

interface MapExportDialogProps {
  isOpen: boolean;
  theme: Theme;
  onClose: () => void;
  onExportPng: () => void;
  onExportJson: () => void;
  onExportFolder: () => void;
  exporting?: boolean;
}

export function MapExportDialog({
  isOpen,
  theme,
  onClose,
  onExportPng,
  onExportJson,
  onExportFolder,
  exporting,
}: MapExportDialogProps) {
  const t = useMapTheme(theme);

  if (!isOpen) return null;

  const btn = `w-full flex items-center gap-3 px-4 py-3 rounded-xl border ${t.card} ${t.cardHover}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[75] bg-black/70 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          onClick={(e) => e.stopPropagation()}
          className={`rounded-2xl border-2 p-6 max-w-sm w-full ${t.card}`}
        >
          <div className="flex justify-between mb-4">
            <h2 className={`text-lg font-bold ${t.heading}`}>Export Map</h2>
            <button type="button" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" disabled={exporting} onClick={onExportPng} className={btn}>
              <Image className="w-5 h-5" />
              PNG poster
            </button>
            <button type="button" disabled={exporting} onClick={onExportJson} className={btn}>
              <FileJson className="w-5 h-5" />
              JSON (native)
            </button>
            <button type="button" disabled={exporting} onClick={onExportFolder} className={btn}>
              <Download className="w-5 h-5" />
              Copy to folder
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
