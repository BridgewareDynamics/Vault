import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ExternalLink } from 'lucide-react';
import { MapBlock, ArchiveFile, Theme } from '../../types';
import { LexicalEditor, LexicalEditorHandle } from '../WordEditor/LexicalEditor';
import { ArchiveFileViewer } from '../Archive/ArchiveFileViewer';
import { formatChronologyLabel } from '../../utils/mapChronology';
import { useMapTheme } from './mapTheme';

interface BlockExpandModalProps {
  isOpen: boolean;
  block: MapBlock | null;
  theme: Theme;
  onClose: () => void;
  onNotesChange: (blockId: string, notesHtml: string) => void;
}

export function BlockExpandModal({
  isOpen,
  block,
  theme,
  onClose,
  onNotesChange,
}: BlockExpandModalProps) {
  const t = useMapTheme(theme);
  const editorRef = useRef<LexicalEditorHandle>(null);
  const [viewerFile, setViewerFile] = useState<ArchiveFile | null>(null);

  const openAttachment = useCallback((vaultPath: string, fileName: string, type: ArchiveFile['type']) => {
    const file: ArchiveFile = {
      name: fileName,
      path: vaultPath,
      size: 0,
      modified: Date.now(),
      type,
    };
    setViewerFile(file);
  }, []);

  if (!isOpen || !block) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className={`rounded-2xl border-2 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ${t.card}`}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold">{block.title || (block.kind === 'branch' ? 'Branch Note' : 'Block')}</h2>
              <p className={`text-sm ${t.primary}`}>
                {block.kind === 'branch'
                  ? `${block.branchSide === 'left' ? 'Left' : 'Right'} branch note`
                  : formatChronologyLabel(block.chronology!)}
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Attachments</h3>
              {block.attachments.length === 0 ? (
                <p className={t.muted}>No attachments</p>
              ) : (
                <ul className="space-y-2">
                  {block.attachments.map((att) => (
                    <li key={att.id}>
                      <button
                        type="button"
                        onClick={() => openAttachment(att.vaultPath, att.fileName, att.type)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left ${t.card} ${t.cardHover}`}
                      >
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1">{att.fileName}</span>
                        <ExternalLink className="w-4 h-4 shrink-0 opacity-60" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Notes</h3>
              <div
                className={`min-h-[200px] rounded-lg border p-2 ${
                  t.isPastel ? 'bg-white border-pink-200/40' : 'bg-gray-950 border-cyber-purple-500/40'
                }`}
              >
                <LexicalEditor
                  ref={editorRef}
                  initialContent={block.notesHtml}
                  onContentChange={(html) => onNotesChange(block.id, html)}
                  placeholder="Add research notes..."
                  className="min-h-[180px] text-sm"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {viewerFile && (
          <ArchiveFileViewer
            file={viewerFile}
            files={[viewerFile]}
            onClose={() => setViewerFile(null)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
