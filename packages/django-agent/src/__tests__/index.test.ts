import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DjangoAgent } from '../index';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
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
vi.mock('ws', () => ({
  WebSocket: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn()
  }))
}));

describe('DjangoAgent', () => {
  let agent: DjangoAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new DjangoAgent({
      djangoServerUrl: 'http://localhost:8000',
      monitorDatabase: true,
      monitorMiddleware: true,
      monitorViews: true,
      monitorSessions: true
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

  it('should record middleware metrics', () => {
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
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject(metric);
  });

  it('should record database metrics', () => {
    const metric = {
      query: 'SELECT * FROM users',
      queryType: 'SELECT' as const,
      executionTime: 25,
      timestamp: Date.now(),
      database: 'myapp',
      table: 'users',
      rowsAffected: 10,
      requestId: 'req-123'
    };

    agent.recordDatabaseMetric(metric);
    const metrics = agent.getDatabaseMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject(metric);
  });

  it('should record view metrics', () => {
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
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject(metric);
  });

  it('should get performance summary', () => {
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
    expect(summary).toBeDefined();
    expect(summary.totalRequests).toBe(1);
    expect(summary.averageResponseTime).toBe(200);
    expect(Array.isArray(summary.slowestEndpoints)).toBe(true);
  });

  it('should clear metrics', () => {
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

    expect(agent.getViewMetrics()).toHaveLength(1);
    agent.clearMetrics();
    expect(agent.getViewMetrics()).toHaveLength(0);
  });
}); 