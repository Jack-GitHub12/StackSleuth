import { describe, it, expect } from 'vitest';
import { SvelteAgent } from '../index';

describe('SvelteAgent', () => {
  it('should initialize correctly', () => {
    const agent = new SvelteAgent();
    expect(agent).toBeDefined();
  });

  it('should start profiling', () => {
    const agent = new SvelteAgent();
    expect(() => agent.startProfiling()).not.toThrow();
  });

  it('should stop profiling', () => {
    const agent = new SvelteAgent();
    agent.startProfiling();
    expect(() => agent.stopProfiling()).not.toThrow();
  });

  it('should track component metrics', () => {
    const agent = new SvelteAgent();
    const metrics = agent.getComponentMetrics();
    expect(metrics).toBeDefined();
    expect(Array.isArray(metrics)).toBe(true);
  });

  it('should get performance summary', () => {
    const agent = new SvelteAgent();
    const summary = agent.getPerformanceSummary();
    expect(summary).toBeDefined();
    expect(typeof summary.totalComponents).toBe('number');
    expect(typeof summary.averageRenderTime).toBe('number');
  });
}); 