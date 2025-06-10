import { BaseAgent, AgentConfig } from '@stacksleuth/core';
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
export declare class LaravelAgent extends BaseAgent {
    private middlewareMetrics;
    private eloquentMetrics;
    private routeMetrics;
    private jobMetrics;
    private cacheMetrics;
    protected config: LaravelAgentConfig;
    private websocket?;
    private isMonitoring;
    constructor(config?: LaravelAgentConfig);
    startMonitoring(): void;
    stopMonitoring(): void;
    private setupWebSocketConnection;
    private processRealTimeMetric;
    recordMiddlewareMetric(metric: LaravelMiddlewareMetric): void;
    recordEloquentMetric(metric: LaravelEloquentMetric): void;
    recordRouteMetric(metric: LaravelRouteMetric): void;
    recordJobMetric(metric: LaravelJobMetric): void;
    recordCacheMetric(metric: LaravelCacheMetric): void;
    collectLaravelMetrics(): Promise<void>;
    getMiddlewareMetrics(): LaravelMiddlewareMetric[];
    getEloquentMetrics(): LaravelEloquentMetric[];
    getRouteMetrics(): LaravelRouteMetric[];
    getJobMetrics(): LaravelJobMetric[];
    getCacheMetrics(): LaravelCacheMetric[];
    getPerformanceSummary(): LaravelPerformanceSummary;
    clearMetrics(): void;
    private startPeriodicCollection;
    private stopPeriodicCollection;
}
//# sourceMappingURL=index.d.ts.map