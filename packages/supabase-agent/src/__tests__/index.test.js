"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("../index");
// Mock Supabase client
const mockSupabaseClient = {
    from: vitest_1.vi.fn(() => ({
        select: vitest_1.vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vitest_1.vi.fn().mockResolvedValue({ data: [], error: null }),
        update: vitest_1.vi.fn().mockResolvedValue({ data: [], error: null }),
        delete: vitest_1.vi.fn().mockResolvedValue({ data: [], error: null })
    })),
    channel: vitest_1.vi.fn(() => ({
        on: vitest_1.vi.fn().mockReturnThis(),
        subscribe: vitest_1.vi.fn().mockResolvedValue({ status: 'SUBSCRIBED' })
    })),
    storage: {
        from: vitest_1.vi.fn(() => ({
            upload: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
            download: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null })
        }))
    },
    auth: {
        signIn: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
        signOut: vitest_1.vi.fn().mockResolvedValue({ error: null }),
        getUser: vitest_1.vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    }
};
(0, vitest_1.describe)('SupabaseAgent', () => {
    let agent;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        agent = new index_1.SupabaseAgent();
    });
    (0, vitest_1.it)('should initialize correctly', () => {
        (0, vitest_1.expect)(agent).toBeDefined();
    });
    (0, vitest_1.it)('should start monitoring', () => {
        (0, vitest_1.expect)(() => agent.startMonitoring()).not.toThrow();
    });
    (0, vitest_1.it)('should stop monitoring', () => {
        agent.startMonitoring();
        (0, vitest_1.expect)(() => agent.stopMonitoring()).not.toThrow();
    });
    (0, vitest_1.it)('should instrument supabase client', () => {
        (0, vitest_1.expect)(() => agent.instrumentClient(mockSupabaseClient)).not.toThrow();
    });
    (0, vitest_1.it)('should get operation metrics', () => {
        const metrics = agent.getOperationMetrics();
        (0, vitest_1.expect)(metrics).toBeDefined();
        (0, vitest_1.expect)(Array.isArray(metrics)).toBe(true);
    });
    (0, vitest_1.it)('should get performance summary', () => {
        const summary = agent.getPerformanceSummary();
        (0, vitest_1.expect)(summary).toBeDefined();
        (0, vitest_1.expect)(typeof summary.totalOperations).toBe('number');
        (0, vitest_1.expect)(typeof summary.averageResponseTime).toBe('number');
    });
    (0, vitest_1.it)('should track table statistics', () => {
        const stats = agent.getTableStatistics();
        (0, vitest_1.expect)(stats).toBeDefined();
        (0, vitest_1.expect)(Array.isArray(stats)).toBe(true);
    });
});
//# sourceMappingURL=index.test.js.map