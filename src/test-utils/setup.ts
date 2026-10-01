import '@testing-library/jest-dom';
import { vi, beforeEach, afterAll } from 'vitest';
import React from 'react';
import { mockElectronAPI } from './mocks';
import { setupTestSettings } from './testSettings';

// Mock Electron API globally. The mock only implements the subset of the API
// the tests exercise, so cast to the canonical type declared in electronAPI.d.ts.
global.window.electronAPI = mockElectronAPI as unknown as typeof window.electronAPI;

// Mock framer-motion with lightweight stubs so tests do not load the full animation library.
// These motion-only props must be stripped so they never leak onto the real DOM element.
const MOTION_ONLY_PROPS = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'whileHover',
  'whileTap',
  'whileDrag',
  'whileFocus',
  'whileInView',
  'drag',
  'dragConstraints',
  'dragElastic',
  'dragMomentum',
  'dragDirectionLock',
  'dragPropagation',
  'dragTransition',
  'layout',
  'layoutId',
  'layoutDependency',
  'layoutRoot',
]);

type MotionStubProps = React.PropsWithChildren<Record<string, unknown>>;

const createMotionComponent = (component: string) => {
  return React.forwardRef<HTMLElement, MotionStubProps>(({ children, ...props }, ref) => {
    const domProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (!MOTION_ONLY_PROPS.has(key)) {
        domProps[key] = value;
      }
    }

    return React.createElement(
      component,
      { ...domProps, ref } as React.HTMLAttributes<HTMLElement> & React.ClassAttributes<HTMLElement>,
      children as React.ReactNode,
    );
  });
};

vi.mock('framer-motion', () => {
  const createMockMotionValue = (initial: number) => {
    let currentValue = initial;
    const listeners = new Set<(value: number) => void>();

    return {
      get: () => currentValue,
      set: (value: number) => {
        currentValue = value;
        listeners.forEach((listener) => listener(value));
      },
      onChange: (callback: (value: number) => void) => {
        listeners.add(callback);
        return () => listeners.delete(callback);
      },
      on: () => () => {},
      off: () => {},
      stop: () => {},
    };
  };

  return {
    motion: {
      div: createMotionComponent('div'),
      button: createMotionComponent('button'),
      img: createMotionComponent('img'),
      span: createMotionComponent('span'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
      p: createMotionComponent('p'),
      form: createMotionComponent('form'),
      input: createMotionComponent('input'),
      section: createMotionComponent('section'),
      nav: createMotionComponent('nav'),
      ul: createMotionComponent('ul'),
      li: createMotionComponent('li'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useMotionValue: createMockMotionValue,
  };
});

class MockIntersectionObserver {
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element) {
    this.callback(
      [{ isIntersecting: true, target: element } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }

  disconnect() {
    // no-op
  }

  unobserve() {
    // no-op
  }
}

class MockResizeObserver {
  observe() {
    // no-op
  }

  disconnect() {
    // no-op
  }

  unobserve() {
    // no-op
  }
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  setupTestSettings();
  Object.values(mockElectronAPI).forEach((mockFn) => {
    if (vi.isMockFunction(mockFn)) {
      mockFn.mockReset();
    }
  });
  mockElectronAPI.getConverterCapabilities.mockResolvedValue({
    inputExtensions: ['.png', '.pdf', '.mp4'],
    matrix: {
      image: ['png', 'jpeg', 'webp', 'tiff', 'pdf', 'gif', 'mp4'],
      pdf: ['png', 'jpeg', 'webp', 'tiff', 'pdf'],
      video: ['mp4', 'webm', 'gif', 'png', 'jpeg'],
      gif: ['png', 'jpeg', 'webp', 'gif', 'mp4', 'webm'],
    },
  });
  mockElectronAPI.onFileConverterProgress.mockImplementation(() => () => {});
  mockElectronAPI.listMaps.mockResolvedValue([]);
  mockElectronAPI.listTranscriptions.mockResolvedValue([]);
  mockElectronAPI.listArchiveCases.mockResolvedValue([]);
  mockElectronAPI.listNovels.mockResolvedValue([]);
  mockElectronAPI.getTranscriptionEngineStatus.mockResolvedValue({
    available: false,
    reason: 'test',
  });
});

// Ensure timers are restored after all tests complete to prevent hanging
// This ensures the process can exit cleanly
afterAll(() => {
  vi.useRealTimers();
});



