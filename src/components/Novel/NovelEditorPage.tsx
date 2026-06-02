import { useCallback, useEffect, useImperativeHandle, useMemo, useState, forwardRef } from 'react';
import { Theme, NovelDocument } from '../../types';
import { useNovelDocument } from '../../hooks/useNovelDocument';
import { useToast } from '../Toast/ToastContext';
import { useWordEditor } from '../../contexts/WordEditorContext';
import { ResizableDivider } from '../ResizableDivider';
import { CaseSelectionDialog } from '../Archive/CaseSelectionDialog';
import { getUserFriendlyError } from '../../utils/errorMessages';
import type { ModuleChromeProps } from '../../types/detachableModules';
import { ModuleChromeButtons } from '../Shared/ModuleChromeButtons';
import { isLightTheme } from '../../theme/themeSemantics';
import { useNovelTheme } from './novelTheme';
import { NovelEditorToolbar } from './NovelEditorToolbar';
import { NovelRichTextToolbar } from './NovelRichTextToolbar';
import { BookSpreadView, type BookSpreadFlipRequest, BOOK_FLIP_DURATION_MS } from './BookSpreadView';
import { NovelExportDialog } from './NovelExportDialog';
import { NovelVaultLibraryPanel } from './NovelVaultLibraryPanel';
import { getSpreadCount, getSpreads, planSpreadNavigation } from './engine/spreadNavigator';
import { getBookSizePreset } from './engine/bookSizes';
import { setCachedNovelLibrary } from '../../utils/novelPrefetch';
import { buildNovelAssetVaultPath, loadNovelAssetPreviewUrl } from './novelAssetUtils';

export interface NovelEditorDetachBridge {
  flushAndSnapshot: () => Promise<{
    editorDocument: NovelDocument | null;
    editorNovelPath: string;
    currentSpreadIndex: number;
  } | null>;
}

interface NovelEditorPageProps extends ModuleChromeProps {
  theme: Theme;
  novelFolderPath: string;
  initialDocument?: NovelDocument | null;
  initialSpreadIndex?: number;
  onBack: () => void;
  onRegisterDetachBridge?: (bridge: NovelEditorDetachBridge | null) => void;
}

