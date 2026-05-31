import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Upload, FileImage, X, HardDriveDownload } from 'lucide-react';
import { FileConverterSource, Theme } from '../../types';
import { useFileConverterTheme } from './fileConverterTheme';
import { detectCategoryFromPath } from '../../hooks/useFileConverter';
import { useToast } from '../Toast/ToastContext';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { prefetchCaseSelectionDialog } from '../../utils/fileConverterPrefetch';
import { FileConverterSourcePreview } from './FileConverterSourcePreview';

const CaseSelectionDialog = lazy(() =>
  import('../Archive/CaseSelectionDialog').then((module) => ({
    default: module.CaseSelectionDialog,
  }))
);

interface CaseFileEntry {
  name: string;
  path: string;
}

interface FileConverterSourcePanelProps {
  source: FileConverterSource | null;
  onSourceChange: (source: FileConverterSource | null) => void;
  theme: Theme;
  selectedCasePath?: string | null;
  onSelectedCasePathChange?: (casePath: string | null) => void;
}

const CONVERTIBLE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.tiff',
  '.tif',
  '.gif',
  '.pdf',
  '.mp4',
  '.mov',
  '.mkv',
  '.webm',
  '.avi',
]);

function isConvertibleFileName(name: string): boolean {
  const dot = name.lastIndexOf('.');
  if (dot < 0) {
    return false;
  }
  return CONVERTIBLE_EXTENSIONS.has(name.slice(dot).toLowerCase());
}

export function FileConverterSourcePanel({
  source,
  onSourceChange,
  theme,
  selectedCasePath: selectedCasePathProp,
  onSelectedCasePathChange,
}: FileConverterSourcePanelProps) {
  const t = useFileConverterTheme(theme);
  const toast = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [internalCasePath, setInternalCasePath] = useState<string | null>(null);
  const selectedCasePath = selectedCasePathProp ?? internalCasePath;
  const setSelectedCasePath = onSelectedCasePathChange ?? setInternalCasePath;
  const [caseFiles, setCaseFiles] = useState<CaseFileEntry[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const loadCaseFiles = useCallback(
    async (casePath: string) => {
      if (!window.electronAPI?.listCaseFiles) {
        return;
      }
      try {
        setLoadingFiles(true);
        const files = await window.electronAPI.listCaseFiles(casePath);
        setCaseFiles(
          files
            .filter((file) => !file.isFolder && isConvertibleFileName(file.name))
            .map((file) => ({ name: file.name, path: file.path }))
        );
      } catch (error) {
        toast.error(getUserFriendlyError(error, { operation: 'loading case files' }));
      } finally {
        setLoadingFiles(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (selectedCasePath) {
      void loadCaseFiles(selectedCasePath);
    } else {
      setCaseFiles([]);
    }
  }, [selectedCasePath, loadCaseFiles]);

  const handleExternalPaths = useCallback(
    (paths: string[]) => {
      const filePath = paths[0];
      if (!filePath) {
        return;
      }
      const category = detectCategoryFromPath(filePath);
      if (!category) {
        toast.error('Unsupported file type for conversion');
        return;
      }
      onSourceChange({
        origin: 'external',
        sourcePath: filePath,
        fileName: filePath.split(/[/\\]/).pop() ?? filePath,
        category,
        casePath: null,
      });
    },
    [onSourceChange, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      const paths = droppedFiles
        .map((file) => (file as File & { path?: string }).path)
        .filter((p): p is string => Boolean(p));

      if (paths.length > 0) {
        handleExternalPaths(paths);
      }
    },
    [handleExternalPaths]
  );

  const handleBrowse = useCallback(async () => {
    if (!window.electronAPI?.selectConverterFile) {
      toast.error('File selection is not available');
      return;
    }
    const filePath = await window.electronAPI.selectConverterFile();
    if (filePath) {
      handleExternalPaths([filePath]);
    }
  }, [handleExternalPaths, toast]);

  const vaultFileList = useMemo(() => caseFiles, [caseFiles]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            void prefetchCaseSelectionDialog();
            setShowCasePicker(true);
          }}
          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors ${t.secondaryButton}`}
        >
          <FolderOpen className="h-4 w-4" />
          Choose from case
        </button>
        <button
          type="button"
          onClick={() => void handleBrowse()}
          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors ${t.secondaryButton}`}
        >
          <HardDriveDownload className="h-4 w-4" />
          Browse files
        </button>
      </div>

      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        whileHover={{ scale: 1.005 }}
        className={`rounded-[24px] border-2 p-10 text-center transition-colors ${
          isDragging ? t.dropZoneActive : t.dropZone
        }`}
      >
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${t.button}`}>
          <Upload className="h-6 w-6 text-white" />
        </div>
        <p className={`text-base font-semibold ${t.heading}`}>Drag & drop evidence here</p>
        <p className={`mt-2 text-sm leading-6 ${t.mutedText}`}>
          Images, PDF, video — PNG, JPEG, WebP, TIFF, GIF, MP4, MOV, and more
        </p>
      </motion.div>

      {source && (
        <>
          <div className={`flex items-center gap-3 rounded-[22px] border px-4 py-3.5 ${t.compactInsetSurface}`}>
            <div className={`rounded-xl p-2.5 ${t.button}`}>
              <FileImage className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`truncate font-semibold ${t.heading}`}>{source.fileName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                    source.origin === 'vault' ? t.badgeVault : t.badgeNeutral
                  }`}
                >
                  {source.origin === 'vault' ? 'Vault file' : 'External'}
                </span>
                <span className={`text-xs uppercase tracking-[0.16em] ${t.muted}`}>{source.category}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSourceChange(null)}
              className={`rounded-xl border p-2 ${t.dialogCancel}`}
              aria-label="Clear source"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <FileConverterSourcePreview source={source} theme={theme} />
        </>
      )}

      {selectedCasePath && (
        <div className={`rounded-[24px] border p-5 ${t.softInsetSurface}`}>
          <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Case files</p>
          {loadingFiles ? (
            <p className={`mt-3 text-sm ${t.mutedText}`}>Loading files…</p>
          ) : vaultFileList.length === 0 ? (
            <p className={`mt-3 text-sm ${t.mutedText}`}>No convertible files in this case.</p>
          ) : (
            <ul className="mt-4 max-h-44 space-y-2 overflow-y-auto">
              {vaultFileList.map((file) => {
                const selected = source?.sourcePath === file.path;
                return (
                  <li key={file.path}>
                    <button
                      type="button"
                      onClick={() => {
                        const category = detectCategoryFromPath(file.path);
                        if (!category) {
                          return;
                        }
                        onSourceChange({
                          origin: 'vault',
                          casePath: selectedCasePath,
                          sourcePath: file.path,
                          fileName: file.name,
                          category,
                        });
                      }}
                      className={`w-full truncate rounded-[18px] border px-4 py-2.5 text-left text-sm transition-colors ${
                        selected ? t.highlightRow : t.promptIdle
                      }`}
                    >
                      {file.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {showCasePicker && (
        <Suspense fallback={null}>
          <CaseSelectionDialog
            isOpen={showCasePicker}
            onClose={() => setShowCasePicker(false)}
            onSelectCase={(casePath) => {
              setSelectedCasePath(casePath);
              setShowCasePicker(false);
            }}
            title="Select case"
            subtitle="Choose a case to browse convertible evidence"
            confirmLabel="Browse files"
            elevated
          />
        </Suspense>
      )}
    </div>
  );
}
