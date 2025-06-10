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
                eloquent: [],
                routes: [],
                jobs: [],
                cache: []
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
(0, vitest_1.describe)('LaravelAgent', () => {
    let agent;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        agent = new index_1.LaravelAgent({
            laravelServerUrl: 'http://localhost:8000',
            monitorEloquent: true,
            monitorMiddleware: true,
            monitorRoutes: true,
            monitorJobs: true,
            monitorCache: true
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
    (0, vitest_1.it)('should record Eloquent metrics', () => {
        const metric = {
            query: 'SELECT * FROM users WHERE id = ?',
            queryType: 'SELECT',
            executionTime: 15,
            timestamp: Date.now(),
            database: 'laravel_app',
            model: 'User',
            bindings: [1],
            rowsAffected: 1,
            requestId: 'req-123'
        };
        agent.recordEloquentMetric(metric);
        const metrics = agent.getEloquentMetrics();
        (0, vitest_1.expect)(metrics).toHaveLength(1);
        (0, vitest_1.expect)(metrics[0]).toMatchObject(metric);
    });
    (0, vitest_1.it)('should record route metrics', () => {
        const metric = {
            routeName: 'users.show',
            routeUri: '/users/{id}',
            controllerAction: 'UserController@show',
            method: 'GET',
            executionTime: 120,
            timestamp: Date.now(),
            statusCode: 200,
            memoryUsage: 8192,
            requestId: 'req-123'
        };
        agent.recordRouteMetric(metric);
        const metrics = agent.getRouteMetrics();
        (0, vitest_1.expect)(metrics).toHaveLength(1);
        (0, vitest_1.expect)(metrics[0]).toMatchObject(metric);
    });
    (0, vitest_1.it)('should record job metrics', () => {
        const metric = {
            jobName: 'SendEmailJob',
            queue: 'emails',
            executionTime: 1500,
            timestamp: Date.now(),
            status: 'completed',
            attempts: 1,
            payload: { email: 'test@example.com' }
        };
        agent.recordJobMetric(metric);
        const metrics = agent.getJobMetrics();
        (0, vitest_1.expect)(metrics).toHaveLength(1);
        (0, vitest_1.expect)(metrics[0]).toMatchObject(metric);
    });
    (0, vitest_1.it)('should record cache metrics', () => {
        const metric = {
            operation: 'get',
            key: 'user:123',
            executionTime: 5,
            timestamp: Date.now(),
            hit: true,
            store: 'redis',
            tags: ['users']
        };
        agent.recordCacheMetric(metric);
        const metrics = agent.getCacheMetrics();
        (0, vitest_1.expect)(metrics).toHaveLength(1);
        (0, vitest_1.expect)(metrics[0]).toMatchObject(metric);
    });
    (0, vitest_1.it)('should get performance summary', () => {
        // Add some test data
        agent.recordRouteMetric({
            routeUri: '/api/users',
            controllerAction: 'UserController@index',
            method: 'GET',
            executionTime: 150,
            timestamp: Date.now(),
            statusCode: 200,
            memoryUsage: 4096,
            requestId: 'req-123'
        });
        agent.recordEloquentMetric({
            query: 'SELECT * FROM users',
            queryType: 'SELECT',
            executionTime: 25,
            timestamp: Date.now(),
            database: 'laravel_app',
            model: 'User',
            bindings: [],
            requestId: 'req-123'
        });
        const summary = agent.getPerformanceSummary();
        (0, vitest_1.expect)(summary).toBeDefined();
        (0, vitest_1.expect)(summary.totalRequests).toBe(1);
        (0, vitest_1.expect)(summary.averageResponseTime).toBe(150);
        (0, vitest_1.expect)(summary.eloquentPerformance.totalQueries).toBe(1);
        (0, vitest_1.expect)(Array.isArray(summary.slowestRoutes)).toBe(true);
    });
    (0, vitest_1.it)('should clear metrics', () => {
        agent.recordRouteMetric({
            routeUri: '/api/test',
            controllerAction: 'TestController@index',
            method: 'GET',
            executionTime: 100,
            timestamp: Date.now(),
            statusCode: 200,
            memoryUsage: 2048,
            requestId: 'req-123'
        });
        (0, vitest_1.expect)(agent.getRouteMetrics()).toHaveLength(1);
        agent.clearMetrics();
        (0, vitest_1.expect)(agent.getRouteMetrics()).toHaveLength(0);
    });
});
//# sourceMappingURL=index.test.js.map