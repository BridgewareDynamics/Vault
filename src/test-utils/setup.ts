import '@testing-library/jest-dom';
import { vi, beforeEach, afterAll } from 'vitest';
import React from 'react';
import { mockElectronAPI } from './mocks';

// Mock Electron API globally
global.window.electronAPI = mockElectronAPI;

// Mock framer-motion with lightweight stubs so tests do not load the full animation library.
const createMotionComponent = (component: string) => {
  return React.forwardRef<any, any>(({ children, ...props }, ref) => {
    const {
      initial,
      animate,
      exit,
      transition,
      whileHover,
      whileTap,
      whileDrag,
      whileFocus,
      whileInView,
      drag,
      dragConstraints,
      dragElastic,
      dragMomentum,
      dragDirectionLock,
      dragPropagation,
      dragTransition,
      layout,
      layoutId,
      layoutDependency,
      layoutRoot,
      ...domProps
    } = props;

    return React.createElement(component, { ...domProps, ref }, children);
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

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
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
  mockElectronAPI.getSettings.mockResolvedValue({
    hardwareAcceleration: true,
    ramLimitMB: 2048,
    fullscreen: false,
    extractionQuality: 'high',
    thumbnailSize: 200,
    performanceMode: 'auto',
    showOnboarding: false,
    theme: 'brideware-purple',
  });
});

// Ensure timers are restored after all tests complete to prevent hanging
// This ensures the process can exit cleanly
afterAll(() => {
  vi.useRealTimers();
});



