"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("../index");
(0, vitest_1.describe)('SvelteAgent', () => {
    (0, vitest_1.it)('should initialize correctly', () => {
        const agent = new index_1.SvelteAgent();
        (0, vitest_1.expect)(agent).toBeDefined();
    });
    (0, vitest_1.it)('should start profiling', () => {
        const agent = new index_1.SvelteAgent();
        (0, vitest_1.expect)(() => agent.startProfiling()).not.toThrow();
    });
    (0, vitest_1.it)('should stop profiling', () => {
        const agent = new index_1.SvelteAgent();
        agent.startProfiling();
        (0, vitest_1.expect)(() => agent.stopProfiling()).not.toThrow();
    });
    (0, vitest_1.it)('should track component metrics', () => {
        const agent = new index_1.SvelteAgent();
        const metrics = agent.getComponentMetrics();
        (0, vitest_1.expect)(metrics).toBeDefined();
        (0, vitest_1.expect)(Array.isArray(metrics)).toBe(true);
    });
    (0, vitest_1.it)('should get performance summary', () => {
        const agent = new index_1.SvelteAgent();
        const summary = agent.getPerformanceSummary();
        (0, vitest_1.expect)(summary).toBeDefined();
        (0, vitest_1.expect)(typeof summary.totalComponents).toBe('number');
        (0, vitest_1.expect)(typeof summary.averageRenderTime).toBe('number');
    });
});
//# sourceMappingURL=index.test.js.map