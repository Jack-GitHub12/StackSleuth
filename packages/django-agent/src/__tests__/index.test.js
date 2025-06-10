"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("../index");
// Mock axios
vitest_1.vi.mock('axios', () => ({
    default: {
        get: vitest_1.vi.fn().mockResolvedValue({
            data: {
                middleware: [],
                database: [],
                views: [],
                sessions: []
            }
        })
    }
}));
// Mock WebSocket
vitest_1.vi.mock('ws', () => ({
    WebSocket: vitest_1.vi.fn().mockImplementation(() => ({
        on: vitest_1.vi.fn(),
        close: vitest_1.vi.fn()
    }))
}));
(0, vitest_1.describe)('DjangoAgent', () => {
    let agent;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        agent = new index_1.DjangoAgent({
            djangoServerUrl: 'http://localhost:8000',
            monitorDatabase: true,
            monitorMiddleware: true,
            monitorViews: true,
            monitorSessions: true
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
    (0, vitest_1.it)('should record middleware metrics', () => {
        const metric = {
            middlewareName: 'TestMiddleware',
            requestPath: '/api/test',
            method: 'GET',
            executionTime: 150,
            timestamp: Date.now(),
            statusCode: 200,
            responseSize: 1024,
            requestId: 'req-123'
        };
        agent.recordMiddlewareMetric(metric);
        const metrics = agent.getMiddlewareMetrics();
        (0, vitest_1.expect)(metrics).toHaveLength(1);
        (0, vitest_1.expect)(metrics[0]).toMatchObject(metric);
    });
    (0, vitest_1.it)('should record database metrics', () => {
        const metric = {
            query: 'SELECT * FROM users',
            queryType: 'SELECT',
            executionTime: 25,
            timestamp: Date.now(),
            database: 'myapp',
            table: 'users',
            rowsAffected: 10,
            requestId: 'req-123'
        };
        agent.recordDatabaseMetric(metric);
        const metrics = agent.getDatabaseMetrics();
        (0, vitest_1.expect)(metrics).toHaveLength(1);
        (0, vitest_1.expect)(metrics[0]).toMatchObject(metric);
    });
    (0, vitest_1.it)('should record view metrics', () => {
        const metric = {
            viewName: 'TestView',
            viewFunction: 'test_view',
            requestPath: '/api/test',
            method: 'GET',
            executionTime: 200,
            timestamp: Date.now(),
            statusCode: 200,
            templateRendered: 'test.html',
            templateRenderTime: 50,
            requestId: 'req-123'
        };
        agent.recordViewMetric(metric);
        const metrics = agent.getViewMetrics();
        (0, vitest_1.expect)(metrics).toHaveLength(1);
        (0, vitest_1.expect)(metrics[0]).toMatchObject(metric);
    });
    (0, vitest_1.it)('should get performance summary', () => {
        // Add some test data
        agent.recordViewMetric({
            viewName: 'TestView',
            viewFunction: 'test_view',
            requestPath: '/api/test',
            method: 'GET',
            executionTime: 200,
            timestamp: Date.now(),
            statusCode: 200,
            requestId: 'req-123'
        });
        const summary = agent.getPerformanceSummary();
        (0, vitest_1.expect)(summary).toBeDefined();
        (0, vitest_1.expect)(summary.totalRequests).toBe(1);
        (0, vitest_1.expect)(summary.averageResponseTime).toBe(200);
        (0, vitest_1.expect)(Array.isArray(summary.slowestEndpoints)).toBe(true);
    });
    (0, vitest_1.it)('should clear metrics', () => {
        agent.recordViewMetric({
            viewName: 'TestView',
            viewFunction: 'test_view',
            requestPath: '/api/test',
            method: 'GET',
            executionTime: 200,
            timestamp: Date.now(),
            statusCode: 200,
            requestId: 'req-123'
        });
        (0, vitest_1.expect)(agent.getViewMetrics()).toHaveLength(1);
        agent.clearMetrics();
        (0, vitest_1.expect)(agent.getViewMetrics()).toHaveLength(0);
    });
});
//# sourceMappingURL=index.test.js.map