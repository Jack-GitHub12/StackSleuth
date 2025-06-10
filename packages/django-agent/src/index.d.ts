import { BaseAgent, AgentConfig } from '@stacksleuth/core';
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
export declare class DjangoAgent extends BaseAgent {
    private middlewareMetrics;
    private databaseMetrics;
    private viewMetrics;
    private sessionMetrics;
    protected config: DjangoAgentConfig;
    private websocket?;
    private isMonitoring;
    constructor(config?: DjangoAgentConfig);
    startMonitoring(): void;
    stopMonitoring(): void;
    private setupWebSocketConnection;
    private processRealTimeMetric;
    recordMiddlewareMetric(metric: DjangoMiddlewareMetric): void;
    recordDatabaseMetric(metric: DjangoDatabaseMetric): void;
    recordViewMetric(metric: DjangoViewMetric): void;
    recordSessionMetric(metric: DjangoSessionMetric): void;
    collectDjangoMetrics(): Promise<void>;
    getMiddlewareMetrics(): DjangoMiddlewareMetric[];
    getDatabaseMetrics(): DjangoDatabaseMetric[];
    getViewMetrics(): DjangoViewMetric[];
    getSessionMetrics(): DjangoSessionMetric[];
    getPerformanceSummary(): DjangoPerformanceSummary;
    clearMetrics(): void;
    private startPeriodicCollection;
    private stopPeriodicCollection;
}
//# sourceMappingURL=index.d.ts.map