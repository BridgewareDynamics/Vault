import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, FileText, X } from 'lucide-react';
import { useToast } from '../Toast/ToastContext';
import { getUserFriendlyError } from '../../utils/errorMessages';

interface NovelExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  novelFolderPath: string;
  title: string;
}

export function NovelExportDialog({ isOpen, onClose, novelFolderPath, title }: NovelExportDialogProps) {
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    if (!window.electronAPI?.showSaveDialog || !window.electronAPI.exportNovelPdf) return;
    const result = await window.electronAPI.showSaveDialog({
      title: 'Export PDF',
      defaultPath: `${title}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (result.canceled || !result.filePath) return;
    setExporting(true);
    try {
      await window.electronAPI.exportNovelPdf(novelFolderPath, result.filePath);
      toast.success('PDF exported');
      onClose();
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'exporting PDF' }));
    } finally {
      setExporting(false);
    }
  };

  const exportDocx = async () => {
    if (!window.electronAPI?.showSaveDialog || !window.electronAPI.exportNovelDocx) return;
    const result = await window.electronAPI.showSaveDialog({
      title: 'Export DOCX',
      defaultPath: `${title}.docx`,
      filters: [{ name: 'Word Document', extensions: ['docx'] }],
    });
    if (result.canceled || !result.filePath) return;
    setExporting(true);
    try {
      await window.electronAPI.exportNovelDocx(novelFolderPath, result.filePath);
      toast.success('DOCX exported');
      onClose();
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'exporting DOCX' }));
    } finally {
      setExporting(false);
    }
  };

  const exportEpub = async () => {
    if (!window.electronAPI?.showSaveDialog || !window.electronAPI.exportNovelEpub) return;
    const result = await window.electronAPI.showSaveDialog({
      title: 'Export EPUB',
      defaultPath: `${title}.epub`,
      filters: [{ name: 'EPUB', extensions: ['epub'] }],
    });
    if (result.canceled || !result.filePath) return;
    setExporting(true);
    try {
      await window.electronAPI.exportNovelEpub(novelFolderPath, result.filePath);
      toast.success('EPUB exported');
      onClose();
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'exporting EPUB' }));
    } finally {
      setExporting(false);
    }
  };

  const exportHtml = async () => {
    if (!window.electronAPI?.selectSaveDirectory || !window.electronAPI.exportNovelHtml) return;
    const dir = await window.electronAPI.selectSaveDirectory();
    if (!dir) return;
    setExporting(true);
    try {
      const result = await window.electronAPI.exportNovelHtml(novelFolderPath, dir);
      toast.success(`Exported to ${result.exportPath}`);
      onClose();
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'exporting HTML' }));
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-gray-900 p-6 text-white shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Export Novel</h2>
            <button type="button" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-6 grid gap-3">
            <button
              type="button"
              disabled={exporting}
              onClick={() => void exportPdf()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 font-semibold disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={() => void exportDocx()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-semibold disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              Export DOCX
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={() => void exportEpub()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 font-semibold disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export EPUB
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={() => void exportHtml()}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-4 py-3 font-semibold disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export HTML folder
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
