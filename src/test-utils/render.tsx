import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { SettingsProvider } from '../utils/settingsContext';
import { ToastProvider } from '../components/Toast/ToastContext';
import { WordEditorProvider } from '../contexts/WordEditorContext';
import { setupTestSettings } from './testSettings';

type ProviderOptions = {
  withToast?: boolean;
  withWordEditor?: boolean;
};

function TestProviders({
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

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & ProviderOptions,
) {
  const { withToast = false, withWordEditor = false, ...renderOptions } = options ?? {};

  setupTestSettings();

  const wrap = (node: ReactElement) => (
    <TestProviders withToast={withToast} withWordEditor={withWordEditor}>
      {node}
    </TestProviders>
  );

  const result = render(wrap(ui), renderOptions);

  return {
    ...result,
    rerender: (nextUi: ReactElement) => result.rerender(wrap(nextUi)),
  };
}

export { defaultTestSettings, setupTestSettings } from './testSettings';
