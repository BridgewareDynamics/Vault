import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, FolderOpen, FolderPlus, Search, X, Zap } from 'lucide-react';
import { ArchiveCase, Theme } from '../../types';
import { useSettingsContext } from '../../utils/settingsContext';
import { useCategoryTags } from '../../hooks/useCategoryTags';
import { useToast } from '../Toast/ToastContext';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { logger } from '../../utils/logger';
import { CaseNameDialog } from './CaseNameDialog';

export interface CaseSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCase: (casePath: string) => void;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  emptyStateHint?: string;
  allowCreateCase?: boolean;
  /** Render above dialogs such as new transcription (z-[80]). */
  elevated?: boolean;
  /** Side panel beside a parent dialog (no full-screen overlay). */
  layout?: 'overlay' | 'companion';
  /** Companion width — use `wide` when the parent studio needs readable case lists. */
  companionSize?: 'compact' | 'wide';
}

export function CaseSelectionDialog({
  isOpen,
  onClose,
  onSelectCase,
  title = 'Select Case',
  subtitle = 'Choose a case folder',
  confirmLabel = 'Confirm',
  emptyStateHint = 'Create a case in the archive or start one below',
  allowCreateCase = true,
  elevated = false,
  layout = 'overlay',
  companionSize = 'compact',
}: CaseSelectionDialogProps) {
  const { settings } = useSettingsContext();
  const isPastel = (settings?.theme as Theme) === 'pastel';
  const toast = useToast();
  const { getTagById } = useCategoryTags();
  const [cases, setCases] = useState<ArchiveCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCasePath, setSelectedCasePath] = useState<string | null>(null);
  const [showCaseNameDialog, setShowCaseNameDialog] = useState(false);
  const [creatingCase, setCreatingCase] = useState(false);

  const loadCases = useCallback(async () => {
    if (!window.electronAPI) {
      return;
    }

    try {
      setLoading(true);
      const casesList = await window.electronAPI.listArchiveCases();
      setCases(casesList);
    } catch (error) {
      logger.error('Failed to load cases:', error);
      toast.error(getUserFriendlyError(error, { operation: 'loading cases' }));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      void loadCases();
      setSearchQuery('');
      setSelectedCasePath(null);
      setShowCaseNameDialog(false);
    }
  }, [isOpen, loadCases]);

  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) {
      return cases;
    }

    const query = searchQuery.toLowerCase();
    return cases.filter((caseItem) => {
      if (caseItem.name.toLowerCase().includes(query)) {
        return true;
      }
      if (caseItem.description?.toLowerCase().includes(query)) {
        return true;
      }
      if (caseItem.categoryTagId) {
        const tag = getTagById(caseItem.categoryTagId);
        if (tag?.name.toLowerCase().includes(query)) {
          return true;
        }
      }
      return false;
    });
  }, [cases, getTagById, searchQuery]);

  const handleConfirm = () => {
    if (!selectedCasePath) {
      return;
    }
    onSelectCase(selectedCasePath);
    onClose();
  };

  const handleCreateCase = async (
    caseName: string,
    description: string,
    categoryTagId?: string
  ) => {
    if (!window.electronAPI?.createCaseFolder) {
      toast.error('Electron API not available');
      return;
    }

    setCreatingCase(true);
    try {
      const casePath = await window.electronAPI.createCaseFolder(
        caseName,
        description,
        categoryTagId
      );
      toast.success(`Case "${caseName}" created`);
      setShowCaseNameDialog(false);
      await loadCases();
      setSelectedCasePath(casePath);
      setSearchQuery('');
    } catch (error) {
      toast.error(getUserFriendlyError(error, { operation: 'create case', fileName: caseName }));
    } finally {
      setCreatingCase(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const shellClassName = isPastel
    ? 'bg-gradient-to-br from-slate-50 via-white to-pink-50/40 border-pink-200/40'
    : 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border-cyber-purple-400/40';
  const headerBorderClassName = isPastel ? 'border-pink-200/40' : 'border-cyber-purple-400/30';
  const searchInputClassName = isPastel
    ? 'bg-white/90 border-pink-200/60 text-gray-800 placeholder-gray-500 focus:border-pink-400/70 focus:ring-pink-400/20'
    : 'bg-gray-800/80 border-gray-700/50 text-white placeholder-gray-500 focus:border-cyber-purple-500/60 focus:ring-cyber-purple-500/20';
  const caseButtonClassName = (selected: boolean) => {
    if (isPastel) {
      return selected
        ? 'border-pink-400/70 bg-pink-100/80 shadow-md shadow-pink-200/40'
        : 'border-pink-200/50 bg-white/80 hover:border-pink-300/60 hover:bg-pink-50/80';
    }
    return selected
      ? 'border-cyber-purple-500/60 bg-cyber-purple-500/20 shadow-lg shadow-cyber-purple-500/30'
      : 'border-gray-700/50 bg-gray-800/60 hover:border-cyber-purple-500/40 hover:bg-gray-800/80';
  };

  const isWideCompanion = layout === 'companion' && companionSize === 'wide';
  const panelMaxWidth =
    layout === 'companion'
      ? isWideCompanion
        ? 'w-full min-w-[min(100%,20rem)] max-w-2xl shrink-0 xl:min-w-[28rem] xl:max-w-[36rem] 2xl:max-w-[40rem]'
        : 'max-w-md xl:w-[26rem]'
      : 'max-w-3xl';
  const panelMaxHeight =
    layout === 'companion' && isWideCompanion ? 'max-h-[min(90vh,860px)]' : 'max-h-[85vh]';
  const panelMotion =
    layout === 'companion'
      ? {
          initial: { opacity: 0, x: 24, scale: 0.98 },
          animate: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0, x: 20, scale: 0.98 },
        }
      : {
          initial: { scale: 0.95, opacity: 0, y: 20 },
          animate: { scale: 1, opacity: 1, y: 0 },
          exit: { scale: 0.95, opacity: 0, y: 20 },
        };

  const casePanel = (
    <motion.div
      key="case-selection-panel"
      {...panelMotion}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      onClick={(event) => event.stopPropagation()}
      className={`flex ${panelMaxHeight} w-full ${panelMaxWidth} flex-col overflow-hidden rounded-2xl border-2 shadow-2xl backdrop-blur-xl ${shellClassName}`}
      style={
        isPastel
          ? {
              boxShadow:
                '0 20px 60px rgba(251, 182, 206, 0.2), 0 0 0 1px rgba(251, 182, 206, 0.1)',
            }
          : undefined
      }
    >
      <div
        className={`border-b p-6 backdrop-blur-xl ${
                isPastel
                  ? 'bg-gradient-to-r from-white/95 via-pink-50/30 to-white/95'
                  : 'bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95'
              } ${headerBorderClassName}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {!isPastel ? (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 opacity-50 blur-xl" />
                    ) : null}
                    <div
                      className={`relative rounded-2xl p-3 shadow-2xl ${
                        isPastel
                          ? 'border border-pink-200/40 bg-gradient-to-br from-pink-100 to-purple-100'
                          : 'bg-gradient-to-br from-purple-600 to-cyan-600'
                      }`}
                    >
                      <FolderOpen
                        className={`h-8 w-8 ${isPastel ? 'text-pink-600' : 'text-white'}`}
                      />
                    </div>
                  </div>
                  <div>
                    <h2
                      id="case-selection-dialog-title"
                      className={`text-2xl font-bold bg-clip-text text-transparent ${
                        isPastel
                          ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500'
                          : 'bg-gradient-to-r from-cyber-purple-400 via-cyber-cyan-400 to-cyber-purple-400'
                      }`}
                    >
                      {title}
                    </h2>
                    <p className={`mt-0.5 text-sm ${isPastel ? 'text-gray-600' : 'text-gray-400'}`}>
                      {subtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={`rounded-lg p-2 transition-colors ${
                    isPastel
                      ? 'text-gray-600 hover:bg-pink-100'
                      : 'text-gray-400 hover:bg-gray-800/80 hover:text-white'
                  }`}
                  aria-label="Close dialog"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div
              className={`border-b p-6 ${
                isPastel ? 'border-pink-200/30 bg-pink-50/20' : 'border-cyber-purple-400/20 bg-gray-900/50'
              }`}
            >
              <div className="relative">
                <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2">
                  <Search
                    className={isPastel ? 'text-pink-500' : 'text-cyber-cyan-400'}
                    size={18}
                  />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search cases by name, description, or tag..."
                  className={`w-full rounded-xl border-2 py-3 pl-12 pr-4 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 ${searchInputClassName}`}
                  autoFocus
                  aria-label="Search cases"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="space-y-4 text-center">
                    <div
                      className={`inline-flex rounded-2xl border-2 p-6 ${
                        isPastel
                          ? 'border-pink-300/40 bg-gradient-to-br from-pink-100/60 to-purple-100/60'
                          : 'border-cyber-cyan-400/30 bg-gradient-to-br from-cyan-900/40 to-purple-900/40'
                      }`}
                    >
                      <div
                        className={`h-12 w-12 animate-spin rounded-full border-b-2 ${
                          isPastel ? 'border-pink-400' : 'border-cyber-cyan-400'
                        }`}
                      />
                    </div>
                    <p className={isPastel ? 'text-gray-700' : 'text-gray-300'}>Loading cases...</p>
                  </div>
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div
                    className={`mb-6 inline-flex rounded-2xl border p-8 ${
                      isPastel
                        ? 'border-pink-200/40 bg-white/70'
                        : 'border-cyber-purple-400/20 bg-gray-800/50'
                    }`}
                  >
                    <FolderOpen
                      className={`h-20 w-20 ${
                        isPastel ? 'text-pink-300' : 'text-cyber-purple-400/50'
                      }`}
                    />
                  </div>
                  <h3 className={`mb-2 text-xl font-bold ${isPastel ? 'text-gray-700' : 'text-gray-300'}`}>
                    {searchQuery ? 'No cases found' : 'No cases available'}
                  </h3>
                  <p className={`max-w-md text-base ${isPastel ? 'text-gray-600' : 'text-gray-400'}`}>
                    {searchQuery ? 'Try a different search term' : emptyStateHint}
                  </p>
                  {allowCreateCase && !searchQuery ? (
                    <motion.button
                      type="button"
                      onClick={() => setShowCaseNameDialog(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white ${
                        isPastel
                          ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400'
                          : 'bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600'
                      }`}
                    >
                      <FolderPlus className="h-4 w-4" />
                      Create New Case
                    </motion.button>
                  ) : null}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <AnimatePresence>
                    {filteredCases.map((caseItem, index) => {
                      const selected = selectedCasePath === caseItem.path;
                      return (
                        <motion.button
                          key={caseItem.path}
                          type="button"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          onClick={() => setSelectedCasePath(caseItem.path)}
                          whileHover={{ scale: 1.01, y: -1 }}
                          whileTap={{ scale: 0.99 }}
                          className={`group relative w-full overflow-hidden rounded-2xl border-2 text-left transition-all ${caseButtonClassName(selected)}`}
                          aria-label={`Select case ${caseItem.name}`}
                          aria-pressed={selected}
                        >
                          <div className="relative flex items-center gap-4 p-5">
                            <div className="relative flex-shrink-0">
                              <motion.div
                                initial={false}
                                animate={{
                                  scale: selected ? 1 : 0.9,
                                  opacity: selected ? 1 : 0.6,
                                }}
                                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                                  selected
                                    ? isPastel
                                      ? 'border-pink-500 bg-gradient-to-br from-pink-400 to-purple-400'
                                      : 'border-cyber-purple-500 bg-gradient-to-br from-purple-600 to-cyan-600'
                                    : isPastel
                                      ? 'border-pink-200 bg-white'
                                      : 'border-gray-500 bg-gray-700/50'
                                }`}
                              >
                                {selected ? <Check className="h-4 w-4 text-white" /> : null}
                              </motion.div>
                            </div>

                            <div
                              className={`relative flex-shrink-0 rounded-xl p-3 ${
                                isPastel
                                  ? 'bg-gradient-to-br from-pink-100/80 to-purple-100/80'
                                  : 'bg-gradient-to-br from-purple-600/20 to-cyan-600/20'
                              }`}
                            >
                              <FolderOpen
                                className={`h-6 w-6 ${
                                  isPastel ? 'text-pink-500' : 'text-cyber-purple-400'
                                }`}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-base font-semibold leading-snug ${
                                  isWideCompanion ? 'break-words' : 'truncate'
                                } ${
                                  selected
                                    ? isPastel
                                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500'
                                      : 'text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple-400 to-cyber-cyan-400'
                                    : isPastel
                                      ? 'text-gray-800'
                                      : 'text-white'
                                }`}
                              >
                                {caseItem.name}
                              </div>
                              {caseItem.description ? (
                                <div
                                  className={`mt-1 text-sm leading-relaxed ${
                                    isWideCompanion ? 'line-clamp-4' : 'line-clamp-2'
                                  } ${isPastel ? 'text-gray-600' : 'text-gray-400'}`}
                                >
                                  {caseItem.description}
                                </div>
                              ) : null}
                            </div>

                            {selected ? (
                              <div className="flex-shrink-0">
                                <div
                                  className={`rounded-full p-2 ${
                                    isPastel
                                      ? 'bg-gradient-to-br from-pink-400 to-purple-400'
                                      : 'bg-gradient-to-br from-purple-600 to-cyan-600'
                                  }`}
                                >
                                  <Zap className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div
              className={`flex flex-col gap-3 border-t p-6 sm:flex-row ${
                isPastel ? 'border-pink-200/40 bg-pink-50/25' : 'border-cyber-purple-400/20 bg-gray-900/50'
              }`}
            >
              {allowCreateCase ? (
                <motion.button
                  type="button"
                  onClick={() => setShowCaseNameDialog(true)}
                  disabled={creatingCase}
                  whileHover={{ scale: creatingCase ? 1 : 1.02 }}
                  whileTap={{ scale: creatingCase ? 1 : 0.98 }}
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-5 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    isPastel
                      ? 'border-pink-200/60 bg-white/90 text-gray-700 hover:border-pink-300 hover:bg-white'
                      : 'border-gray-700/50 bg-gray-800/80 text-white hover:border-cyber-purple-400/50 hover:bg-gray-800'
                  }`}
                  aria-label="Create new case"
                >
                  <FolderPlus className="h-4 w-4" />
                  Create New Case
                </motion.button>
              ) : null}
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 rounded-xl border px-5 py-3 text-sm font-medium transition-all ${
                  isPastel
                    ? 'border-pink-200/50 bg-white/80 text-gray-700 hover:bg-pink-50'
                    : 'border-gray-700/50 bg-gray-800/80 text-white hover:bg-gray-700/80'
                }`}
                aria-label="Cancel case selection"
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedCasePath || creatingCase}
                whileHover={{ scale: !selectedCasePath || creatingCase ? 1 : 1.02 }}
                whileTap={{ scale: !selectedCasePath || creatingCase ? 1 : 0.98 }}
                className={`flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  isPastel
                    ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 hover:shadow-pink-400/40'
                    : 'bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 hover:shadow-cyber-purple-500/50'
                }`}
                aria-label={confirmLabel}
              >
                {confirmLabel}
              </motion.button>
            </div>
    </motion.div>
  );

  const caseNameDialog = (
    <CaseNameDialog
      isOpen={showCaseNameDialog}
      elevated
      superElevated={elevated || layout === 'companion'}
      onClose={() => {
        if (!creatingCase) {
          setShowCaseNameDialog(false);
        }
      }}
      onConfirm={handleCreateCase}
    />
  );

  if (layout === 'companion') {
    return (
      <>
        <AnimatePresence mode="popLayout">{isOpen ? casePanel : null}</AnimatePresence>
        {caseNameDialog}
      </>
    );
  }

  return createPortal(
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className={`fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm ${
            elevated ? 'z-[80]' : 'z-[60]'
          } ${isPastel ? 'bg-black/40' : 'bg-black/80'}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-selection-dialog-title"
        >
          {casePanel}
        </motion.div>
      </AnimatePresence>
      {caseNameDialog}
    </>,
    document.body
  );
}
