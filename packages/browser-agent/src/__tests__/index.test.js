"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("../index");
// Mock browser APIs
Object.defineProperty(global, 'window', {
    value: {
        performance: {
            now: vitest_1.vi.fn(() => Date.now()),
            getEntriesByType: vitest_1.vi.fn(() => []),
            mark: vitest_1.vi.fn(),
            measure: vitest_1.vi.fn()
        },
        addEventListener: vitest_1.vi.fn(),
        removeEventListener: vitest_1.vi.fn()
    }
});
Object.defineProperty(global, 'document', {
    value: {
        addEventListener: vitest_1.vi.fn(),
        removeEventListener: vitest_1.vi.fn(),
        querySelector: vitest_1.vi.fn(),
        querySelectorAll: vitest_1.vi.fn(() => [])
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
(0, vitest_1.describe)('BrowserAgent', () => {
    let agent;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        agent = new index_1.BrowserAgent({
            trackUserInteractions: true,
            trackNetworkRequests: true,
            trackPerformance: true
        });
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
    (0, vitest_1.it)('should track page metrics', () => {
        const metrics = agent.getPageMetrics();
        (0, vitest_1.expect)(metrics).toBeDefined();
        (0, vitest_1.expect)(typeof metrics.pageLoadTime).toBe('number');
    });
    (0, vitest_1.it)('should get performance data', () => {
        const data = agent.getPerformanceData();
        (0, vitest_1.expect)(data).toBeDefined();
        (0, vitest_1.expect)(Array.isArray(data.resourceTimings)).toBe(true);
    });
    (0, vitest_1.it)('should track user interactions', () => {
        const interactions = agent.getUserInteractions();
        (0, vitest_1.expect)(interactions).toBeDefined();
        (0, vitest_1.expect)(Array.isArray(interactions)).toBe(true);
    });
    (0, vitest_1.it)('should get browser info', () => {
        const info = agent.getBrowserInfo();
        (0, vitest_1.expect)(info).toBeDefined();
        (0, vitest_1.expect)(typeof info.userAgent).toBe('string');
    });
});
//# sourceMappingURL=index.test.js.map