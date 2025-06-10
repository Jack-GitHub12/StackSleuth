import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserAgent } from '../index';

// Mock browser APIs
Object.defineProperty(global, 'window', {
  value: {
    performance: {
      now: vi.fn(() => Date.now()),
      getEntriesByType: vi.fn(() => []),
      mark: vi.fn(),
      measure: vi.fn()
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
});

Object.defineProperty(global, 'document', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => [])
  }
});

Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test-agent',
    connection: {
      effectiveType: '4g',
      downlink: 10
    }
  }
});

describe('BrowserAgent', () => {
  let agent: BrowserAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new BrowserAgent({
      trackUserInteractions: true,
      trackNetworkRequests: true,
      trackPerformance: true
    });
  });

  it('should initialize correctly', () => {
    expect(agent).toBeDefined();
  });

  it('should start monitoring', () => {
    expect(() => agent.startMonitoring()).not.toThrow();
  });

  it('should stop monitoring', () => {
    agent.startMonitoring();
    expect(() => agent.stopMonitoring()).not.toThrow();
  });

  it('should track page metrics', () => {
    const metrics = agent.getPageMetrics();
    expect(metrics).toBeDefined();
    expect(typeof metrics.pageLoadTime).toBe('number');
  });

  it('should get performance data', () => {
    const data = agent.getPerformanceData();
    expect(data).toBeDefined();
    expect(Array.isArray(data.resourceTimings)).toBe(true);
  });

  it('should track user interactions', () => {
    const interactions = agent.getUserInteractions();
    expect(interactions).toBeDefined();
    expect(Array.isArray(interactions)).toBe(true);
  });

  it('should get browser info', () => {
    const info = agent.getBrowserInfo();
    expect(info).toBeDefined();
    expect(typeof info.userAgent).toBe('string');
  });
}); 