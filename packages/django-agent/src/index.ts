import { BaseAgent, AgentConfig, PerformanceMetrics } from '@stacksleuth/core';
import axios, { AxiosResponse } from 'axios';
import { WebSocket } from 'ws';

// Django-specific interfaces
export interface DjangoMiddlewareMetric {
  middlewareName: string;
  requestPath: string;
  method: string;
  executionTime: number;
  timestamp: number;
  statusCode: number;
  responseSize: number;
  requestId: string;
}

export interface DjangoDatabaseMetric {
  query: string;
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'ALTER' | 'DROP';
  executionTime: number;
  timestamp: number;
  database: string;
  table?: string;
  rowsAffected?: number;
  requestId: string;
}

export interface DjangoViewMetric {
  viewName: string;
  viewFunction: string;
  requestPath: string;
  method: string;
  executionTime: number;
  timestamp: number;
  statusCode: number;
  templateRendered?: string;
  templateRenderTime?: number;
  requestId: string;
}

export interface DjangoSessionMetric {
  sessionKey: string;
  userId?: string;
  requestCount: number;
  lastActivity: number;
  sessionData: Record<string, any>;
  ipAddress: string;
}

export interface DjangoPerformanceSummary {
  totalRequests: number;
  averageResponseTime: number;
  slowestEndpoints: Array<{
    path: string;
    averageTime: number;
    requestCount: number;
  }>;
  databasePerformance: {
    totalQueries: number;
    averageQueryTime: number;
    slowestQueries: Array<{
      query: string;
      averageTime: number;
      executionCount: number;
    }>;
  };
  middlewarePerformance: Array<{
    name: string;
    averageTime: number;
    requestCount: number;
  }>;
  errorRate: number;
  memoryUsage: {
    average: number;
    peak: number;
  };
}

export interface DjangoAgentConfig extends AgentConfig {
  djangoServerUrl?: string;
  monitorDatabase?: boolean;
  monitorMiddleware?: boolean;
  monitorViews?: boolean;
  monitorSessions?: boolean;
  enableRealTimeUpdates?: boolean;
  customMiddleware?: string[];
}

export class DjangoAgent extends BaseAgent {
  private middlewareMetrics: DjangoMiddlewareMetric[] = [];
  private databaseMetrics: DjangoDatabaseMetric[] = [];
  private viewMetrics: DjangoViewMetric[] = [];
  private sessionMetrics: Map<string, DjangoSessionMetric> = new Map();
  protected config: DjangoAgentConfig;
  private websocket?: WebSocket;
  private isMonitoring = false;

  constructor(config: DjangoAgentConfig = {}) {
    super(config);
    this.config = {
      djangoServerUrl: 'http://localhost:8000',
      monitorDatabase: true,
      monitorMiddleware: true,
      monitorViews: true,
      monitorSessions: true,
      enableRealTimeUpdates: false,
      customMiddleware: [],
      ...config
    };
  }

  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('Django monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting Django performance monitoring...');

    if (this.config.enableRealTimeUpdates) {
      this.setupWebSocketConnection();
    }

