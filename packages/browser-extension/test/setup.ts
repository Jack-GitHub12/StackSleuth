import { vi } from 'vitest';

// Mock Chrome APIs for testing
const mockChrome = {
  runtime: {
    id: 'test-extension-id',
    onMessage: {
      addListener: vi.fn()
    },
    sendMessage: vi.fn()
  },
  tabs: {
    onUpdated: {
      addListener: vi.fn()
    },
    onRemoved: {
      addListener: vi.fn()
    },
    query: vi.fn()
  },
  scripting: {
    executeScript: vi.fn()
  },
  devtools: {
    panels: {
      create: vi.fn()
    }
  }
};

// @ts-ignore
global.chrome = mockChrome; 