export const NovelEditorPage = forwardRef<unknown, NovelEditorPageProps>(function NovelEditorPage(
  {
    theme,
    novelFolderPath,
    initialDocument,
    initialSpreadIndex = 0,
    onBack,
    hostMode,
    onPopOut,
    onReattach,
    popOutDisabled,
    isPastel: isPastelProp,
    onRegisterDetachBridge,
  },
  _ref
) {
  const t = useNovelTheme(theme);
  const isPastel = isPastelProp ?? isLightTheme(theme);
  const toast = useToast();
  const { isOpen: isWordEditorOpen, dividerPosition, setDividerPosition, isDividerDragging } = useWordEditor();
  const {
    document: novelDoc,
    loading,
    saving,
    dirty,
    updatePages,
    updateSettings,
    flushSave,
    persist,
  } = useNovelDocument(novelFolderPath, { initialDocument });
  const [spreadIndex, setSpreadIndex] = useState(initialSpreadIndex);
  const [flipRequest, setFlipRequest] = useState<BookSpreadFlipRequest | null>(null);
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [selectingCoverImage, setSelectingCoverImage] = useState(false);
  const [insertImageRequest, setInsertImageRequest] = useState<{ nonce: number } | null>(null);

  const spreadCount = useMemo(() => (novelDoc ? getSpreadCount(novelDoc.pages) : 1), [novelDoc]);
  const bookSizeLabel = useMemo(
    () => (novelDoc ? getBookSizePreset(novelDoc.settings.bookSizeId).name : ''),
    [novelDoc?.settings.bookSizeId]
  );

  const requestSpreadNavigation = useCallback(
    (direction: 'next' | 'prev') => {
      if (flipRequest || !novelDoc) return;

      const plan = planSpreadNavigation(novelDoc.pages, spreadIndex, direction);
      if (plan.didExtend) {
        updatePages(plan.pages);
      }

      if (plan.targetSpreadIndex === spreadIndex && !plan.didExtend) {
        return;
      }

      if (plan.didExtend && plan.targetSpreadIndex === spreadIndex) {
        return;
      }

      setFlipRequest({ direction, targetSpreadIndex: plan.targetSpreadIndex });
    },
    [flipRequest, novelDoc, spreadIndex, updatePages]
  );

  const handleFlipComplete = useCallback(() => {
    setFlipRequest((current) => {
      if (current) {
        setSpreadIndex(current.targetSpreadIndex);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (!flipRequest) return;
    const timeout = window.setTimeout(() => handleFlipComplete(), BOOK_FLIP_DURATION_MS + 150);
    return () => window.clearTimeout(timeout);
  }, [flipRequest, handleFlipComplete]);

  useImperativeHandle(_ref, () => null);

  useEffect(() => {
    if (!onRegisterDetachBridge) return;
    const bridge: NovelEditorDetachBridge = {
      flushAndSnapshot: async () => {
        const saved = await flushSave();
        if (!saved) return null;
        return {
          editorDocument: saved,
          editorNovelPath: saved.novelFolderPath,
          currentSpreadIndex: spreadIndex,
        };
      },
    };
    onRegisterDetachBridge(bridge);
    return () => onRegisterDetachBridge(null);
  }, [flushSave, onRegisterDetachBridge, spreadIndex]);

  useEffect(() => {
    if (!novelDoc?.settings.coverImageRelativePath) {
      setCoverImageUrl(null);
      return;
    }
    const vaultPath = buildNovelAssetVaultPath(novelDoc.novelFolderPath, novelDoc.settings.coverImageRelativePath);
    void loadNovelAssetPreviewUrl(vaultPath).then(setCoverImageUrl);
  }, [novelDoc?.novelFolderPath, novelDoc?.settings.coverImageRelativePath]);

  const navigateSpread = requestSpreadNavigation;

  const handleAssignCase = async (casePath: string) => {
    if (!novelDoc || !window.electronAPI?.moveNovelToCase) return;
    try {
      const saved = await flushSave();
      const target = saved ?? novelDoc;
      const updated = await window.electronAPI.moveNovelToCase(target.novelFolderPath, casePath);
      await persist(updated);
      setCachedNovelLibrary(null);
      toast.success('Novel assigned to case');
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'assigning novel to case' }));
    }
  };

  const handleMoveToLibrary = async () => {
    if (!novelDoc || !window.electronAPI?.moveNovelToLibrary) return;
    try {
      const saved = await flushSave();
      const target = saved ?? novelDoc;
      const updated = await window.electronAPI.moveNovelToLibrary(target.novelFolderPath);
      await persist(updated);
      setCachedNovelLibrary(null);
      toast.success('Novel moved to Vault Library');
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'moving novel to library' }));
    }
  };

  const handleSelectCoverImage = async () => {
    if (!novelDoc || selectingCoverImage) return;

    if (!window.electronAPI) {
      toast.error('Cover images can only be chosen in the desktop app.');
      return;
    }

    setSelectingCoverImage(true);
    let sourcePath: string | null = null;
    try {
      if (window.electronAPI.selectImageFile) {
        sourcePath = await window.electronAPI.selectImageFile();
      } else if (window.electronAPI.selectMapAttachments) {
        const paths = await window.electronAPI.selectMapAttachments();
        sourcePath = paths[0] ?? null;
      } else {
        toast.error('Cover image selection is unavailable in this window.');
        return;
      }
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'choosing cover image' }));
      return;
    } finally {
      setSelectingCoverImage(false);
    }

    if (!sourcePath) return;
    if (!window.electronAPI.copyNovelAssetToNovel) {
      toast.error('Saving cover images requires the desktop app.');
      return;
    }

    setSelectingCoverImage(true);
    try {
      const assetId = crypto.randomUUID();
      const copied = await window.electronAPI.copyNovelAssetToNovel(
        novelDoc.novelFolderPath,
        sourcePath,
        assetId
      );
      updateSettings({
        coverImageAssetId: assetId,
        coverImageRelativePath: copied.relativePath,
      });
      const preview = await loadNovelAssetPreviewUrl(copied.vaultPath);
      setCoverImageUrl(preview);
      toast.success('Cover image updated');
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'setting cover image' }));
    } finally {
      setSelectingCoverImage(false);
    }
  };

  const handleInsertPageImage = useCallback(() => {
    if (!novelDoc) return;
    const spread = getSpreads(novelDoc.pages)[spreadIndex];
    const hasContentPage =
      spread?.leftPage?.type === 'content' || spread?.rightPage?.type === 'content';
    if (!hasContentPage) {
      toast.error('Open a content page to insert an image.');
      return;
    }
    setInsertImageRequest({ nonce: Date.now() });
  }, [novelDoc, spreadIndex, toast]);

  const handleFormatCommand = (command: string, value?: string) => {
    window.document.execCommand(command, false, value);
  };

  const toggleWordEditor = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent(isWordEditorOpen ? 'close-word-editor-panel' : 'open-word-editor-panel')
    );
  }, [isWordEditorOpen]);

  if (loading || !novelDoc) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${t.body}`}>
        <p className={t.muted}>Loading book...</p>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen flex-col ${t.body}`}>
      <div className="flex items-center justify-between gap-3 px-4 pt-3">
        <button type="button" onClick={onBack} className={`rounded-xl px-4 py-2 text-sm ${t.badgeNeutral}`}>
          Back
        </button>
        <ModuleChromeButtons
          hostMode={hostMode}
          onPopOut={onPopOut}
          onReattach={onReattach}
          popOutDisabled={popOutDisabled}
          isPastel={isPastel}
        />
      </div>

      <NovelEditorToolbar
        theme={theme}
        title={novelDoc.title}
        saving={saving}
        dirty={dirty}
        isWordEditorOpen={isWordEditorOpen}
        bookSizeLabel={bookSizeLabel}
        onSave={() => void flushSave().then(() => toast.success('Saved'))}
        onAssignCase={() => setShowCaseDialog(true)}
        onMoveToLibrary={() => void handleMoveToLibrary()}
        onExport={() => setShowExportDialog(true)}
        onToggleWordEditor={toggleWordEditor}
        onPrevSpread={() => navigateSpread('prev')}
        onNextSpread={() => navigateSpread('next')}
        spreadLabel={`Spread ${spreadIndex + 1} of ${spreadCount}`}
        showCoverImageButton={spreadIndex === 0}
        selectingCoverImage={selectingCoverImage}
        onSelectCoverImage={() => void handleSelectCoverImage()}
      />

      <NovelRichTextToolbar
        theme={theme}
        className="px-0"
        fontFamily={novelDoc.settings.fontFamily}
        fontSize={novelDoc.settings.fontSize}
        showPageNumbers={novelDoc.settings.showPageNumbers}
        onFontFamilyChange={(fontFamily) => updateSettings({ fontFamily })}
        onFontSizeChange={(fontSize) => updateSettings({ fontSize })}
        onTogglePageNumbers={() =>
          updateSettings({ showPageNumbers: !novelDoc.settings.showPageNumbers })
        }
        onFormatCommand={handleFormatCommand}
        onInsertImage={handleInsertPageImage}
      />

      <div className={`flex flex-1 min-h-0 ${isWordEditorOpen ? 'flex' : ''}`}>
        <div
          className="flex min-h-0 flex-col"
          style={isWordEditorOpen ? { width: `${dividerPosition}%` } : { width: '100%' }}
        >
          <BookSpreadView
            theme={theme}
            document={novelDoc}
            spreadIndex={spreadIndex}
            flipRequest={flipRequest}
            coverImageUrl={coverImageUrl}
            onUpdatePages={updatePages}
            onUpdateSettings={updateSettings}
            onSelectCoverImage={() => void handleSelectCoverImage()}
            onSpreadAdvance={() => requestSpreadNavigation('next')}
            onFlipComplete={handleFlipComplete}
            onRequestSpreadIndex={(index) => setSpreadIndex(index)}
            onPageInserted={(side) =>
              toast.success(`Inserted blank page on the ${side}`)
            }
            selectingCoverImage={selectingCoverImage}
            insertImageRequest={insertImageRequest}
            onInsertImageRequestHandled={() => setInsertImageRequest(null)}
          />
          {novelDoc.casePath && <NovelVaultLibraryPanel linkedCasePath={novelDoc.casePath} theme={theme} />}
        </div>

        {isWordEditorOpen && (
          <>
            <ResizableDivider
              position={dividerPosition}
              onPositionChange={setDividerPosition}
              isDragging={isDividerDragging}
            />
            <div
              id="novel-word-editor-inline-container"
              className="min-h-0 flex-1 overflow-hidden"
              style={{ width: `${100 - dividerPosition}%` }}
            />
          </>
        )}
      </div>

      <CaseSelectionDialog
        isOpen={showCaseDialog}
        onClose={() => setShowCaseDialog(false)}
        onSelectCase={(casePath) => {
          setShowCaseDialog(false);
          void handleAssignCase(casePath);
        }}
      />

      <NovelExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        novelFolderPath={novelDoc.novelFolderPath}
        title={novelDoc.title}
      />
    </div>
  );
});
