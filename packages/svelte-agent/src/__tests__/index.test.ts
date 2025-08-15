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

  it.skip('should track component metrics', () => {
    const agent = new SvelteAgent();
    const metrics = agent.getComponentMetrics();
    expect(metrics).toBeDefined();
    // Check that it's actually an array
    expect(metrics).toBeInstanceOf(Array);
    expect(Array.isArray(metrics)).toBe(true);
  });

  it.skip('should get performance summary', () => {
    const agent = new SvelteAgent();
    const summary = agent.getPerformanceSummary();
    expect(summary).toBeDefined();
    // The summary should have the expected structure
    expect(summary).toHaveProperty('totalComponents');
    expect(summary).toHaveProperty('averageRenderTime');
    // These will be 0 since no components have been tracked
    expect(summary.totalComponents).toBe(0);
    expect(summary.averageRenderTime).toBe(0);
  });
}); 