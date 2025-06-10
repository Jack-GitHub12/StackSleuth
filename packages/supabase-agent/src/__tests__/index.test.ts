import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseAgent } from '../index';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: [], error: null }),
    update: vi.fn().mockResolvedValue({ data: [], error: null }),
    delete: vi.fn().mockResolvedValue({ data: [], error: null })
  })),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockResolvedValue({ status: 'SUBSCRIBED' })
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      download: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  },
  auth: {
    signIn: vi.fn().mockResolvedValue({ data: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null })
  }
};

describe('SupabaseAgent', () => {
  let agent: SupabaseAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new SupabaseAgent();
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

  it('should instrument supabase client', () => {
    expect(() => agent.instrumentClient(mockSupabaseClient as any)).not.toThrow();
  });

  it('should get operation metrics', () => {
    const metrics = agent.getOperationMetrics();
    expect(metrics).toBeDefined();
    expect(Array.isArray(metrics)).toBe(true);
  });

  it('should get performance summary', () => {
    const summary = agent.getPerformanceSummary();
    expect(summary).toBeDefined();
    expect(typeof summary.totalOperations).toBe('number');
    expect(typeof summary.averageResponseTime).toBe('number');
  });

  it('should track table statistics', () => {
    const stats = agent.getTableStatistics();
    expect(stats).toBeDefined();
    expect(Array.isArray(stats)).toBe(true);
  });
}); 