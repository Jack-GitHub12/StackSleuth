import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LaravelAgent } from '../index';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
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
vi.mock('ws', () => ({
  WebSocket: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn()
  }))
}));

describe('LaravelAgent', () => {
  let agent: LaravelAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new LaravelAgent({
      laravelServerUrl: 'http://localhost:8000',
      monitorEloquent: true,
      monitorMiddleware: true,
      monitorRoutes: true,
      monitorJobs: true,
      monitorCache: true
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

  it('should record Eloquent metrics', () => {
    const metric = {
      query: 'SELECT * FROM users WHERE id = ?',
      queryType: 'SELECT' as const,
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
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject(metric);
  });

  it('should record route metrics', () => {
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
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject(metric);
  });

  it('should record job metrics', () => {
    const metric = {
      jobName: 'SendEmailJob',
      queue: 'emails',
      executionTime: 1500,
      timestamp: Date.now(),
      status: 'completed' as const,
      attempts: 1,
      payload: { email: 'test@example.com' }
    };

    agent.recordJobMetric(metric);
    const metrics = agent.getJobMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject(metric);
  });

  it('should record cache metrics', () => {
    const metric = {
      operation: 'get' as const,
      key: 'user:123',
      executionTime: 5,
      timestamp: Date.now(),
      hit: true,
      store: 'redis',
      tags: ['users']
    };

    agent.recordCacheMetric(metric);
    const metrics = agent.getCacheMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject(metric);
  });

  it('should get performance summary', () => {
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
    expect(summary).toBeDefined();
    expect(summary.totalRequests).toBe(1);
    expect(summary.averageResponseTime).toBe(150);
    expect(summary.eloquentPerformance.totalQueries).toBe(1);
    expect(Array.isArray(summary.slowestRoutes)).toBe(true);
  });

  it('should clear metrics', () => {
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

    expect(agent.getRouteMetrics()).toHaveLength(1);
    agent.clearMetrics();
    expect(agent.getRouteMetrics()).toHaveLength(0);
  });
}); 