import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';
import { mockElectronAPI } from './mocks';

// Mock Electron API globally
global.window.electronAPI = mockElectronAPI;

// Mock framer-motion to avoid animation delays in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: 'div',
      button: 'button',
      img: 'img',
      span: 'span',
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      p: 'p',
      form: 'form',
      input: 'input',
      section: 'section',
      nav: 'nav',
      ul: 'ul',
      li: 'li',
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  Object.values(mockElectronAPI).forEach((mockFn) => {
    if (vi.isMockFunction(mockFn)) {
      mockFn.mockReset();
    }
  });
});



