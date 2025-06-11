export interface FastAPIRouteMetrics {
    path: string;
    method: string;
    duration: number;
    statusCode: number;
    requestSize: number;
    responseSize: number;
    timestamp: number;
    userId?: string;
    errors: string[];
    dbQueries: number;
    cacheHits: number;
    cacheMisses: number;
}
export interface FastAPIServerMetrics {
    serverId: string;
    host: string;
    port: number;
    startTime: number;
    totalRequests: number;
    activeConnections: number;
    avgResponseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
}
export interface FastAPIPerformanceStats {
    totalRequests: number;
    avgResponseTime: number;
    slowEndpoints: FastAPIRouteMetrics[];
    errorRate: number;
    topEndpoints: Array<{
        path: string;
        method: string;
        count: number;
        avgDuration: number;
    }>;
    serverMetrics: FastAPIServerMetrics[];
    databaseStats: {
        totalQueries: number;
        avgQueryTime: number;
        slowQueries: number;
    };
    cacheStats: {
        hitRate: number;
        totalHits: number;
        totalMisses: number;
    };
}
export declare class FastAPIAgent {
    private profiler;
    private routeMetrics;
    private serverMetrics;
    private isActive;
    private slowQueryThreshold;
    private maxMetricsHistory;
    private wsConnection?;
    private pythonServerUrl;
    private monitoringInterval?;
    constructor(config?: {
        endpoint?: string;
        apiKey?: string;
        slowQueryThreshold?: number;
        maxMetricsHistory?: number;
        pythonServerUrl?: string;
        autoInit?: boolean;
    });
    /**
     * Initialize the FastAPI agent
     */
    init(): Promise<void>;
    /**
     * Connect to FastAPI server for real-time monitoring
     */
    private connectToFastAPIServer;
    /**
     * Handle messages from FastAPI server
     */
    private handleServerMessage;
    /**
     * Request server information
     */
    private requestServerInfo;
    /**
     * Record route performance metrics (made public for testing)
     */
    recordRouteMetrics(data: any): void;
    /**
     * Update server metrics
     */
    private updateServerMetrics;
    /**
     * Record error events
     */
    private recordErrorEvent;
    /**
     * Record database query metrics
     */
    private recordDatabaseQuery;
    /**
     * Record cache events
     */
    private recordCacheEvent;
    /**
     * Start periodic server monitoring via HTTP
     */
    private startServerMonitoring;
    /**
     * Collect server metrics via HTTP API
     */
    private collectServerMetrics;
    /**
     * Install FastAPI middleware (via HTTP request to server)
     */
    installMiddleware(middlewareConfig?: {
        enableRouteMetrics?: boolean;
        enableDatabaseMetrics?: boolean;
        enableCacheMetrics?: boolean;
        slowQueryThreshold?: number;
    }): Promise<void>;
    /**
     * Get performance statistics
     */
    getPerformanceStats(): FastAPIPerformanceStats;
    /**
     * Get recent route metrics
     */
    getRecentRoutes(limit?: number): FastAPIRouteMetrics[];
    /**
     * Get server metrics
     */
    getServerMetrics(): FastAPIServerMetrics[];
    /**
     * Generate Python middleware code
     */
    generateMiddlewareCode(): string;
    /**
     * Stop the FastAPI agent and cleanup resources
     */
    stop(): Promise<void>;
}
export declare const fastapiAgent: FastAPIAgent;
//# sourceMappingURL=index.d.ts.map