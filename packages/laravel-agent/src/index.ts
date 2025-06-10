import { BaseAgent, AgentConfig, PerformanceMetrics } from '@stacksleuth/core';
import axios, { AxiosResponse } from 'axios';
import { WebSocket } from 'ws';

// Laravel-specific interfaces
export interface LaravelMiddlewareMetric {
  middlewareName: string;
  requestPath: string;
  method: string;
  executionTime: number;
  timestamp: number;
  statusCode: number;
  responseSize: number;
  requestId: string;
}

export interface LaravelEloquentMetric {
  query: string;
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'ALTER' | 'DROP';
  executionTime: number;
  timestamp: number;
  database: string;
  model?: string;
  bindings: any[];
  rowsAffected?: number;
  requestId: string;
}

export interface LaravelRouteMetric {
  routeName?: string;
  routeUri: string;
  controllerAction: string;
  method: string;
  executionTime: number;
  timestamp: number;
  statusCode: number;
  memoryUsage: number;
  requestId: string;
}

export interface LaravelJobMetric {
  jobName: string;
  queue: string;
  executionTime: number;
  timestamp: number;
  status: 'completed' | 'failed' | 'retrying';
  attempts: number;
  payload: any;
  failureReason?: string;
}

export interface LaravelCacheMetric {
  operation: 'get' | 'put' | 'forget' | 'flush' | 'remember';
  key: string;
  executionTime: number;
  timestamp: number;
  hit: boolean;
  store: string;
  tags?: string[];
}

export interface LaravelPerformanceSummary {
  totalRequests: number;
  averageResponseTime: number;
  slowestRoutes: Array<{
    uri: string;
    action: string;
    averageTime: number;
    requestCount: number;
  }>;
  eloquentPerformance: {
    totalQueries: number;
    averageQueryTime: number;
    slowestQueries: Array<{
      query: string;
      averageTime: number;
      executionCount: number;
    }>;
    modelStats: Array<{
      model: string;
      queryCount: number;
      averageTime: number;
    }>;
  };
  middlewarePerformance: Array<{
    name: string;
    averageTime: number;
    requestCount: number;
  }>;
  cachePerformance: {
    hitRate: number;
    missRate: number;
    averageAccessTime: number;
    operationStats: Array<{
      operation: string;
      count: number;
      averageTime: number;
    }>;
  };
  jobPerformance: {
    totalJobs: number;
    successRate: number;
    averageExecutionTime: number;
    failedJobs: number;
  };
  errorRate: number;
  memoryUsage: {
    average: number;
    peak: number;
  };
}

export interface LaravelAgentConfig extends AgentConfig {
  laravelServerUrl?: string;
  monitorEloquent?: boolean;
  monitorMiddleware?: boolean;
  monitorRoutes?: boolean;
  monitorJobs?: boolean;
  monitorCache?: boolean;
  enableRealTimeUpdates?: boolean;
  customMiddleware?: string[];
  eloquentModels?: string[];
}

export class LaravelAgent extends BaseAgent {
  private middlewareMetrics: LaravelMiddlewareMetric[] = [];
  private eloquentMetrics: LaravelEloquentMetric[] = [];
  private routeMetrics: LaravelRouteMetric[] = [];
  private jobMetrics: LaravelJobMetric[] = [];
  private cacheMetrics: LaravelCacheMetric[] = [];
  protected config: LaravelAgentConfig;
  private websocket?: WebSocket;
  private isMonitoring = false;

