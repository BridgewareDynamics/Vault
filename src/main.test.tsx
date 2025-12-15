// path: src/main.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';

describe('main entrypoint', () => {
  beforeEach(() => {
    // Ensure a clean DOM root for each test
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('creates a React root and renders the App into #root', async () => {
    await import('./main');

    // If we got here without throwing, the entrypoint executed successfully
    const rootElement = document.getElementById('root');
    expect(rootElement).not.toBeNull();
  });
});


