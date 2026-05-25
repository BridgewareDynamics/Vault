import { useCallback, useEffect, useRef, useState } from 'react';
import { Home, Save, Download, FolderOpen, ArrowLeft } from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { MapBlock, MapBranchSide, MapCanvasSide, Theme } from '../../types';
import { useMapDocument } from '../../hooks/useMapDocument';
import { relayoutDocument } from '../../utils/mapLayout';
import { useToast } from '../Toast/ToastContext';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { CaseSelectionDialog } from '../Archive/CaseSelectionDialog';
import { useMapTheme } from './mapTheme';
import { MapCanvas } from './MapCanvas';
import { CreateBlockDialog } from './CreateBlockDialog';
import { BlockExpandModal } from './BlockExpandModal';
import { MapExportDialog } from './MapExportDialog';
import { DeleteBlockDialog } from './DeleteBlockDialog';

interface MapEditorPageProps {
  theme: Theme;
  mapFolderPath: string;
  autoEditTitleKey?: number | null;
  onBack: () => void;
  onHome: () => void;
}

interface BranchDraft {
  parentBlockId: string;
  parentTitle?: string;
  side: MapBranchSide;
  sourceSide: MapCanvasSide;
}

export function MapEditorPage({
  theme,
  mapFolderPath,
  autoEditTitleKey,
  onBack,
  onHome,
}: MapEditorPageProps) {
  const t = useMapTheme(theme);
  const toast = useToast();
  const flowRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { document, loading, saving, dirty, updateDocument, saveNow, relayout } =
    useMapDocument(mapFolderPath);

  const [showCreateBlock, setShowCreateBlock] = useState(false);
  const [expandBlockId, setExpandBlockId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [branchDraft, setBranchDraft] = useState<BranchDraft | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const linkedCaseName =
    document?.casePath?.split(/[\\/]/).filter(Boolean).pop() ?? null;

  const expandBlock = document?.blocks.find((b) => b.id === expandBlockId) ?? null;
  const editingBlock = document?.blocks.find((b) => b.id === editingBlockId) ?? null;
  const deletingBlock = document?.blocks.find((b) => b.id === deletingBlockId) ?? null;
  const editingBranchContext =
    editingBlock?.kind === 'branch'
      ? {
          parentBlockId: editingBlock.branchParentBlockId ?? '',
          parentTitle: document?.blocks.find((block) => block.id === editingBlock.branchParentBlockId)?.title,
          side: editingBlock.branchSide ?? 'right',
          sourceSide: editingBlock.branchSourceSide ?? editingBlock.branchSide ?? 'right',
        }
      : null;
  const activeBranchContext = editingBranchContext ?? branchDraft;

  useEffect(() => {
    if (document?.title) {
      setTitleDraft(document.title);
    }
  }, [document?.title]);

  useEffect(() => {
    if (!document || !autoEditTitleKey) return;
    const frame = requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, [autoEditTitleKey, document]);

  const commitTitle = useCallback(() => {
    if (!document) return;
    const nextTitle = titleDraft.trim() || 'Untitled Map';
    setTitleDraft(nextTitle);
    if (nextTitle === document.title) return;
    updateDocument((prev) => ({ ...prev, title: nextTitle }));
  }, [document, titleDraft, updateDocument]);

  const handleAddBlock = useCallback(
    (block: MapBlock) => {
      if (!document) return;
      updateDocument((prev) => {
        const branchOrder =
          block.kind === 'branch'
            ? prev.blocks.filter(
                (candidate) =>
                  candidate.kind === 'branch' &&
                  candidate.branchParentBlockId === block.branchParentBlockId &&
                  candidate.branchSide === block.branchSide
              ).length
            : undefined;

        return relayoutDocument(
          {
            ...prev,
            blocks: [
              ...prev.blocks,
              block.kind === 'branch' ? { ...block, branchOrder } : block,
            ],
          },
          false
        );
      });
      setBranchDraft(null);
      toast.success(block.kind === 'branch' ? 'Branch card added' : 'Block added to timeline');
    },
    [document, updateDocument, toast]
  );

  const handleToggleEdgeStyle = useCallback(() => {
    if (!document) return;
    const next: 'solid' | 'dotted' = document.defaultEdgeStyle === 'solid' ? 'dotted' : 'solid';
    updateDocument((prev) => {
      const updated = { ...prev, defaultEdgeStyle: next };
      return relayoutDocument(updated, false);
    });
  }, [document, updateDocument]);

  const handleExportPng = async () => {
    if (!document || !flowRef.current) return;
    setExporting(true);
    try {
      const el = flowRef.current.querySelector('.react-flow__viewport') as HTMLElement;
      const target = el ?? flowRef.current;
      const pngBase64 = await toPng(target, {
        pixelRatio: 2,
        backgroundColor: t.isPastel ? '#f8fafc' : '#0a0a0f',
      });
      if (window.electronAPI?.exportMapPng) {
        const result = await window.electronAPI.exportMapPng({
          mapFolderPath: document.mapFolderPath,
          pngBase64,
        });
        toast.success(`PNG saved to ${result.filePath}`);
      }
      setShowExport(false);
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'exporting PNG' }));
    } finally {
      setExporting(false);
    }
  };

  const handleExportJson = async () => {
    if (!document || !window.electronAPI?.showSaveDialog) return;
    setExporting(true);
    try {
      const result = await window.electronAPI.showSaveDialog({
        title: 'Export Map JSON',
        defaultPath: `${document.title}.vault-map.json`,
        filters: [{ name: 'Vault Map', extensions: ['json'] }],
      });
      if (!result.canceled && result.filePath) {
        const blob = JSON.stringify(document, null, 2);
        await window.electronAPI.saveTextFile(result.filePath, blob);
        toast.success('Map exported as JSON');
      }
      setShowExport(false);
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'exporting JSON' }));
    } finally {
      setExporting(false);
    }
  };

  const handleExportFolder = async () => {
    if (!document || !window.electronAPI?.selectSaveDirectory) return;
    setExporting(true);
    try {
      await saveNow();
      const dir = await window.electronAPI.selectSaveDirectory();
      if (dir && window.electronAPI.exportMapToDirectory) {
        const result = await window.electronAPI.exportMapToDirectory(
          document.mapFolderPath,
          dir
        );
        toast.success(`Exported to ${result.exportPath}`);
      }
      setShowExport(false);
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'exporting map' }));
    } finally {
      setExporting(false);
    }
  };

  const handleAssignCase = async (casePath: string) => {
    if (!document) return;
    try {
      const updatedDocument = { ...document, casePath };
      updateDocument(() => updatedDocument, { skipAutosave: true });
      await saveNow(updatedDocument);
      setShowCaseDialog(false);
      toast.success('Map linked to case');
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'linking map to case' }));
    }
  };

  const handleMoveToLibrary = async () => {
    if (!document?.casePath) return;
    if (!confirm('Move this map back to the Vault library and unlink it from the current case?')) {
      return;
    }

    try {
      const updatedDocument = { ...document, casePath: null };
      updateDocument(() => updatedDocument, { skipAutosave: true });
      await saveNow(updatedDocument);
      toast.success('Map moved to Vault library');
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'moving map to Vault library' }));
    }
  };

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      if (!document) return;
      const blockToDelete = document.blocks.find((block) => block.id === blockId);
      if (!blockToDelete) return;
      setDeletingBlockId(blockId);
    },
    [document]
  );

  const collectBranchSubtreeIds = useCallback((rootBlockId: string, blocks: MapBlock[]): Set<string> => {
    const ids = new Set<string>([rootBlockId]);
    const queue = [rootBlockId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;
      blocks.forEach((block) => {
        if (block.kind === 'branch' && block.branchParentBlockId === currentId && !ids.has(block.id)) {
          ids.add(block.id);
          queue.push(block.id);
        }
      });
    }

    return ids;
  }, []);

  const handleConfirmDeleteBlock = useCallback(() => {
    if (!document || !deletingBlockId) return;
    const idsToDelete = collectBranchSubtreeIds(deletingBlockId, document.blocks);

    if (expandBlockId === deletingBlockId) {
      setExpandBlockId(null);
    }
    if (editingBlockId === deletingBlockId) {
      setEditingBlockId(null);
    }

    updateDocument((prev) => {
      const blocks = prev.blocks.filter((block) => !idsToDelete.has(block.id));
      return relayoutDocument({ ...prev, blocks }, false);
    });
    setDeletingBlockId(null);
    toast.success(idsToDelete.size > 1 ? 'Block and branch notes deleted' : 'Block deleted');
    },
    [collectBranchSubtreeIds, deletingBlockId, document, editingBlockId, expandBlockId, toast, updateDocument]
  );

  const handleEditBlock = useCallback(
    (blockId: string) => {
      if (expandBlockId === blockId) {
        setExpandBlockId(null);
      }
      setBranchDraft(null);
      setEditingBlockId(blockId);
    },
    [expandBlockId]
  );

  const handleSaveEditedBlock = useCallback(
    (updatedBlock: MapBlock) => {
      if (!document) return;

      updateDocument((prev) => {
        const existingBlock = prev.blocks.find((block) => block.id === updatedBlock.id);
        if (!existingBlock) {
          return prev;
        }

        const chronologyChanged =
          existingBlock.kind !== 'branch' &&
          updatedBlock.kind !== 'branch' &&
          existingBlock.chronology?.sortKey !== updatedBlock.chronology?.sortKey;

        const nextBlock =
          chronologyChanged && updatedBlock.kind !== 'branch'
            ? {
                ...updatedBlock,
                size: existingBlock.size,
                positionLocked: false,
              }
            : updatedBlock.kind === 'branch'
              ? {
                  ...updatedBlock,
                  size: existingBlock.size,
                  positionLocked: false,
                }
              : {
                  ...updatedBlock,
                  position: existingBlock.position,
                  size: existingBlock.size,
                  positionLocked: existingBlock.positionLocked,
                };

        const blocks = prev.blocks.map((block) =>
          block.id === updatedBlock.id ? nextBlock : block
        );
        return relayoutDocument({ ...prev, blocks }, false);
      });

      setEditingBlockId(null);
      setBranchDraft(null);
      toast.success('Block updated');
    },
    [document, toast, updateDocument]
  );

  const handleCreateBranch = useCallback(
    (parentBlockId: string, side: MapBranchSide, sourceSide: MapCanvasSide) => {
      if (!document) return;
      const parentBlock = document.blocks.find((block) => block.id === parentBlockId);
      if (!parentBlock) return;
      setEditingBlockId(null);
      if (expandBlockId === parentBlockId) {
        setExpandBlockId(null);
      }
      setBranchDraft({
        parentBlockId,
        parentTitle: parentBlock.title,
        side,
        sourceSide,
      });
      setShowCreateBlock(true);
    },
    [document, expandBlockId]
  );

  if (loading || !document) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${t.bg}`}>
        <p className={t.muted}>Loading map...</p>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${t.bg}`}>
      <header className="flex items-center gap-3 p-4 border-b border-white/10 shrink-0 flex-wrap">
        <button type="button" onClick={onBack} className={`p-2 rounded-lg border ${t.card}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button type="button" onClick={onHome} className={`p-2 rounded-lg border ${t.card}`} aria-label="Home">
          <Home className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-[220px] max-w-[520px]">
          <input
            ref={titleInputRef}
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
              if (e.key === 'Escape') {
                setTitleDraft(document.title);
                e.currentTarget.blur();
              }
            }}
            placeholder="Untitled Map"
            className={`w-full px-3 py-2 rounded-xl border text-lg font-bold outline-none ${
              t.isPastel
                ? 'bg-white/85 border-pink-200/50 text-gray-800 focus:border-purple-300'
                : 'bg-gray-900/90 border-cyber-purple-500/40 text-white focus:border-cyber-cyan-400'
            }`}
            aria-label="Map title"
          />
        </div>
        {dirty && <span className={`text-xs ${t.muted}`}>Unsaved</span>}
        <button
          type="button"
          onClick={() => setShowCaseDialog(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${t.card}`}
          title={linkedCaseName ? `Linked to ${linkedCaseName}` : 'Assign this map to a case'}
        >
          <FolderOpen className="w-4 h-4" />
          {document.casePath ? `Change case${linkedCaseName ? `: ${linkedCaseName}` : ''}` : 'Assign case'}
        </button>
        {document.casePath && (
          <button
            type="button"
            onClick={handleMoveToLibrary}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${t.card}`}
            title="Move this map back to the Vault library"
          >
            <Home className="w-4 h-4" />
            Move to Vault Library
          </button>
        )}
        <button
          type="button"
          onClick={() => saveNow()}
          disabled={saving}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${t.card}`}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setShowExport(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${t.button}`}
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </header>

      <div className="flex-1 min-h-0">
        <div ref={flowRef} className="w-full h-full">
          <ReactFlowProvider>
            <MapCanvas
              document={document}
              theme={theme}
              edgeStyle={document.defaultEdgeStyle}
              onBlocksChange={(blocks) => {
                updateDocument((prev) => relayoutDocument({ ...prev, blocks }, false));
              }}
              onViewportChange={(viewport) => {
                updateDocument((prev) => ({ ...prev, viewport }), { skipAutosave: false });
              }}
              onExpandBlock={setExpandBlockId}
              onPreviewBlock={setExpandBlockId}
              onDeleteBlock={handleDeleteBlock}
              onEditBlock={handleEditBlock}
              onCreateBranch={handleCreateBranch}
              onNewBlock={() => {
                setBranchDraft(null);
                setShowCreateBlock(true);
              }}
              onToggleEdgeStyle={handleToggleEdgeStyle}
              onRelayout={() => relayout(true)}
            />
          </ReactFlowProvider>
        </div>
      </div>

      <CreateBlockDialog
        isOpen={showCreateBlock || !!editingBlock}
        onClose={() => {
          setShowCreateBlock(false);
          setEditingBlockId(null);
          setBranchDraft(null);
        }}
        theme={theme}
        mapFolderPath={document.mapFolderPath}
        onSubmit={editingBlock ? handleSaveEditedBlock : handleAddBlock}
        blockToEdit={editingBlock}
        branchContext={activeBranchContext}
      />

      <BlockExpandModal
        isOpen={!!expandBlockId}
        block={expandBlock}
        theme={theme}
        onClose={() => setExpandBlockId(null)}
        onNotesChange={(blockId, notesHtml) => {
          updateDocument((prev) => ({
            ...prev,
            blocks: prev.blocks.map((b) =>
              b.id === blockId ? { ...b, notesHtml } : b
            ),
          }));
        }}
      />

      <MapExportDialog
        isOpen={showExport}
        theme={theme}
        onClose={() => setShowExport(false)}
        onExportPng={handleExportPng}
        onExportJson={handleExportJson}
        onExportFolder={handleExportFolder}
        exporting={exporting}
      />

      <CaseSelectionDialog
        isOpen={showCaseDialog}
        onClose={() => setShowCaseDialog(false)}
        onSelectCase={handleAssignCase}
      />

      <DeleteBlockDialog
        isOpen={!!deletingBlockId}
        theme={theme}
        blockTitle={deletingBlock?.title}
        onClose={() => setDeletingBlockId(null)}
        onConfirm={handleConfirmDeleteBlock}
      />
    </div>
  );
}
