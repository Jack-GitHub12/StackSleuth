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
  rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
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
    signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({ data: null, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    refreshToken: vi.fn().mockResolvedValue({ data: null, error: null })
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

  it.skip('should get performance summary', () => {
    const summary = agent.getPerformanceSummary();
    expect(summary).toBeDefined();
    // The summary should have the expected structure
    expect(summary).toHaveProperty('totalOperations');
    expect(summary).toHaveProperty('averageResponseTime');
    // These will be 0 since no operations have been recorded
    expect(summary.totalOperations).toBe(0);
    expect(summary.averageResponseTime).toBe(0);
  });

  it('should track table statistics', () => {
    const stats = agent.getTableStatistics();
    expect(stats).toBeDefined();
    expect(Array.isArray(stats)).toBe(true);
  });
}); 