import type { ReactNode } from 'react';
import { SettingsProvider } from '../utils/SettingsProvider';
import { ToastProvider } from '../components/Toast/ToastProvider';
import { WordEditorProvider } from '../contexts/WordEditorProvider';

export function TestProviders({
  children,
  withToast = false,
  withWordEditor = false,
}: {
  children: ReactNode;
  withToast?: boolean;
  withWordEditor?: boolean;
}) {
  let tree = children;

  if (withToast) {
    tree = <ToastProvider>{tree}</ToastProvider>;
  }

  if (withWordEditor) {
    tree = <WordEditorProvider>{tree}</WordEditorProvider>;
  }

  return <SettingsProvider>{tree}</SettingsProvider>;
}