  constructor(config: LaravelAgentConfig = {}) {
    super(config);
    this.config = {
      laravelServerUrl: 'http://localhost:8000',
      monitorEloquent: true,
      monitorMiddleware: true,
      monitorRoutes: true,
      monitorJobs: true,
      monitorCache: true,
      enableRealTimeUpdates: false,
      customMiddleware: [],
      eloquentModels: [],
      ...config
    };
  }

  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('Laravel monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting Laravel performance monitoring...');

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
    console.log('Stopping Laravel performance monitoring...');

    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }

    this.stopPeriodicCollection();
  }

  private setupWebSocketConnection(): void {
    try {
      const wsUrl = this.config.laravelServerUrl?.replace('http', 'ws') + '/ws/stacksleuth';
      this.websocket = new WebSocket(wsUrl);

      this.websocket.on('open', () => {
        console.log('Connected to Laravel WebSocket for real-time monitoring');
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
        console.error('Laravel WebSocket error:', error);
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
      case 'eloquent':
        this.recordEloquentMetric(metric.data);
        break;
      case 'route':
        this.recordRouteMetric(metric.data);
        break;
      case 'job':
        this.recordJobMetric(metric.data);
        break;
      case 'cache':
        this.recordCacheMetric(metric.data);
        break;
    }
  }

  public recordMiddlewareMetric(metric: LaravelMiddlewareMetric): void {
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

  public recordEloquentMetric(metric: LaravelEloquentMetric): void {
    if (!this.config.monitorEloquent) return;

    this.eloquentMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });

    // Keep only recent metrics (last 1000)
    if (this.eloquentMetrics.length > 1000) {
      this.eloquentMetrics = this.eloquentMetrics.slice(-1000);
    }
  }

  public recordRouteMetric(metric: LaravelRouteMetric): void {
    if (!this.config.monitorRoutes) return;

    this.routeMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });

    // Keep only recent metrics (last 1000)
    if (this.routeMetrics.length > 1000) {
      this.routeMetrics = this.routeMetrics.slice(-1000);
    }
  }

  public recordJobMetric(metric: LaravelJobMetric): void {
    if (!this.config.monitorJobs) return;

    this.jobMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });

    // Keep only recent metrics (last 500)
    if (this.jobMetrics.length > 500) {
      this.jobMetrics = this.jobMetrics.slice(-500);
    }
  }

  public recordCacheMetric(metric: LaravelCacheMetric): void {
    if (!this.config.monitorCache) return;

    this.cacheMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });

    // Keep only recent metrics (last 1000)
    if (this.cacheMetrics.length > 1000) {
      this.cacheMetrics = this.cacheMetrics.slice(-1000);
    }
  }

  public async collectLaravelMetrics(): Promise<void> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.config.laravelServerUrl}/api/stacksleuth/metrics`,
        { timeout: 5000 }
      );

      const metrics = response.data;

      if (metrics.middleware && this.config.monitorMiddleware) {
        metrics.middleware.forEach((metric: LaravelMiddlewareMetric) => {
          this.recordMiddlewareMetric(metric);
        });
      }

      if (metrics.eloquent && this.config.monitorEloquent) {
        metrics.eloquent.forEach((metric: LaravelEloquentMetric) => {
          this.recordEloquentMetric(metric);
        });
      }

      if (metrics.routes && this.config.monitorRoutes) {
        metrics.routes.forEach((metric: LaravelRouteMetric) => {
          this.recordRouteMetric(metric);
        });
      }

      if (metrics.jobs && this.config.monitorJobs) {
        metrics.jobs.forEach((metric: LaravelJobMetric) => {
          this.recordJobMetric(metric);
        });
      }

      if (metrics.cache && this.config.monitorCache) {
        metrics.cache.forEach((metric: LaravelCacheMetric) => {
          this.recordCacheMetric(metric);
        });
      }
    } catch (error) {
      console.error('Error collecting Laravel metrics:', error);
    }
  }

  public getMiddlewareMetrics(): LaravelMiddlewareMetric[] {
    return [...this.middlewareMetrics];
  }

  public getEloquentMetrics(): LaravelEloquentMetric[] {
    return [...this.eloquentMetrics];
  }

  public getRouteMetrics(): LaravelRouteMetric[] {
    return [...this.routeMetrics];
  }

  public getJobMetrics(): LaravelJobMetric[] {
    return [...this.jobMetrics];
  }

  public getCacheMetrics(): LaravelCacheMetric[] {
    return [...this.cacheMetrics];
  }

  public getPerformanceSummary(): LaravelPerformanceSummary {
    const totalRequests = this.routeMetrics.length;
    const averageResponseTime = totalRequests > 0 
      ? this.routeMetrics.reduce((sum, metric) => sum + metric.executionTime, 0) / totalRequests 
      : 0;

    // Calculate slowest routes
    const routeStats = new Map<string, { totalTime: number; count: number; action: string }>();
    this.routeMetrics.forEach(metric => {
      const key = metric.routeUri;
      const current = routeStats.get(key) || { totalTime: 0, count: 0, action: metric.controllerAction };
      current.totalTime += metric.executionTime;
      current.count += 1;
      routeStats.set(key, current);
    });

    const slowestRoutes = Array.from(routeStats.entries())
      .map(([uri, stats]) => ({
        uri,
        action: stats.action,
        averageTime: stats.totalTime / stats.count,
        requestCount: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    // Calculate Eloquent performance
    const totalQueries = this.eloquentMetrics.length;
    const averageQueryTime = totalQueries > 0
      ? this.eloquentMetrics.reduce((sum, metric) => sum + metric.executionTime, 0) / totalQueries
      : 0;

    const queryStats = new Map<string, { totalTime: number; count: number }>();
    this.eloquentMetrics.forEach(metric => {
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

    // Calculate model statistics
    const modelStats = new Map<string, { totalTime: number; count: number }>();
    this.eloquentMetrics.forEach(metric => {
      if (metric.model) {
        const current = modelStats.get(metric.model) || { totalTime: 0, count: 0 };
        current.totalTime += metric.executionTime;
        current.count += 1;
        modelStats.set(metric.model, current);
      }
    });

    const modelStatistics = Array.from(modelStats.entries())
      .map(([model, stats]) => ({
        model,
        queryCount: stats.count,
        averageTime: stats.totalTime / stats.count
      }));

    // Calculate cache performance
    const cacheHits = this.cacheMetrics.filter(metric => metric.hit).length;
    const totalCacheOps = this.cacheMetrics.length;
    const hitRate = totalCacheOps > 0 ? (cacheHits / totalCacheOps) * 100 : 0;
    const missRate = 100 - hitRate;

    const cacheOperationStats = new Map<string, { totalTime: number; count: number }>();
    this.cacheMetrics.forEach(metric => {
      const current = cacheOperationStats.get(metric.operation) || { totalTime: 0, count: 0 };
      current.totalTime += metric.executionTime;
      current.count += 1;
      cacheOperationStats.set(metric.operation, current);
    });

    const operationStats = Array.from(cacheOperationStats.entries())
      .map(([operation, stats]) => ({
        operation,
        count: stats.count,
        averageTime: stats.totalTime / stats.count
      }));

    // Calculate job performance
    const completedJobs = this.jobMetrics.filter(metric => metric.status === 'completed').length;
    const totalJobs = this.jobMetrics.length;
    const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
    const averageJobTime = totalJobs > 0
      ? this.jobMetrics.reduce((sum, metric) => sum + metric.executionTime, 0) / totalJobs
      : 0;
    const failedJobs = this.jobMetrics.filter(metric => metric.status === 'failed').length;

    // Calculate error rate
    const errorResponses = this.routeMetrics.filter(metric => metric.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorResponses / totalRequests) * 100 : 0;

    return {
      totalRequests,
      averageResponseTime,
      slowestRoutes,
      eloquentPerformance: {
        totalQueries,
        averageQueryTime,
        slowestQueries,
        modelStats: modelStatistics
      },
      middlewarePerformance: [],
      cachePerformance: {
        hitRate,
        missRate,
        averageAccessTime: totalCacheOps > 0 
          ? this.cacheMetrics.reduce((sum, metric) => sum + metric.executionTime, 0) / totalCacheOps
          : 0,
        operationStats
      },
      jobPerformance: {
        totalJobs,
        successRate,
        averageExecutionTime: averageJobTime,
        failedJobs
      },
      errorRate,
      memoryUsage: {
        average: totalRequests > 0 
          ? this.routeMetrics.reduce((sum, metric) => sum + metric.memoryUsage, 0) / totalRequests
          : 0,
        peak: Math.max(...this.routeMetrics.map(metric => metric.memoryUsage), 0)
      }
    };
  }

  public clearMetrics(): void {
    this.middlewareMetrics = [];
    this.eloquentMetrics = [];
    this.routeMetrics = [];
    this.jobMetrics = [];
    this.cacheMetrics = [];
  }

  private startPeriodicCollection(): void {
    // Collect metrics every 10 seconds
    const interval = setInterval(async () => {
      if (!this.isMonitoring) {
        clearInterval(interval);
        return;
      }
      await this.collectLaravelMetrics();
    }, 10000);
  }

  private stopPeriodicCollection(): void {
    // Implementation would stop any active intervals
  }
} 