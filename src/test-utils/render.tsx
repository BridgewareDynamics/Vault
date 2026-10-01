import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { setupTestSettings } from './testSettings';
import { TestProviders } from './TestProviders';

type ProviderOptions = {
  withToast?: boolean;
  withWordEditor?: boolean;
};

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