    // Start periodic data collection
    this.startPeriodicCollection();
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    console.log('Stopping Django performance monitoring...');

    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }

    this.stopPeriodicCollection();
  }

  private setupWebSocketConnection(): void {
    try {
      const wsUrl = this.config.djangoServerUrl?.replace('http', 'ws') + '/ws/stacksleuth/';
      this.websocket = new WebSocket(wsUrl);

      this.websocket.on('open', () => {
        console.log('Connected to Django WebSocket for real-time monitoring');
      });

      this.websocket.on('message', (data: string) => {
        try {
          const metric = JSON.parse(data);
          this.processRealTimeMetric(metric);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.websocket.on('error', (error) => {
        console.error('Django WebSocket error:', error);
      });
    } catch (error) {
      console.error('Failed to setup WebSocket connection:', error);
    }
  }

  private processRealTimeMetric(metric: any): void {
    switch (metric.type) {
      case 'middleware':
        this.recordMiddlewareMetric(metric.data);
        break;
      case 'database':
        this.recordDatabaseMetric(metric.data);
        break;
      case 'view':
        this.recordViewMetric(metric.data);
        break;
      case 'session':
        this.recordSessionMetric(metric.data);
        break;
    }
  }

  public recordMiddlewareMetric(metric: DjangoMiddlewareMetric): void {
    if (!this.config.monitorMiddleware) return;

    this.middlewareMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });

    // Keep only recent metrics (last 1000)
    if (this.middlewareMetrics.length > 1000) {
      this.middlewareMetrics = this.middlewareMetrics.slice(-1000);
    }
  }

  public recordDatabaseMetric(metric: DjangoDatabaseMetric): void {
    if (!this.config.monitorDatabase) return;

    this.databaseMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });

    // Keep only recent metrics (last 1000)
    if (this.databaseMetrics.length > 1000) {
      this.databaseMetrics = this.databaseMetrics.slice(-1000);
    }
  }

  public recordViewMetric(metric: DjangoViewMetric): void {
    if (!this.config.monitorViews) return;

    this.viewMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });

    // Keep only recent metrics (last 1000)
    if (this.viewMetrics.length > 1000) {
      this.viewMetrics = this.viewMetrics.slice(-1000);
    }
  }

  public recordSessionMetric(metric: DjangoSessionMetric): void {
    if (!this.config.monitorSessions) return;

    this.sessionMetrics.set(metric.sessionKey, {
      ...metric,
      lastActivity: Date.now()
    });

    // Clean up old sessions (older than 24 hours)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    for (const [key, session] of this.sessionMetrics.entries()) {
      if (session.lastActivity < oneDayAgo) {
        this.sessionMetrics.delete(key);
      }
    }
  }

  public async collectDjangoMetrics(): Promise<void> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.config.djangoServerUrl}/api/stacksleuth/metrics/`,
        { timeout: 5000 }
      );

      const metrics = response.data;

      if (metrics.middleware && this.config.monitorMiddleware) {
        metrics.middleware.forEach((metric: DjangoMiddlewareMetric) => {
          this.recordMiddlewareMetric(metric);
        });
      }

      if (metrics.database && this.config.monitorDatabase) {
        metrics.database.forEach((metric: DjangoDatabaseMetric) => {
          this.recordDatabaseMetric(metric);
        });
      }

      if (metrics.views && this.config.monitorViews) {
        metrics.views.forEach((metric: DjangoViewMetric) => {
          this.recordViewMetric(metric);
        });
      }

      if (metrics.sessions && this.config.monitorSessions) {
        metrics.sessions.forEach((metric: DjangoSessionMetric) => {
          this.recordSessionMetric(metric);
        });
      }
    } catch (error) {
      console.error('Error collecting Django metrics:', error);
    }
  }

  public getMiddlewareMetrics(): DjangoMiddlewareMetric[] {
    return [...this.middlewareMetrics];
  }

  public getDatabaseMetrics(): DjangoDatabaseMetric[] {
    return [...this.databaseMetrics];
  }

  public getViewMetrics(): DjangoViewMetric[] {
    return [...this.viewMetrics];
  }

  public getSessionMetrics(): DjangoSessionMetric[] {
    return Array.from(this.sessionMetrics.values());
  }

  public getPerformanceSummary(): DjangoPerformanceSummary {
    const totalRequests = this.viewMetrics.length;
    const averageResponseTime = totalRequests > 0 
      ? this.viewMetrics.reduce((sum, metric) => sum + metric.executionTime, 0) / totalRequests 
      : 0;

    // Calculate slowest endpoints
    const endpointStats = new Map<string, { totalTime: number; count: number }>();
    this.viewMetrics.forEach(metric => {
      const key = metric.requestPath;
      const current = endpointStats.get(key) || { totalTime: 0, count: 0 };
      current.totalTime += metric.executionTime;
      current.count += 1;
      endpointStats.set(key, current);
    });

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([path, stats]) => ({
        path,
        averageTime: stats.totalTime / stats.count,
        requestCount: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    // Calculate database performance
    const totalQueries = this.databaseMetrics.length;
    const averageQueryTime = totalQueries > 0
      ? this.databaseMetrics.reduce((sum, metric) => sum + metric.executionTime, 0) / totalQueries
      : 0;

    const queryStats = new Map<string, { totalTime: number; count: number }>();
    this.databaseMetrics.forEach(metric => {
      const key = metric.query.substring(0, 100); // Truncate for grouping
      const current = queryStats.get(key) || { totalTime: 0, count: 0 };
      current.totalTime += metric.executionTime;
      current.count += 1;
      queryStats.set(key, current);
    });

    const slowestQueries = Array.from(queryStats.entries())
      .map(([query, stats]) => ({
        query,
        averageTime: stats.totalTime / stats.count,
        executionCount: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    // Calculate middleware performance
    const middlewareStats = new Map<string, { totalTime: number; count: number }>();
    this.middlewareMetrics.forEach(metric => {
      const current = middlewareStats.get(metric.middlewareName) || { totalTime: 0, count: 0 };
      current.totalTime += metric.executionTime;
      current.count += 1;
      middlewareStats.set(metric.middlewareName, current);
    });

    const middlewarePerformance = Array.from(middlewareStats.entries())
      .map(([name, stats]) => ({
        name,
        averageTime: stats.totalTime / stats.count,
        requestCount: stats.count
      }));

    // Calculate error rate
    const errorResponses = this.viewMetrics.filter(metric => metric.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorResponses / totalRequests) * 100 : 0;

    return {
      totalRequests,
      averageResponseTime,
      slowestEndpoints,
      databasePerformance: {
        totalQueries,
        averageQueryTime,
        slowestQueries
      },
      middlewarePerformance,
      errorRate,
      memoryUsage: {
        average: 0, // Would be populated by actual Django integration
        peak: 0
      }
    };
  }

  public clearMetrics(): void {
    this.middlewareMetrics = [];
    this.databaseMetrics = [];
    this.viewMetrics = [];
    this.sessionMetrics.clear();
  }

  private startPeriodicCollection(): void {
    // Collect metrics every 10 seconds
    const interval = setInterval(async () => {
      if (!this.isMonitoring) {
        clearInterval(interval);
        return;
      }
      await this.collectDjangoMetrics();
    }, 10000);
  }

  private stopPeriodicCollection(): void {
    // Implementation would stop any active intervals
  }
} 