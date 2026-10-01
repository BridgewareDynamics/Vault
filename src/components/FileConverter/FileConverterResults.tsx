import { lazy, Suspense, useState } from 'react';
import { Save, Replace, FolderPlus, CheckCircle2 } from 'lucide-react';
import {
  FileConverterResult,
  FileConverterSource,
  ReplaceVaultFileResult,
  Theme,
} from '../../types';
import { useFileConverterTheme } from './fileConverterTheme';
import { useToast } from '../Toast/ToastContext';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { prefetchCaseSelectionDialog } from '../../utils/fileConverterPrefetch';

const CaseSelectionDialog = lazy(() =>
  import('../Archive/CaseSelectionDialog').then((module) => ({
    default: module.CaseSelectionDialog,
  }))
);

interface FileConverterResultsProps {
  source: FileConverterSource;
  result: FileConverterResult;
  theme: Theme;
  onComplete: () => void;
  onExit?: () => void;
}

export function FileConverterResultsPanel({
  source,
  result,
  theme,
  onComplete,
  onExit,
}: FileConverterResultsProps) {
  const t = useFileConverterTheme(theme);
  const toast = useToast();
  const [showAssignCase, setShowAssignCase] = useState(false);
  const [replaceConfirm, setReplaceConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [replaceResult, setReplaceResult] = useState<ReplaceVaultFileResult | null>(null);

  const outputPath = result.outputPath;
  const outputCount = result.outputPaths?.length ?? (outputPath ? 1 : 0);

  const handleSaveToCase = async (casePath: string) => {
    if (!outputPath || !window.electronAPI?.saveConvertedFileToCase) {
      return;
    }
    setBusy(true);
    try {
      const saveResult = await window.electronAPI.saveConvertedFileToCase(casePath, outputPath);
      if (!saveResult.success) {
        throw new Error(saveResult.error ?? 'Save failed');
      }
      toast.success('Converted file saved to case');
      onComplete();
      onExit?.();
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'saving to case' }));
    } finally {
      setBusy(false);
      setShowAssignCase(false);
    }
  };

  const handleReplaceSource = async () => {
    if (!outputPath || !window.electronAPI?.replaceVaultFileWithConversion) {
      return;
    }
    setBusy(true);
    try {
      const replaceRes = await window.electronAPI.replaceVaultFileWithConversion({
        casePath: source.casePath ?? null,
        originalPath: source.sourcePath,
        convertedPath: outputPath,
      });
      if (!replaceRes.success) {
        throw new Error(replaceRes.error ?? 'Replace failed');
      }
      setReplaceResult(replaceRes);
      toast.success('Source file replaced and vault references updated');
      onComplete();
      onExit?.();
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'replacing source file' }));
    } finally {
      setBusy(false);
      setReplaceConfirm(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${t.button}`}>
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className={`text-xs uppercase tracking-[0.22em] ${t.sectionLabel}`}>Complete</p>
          <p className={`text-lg font-semibold ${t.heading}`}>Conversion finished</p>
          <p className={`mt-1 text-sm ${t.mutedText}`}>
            {outputCount > 1
              ? `${outputCount} output files created`
              : outputPath
                ? `Output: ${outputPath.split(/[/\\]/).pop()}`
                : 'Output ready'}
          </p>
        </div>
      </div>

      {replaceResult?.updatedMaps && replaceResult.updatedMaps.length > 0 && (
        <div className={`rounded-[20px] border p-4 ${t.callout}`}>
          <p className={`text-sm ${t.body}`}>
            Updated {replaceResult.updatedMaps.length} map(s) with the new file reference.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {source.origin === 'vault' && outputPath && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setReplaceConfirm(true)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold ${t.button}`}
          >
            <Replace className="h-4 w-4" />
            Replace source in vault
          </button>
        )}

        {source.origin === 'external' && outputPath && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void prefetchCaseSelectionDialog();
              setShowAssignCase(true);
            }}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold ${t.button}`}
          >
            <FolderPlus className="h-4 w-4" />
            Assign to case
          </button>
        )}

        {source.origin === 'vault' && source.casePath && outputPath && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSaveToCase(source.casePath!)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium ${t.dialogSecondaryAction}`}
          >
            <Save className="h-4 w-4" />
            Save as new file
          </button>
        )}
      </div>

      {replaceConfirm && (
        <div className={`rounded-[22px] border p-5 ${t.dialogInset}`}>
          <p className={`text-sm leading-6 ${t.body}`}>
            This will replace the original file in the vault and update linked maps and transcriptions. A backup
            copy will be kept in <code className="rounded bg-black/10 px-1.5 py-0.5">.vault-backup</code>.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleReplaceSource()}
              className={`rounded-2xl px-4 py-2.5 text-sm font-semibold ${t.button}`}
            >
              Confirm replace
            </button>
            <button
              type="button"
              onClick={() => setReplaceConfirm(false)}
              className={`rounded-2xl border px-4 py-2.5 text-sm font-medium ${t.dialogCancel}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showAssignCase && (
        <Suspense fallback={null}>
          <CaseSelectionDialog
            isOpen={showAssignCase}
            onClose={() => setShowAssignCase(false)}
            onSelectCase={(casePath) => void handleSaveToCase(casePath)}
            title="Assign to case"
            subtitle="Save the converted file into a vault case"
            confirmLabel="Save to case"
            elevated
          />
        </Suspense>
      )}
    </div>
  );
}
