export interface RedisOperationMetrics {
    command: string;
    duration: number;
    keyCount: number;
    dataSize: number;
    success: boolean;
    error?: string;
    timestamp: number;
    connectionId: string;
}
export interface RedisConnectionMetrics {
    id: string;
    host: string;
    port: number;
    database: number;
    connectTime: number;
    totalOperations: number;
    avgResponseTime: number;
    errorRate: number;
    lastActivity: number;
    memoryUsage: number;
}
export interface RedisPerformanceStats {
    totalOperations: number;
    avgResponseTime: number;
    slowQueries: RedisOperationMetrics[];
    errorRate: number;
    topCommands: Array<{
        command: string;
        count: number;
        avgDuration: number;
    }>;
    connectionPool: RedisConnectionMetrics[];
    memoryStats: {
        total: number;
        used: number;
        peak: number;
        fragmentation: number;
    };
}
export declare class RedisAgent {
    private profiler;
    private operationMetrics;
    private connectionMetrics;
    private isActive;
    private slowQueryThreshold;
    private maxMetricsHistory;
    private metricsInterval?;
    constructor(config?: {
        endpoint?: string;
        apiKey?: string;
        slowQueryThreshold?: number;
        maxMetricsHistory?: number;
        autoInit?: boolean;
    });
    /**
     * Initialize the Redis agent and start monitoring
     */
    init(): Promise<void>;
    /**
     * Instrument the standard redis client
     */
    private instrumentRedisClient;
    /**
     * Instrument IORedis client
     */
    private instrumentIORedisClient;
    /**
     * Wrap Redis client methods for monitoring
     */
    private wrapRedisClient;
    /**
     * Wrap IORedis client methods
     */
    private wrapIORedisClient;
    /**
     * Wrap Redis operations for performance monitoring
     */
    private wrapRedisOperation;
    /**
     * Track Redis connection
     */
    private trackConnection;
    /**
     * Record operation metrics (made public for testing)
     */
    recordOperationMetrics(metrics: RedisOperationMetrics): void;
    /**
     * Update connection metrics
     */
    private updateConnectionMetrics;
    /**
     * Start periodic metrics collection
     */
    private startPeriodicMetricsCollection;
    /**
     * Collect Redis INFO metrics
     */
    private collectRedisInfo;
    /**
     * Clean up old metrics
     */
    private cleanupOldMetrics;
    /**
     * Generate unique connection ID
     */
    private generateConnectionId;
    /**
     * Extract key count from command arguments
     */
    private extractKeyCount;
    /**
     * Calculate data size of operation
     */
    private calculateDataSize;
    /**
     * Check if method is a Redis command
     */
    private isRedisCommand;
    /**
     * Get performance statistics
     */
    getPerformanceStats(): RedisPerformanceStats;
    /**
     * Get recent operations
     */
    getRecentOperations(limit?: number): RedisOperationMetrics[];
    /**
     * Get connection metrics
     */
    getConnectionMetrics(): RedisConnectionMetrics[];
    /**
     * Stop the Redis agent and cleanup resources
     */
    stop(): Promise<void>;
}
export declare const redisAgent: RedisAgent;
//# sourceMappingURL=index.d.ts.map